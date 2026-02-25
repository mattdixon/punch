import { Resend } from "resend"
import type { ReactElement } from "react"

let resend: Resend | null = null

function getResend(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY
}

export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string
  subject: string
  react: ReactElement
}) {
  if (!isEmailConfigured()) {
    throw new Error("Email is not configured. Set RESEND_API_KEY.")
  }

  const from = process.env.EMAIL_FROM || "Punch <onboarding@resend.dev>"

  // In dev, redirect all emails to a single address (Resend sandbox restriction)
  const recipient = process.env.EMAIL_OVERRIDE_TO || to

  const { error } = await getResend().emails.send({
    from,
    to: recipient,
    subject: process.env.EMAIL_OVERRIDE_TO ? `[To: ${to}] ${subject}` : subject,
    react,
  })

  if (error) {
    console.error("Failed to send email:", error)
    throw new Error("Failed to send email")
  }
}
