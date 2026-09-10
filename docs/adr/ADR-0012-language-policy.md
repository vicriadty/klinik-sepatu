# ADR-0012: Language Policy — Bahasa Indonesia UI, English Technical Docs

- **Status**: Accepted
- **Date**: 2026-09-10
- **Deciders**: Owner (product), Engineering
- **Related PRD sections**: all three PRDs (cross-cutting); `prd-web.md` §20; `prd-mobile.md` §26
- **Related ADRs**: none (policy decision)

## Context

The product serves Indonesian UMKM staff (cashiers) and an owner who
operate in Bahasa Indonesia day-to-day, while the PRDs themselves are
written in mixed Indonesian/English and the codebase vocabulary (entities,
enums, endpoints) is English. An explicit language policy was missing:
UI copy, validation messages, docs, and ADRs could each drift either way.

Options:

1. **UI in Bahasa Indonesia; technical documentation in English.**
2. **Everything English.**
3. **Everything Indonesian.**
4. **Bilingual UI with a language toggle.**

## Decision

### 1. User-facing UI: Bahasa Indonesia

- All UI copy in both clients — labels, buttons, empty states, toasts,
  confirmation dialogs, KPI titles ("Pendapatan hari ini", "Siap diambil"),
  and status badges ("Diproses", "Selesai") — is **Bahasa Indonesia**.
- Error **messages** shown to users are Indonesian and actionable ("Nomor
  telepon sudah terdaftar — gunakan pelanggan yang ada?").
- Laravel's default English validation strings are **not surfaced raw**:
  clients map field/error keys to Indonesian copy themselves, so the
  backend response contract stays stable (field → errors[]) while users
  see Indonesian text.

### 2. Technical documentation: English

- ADRs (this directory), the glossary, and engineering-level docs
  (README, API notes, migration notes) are **English**.
- The PRDs remain as written (mixed Indonesian prose) — they are product
  artifacts; new normative additions during implementation are written to
  match their surrounding style, while decisions with engineering
  consequences get an English ADR here.

### 3. Code vocabulary: English (unchanged)

- Entities, enums, endpoints, DB columns, and code identifiers stay English
  (`Order`, `READY_FOR_PICKUP`, `grand_total`) — they are API/DB contract,
  not UI copy. UI labels are never derived by "translating" enum names in
  code; each client owns a label map (also satisfying web PRD rule 5 /
  mobile PRD rule 3: no hard-coded contract values — a typed constant map
  keyed by backend values is the pattern).

### 4. No language toggle in the MVP

Single-locale UI, Indonesian. i18n framework setup is deferred; copy lives
in per-client constants files, structured so extracting to an i18n library
later is mechanical.

## Alternatives Considered

### Everything English

Rejected: cashier-facing POS speed depends on reading at a glance; English
UI adds friction for exactly the users the mobile PRD optimizes for
("cepat digunakan dengan satu tangan", minimal cognitive load).

### Everything Indonesian

Rejected for docs: engineering documentation in Indonesian narrows the
contributor/maintainer pool and diverges from the code vocabulary
(English identifiers), forcing constant code-switching inside sentences —
the PRDs already exhibit this friction.

### Bilingual UI with toggle

Rejected for MVP: doubles copy maintenance and test surface (snapshot/label
assertions per locale) for a single-shop, single-locale user base.

## Consequences

- **Positive**: cashiers get fastest-reading UI; docs stay
  maintainer-friendly and consistent with code vocabulary; no i18n
  machinery to build or test.
- **Negative**: every backend validation error needs a client-side
  Indonesian mapping (a shared per-client error-map file must be kept
  aligned with the API's field names); adding a second locale later is a
  real (though mechanical) project.
- **Neutral**: date/time formatting is `Asia/Jakarta` + Indonesian
  conventions (web PRD §20), currency is `Rp` formatting of integer
  rupiah (ADR-0004) — both already locale-consistent with this policy.
