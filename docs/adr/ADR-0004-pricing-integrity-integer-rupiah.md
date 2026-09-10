# ADR-0004: Pricing Integrity — Integer Rupiah, Immutable Items, Master-Discount-Only

- **Status**: Accepted
- **Date**: 2026-09-10
- **Deciders**: Owner (product), Engineering
- **Related PRD sections**: `prd-backend.md` §6, §9, §16, §17; `prd-mobile.md` §10–§13
- **Related ADRs**: ADR-0002 (order-first flow), ADR-0009 (order numbering)

## Context

The PRDs required the backend to be the single pricing authority
("total tersimpan secara immutable", "perubahan harga service tidak mengubah
order lama") but left three decisions open:

1. **Money representation** — "rounding/decimal handling konsisten" without
   saying what the type is.
2. **Discount semantics** — a `discounts` table exists in the schema
   (§10) but no rules were defined: who may grant one, in what form
   (percent vs. nominal), master vs. free-form manual entry.
3. **Order mutability** — `PUT /orders/{id}` existed with no rule about what
   may change after creation, while payments may already exist.

During grilling, the owner initially leaned toward "master + manual" discounts,
then refined to **master-only** — recorded here as the final decision.

## Decision

### 1. Money is integer rupiah

- All monetary values (`price`, `subtotal`, `discount`, `grand_total`,
  `amount_paid`, `remaining`) are **non-negative integers in IDR** (no
   decimals exist in rupiah).
- PostgreSQL column type: `BIGINT`. Validation: `integer`, `min:0`.
- No floats anywhere in the pricing pipeline; percent discounts are computed
  with integer division and documented rounding (round **down** to the whole
  rupiah; result clamped so discount ≤ subtotal).

### 2. Price snapshot at order creation

- When an order is created, each `order_item_services` row **copies** the
  service's current price into a `unit_price` column. Later service price
  changes never touch existing orders.
- Totals (`order_subtotal`, `discount_value`, `grand_total`) are computed by
  the backend, stored on the order, and treated as **immutable transactional
  values**.

### 3. Master-discount-only, max one per order

- `discounts` is a **master table**, managed by the Owner (optionally Admin
  per policy): `name`, `type` (`PERCENT` | `FIXED`), `value`, `active`,
  optional `min_order_subtotal`.
- At order creation the client may submit **one** `discount_id`. There is **no
  free-form manual discount input** in the MVP.
- The backend validates: discount exists and `active`; `PERCENT` value
  1–100; `FIXED` value ≤ order subtotal; `min_order_subtotal` satisfied.
- Computation (integer rupiah):

```text
order_subtotal = Σ item.unit_price          (per item: Σ service snapshot prices)
discount_value = PERCENT: floor(subtotal × value / 100)
                 FIXED:   value             (clamped to ≤ subtotal)
grand_total    = order_subtotal − discount_value
remaining      = grand_total − Σ payments.amount_paid
```

- Cashiers see and apply registered discounts only; granting power is
  controlled by owning the `discounts` master data, not by a per-order
  permission.

### 4. Orders are immutable after creation

- `PUT /orders/{id}` may change **only**: customer notes / internal notes,
  and photo management (photos have their own endpoints).
- Items, services, discounts, and totals are **locked** from creation.
- Corrections happen by **cancel + re-create** (`CANCELLED` per ADR-0001
  rules, then a new order with a new number). This keeps the ledger, audit
  log, and payment records consistent.
- Consequently the conceptual payload for `POST /orders` carries
  `discount_id` (nullable) instead of a raw discount amount:

```json
{
  "customer_id": 10,
  "items": [
    { "brand": "Nike", "model": "Air Force 1", "color": "White",
      "shoe_type": "Sneakers", "notes": "Yellowing on sole", "services": [2, 5] }
  ],
  "discount_id": null
}
```

### 5. Service price changes are audited

- Changing a service's price writes a `SERVICE_PRICE_CHANGED` audit log entry
  (before/after payloads), per `prd-backend.md` §25. Existing orders are
  untouched by definition (snapshot rule above).

## Alternatives Considered

### DECIMAL(15,2) money

Rejected: rupiah has no sub-unit in practice; decimals invite float casts and
rounding drift across PHP/JS/SQL boundaries. Integer arithmetic is exact and
trivially validated.

### Manual free-form discount input

Rejected during grilling refinement: simplest UX for negotiation-driven
discounts, but uncontrolled — any value the cashier types becomes revenue
leakage with no master-data oversight. Owner chose registered discounts as the
control point.

### Multiple/stacked discounts

Rejected: compounding rules, precedence, and reporting ambiguity for
marginal flexibility at a single store.

### Editable orders while UNPAID

Rejected: re-pricing an order that already has payments recorded forces
refund/partial-adjustment logic into the MVP; cancel + re-create is simpler,
auditable, and matches how the shop already thinks about mistakes.

## Consequences

- **Positive**: deterministic, testable pricing (pure integer function of
  snapshot + discount); zero float bugs; revenue cannot be silently discounted
  by staff; audit trail is complete.
- **Negative**: no ad-hoc negotiated discount without the Owner registering it
  first (accepted as a control, not a bug); correcting an order costs a cancel
  + re-create cycle; percent rounding must be documented to clients for
  preview parity (client preview should use the same floor rule).
- **Neutral**: `discounts` table gains `type`, `value`, `active`,
  `min_order_subtotal` columns in the PRD schema; orders carry
  `discount_id` + computed `discount_value`.
