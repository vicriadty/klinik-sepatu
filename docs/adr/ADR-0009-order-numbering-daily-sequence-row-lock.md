# ADR-0009: Order Numbering — Daily Sequence with Row-Level Locking

- **Status**: Accepted
- **Date**: 2026-09-10
- **Deciders**: Owner (product), Engineering
- **Related PRD sections**: `prd-backend.md` §6.1, §11, §17
- **Related ADRs**: ADR-0002 (order creation is the atomic business event), ADR-0011 (PostgreSQL as the coordination point)

## Context

Order numbers follow the human-readable format `ORD-20260908-0001`
(date + daily counter, per `prd-backend.md` §6.1) and must be **unique**
(§11). Two cashiers can submit orders concurrently on one mobile device
each, so the generator must be race-safe. The number appears on the
customer's WhatsApp receipt (ADR-0006) and is spoken across the counter, so
it must be short, sequential per day, and predictable — not a random
identifier.

Candidates:

1. **Daily counter table + `SELECT … FOR UPDATE`** (row lock inside the
   order-creation transaction).
2. **Derive from the auto-increment `id`** (e.g., `ORD-{id}`).
3. **UUID** as the order number.

## Decision

### 1. Dedicated `daily_sequences` table with row-level locking

```text
daily_sequences (date DATE PRIMARY KEY, last_number BIGINT NOT NULL)
```

Generation happens **inside the order-creation DB transaction**:

```sql
INSERT INTO daily_sequences (date, last_number) VALUES (:today, 1)
ON CONFLICT (date) DO UPDATE SET last_number = daily_sequences.last_number + 1
RETURNING last_number;
```

- The upsert takes/creates the row lock for `:today`; concurrent creators
  queue on it — two cashiers can never receive the same counter value.
- `:today` is resolved in the business timezone **`Asia/Jakarta`** (the date
  component of the number must match the shop's operating day, not UTC —
  an 8 PM order is still "today's" number).
- Final number: `ORD-YYYYMMDD-####` (counter zero-padded to 4 digits,
  practically unlimited by the BIGINT column).

### 2. Unique constraint on `orders.order_number`

The DB-level UNIQUE constraint (PRD §11) remains as the final guard; with
the locked counter it should never fire, but if it ever does the creation
transaction retries the sequence once before failing.

### 3. No gaps guarantee is explicitly NOT promised

If a creation transaction rolls back after consuming a counter (validation
failure after allocation, deadlock, etc.), that number is skipped. Numbers
are **unique and per-day sequential**, not gap-free — standard for POS
systems; chasing gaplessness would require serializing all failures too.

## Alternatives Considered

### Derive from auto-increment `id` (e.g., `ORD-{id}` or `ORD-{YYYYMMDD}-{id}`)

Rejected: no extra table, but numbers jump when transactions roll back or
rows are deleted, never reset per day, and leak total order volume
(`ORD-8` on day one tells customers the shop is new / `ORD-9517` later tells
them how busy it is). The daily-reset format also matches how the shop
already refers to orders ("order hari ini nomor berapa?").

### UUID as order number

Rejected: perfect uniqueness with zero coordination, but unusable verbally —
the cashier and customer must read the number across the counter and by
phone; a 36-char hex string fails that job. (UUIDs may still be used
internally for idempotency keys, per PRD §27 — different concern.)

### Application-level lock (e.g., Redis lock / cache lock)

Rejected: introduces a Redis dependency the PRD explicitly defers, and the
database already provides correct, transactional locking for a single-store
write volume.

## Consequences

- **Positive**: race-safe at any realistic concurrency; numbers are short,
  human-friendly, and reset daily; the mechanism is one small table plus a
  single guarded upsert — easy to unit-test with parallel transactions.
- **Negative**: order creation serializes briefly on the per-day counter row
  (microseconds — irrelevant at single-store volume); rolled-back
  transactions leave gaps (accepted, documented above); the daily sequence
  date must use `Asia/Jakarta` consistently or numbers drift across
  midnight.
- **Neutral**: `daily_sequences` is added to the PRD's minimum table list
  (§10); the generator lives in a dedicated domain service
  (`OrderNumberGenerator`) so the policy is swappable without touching
  controllers.
