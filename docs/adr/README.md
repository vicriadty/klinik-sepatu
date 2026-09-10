# Architecture Decision Records

Architecture decisions for Klinik Sepatu (Cleaning Shoe Service POS),
produced by the grilling session on **2026-09-10**. Each ADR follows the
format Context → Decision → Alternatives Considered → Consequences.

## Status Legend

- **Accepted** — active decision, binding for implementation.
- **Superseded** — replaced by another ADR (link to the successor).
- **Proposed** — under discussion, not final.

## Index

| ADR | Title | Status | Core decision |
|-----|-------|--------|---------------|
| [0001](ADR-0001-single-level-five-status-order-lifecycle.md) | Single-Level Five-Status Order Lifecycle | Accepted | The order is the only status-bearing entity; 5 statuses (`RECEIVED → ON_PROCESS → READY_FOR_PICKUP → COMPLETED`, `CANCELLED` only from the first two); per-item granular workflow deferred; `COMPLETED` requires `PAID` |
| [0002](ADR-0002-order-first-payment-flow-static-qris.md) | Order-First Payment Flow, Static QRIS | Accepted | Order created first (UNPAID) → payment screen; static QRIS + manual cashier confirmation (no gateway); `payment_status` is server-derived; cancelling a paid order requires a refund record |
| [0003](ADR-0003-sanctum-pat-username-identifier.md) | Sanctum PAT, Username Identifier | Accepted | One Sanctum PAT mechanism for web + mobile; `/auth/refresh` removed; login via unique **username**, email optional; revocable tokens |
| [0004](ADR-0004-pricing-integrity-integer-rupiah.md) | Pricing Integrity — Integer Rupiah | Accepted | Money = integer rupiah (BIGINT); price snapshots at order creation; **master discounts only** (max 1/order, PERCENT/FIXED); orders immutable (notes/photos only); corrections = cancel + re-create |
| [0005](ADR-0005-revenue-recognition-order-creation-date.md) | Revenue = Order Creation Date | Accepted | Revenue computed from `orders.created_at` (Asia/Jakarta), excluding CANCELLED; payment status is a report dimension, not a revenue filter |
| [0006](ADR-0006-whatsapp-cloud-api-notifications.md) | WhatsApp Cloud API + Digital Receipt | Accepted | Official WhatsApp Cloud API in the MVP via the provider abstraction; 4 events (receipt, payment, ready-for-pickup, completed) = 4 Meta templates; queued, non-blocking; delivery status tracked in `notifications` |
| [0007](ADR-0007-photo-architecture-type-minio-uuid-urls.md) | Photos: Type, MinIO, UUID URLs | Accepted | Single `type` column (BEFORE/AFTER/DAMAGE/QC); the 5-angle SOP is mobile UI guidance, not data; MinIO via Docker (S3-compatible); UUID public URLs without signed URLs |
| [0008](ADR-0008-customer-identity-unique-phone-normalization.md) | Customer = Unique Phone + 62 Normalization | Accepted | `phone` unique, stored canonically as `62812…`; server-side normalization; search accepts any format; duplicates → 409 + offer the existing customer |
| [0009](ADR-0009-order-numbering-daily-sequence-row-lock.md) | Order Numbering: Daily Sequence + Row Lock | Accepted | `daily_sequences` table + upsert `RETURNING` inside the creation transaction; race-safe; daily reset (Asia/Jakarta); gaps allowed |
| [0010](ADR-0010-monorepo-layout.md) | Monorepo backend/web/mobile | Accepted | One repo: `backend/ web/ mobile/ docs/` + top-level docker-compose; PRDs stay at the root; no shared TS package in the MVP |
| [0011](ADR-0011-backend-tooling-pest-scramble-offset-pagination.md) | Tooling: Pest, Scramble, Offset Pagination | Accepted | Pest for all test layers; Scramble auto-OpenAPI (used by contract tests + client typing); offset pagination everywhere; Laravel 12 + PostgreSQL |
| [0012](ADR-0012-language-policy.md) | Language Policy | Accepted | UI in Bahasa Indonesia (all clients, client-side error mapping); technical docs & ADRs in English; code vocabulary English; no toggle in the MVP |

## Cross-ADR Principles

1. **The backend is the only authority** — pricing, status, payment,
   permissions (PRD backend §2.2; reinforced by ADR-0002, 0004).
2. **Immutable by default** — orders lock after creation; corrections go
   through cancel + re-create (ADR-0004); payments are recorded, never
   edited.
3. **Small, stable contracts** — 5 statuses, 1 discount kind, 1 pagination
   shape, 4 WhatsApp templates; any contract addition requires a PRD
   update + a new ADR.
4. **Queue everything heavy** — exports, notifications, image processing
   (PRD §24; ADR-0006, 0011).
5. **Idempotent & race-safe** — idempotency keys on order/payment
   creation; row-locked sequences; unique constraints as the last guard
   (ADR-0002, 0008, 0009).

## How to Change a Decision

1. Write a new numbered ADR (`ADR-0013-...`) with status `Proposed`.
2. If it supersedes an old one: set the old ADR's status to
   `Superseded by ADR-00XX` and cross-link it.
3. List the affected PRD sections; update the PRDs in the same PR
   (AI-agent rules in all three PRDs).
4. Include the tests that prove the new rule (PRD backend §29).
