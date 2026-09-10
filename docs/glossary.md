# Glossary — Klinik Sepatu (Cleaning Shoe Service POS)

Domain vocabulary of the system, agreed during the grilling session on
2026-09-10. This is the single reference used by all three PRDs, the ADRs,
and the code. Code identifiers (entities, enums, DB columns) use these
English terms; UI copy is Bahasa Indonesia (ADR-0012).

## Order & Workflow

- **Order** — one customer transaction (one receipt): a unique daily order
  number, one customer, ≥1 Order Item, immutable totals. Owns the status
  lifecycle. *(Pesanan)*
- **Order Number** — human-readable identifier `ORD-YYYYMMDD-####`, generated
  from a daily sequence with row-level locking, reset daily in
  `Asia/Jakarta`; gaps allowed (ADR-0009).
- **Order Item** — one pair of shoes inside an order (brand, model, color,
  type, notes, photos, selected services). Has no status of its own in the
  MVP — it follows the order status (ADR-0001).
- **Order Status** — the single status, at order level; only 5 values:
  `RECEIVED`, `ON_PROCESS`, `READY_FOR_PICKUP`, `COMPLETED`, `CANCELLED`.
  Transitions follow the matrix in ADR-0001; every transition writes an
  `order_status_histories` row.
- **Status Transition Matrix** — the from×to map the backend enforces;
  illegal skips are rejected with 422 (ADR-0001).
- **Order Status History** — append-only record per status change
  (order_id, from, to, actor, timestamp).
- **Order Item Service** — item→service relation carrying a **price
  snapshot** (`unit_price`) copied at order creation; immune to later
  master price changes (ADR-0004).

## Service & Pricing

- **Service** — the priceable master item (deep clean, unyellowing,
  repainting, etc.); category, description, price, duration estimate,
  active flag.
- **Service Category** — grouping of services for UI/reports.
- **Master Service Price** — a service's current price; changes apply only
  to new orders and always log `SERVICE_PRICE_CHANGED` in the audit log
  (ADR-0004).
- **Snapshot Price (`unit_price`)** — the price frozen onto an order item
  service when the order is created.
- **Order Subtotal** — Σ snapshot prices of all services of all items.
- **Discount** — owner-owned master data (not free-form input): `PERCENT`
  (1–100, rounded **down** to the whole rupiah) or `FIXED` (nominal),
  optional `min_order_subtotal`; at most **one** per order (ADR-0004).
- **Discount Value** — the computed discount amount on an order (integer
  rupiah, clamped ≤ subtotal).
- **Grand Total** — `order_subtotal − discount_value`; the immutable
  transactional value.
- **Integer Rupiah** — the money representation everywhere: BIGINT, no
  decimals, min 0; no floats in the pricing pipeline (ADR-0004).

## Payment

- **Payment** — a payment recorded by the cashier against an existing
  order (method + amount). QRIS/TRANSFER credibility is the cashier's
  manual confirmation, not automated proof (ADR-0002).
- **Payment Method** — `CASH`, `QRIS`, `TRANSFER` (MVP; no gateway).
- **Payment Status** — a server-**derived** value (never client input):
  `UNPAID`, `PARTIAL`, `PAID`; `REFUNDED` reserved for the future.
- **Order-First Flow** — the mandatory sequence: create the order (UNPAID)
  → payment screen → `POST /orders/{id}/payments` (ADR-0002).
- **Outstanding Payment** — Σ (`grand_total` − `paid_total`) over
  non-cancelled orders with a positive remainder (ADR-0005).
- **Force Settlement** — the guard requiring `payment_status = PAID`
  before `COMPLETED` (ADR-0001, 0002).
- **Refund Record** — the recording of returned money when cancelling an
  order that already has payments; required before cancellation
  (ADR-0002).
- **Payment Transaction** — a table reserved for a future gateway
  integration; **not used in the MVP**.

## Customer

- **Customer** — the shoe owner; primary identity is the phone number.
- **Canonical Phone** — the unique stored format `62` + significant digits
  (`62812…`); UNIQUE constraint; server-side normalization from any common
  input format (`0812…`, `+62…`) (ADR-0008).
- **Phone Normalization** — the server-side process: strip non-digits →
  convert prefix → validate length/prefix → store canonical.

## Photos

- **Photo Type** — the business meaning of a photo: `BEFORE` (intake
  evidence), `AFTER` (result proof), `DAMAGE` (defect record), `QC`
  (QC sign-off). The only photo data axis (ADR-0007).
- **Angle Guidance** — the 5-angle SOP (front/back/left/right/top) in the
  mobile wizard; purely UI guidance, never persisted by the backend
  (ADR-0007).
- **UUID Public URL** — photo access pattern: random UUID filenames on a
  public disk, stable direct URLs, no signed URLs (ADR-0007).
- **Object Storage (MinIO)** — file storage via the S3-compatible driver;
  never database blobs (ADR-0007).

## Notifications & Receipt

- **Digital Receipt (Struk Digital)** — the order summary sent via
  WhatsApp when an order is created: number, items, totals, payment
  status, store footer (ADR-0006).
- **Notification Event** — the 4 MVP events: `ORDER_RECEIVED_RECEIPT`,
  `PAYMENT_RECEIVED`, `ORDER_READY_FOR_PICKUP`, `ORDER_COMPLETED`; one
  approved WhatsApp template each (ADR-0006).
- **WhatsApp Cloud API** — the official Meta channel via
  `WhatsAppCloudProvider`; the domain only knows the abstraction
  (PRD backend §23).
- **Notification Status** — `QUEUED` → `SENT` / `FAILED` (bounded retry);
  `SKIPPED` for invalid/missing numbers; a failed send never rolls back
  the business operation (ADR-0006).

## Security & API

- **Idempotency Key** — a client UUID on `POST /orders` and create
  payment; retries never create duplicates (PRD §27; ADR-0002).
- **PAT (Personal Access Token)** — revocable Sanctum token, the single
  auth mechanism for web + mobile; no `/auth/refresh` (ADR-0003).
- **Username** — the unique login identifier (min 3 chars); email is
  optional (ADR-0003).
- **Audit Log** — actor/action/entity/before/after records for important
  actions (PRD §25).
- **Offset Pagination** — the single convention `?page=&per_page=` + meta
  `total/last_page`; mobile infinite scroll requests page+1 (ADR-0011).
- **Derived Status** — a value computed by the server from data (not
  client input); e.g. `payment_status`.

## Roles

- **OWNER** — full access; sole manager of master discounts, users,
  settings.
- **ADMIN** — operational & backoffice; cannot manage owners.
- **CASHIER** — login, customers, orders, payments, BEFORE photos; cannot
  edit master data; dashboard access limited to operational counts (no
  revenue).
- **CLEANER / QC** — future-phase roles (per-item workflow); not in the
  MVP (ADR-0001).

## Reports

- **Revenue (order-creation basis)** — Σ `grand_total` of non-cancelled
  orders **created** in the period, `Asia/Jakarta`; payment status is a
  dimension, not a revenue filter (ADR-0005).
- **Report Export** — the async XLSX flow: create record → queue job →
  generate → store → poll/download (PRD §21–22).
- **Outstanding** — see *Outstanding Payment*.

## Structure

- **Monorepo** — one repository `backend/ web/ mobile/ docs/`; PRDs at the
  root (ADR-0010).
- **Business Timezone** — `Asia/Jakarta` for every period boundary, the
  daily order number, and displayed dates (PRD backend §20).
