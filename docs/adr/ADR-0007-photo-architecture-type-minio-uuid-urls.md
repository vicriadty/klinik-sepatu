# ADR-0007: Photo Architecture — Type Taxonomy, MinIO Storage, UUID Public URLs

- **Status**: Accepted
- **Date**: 2026-09-10
- **Deciders**: Owner (product), Engineering
- **Related PRD sections**: `prd-backend.md` §18, §24; `prd-mobile.md` §12, §23
- **Related ADRs**: ADR-0001 (photo types vs. workflow), ADR-0002 (BEFORE photos at intake)

## Context

Two vocabularies for photos collided across PRDs:

- Backend §18: photo **types** `BEFORE` / `AFTER` / `DAMAGE` / `QC`.
- Mobile §12: SOP **angle categories** front / back / left / right / top /
  damage-special — a per-shoe photo checklist for intake.

Options to reconcile:

1. **Two fields** on `order_item_photos`: `type` (backend enum) + `angle`
   (mobile SOP enum).
2. **Type only** — keep the backend enum; the 5-angle checklist becomes UI
   guidance in the mobile wizard, not a data model concern.
3. **Type + free-form label string**.

Separately, the PRD required "S3-compatible object storage" for photos with
no concrete driver, and photo access control was undecided
(signed URLs vs. public-but-unguessable).

## Decision

### 1. Single `type` column; angle is UI guidance, not data

- `order_item_photos.type` ∈ `BEFORE` | `AFTER` | `DAMAGE` | `QC` — the
  contract between backend and clients.
- The mobile wizard's 5-angle SOP (front/back/left/right/top) is implemented
  as **in-app capture guidance** (checklist UI encouraging a complete set of
  `BEFORE` photos, plus `DAMAGE` shots when defects are noted). The angle of
  any individual shot is not persisted by the backend.
- Rationale: angle is photographic technique; `type` is business meaning
  (evidence at intake vs. proof of result vs. defect record vs. QC sign-off).
  Mixing them into one enum would let UI conventions leak into the data
  contract, and future web QC views need business meaning, not camera angles.

### 2. Storage: MinIO via Docker (S3-compatible)

- Photos are stored through Laravel's S3 disk driver pointed at **MinIO**
  (docker-compose service) in development and on the single production
   server.
- Migration to any S3-compatible cloud later is a `.env` change, per PRD
   "arsitektur harus memungkinkan migrasi".
- Files are **never** stored as database blobs (PRD §18); the DB keeps
  `path` + metadata only.

### 3. Access: UUID filenames, public URL

- Each upload gets a **UUID filename** (no user-controlled names) stored on
  the public disk; the API returns a stable direct URL.
- No signed/expiring URLs in the MVP. The UUID makes URLs unguessable;
  shoe photos are considered low-sensitivity business records.
- `DELETE /order-item-photos/{photo}` removes the DB row and the object;
  photo edits are allowed post-creation (ADR-0004 locks items/totals, not
  photos).

### 4. Upload pipeline rules (carried into specs)

- Validation: mime type (JPEG/PNG/WebP), max size (e.g., 5 MB post-compress),
  extension check — per PRD §26.
- Mobile compresses/resizes **before** upload (PRD mobile §23); backend
  re-validates size and may queue thumbnail generation (image processing is
  a queued job per PRD §24).
- Photos upload after order creation (order-first flow, ADR-0002):
  the wizard captures locally, submits the order, then uploads `BEFORE`/
  `DAMAGE` photos to the created order items; per-item upload failures are
  retryable without invalidating the order.
- Upload order does not block order creation — the success screen only needs
  the order number.

## Alternatives Considered

### Two fields: `type` + `angle`

Rejected: satisfies both PRDs literally but adds a validation matrix
(e.g., is `angle=FRONT` valid with `type=QC`?) and a second enum that no
backend report, dashboard, or future QC screen actually consumes. The SOP
checklist lives better in the mobile UI.

### Type + free-form label

Rejected: flexible but unvalidatable; reporting on photos (e.g., "does this
item have AFTER photos?") must then do fuzzy matching on strings.

### Local disk driver (no MinIO)

Rejected: zero infra, but the PRD explicitly names S3-compatible storage;
starting local risks URL/format migration pain when moving to real S3 later.
MinIO in Docker is one compose service and honors the contract from day one.

### Signed URLs with expiry

Rejected for MVP: stronger privacy, but every list/detail render must mint
fresh URLs, cached responses break, and offline/mobile cache layers churn —
significant complexity for low-sensitivity operational photos.

### Cloud S3/R2 from day one

Rejected: valid option, but adds account/billing/egress dependency and
requires stable internet from the shop for every thumbnail; MinIO keeps the
stack self-contained while preserving the S3 contract.

## Consequences

- **Positive**: one small validated enum; mobile keeps its SOP discipline in
  UI; storage contract is S3 from day one with self-hosting; URLs are
  simple, cacheable, and stable; photo lifecycle (add/delete) stays possible
  after order creation without touching pricing.
- **Negative**: anyone holding a photo URL can view it (accepted: UUIDs are
  unguessable and content is non-sensitive); angle metadata is lost — if the
  shop later wants structured per-angle comparison views, a migration would
  be needed; MinIO is one more container to operate and back up.
- **Neutral**: `order_item_photos` schema in the PRD gains explicit
  `type` values documentation; thumbnail generation joins the queue workload
  list (exports, notifications, image processing).
