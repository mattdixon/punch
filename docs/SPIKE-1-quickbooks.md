# SPIKE-1: QuickBooks Online Integration

**Decision: BUILD (post-MVP, ~2-3 weeks)**

## Summary

The QBO API is mature, free to use, and maps cleanly to our data model. A "Send to QuickBooks" button eliminates the manual CSV import workflow and lets QBO handle invoice delivery (email).

## OAuth 2.0 Flow

- Standard Authorization Code flow via `intuit-oauth` npm package
- Scope: `com.intuit.quickbooks.accounting`
- Access tokens expire hourly (refreshed automatically)
- **Refresh tokens last 5 years** — admin connects once and it persists
- Re-authorization only needed if token expires (5 years), user revokes access, or app credentials change

## Entity Mapping

| Punch | QBO | Strategy |
|-------|-----|----------|
| Client | Customer | Lazy match by name, store `qboCustomerId` |
| Project | Item (Service) | Lazy match by name, store `qboItemId` |
| Time entries (aggregated) | Invoice Line | Hours = Qty, bill rate = UnitPrice |
| Payment terms | SalesTermRef | Map our string to QBO term ID |

## Invoice Creation

- `POST /v3/company/{realmId}/invoice` — one per client per export batch
- Line items: one per project with hours and bill rate
- Email delivery: `POST /v3/company/{realmId}/invoice/{id}/send` — QBO sends branded PDF
- Read back: `GET /v3/company/{realmId}/invoice/{id}` — check `Balance` for payment status

## Cost

- **$0** for API access. Free developer program, no per-call or per-invoice fees.
- Agency needs their own QBO subscription ($38+/mo — they already have this)

## Rate Limits

- ~500 requests/minute per company
- Our use case (5-15 invoices per billing cycle) is ~1% of the limit

## Schema Changes

```prisma
// Add to Client
qboCustomerId  String?

// Add to Project
qboItemId      String?

// Add to CompanySettings (or separate QBOConnection model)
qboRealmId          String?
qboAccessToken      String?   // encrypted
qboRefreshToken     String?   // encrypted
qboTokenExpiresAt   DateTime?
qboConnectedAt      DateTime?
```

## New Dependencies

- `intuit-oauth` — Intuit's official OAuth library
- `node-quickbooks` — community QBO API client

## New Environment Variables

```env
QBO_CLIENT_ID="your-app-client-id"
QBO_CLIENT_SECRET="your-app-client-secret"
QBO_ENVIRONMENT="sandbox"
QBO_REDIRECT_URI="http://localhost:3000/api/qbo/callback"
```

## Effort Estimate

| Task | Days |
|------|------|
| OAuth flow (connect button, callback, token storage/refresh) | 3-4 |
| Entity mapping (lazy sync for Customers + Items) | 2-3 |
| Invoice creation (aggregate, build JSON, call API) | 3-4 |
| Invoice email via QBO | 1 |
| UI (settings connection, export button, feedback) | 2-3 |
| Error handling and edge cases | 2-3 |
| Testing (sandbox end-to-end) | 2-3 |
| **Total** | **~15-20** |

## Risks

- **App review:** Intuit requires review before production access (~1-2 weeks). Start early.
- **Duplicate invoices:** Store QBO invoice ID on timecards after creation; check before re-creating.
- **Self-hosted callback:** OAuth requires a publicly accessible callback URL.

## Impact on SPIKE-2

QBO handling invoice emails significantly reduces the need for Punch's own email system. The only remaining critical email use cases are user invitations and password resets.
