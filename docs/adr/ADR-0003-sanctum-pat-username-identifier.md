# ADR-0003: Sanctum Personal Access Tokens with Username Identifier

- **Status**: Accepted
- **Date**: 2026-09-10
- **Deciders**: Owner (product), Engineering
- **Related PRD sections**: `prd-backend.md` §3, §13, §26; `prd-web.md` §8; `prd-mobile.md` §6
- **Related ADRs**: ADR-0012 (UI language), ADR-0004 (no payment data in logs)

## Context

The backend serves two clients with very different runtime environments:

1. **Web dashboard** (React + Vite) — browser, Owner/Admin, desktop-first.
2. **Mobile POS** (React Native + Expo) — Android, Cashier/Admin, portrait-first.

The PRD said "Laravel Sanctum **atau mekanisme setara**" and kept
`POST /auth/refresh` conditional ("bila strategy membutuhkan"). Auth had to be
pinned down because it determines the login API shape, token storage, session
restore, logout, and 401 handling on both clients.

Candidates:

1. **Sanctum personal access tokens (PAT)** for both clients.
2. **Sanctum SPA cookie sessions** for web + PAT for mobile (two mechanisms).
3. **JWT with refresh tokens** (e.g., tymon/jwt-auth), short-lived access
   token + `/auth/refresh`.

Separately, the PRD only said "user login identifier unique" — the identifier
itself (email? username? either?) was undecided, and the target users are
UMKM cashiers who may not use email at all.

## Decision

### 1. Sanctum personal access tokens for all clients

- `POST /auth/login` (identifier + password) issues a Sanctum **PAT**.
- The token is long-lived and **revocable**: `POST /auth/logout` revokes the
  current token; user deactivation revokes all of that user's tokens.
- `GET /auth/me` returns the authenticated user (id, name, username, role,
  status).

### 2. `/auth/refresh` is removed from the spec

Sanctum PATs do not need refresh rotation for an internal-tool MVP. The
endpoint listed as conditional in `prd-backend.md` §13 is **deleted**;
expired/revoked tokens simply yield `401` and the client redirects to login.

### 3. Token storage per client

- **Web**: token persisted client-side and attached as `Authorization: Bearer`
  by the single API client abstraction (`services/api.ts`); session survives
  browser refresh. Pragmatic for an internal, non-public dashboard behind a
  controlled origin.
- **Mobile**: token in platform secure storage (Expo SecureStore /
  Android Keystore-backed); session restore on app open; logout clears it.

### 4. Identifier = username (unique); email optional

- `users.username` is the **unique login identifier** (min 3 chars,
  alphanumeric + underscore).
- `users.email` is **nullable** and informational only — never used for login.
- Password reset is an owner/admin action via user management, not self-service
  email reset (MVP).

### 5. Security rules carried into the specs

- Tokens are never written to logs or console on any client (PRD backend §26,
  web §23, mobile §29 — all already aligned).
- Rate limiting on `POST /auth/login` and sensitive endpoints.
- 401 responses trigger logout/redirect on both clients.

## Alternatives Considered

### Sanctum SPA cookie sessions (web) + PAT (mobile)

Rejected: strongest XSS posture for the web client, but running two auth
mechanisms doubles backend configuration (CSRF, stateful guards, origins) and
client-side API handling for a two-client internal system — the marginal
security gain does not justify the maintenance cost at this scale.

### JWT + refresh endpoint

Rejected: robust token-expiry policy, but adds a third-party dependency,
refresh-token storage/rotation logic on two clients, and `/auth/refresh`
semantics — complexity the MVP does not need. Revocation (instant logout,
user deactivation) is actually *harder* with stateless JWT than with Sanctum
PATs.

### Email as the identifier

Rejected: forces every cashier to have an email; UMKM reality is
WhatsApp/phone-first staff accounts. Email becomes optional metadata instead.

## Consequences

- **Positive**: one mechanism, one login endpoint, one storage pattern per
  client; instant revocation for deactivation/logout; zero extra dependencies;
  `/auth/refresh` ambiguity resolved by deletion.
- **Negative**: a stolen web token is valid until revoked (no automatic
  expiry rotation) — accepted for an internal dashboard; XSS hygiene on the
  web app remains important; users without email cannot self-recover
  passwords (owner/admin resets instead).
- **Neutral**: Sanctum's `personal_access_tokens` table is part of the schema;
  token abilities (scopes) are available if finer-grained permissions are
  needed later without changing the mechanism.
