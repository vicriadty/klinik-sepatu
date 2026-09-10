# ADR-0006: WhatsApp Cloud API Notifications with Digital Receipt

- **Status**: Accepted
- **Date**: 2026-09-10
- **Deciders**: Owner (product), Engineering
- **Related PRD sections**: `prd-backend.md` §23, §24; `prd-web.md` §17; `prd-mobile.md` §24
- **Related ADRs**: ADR-0001 (status transitions), ADR-0002 (payment events), ADR-0011 (queue)

## Context

The backend PRD required a notification abstraction
(`WhatsAppProvider` / `PushProvider`) with vendors unspecified. The web
settings page displays "notification configuration status". The owner also
wanted a **digital receipt** instead of a thermal printer, which naturally
rides the same channel.

Candidates for the WhatsApp channel:

1. **WhatsApp Cloud API (official Meta)** — requires Meta Business
   verification, per-message template approval, webhook endpoint, rate-limit
   handling; official and stable.
2. **Third-party unofficial gateways** (Fonnte, Wablas, etc.) — fast setup,
   no approval cycle, but operate against WhatsApp ToS with real ban risk for
   the business number.

The owner selected **WhatsApp Cloud API in the MVP**, accepting the added
scope, and selected **all four notification events**, including the digital
receipt.

## Decision

### 1. Channel: WhatsApp Cloud API (official), provider abstraction retained

- The domain dispatches notifications through the existing abstraction
  (`prd-backend.md` §23); the first concrete implementation is
  `WhatsAppCloudProvider`. Domain code never touches Meta SDK/vendor details.
- `PushProvider` remains an interface-only stub for the future staff-push
  phase (mobile §24).

### 2. Four MVP events (four approved templates)

| # | Event | Trigger | Recipient | Purpose |
|---|-------|---------|-----------|---------|
| 1 | `ORDER_RECEIVED_RECEIPT` | Order created (`POST /orders` success) | Customer | **Digital receipt**: order number, items & services, subtotal, discount, grand total, payment status, store footer (settings) |
| 2 | `PAYMENT_RECEIVED` | Payment recorded (`POST /orders/{id}/payments` success) | Customer | Payment confirmation: amount, method, remaining balance / `PAID` |
| 3 | `ORDER_READY_FOR_PICKUP` | Status transition → `READY_FOR_PICKUP` | Customer | Pickup invitation: order number, total due (if any), store address |
| 4 | `ORDER_COMPLETED` | Status transition → `COMPLETED` | Customer | Thank-you + re-order invitation |

- Each event maps to **one pre-approved WhatsApp template** (Meta approval is
  per template; the receipt uses an interactive/details template with
  parameters for order lines).
- Sending is **queued** (`QUEUE_CONNECTION=database`, per PRD §24) — the API
  request that triggers the business event never blocks on Meta's API.

### 3. Delivery tracking in `notifications`

Every send records a row: `event`, `channel`, `recipient_phone`,
`order_id` (nullable), `status` (`QUEUED` → `SENT` / `FAILED`),
provider message id, attempts, timestamps. Failures are retried with
backoff (bounded attempts); the Web settings page surfaces the aggregate
configuration/health status, per `prd-web.md` §17.

### 4. Failure is non-blocking by design

- If WhatsApp sending fails (rate limit, expired token, unreachable), the
  **business operation still succeeds** — the order/payment/status change is
  already committed; only the notification row shows `FAILED`.
- Missing/invalid customer phone ⇒ notification row is created as `SKIPPED`
  (no send attempt) rather than failing the business flow.

### 5. Prerequisites acknowledged (scope added by this ADR)

- Meta Business Account + WhatsApp Business number, verified.
- Four templates drafted and **approved by Meta before go-live** (template
  approval can take days–weeks; this is a launch-critical path item).
- `WHATSAPP_*` credentials via environment configuration only (PRD §26);
  webhook endpoint for delivery status (idempotent, rate-limit-safe) is part
  of the backend scope.

## Alternatives Considered

### Abstraction-only, vendor deferred

Rejected by the owner: the digital receipt and pickup notifications are core
MVP value; deferring the vendor would ship the settings page with nothing
real behind it.

### Unofficial gateway (Fonnte/Wablas)

Rejected: zero approval friction and cheap, but the business's primary
customer channel would run on a ToS-violating service with a real risk of
number bans — an unacceptable operational risk for the shop's main line.

### Fewer events (e.g., receipt only)

Rejected by the owner: pickup notification is the highest-value message for
a cleaning service (it drives collection and payment completion); all four
were confirmed during grilling.

### Thermal printer receipt

Rejected for MVP (mobile §23 already leans this way): device testing matrix
and ESC/POS dependency for marginal benefit when every customer already uses
WhatsApp; digital receipt covers the proof-of-transaction need.

## Consequences

- **Positive**: official, stable channel; receipt + pickup flow is fully
  automated; provider abstraction keeps the domain clean and allows adding
  channels (e.g., push) without refactor; delivery state is auditable.
- **Negative**: real launch dependency on Meta verification + four template
  approvals (calendar risk — must start early); per-conversation pricing
  (small but nonzero); webhook endpoint and retry logic add backend surface.
- **Neutral**: `notifications` table gains event/channel/status/provider-ref
  columns in the PRD schema; template parameter design must fit the receipt's
  multi-line order summary (Meta templates have fixed structures — the
  receipt template will summarize rather than itemize every line if
  parameter limits require it).
