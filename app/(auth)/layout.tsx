import { Clock } from "lucide-react"
import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground">
        <Link href="/" className="flex items-center gap-2">
          <Clock className="h-6 w-6" />
          <span className="text-xl font-bold">Punch</span>
        </Link>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight">
            Simple time tracking<br />for agencies
          </h1>
          <p className="text-lg opacity-80 max-w-md">
            Track hours, approve timecards, and export for invoicing. No clutter, no complexity.
          </p>
        </div>
        <p className="text-sm opacity-60">
          Trusted by agencies who value simplicity.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
