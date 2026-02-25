import { getProfile } from "@/app/actions/profile"
import { ProfileForm } from "@/components/profile/profile-form"
import { ChangePasswordForm } from "@/components/profile/change-password-form"

export default async function ProfilePage() {
  const profile = await getProfile()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Profile</h1>
      <div className="grid gap-6 max-w-2xl">
        <ProfileForm profile={profile} />
        <ChangePasswordForm />
      </div>
    </div>
  )
}
