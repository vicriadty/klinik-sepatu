# ADR-0011: Backend Tooling — Pest, Scramble, Offset Pagination, Laravel 13

- **Status**: Accepted
- **Date**: 2026-09-10
- **Deciders**: Owner (product), Engineering
- **Related PRD sections**: `prd-backend.md` §3, §12, §21, §29, §30
- **Related ADRs**: ADR-0001 (transition tests), ADR-0004 (pricing tests), ADR-0009 (sequence tests)

## Context

The backend PRD mandates three test layers (unit, feature, contract), API
documentation, consistent pagination across clients, and a Laravel stack —
but names no concrete tools beyond "Laravel". PHP 8.4 is fixed by the PRD.
Undecided items:

1. **Test framework**: Pest vs. classic PHPUnit.
2. **API documentation tool**: the PRD requires docs *and* stable response
   schemas (contract tests) — options were Scramble (auto-OpenAPI), Scribe
   (pretty docs, weak OpenAPI), or OpenAPI-first (hand-written spec).
3. **Pagination style**: web tables want numbered pages; mobile wants
   infinite scroll — offset for everyone, or cursor for mobile?
4. **Laravel version**: PRD says only "Laravel"; with PHP 8.4 the current
   line at scaffolding time is Laravel 13.

## Decision

### 1. Test framework: **Pest**

- All layers — unit (pricing, status transitions, payment balance,
  permissions), feature (login, CRUD, multi-item orders, payments, photos,
  reports, exports, authorization), and contract — are written in **Pest**
  (v2+), which is PHPUnit under the hood.
- Rationale: concise datasets/higher-order tests fit the PRD's tabular rules
  (transition matrix, permission matrix, pricing table) — each rule becomes
  one dataset row instead of a test method.
- Pest's architecture-testing plugin is *not* adopted (no layer enforcement
  rules in MVP scope).

### 2. API documentation: **Scramble** (auto-generated OpenAPI)

- Scramble derives the OpenAPI spec from the code (routes + PHPDoc +
  FormRequest rules), served at a docs URL in non-production.
- **Contract tests consume the generated spec**: response schemas for the
  endpoints used by mobile/dashboard are asserted against the OpenAPI
  definitions, making "response schema API yang dipakai mobile/dashboard
  harus stabil" (PRD §29) mechanically enforced on every CI run.
- The generated spec is the artifact the two clients build typed models
  from (ADR-0010 decision to defer a shared TS package).

### 3. Pagination: **offset everywhere**

```json
{
  "data": [ ... ],
  "meta": { "page": 1, "per_page": 15, "total": 132, "last_page": 9 }
}
```

- One convention for every list endpoint (`orders`, `customers`, `users`,
  transaction/report listings): `?page=&per_page=` (per_page capped, e.g.
  100).
- Web tables render numbered pagination; mobile infinite scroll simply
  requests `page + 1` — no cursor branch anywhere.
- Filter state (search/status/date) rides the query string so pagination
  never drops filters (web PRD §20).

### 4. Laravel 13 on PHP 8.4

- `backend/` uses **Laravel 13** (current line at scaffolding time),
  Sanctum v4 (ADR-0003), database queue driver (PRD §24), and PostgreSQL 16.
- Laravel Excel / PhpSpreadsheet ecosystem for XLSX exports (PRD §22),
  queued via the database queue.

## Alternatives Considered

### PHPUnit classic

Rejected: nothing wrong with it, but Pest expresses the PRD's matrix-shaped
rules with materially less boilerplate; team familiarity favored Pest.

### Scribe

Rejected: excellent human-readable docs, but its OpenAPI export is limited —
the PRD's contract-test requirement needs a machine-accurate spec, which is
Scramble's core feature.

### OpenAPI-first (hand-written spec, code conforms)

Rejected: maximum discipline, but every endpoint costs spec-writing time and
risks drift the other direction (spec says X, code does Y) without a
generator; auto-generation + tests closes the loop cheaper.

### Cursor pagination for mobile

Rejected: correct for high-volume, real-time-insert feeds; a single store's
order volume (tens/day) makes offset pagination's weaknesses theoretical,
and one convention halves the client API-layer code.

## Consequences

- **Positive**: matrix rules become dataset-driven tests; the OpenAPI spec
  is always in sync with the code and doubles as the contract-test oracle
  and the client typing source; one pagination shape to document, learn, and
  mock; current, supported framework line.
- **Negative**: Scramble's inference is imperfect — controllers/FormRequests
  need consistent PHPDoc discipline or the spec grows holes; offset
  pagination degrades at large offsets (irrelevant at this volume, but noted
  as the first thing to revisit if the shop scales).
- **Neutral**: `composer.json` gains `pestphp/pest`, `dedoc/scramble`,
  `maatwebsite/excel` (PhpSpreadsheet transitively); CI jobs run
  `pest --parallel` plus a contract-test suite step.
