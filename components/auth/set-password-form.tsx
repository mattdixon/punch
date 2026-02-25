"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  validateSetPasswordToken,
  setPasswordWithToken,
} from "@/app/actions/auth"

export function SetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  const type = (searchParams.get("type") as "invite" | "reset") || "reset"

  const [status, setStatus] = useState<
    "loading" | "valid" | "error" | "success"
  >("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [userName, setUserName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function validate() {
      if (!token) {
        setStatus("error")
        setErrorMessage("No token provided")
        return
      }
      try {
        const result = await validateSetPasswordToken(token, type)
        if (result.valid) {
          setStatus("valid")
          setUserName(result.userName)
        } else {
          setStatus("error")
          setErrorMessage(result.error)
        }
      } catch {
        setStatus("error")
        setErrorMessage("Something went wrong. Please try again.")
      }
    }
    validate()
  }, [token, type])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage("")

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters")
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match")
      return
    }

    setSaving(true)

    try {
      await setPasswordWithToken(token!, password)
      setStatus("success")
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  if (status === "loading") {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="py-8 text-center text-muted-foreground">
          Validating link...
        </CardContent>
      </Card>
    )
  }

  if (status === "success") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Password Set</CardTitle>
          <CardDescription>
            Your password has been updated. You can now sign in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => router.push("/login")}>
            Go to Sign In
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (status === "error") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Invalid Link</CardTitle>
          <CardDescription>{errorMessage}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            variant="outline"
            onClick={() => router.push("/login")}
          >
            Back to Sign In
          </Button>
        </CardContent>
      </Card>
    )
  }

  const heading =
    type === "invite" ? "Welcome to Punch" : "Reset Your Password"
  const description =
    type === "invite"
      ? `Hi ${userName}, set a password to get started.`
      : "Enter your new password below."

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">{heading}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {errorMessage}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={saving}
              placeholder="At least 8 characters"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              disabled={saving}
            />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Setting password..." : "Set Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
