# ADR-0010: Monorepo Layout for Backend, Web, and Mobile

- **Status**: Accepted
- **Date**: 2026-09-10
- **Deciders**: Owner (product), Engineering
- **Related PRD sections**: all three PRDs (cross-cutting); `prd-web.md` §5; `prd-mobile.md` §5
- **Related ADRs**: ADR-0011 (shared tooling), ADR-0004 (API contract changes touch spec + clients together)

## Context

The system is three applications against one API contract:

- `backend/` — Laravel REST API (single source of truth).
- `web/` — React + Vite owner/admin dashboard.
- `mobile/` — React Native + Expo cashier app.

The PRDs cross-reference constantly (the web PRD forbids inventing endpoints
without updating the backend spec; the mobile PRD requires typed models from
the API contract). Structural options:

1. **Monorepo** — one repository, three app directories + shared docs.
2. **Three separate repositories.**
3. **Monorepo + `packages/contracts`** shared TypeScript types
   (JS workspaces).

The repo currently holds the PRDs at the root and a `web-templates/src`
reference template (Tailwind CSS v4 + ApexCharts + react-router v7) that
will seed `web/`.

## Decision

### 1. Single repository, app-scoped directories

```text
klinik-sepatu/
├── backend/          # Laravel API (PHP 8.4, REST /api/v1)
├── web/              # React + Vite + TS dashboard (seeded from web-templates/src)
├── mobile/           # React Native + Expo + TS cashier app
├── docs/             # PRDs, ADRs (this directory), glossary
│   └── adr/
├── prd-backend.md    # keep at root (AI Agent rules reference these paths)
├── prd-web.md
├── prd-mobile.md
└── docker-compose.yml  # app + postgres + minio (ADR-0007) — top-level dev entry
```

- Each app directory is **independently buildable and deployable** with its
  own toolchain (`backend/composer.json`, `web/package.json`,
  `mobile/package.json`); nothing in one app imports from another.
- The existing `web-templates/src` stays as a reference until `web/` is
  scaffolded, then is removed.

### 2. No shared TypeScript package in the MVP

`web/` and `mobile/` each define their own typed models from the API
contract (PRD mobile rule 7). A `packages/contracts` workspace is deferred:
with Scramble auto-generating OpenAPI (ADR-0011), generated types can later
be produced per-app from the spec without a runtime shared package.

### 3. Contract changes are one-repo changes

Because the API spec, both clients, and the ADRs live together, a contract
change is reviewable as a single PR touching `prd-backend.md` +
`backend/` + affected clients — enforcing the AI-agent rules in all three
PRDs mechanically rather than by discipline across repos.

## Alternatives Considered

### Three separate repositories

Rejected: cleanest CI isolation, but every cross-cutting change (a new
endpoint, a status enum change like ADR-0001's 5-status model) becomes a
three-repo coordination exercise; the PRDs' mutual references and the
"update spec when contract changes" rules become cross-repo discipline
instead of same-PR visibility.

### Monorepo + shared contracts workspace

Rejected for MVP: TypeScript project references/workspace tooling
(turbo, nx, or bare npm workspaces) add setup and version-pinning overhead
before the second consumer of the types even exists; per-app types from the
OpenAPI spec achieve the same safety later with less machinery.

### Single mega-package (one package.json, one build)

Rejected: mixing PHP, two React runtimes, and Expo under one toolchain
fights every tool involved.

## Consequences

- **Positive**: atomic cross-stack changes; one clone gives a complete
  system view; docs/ADRs sit next to the code they govern; onboarding is
  one checkout; docker-compose can orchestrate the whole dev stack.
- **Negative**: repository carries three toolchains (PHP + two JS apps) —
  CI must scope jobs by path (e.g., run backend tests only when `backend/`
  changes); repo size grows with mobile assets; a stray root-level script
  could accidentally couple apps (guarded by convention + path-scoped CI).
- **Neutral**: PRD root paths stay valid (`prd-*.md` remain at root);
  `web/` inherits Tailwind v4 + ApexCharts + react-router v7 from the
  template per `prd-web.md` §4.
