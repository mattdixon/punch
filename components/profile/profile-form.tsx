"use client"

import { useState } from "react"
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
import { Badge } from "@/components/ui/badge"
import { updateProfile } from "@/app/actions/profile"
import { toast } from "sonner"

type Profile = {
  id: string
  name: string
  email: string
  role: string
  defaultPayCents: number
  createdAt: Date
}

export function ProfileForm({ profile }: { profile: Profile }) {
  const [name, setName] = useState(profile.name)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      await updateProfile({ name })
      toast.success("Profile updated")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Your account information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={profile.email} disabled />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <div>
              <Badge variant={profile.role === "ADMIN" || profile.role === "OWNER" ? "default" : "secondary"}>
                {profile.role}
              </Badge>
            </div>
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
