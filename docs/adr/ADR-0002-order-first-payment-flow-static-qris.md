# ADR-0002: Order-First Payment Flow with Static QRIS and Manual Confirmation

- **Status**: Accepted
- **Date**: 2026-09-10
- **Deciders**: Owner (product), Engineering
- **Related PRD sections**: `prd-backend.md` §8, §19, §27; `prd-mobile.md` §13–§15
- **Related ADRs**: ADR-0001 (lifecycle), ADR-0004 (pricing immutability)

## Context

The mobile PRD flow was `Review → Continue to Payment → Order Created`, yet the
backend payment API is `POST /orders/{order}/payments` — payments attach to an
**existing** order. The sequence contradicted itself: you cannot pay for an
order that does not exist.

Independently, the PRDs left the QRIS depth undefined. Options were:

1. **Dynamic QRIS via a gateway** (Midtrans/Xendit): webhook callbacks, status
   polling, idempotent callback handling — a large third-party integration.
2. **Static QRIS + manual cashier confirmation**: the shop displays its
   registered static QRIS sticker; the customer scans and pays; the cashier
   verifies receipt (e.g., via the acquirer app/mutation) and records the
   payment manually as method `QRIS`.
3. **Defer QRIS** to a later phase.

Payment status transitions also needed rules: when a payment leaves `UNPAID`,
how partial payments accumulate, and what `COMPLETED`/`CANCELLED` require.

## Decision

### 1. Order-first sequence

```text
Wizard review (client-side preview only)
→ POST /orders              (creates order, status RECEIVED, payment_status UNPAID)
→ Success screen shows order number
→ Payment screen (choose method + amount)
→ POST /orders/{id}/payments (one or more; server is the payment authority)
```

- The client may display a **preview** total during the wizard, but the stored
  totals come from the backend at creation (ADR-0004).
- If connectivity drops after order creation, the order safely exists as
  `UNPAID`; the cashier resumes payment from the order list.
- Double-submit protection on `POST /orders` uses an **idempotency key**
  (client-generated UUID, see `prd-backend.md` §27); retries never create a
  duplicate order.

### 2. Static QRIS, manual confirmation

- MVP payment methods: `CASH`, `QRIS`, `TRANSFER` — all recorded through the
  same `POST /orders/{order}/payments` endpoint by the cashier.
- There is **no payment gateway integration** and **no webhook** in the MVP.
  `payment_transactions` stays in the schema unused, reserved for a future
  gateway phase (documented explicitly in the PRD).
- QRIS payment is "confirmed" by the cashier after checking the acquirer's
  app/mutation. The system records the cashier's confirmation, not an
  automated proof of transfer.

### 3. Payment status machine (server-computed)

```text
UNPAID → PARTIAL → PAID
```

- `payment_status` is **derived**, never client-supplied: the backend
  recalculates `paid_total` and sets `UNPAID` / `PARTIAL` / `PAID` from the
  sum of recorded payments vs. `grand_total`.
- A payment that exactly settles the remainder sets `PAID`; overpayment is
  rejected (`422`).
- `REFUNDED` remains a future payment-status value, but **refund recording**
  exists in the MVP only as part of cancellation (below).

### 4. Settlement and cancellation guards

These rules are part of the transition matrix of ADR-0001:

- `COMPLETED` **requires `payment_status = PAID`** (force settlement). The
  cashier must settle the remainder before closing the order.
- `CANCELLED` is allowed only from `RECEIVED` or `ON_PROCESS`.
  - If **no payment** exists: cancel directly.
  - If **payments exist**: a refund must be recorded first — the affected
    payments are marked refunded (`REFUNDED`-flagged rows with amount) —
  then the order may be cancelled. Cash refund is handled physically by
  staff; the system keeps the ledger honest.
- `READY_FOR_PICKUP` and `COMPLETED` orders cannot be cancelled.

## Alternatives Considered

### Combined order+payment endpoint (single transactional request)

Rejected: fewer round-trips, but partial payment, "QRIS pending" states, and
retry semantics become awkward — one payload must encode many payment
scenarios, and a retry after a network failure risks double-charging.

### Payment-first (order created upon payment)

Rejected: contradicts the domain — the shop receives shoes *before* money
changes hands; unpaid orders are a normal state, not an error.

### Dynamic QRIS gateway in MVP

Rejected for MVP: adds vendor selection, credentials, webhook endpoints,
idempotent callback handling, and reconciliation UI — significant scope and
external dependency for marginal automation at single-store volume.

## Consequences

- **Positive**: Mobile flow matches the API contract exactly; order creation
  is resilient to network drops mid-flow; zero gateway cost/dependency;
  payment state machine is small and fully testable.
- **Negative**: QRIS/TRANSFER payments rely on cashier honesty and manual
  verification — the system can be told "paid" without cryptographic proof.
  Reconciliation with the acquirer is a manual, outside-the-system task.
- **Neutral**: `payment_transactions` exists but is explicitly unused in MVP
  (documented, not dropped) so a future gateway phase does not require a
  destructive migration.

## Future Phase Note

A gateway phase would add: dynamic QRIS generation, a webhook endpoint
(idempotent), `payment_transactions` population, and automated
`PAID` transitions — without changing the order-first sequence or the
derived-status rule decided here.
