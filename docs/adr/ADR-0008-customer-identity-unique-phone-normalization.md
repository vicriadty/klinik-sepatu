# ADR-0008: Customer Identity — Unique Phone with 62 Normalization

- **Status**: Accepted
- **Date**: 2026-09-10
- **Deciders**: Owner (product), Engineering
- **Related PRD sections**: `prd-backend.md` §11, §15; `prd-mobile.md` §8
- **Related ADRs**: ADR-0006 (WhatsApp recipient), ADR-0003 (identifier philosophy)

## Context

Customers are identified primarily by phone at the counter ("cari nomor
Budi"). Indonesian phone numbers are written in many formats:
`0812…`, `62812…`, `+62 812…`, sometimes with spaces/dashes. The PRD only
required "customer phone index" — uniqueness policy was undecided.

The three candidate policies:

1. **Unique + normalized to 62 prefix** — store `62812…`; input in any
   common format is normalized before the uniqueness check.
2. **Unique on raw string** — exact-match uniqueness, no normalization.
3. **No uniqueness** — phone is a searchable attribute only.

This choice determines whether a customer's transaction history stays whole
and whether WhatsApp notifications (ADR-0006) have a reliable destination.

## Decision

### 1. `customers.phone` is UNIQUE, stored in normalized form

- Canonical storage format: **`62` + significant digits**, no `+`, no
  spaces, no dashes, no leading `0` — e.g., all of `08123456789`,
  `+62 812-3456-789`, `62812345678` become `62812345678`.
- Normalization runs **server-side** on create and update (validation layer),
  not only in the client: strip non-digits → map leading `0` or `62` to
  canonical form → validate length/prefix plausibility (11–15 digits, starts
  with `62`).
- The DB enforces a **UNIQUE constraint** on the normalized column as the
  final guard (race-safe against two cashiers creating the same customer
  simultaneously → second insert gets `409`/`422` with an actionable message).

### 2. Search accepts any format

- `GET /customers?search=…` normalizes digit-only queries the same way
  before matching, and also matches `name` (case-insensitive) — the cashier
  can type the number exactly as the customer says it.
- Search remains flexible even though storage is canonical.

### 3. Client behavior (mobile)

- The create-customer form displays a **normalized preview** (e.g., typing
  `0812…` shows `+62 812…`) so the cashier sees what will be stored, but the
  client does not enforce its own format policy — the backend is the
  authority (mobile §8 already says validation follows backend policy).
- On `409`-class duplicate errors, the mobile app offers the existing
  customer record instead of forcing a new one.

### 4. WhatsApp linkage

- The normalized phone doubles as the WhatsApp recipient number for
  notification events (ADR-0006) — one identity, one channel address, no
  separate "WhatsApp number" field in the MVP.

## Alternatives Considered

### Unique on raw string

Rejected: `08123456789` and `62812345678` would become two customers; every
duplicate silently splits transaction history and skews customer reports —
the exact failure this policy exists to prevent.

### No uniqueness (index only)

Rejected: maximally forgiving at the counter, but history fragmentation is
guaranteed at any real volume, and the customer report (PRD §22) becomes
unreliable.

### Server-side fuzzy dedup / merge tooling

Rejected for MVP: powerful but complex (merge UI, conflict rules); strict
normalization + unique constraint makes duplicate *creation* rare enough
that merge tooling can wait for a real need.

## Consequences

- **Positive**: one phone = one customer = whole transaction history;
  customer reports and repeat-customer insights are trustworthy; WhatsApp
  notifications have a deterministic destination; race conditions are
  resolved by the DB constraint.
- **Negative**: genuinely distinct customers sharing a phone (family members)
  must be distinguished by name within one customer record — accepted MVP
  simplification; normalization must be conservative (malformed numbers
  rejected with a clear message rather than silently mangled).
- **Neutral**: `customers` schema documents the canonical format; a
  `phone_normalized` display helper (e.g., `+62 812-3456-789`) may be added
  client-side for readability without affecting storage.
