# ADR-0005: Revenue Recognition on Order Creation Date

- **Status**: Accepted
- **Date**: 2026-09-10
- **Deciders**: Owner (product), Engineering
- **Related PRD sections**: `prd-backend.md` §20, §21, §22; `prd-web.md` §10, §13
- **Related ADRs**: ADR-0002 (payment state machine), ADR-0004 (totals immutable)

## Context

The dashboard KPIs ("revenue hari ini", "outstanding payment") and the
revenue reports (`GET /dashboard/revenue`, `GET /reports/revenue`) need a
single recognition basis. Candidates:

1. **Order creation date** — revenue = `grand_total` of orders *created* in
   the period, broken down by payment status.
2. **Payment receipt date** (cash basis) — revenue = sum of payments
   *received* in the period.
3. **Completion date** (accrual-ish) — revenue recognized when orders become
   `COMPLETED`.

The PRDs never picked one, and each basis tells a different story: a order
created today but paid at pickup would count today (basis 1), at pickup
(basis 2), or when finished (basis 3). Mixed bases across endpoints would
make KPIs mutually inconsistent.

## Decision

**Revenue is recognized on the order creation date** (`orders.created_at`,
timezone `Asia/Jakarta`), regardless of when payments arrive or when the
order completes.

Rules carried into the specs:

1. **Dashboard `revenue` and report `revenue`** sum `grand_total` of
   non-cancelled orders whose `created_at` falls in the filter period
   (today / 7d / 30d / custom range).
2. **Cancelled orders are excluded from revenue** in every period, including
   historical ones (a cancelled order contributes nothing, whenever it was
   created).
3. **Payment status is a reporting dimension, not a filter on revenue**:
   - "revenue hari ini" = Σ `grand_total` of orders created today
     (non-cancelled), with a parallel breakdown by `UNPAID` / `PARTIAL` /
     `PAID`.
   - "outstanding payment" = Σ (`grand_total` − `paid_total`) of
     non-cancelled orders with remaining > 0 — scoped the same way
     (created-in-period for reports; all open orders for the operational KPI).
4. **Cash-flow style figures** (money actually received in a period) are
   *available* via the payment-method dashboard breakdown, but the headline
   "revenue" label always means order-creation-basis. No endpoint mixes the
   two under one name.
5. All period boundaries are computed in **`Asia/Jakarta`** regardless of
   server timezone.

## Alternatives Considered

### Cash basis (payment receipt date)

Rejected as the headline basis: most accurate for "money in the till", but
partial payments split one order's value across periods, revenue and order
counts stop lining up (dashboard would show 5 orders but revenue for 3), and
an order created yesterday and paid today silently disappears from
yesterday's report.

### Completion basis (accrual)

Rejected: accounting-correct for delivered value, but the current month always
lags (work in progress invisible), and `COMPLETED` is gated on full payment
(ADR-0001/0002), which would couple revenue recognition to settlement
behavior.

## Consequences

- **Positive**: revenue, order counts, and top-services all share one time
  axis (`created_at`) — dashboard charts line up; deterministic and cheap to
  query (indexed `orders.created_at`); unpaid work-in-progress is visible as
  revenue + outstanding instead of vanishing.
- **Negative**: "revenue" is a booked-sales figure, not cash collected — the
  owner must read the outstanding-payment KPI alongside it; a late cancel
  reduces the period it was *created* in, which can make an old period's
  number change retroactively (accepted; audit log retains the trail).
- **Neutral**: reports filter out `CANCELLED` explicitly; `payment_methods`
  dashboard uses payment rows (receipt basis) by design and is labeled
  accordingly in the UI copy.
