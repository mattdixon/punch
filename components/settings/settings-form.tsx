"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { updateCompanySettings, updateCompanyLogo } from "@/app/actions/settings"
import { toast } from "sonner"
import Image from "next/image"

const PAYMENT_TERMS_OPTIONS = [
  "Due on receipt",
  "Net 15",
  "Net 30",
  "Net 60",
]

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (\u20AC)" },
  { value: "GBP", label: "GBP (\u00A3)" },
  { value: "CAD", label: "CAD (C$)" },
  { value: "AUD", label: "AUD (A$)" },
]

const MONTH_OPTIONS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
]

type CompanySettings = {
  id: string
  companyName: string
  logoBase64: string | null
  defaultPaymentTerms: string
  defaultBillCents: number
  defaultPayCents: number
  defaultCurrency: string
  fiscalYearStartMonth: number
}

export function SettingsForm({ settings }: { settings: CompanySettings }) {
  const [saving, setSaving] = useState(false)
  const [savingLogo, setSavingLogo] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(settings.logoBase64)
  const [companyName, setCompanyName] = useState(settings.companyName)
  const [paymentTerms, setPaymentTerms] = useState(settings.defaultPaymentTerms)
  const [billRate, setBillRate] = useState(
    settings.defaultBillCents > 0 ? (settings.defaultBillCents / 100).toFixed(2) : ""
  )
  const [payRate, setPayRate] = useState(
    settings.defaultPayCents > 0 ? (settings.defaultPayCents / 100).toFixed(2) : ""
  )
  const [currency, setCurrency] = useState(settings.defaultCurrency)
  const [fiscalMonth, setFiscalMonth] = useState(String(settings.fiscalYearStartMonth))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      await updateCompanySettings({
        companyName,
        defaultPaymentTerms: paymentTerms,
        defaultBillCents: Math.round(parseFloat(billRate || "0") * 100),
        defaultPayCents: Math.round(parseFloat(payRate || "0") * 100),
        defaultCurrency: currency,
        fiscalYearStartMonth: parseInt(fiscalMonth),
      })
      toast.success("Settings saved")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Company</CardTitle>
          <CardDescription>Basic company information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Punch"
              required
            />
            <p className="text-xs text-muted-foreground">
              Shown in the sidebar header.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Company Logo</Label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <div className="relative h-16 w-16 rounded-md border overflow-hidden bg-white flex items-center justify-center">
                  <Image
                    src={logoPreview}
                    alt="Company logo"
                    width={64}
                    height={64}
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-md border border-dashed flex items-center justify-center text-muted-foreground text-xs">
                  No logo
                </div>
              )}
              <div className="flex flex-col gap-2">
                <label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return

                      if (file.size > 2 * 1024 * 1024) {
                        toast.error("Logo must be under 2MB")
                        return
                      }

                      const reader = new FileReader()
                      reader.onload = async () => {
                        const dataUrl = reader.result as string
                        setLogoPreview(dataUrl)
                        setSavingLogo(true)
                        try {
                          await updateCompanyLogo(dataUrl)
                          toast.success("Logo updated")
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Failed to upload logo")
                          setLogoPreview(settings.logoBase64)
                        } finally {
                          setSavingLogo(false)
                        }
                      }
                      reader.readAsDataURL(file)
                    }}
                  />
                  <span className={cn(
                    "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors",
                    "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                    "h-9 px-3 cursor-pointer",
                    savingLogo && "opacity-50 pointer-events-none"
                  )}>
                    {savingLogo ? "Uploading..." : "Upload Logo"}
                  </span>
                </label>
                {logoPreview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive h-auto p-0 text-xs"
                    disabled={savingLogo}
                    onClick={async () => {
                      setSavingLogo(true)
                      try {
                        await updateCompanyLogo(null)
                        setLogoPreview(null)
                        toast.success("Logo removed")
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Failed to remove logo")
                      } finally {
                        setSavingLogo(false)
                      }
                    }}
                  >
                    Remove logo
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, or SVG. Max 2MB. Shown in the sidebar.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Default Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fiscalMonth">Fiscal Year Start</Label>
            <Select value={fiscalMonth} onValueChange={setFiscalMonth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Rates</CardTitle>
          <CardDescription>
            Fallback rates when not set at the project or user level.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="billRate">Default Bill Rate ($/hr)</Label>
            <Input
              id="billRate"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={billRate}
              onChange={(e) => setBillRate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Used when a project has no bill rate set.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payRate">Default Pay Rate ($/hr)</Label>
            <Input
              id="payRate"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={payRate}
              onChange={(e) => setPayRate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Used when a user has no pay rate set.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Terms</CardTitle>
          <CardDescription>
            Default terms for new projects. Can be overridden per project.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="paymentTerms">Default Payment Terms</Label>
            <Select value={paymentTerms} onValueChange={setPaymentTerms}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_TERMS_OPTIONS.map((term) => (
                  <SelectItem key={term} value={term}>
                    {term}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  )
}
