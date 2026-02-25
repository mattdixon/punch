import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Link,
  Hr,
  Preview,
} from "@react-email/components"

export function InviteEmail({
  name,
  inviteUrl,
  companyName,
}: {
  name: string
  inviteUrl: string
  companyName: string
}) {
  return (
    <Html>
      <Head />
      <Preview>You&apos;ve been invited to {companyName} on Punch</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={heading}>Welcome to {companyName}!</Text>
          <Text style={text}>Hi {name},</Text>
          <Text style={text}>
            You&apos;ve been invited to track your time on Punch. Click the link
            below to set your password and get started.
          </Text>
          <Link href={inviteUrl} style={button}>
            Set Your Password
          </Link>
          <Hr style={hr} />
          <Text style={footer}>
            This link expires in 72 hours. If you didn&apos;t expect this
            invitation, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const body = {
  backgroundColor: "#f4f4f5",
  fontFamily: "sans-serif",
}
const container = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  padding: "32px",
  borderRadius: "8px",
  maxWidth: "480px",
}
const heading = {
  fontSize: "24px",
  fontWeight: "bold" as const,
  marginBottom: "16px",
}
const text = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#3f3f46",
}
const button = {
  display: "inline-block",
  backgroundColor: "#18181b",
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: "6px",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: "500" as const,
  marginTop: "8px",
  marginBottom: "8px",
}
const hr = {
  borderColor: "#e4e4e7",
  marginTop: "24px",
  marginBottom: "24px",
}
const footer = {
  fontSize: "12px",
  color: "#a1a1aa",
}
