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
import { updateCompanySettings } from "@/app/actions/settings"
import { toast } from "sonner"

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
  defaultPaymentTerms: string
  defaultBillCents: number
  defaultPayCents: number
  defaultCurrency: string
  fiscalYearStartMonth: number
}

export function SettingsForm({ settings }: { settings: CompanySettings }) {
  const [saving, setSaving] = useState(false)
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
