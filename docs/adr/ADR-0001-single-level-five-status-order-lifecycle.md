# ADR-0001: Single-Level Five-Status Order Lifecycle

- **Status**: Accepted
- **Date**: 2026-09-10
- **Deciders**: Owner (product), Engineering
- **Related PRD sections**: `prd-backend.md` §7, `prd-mobile.md` §18, §19, §20
- **Supersedes**: The eight-status model implied by `prd-mobile.md` §18

## Context

The three PRDs disagreed on the order status model:

- `prd-backend.md` §7 defined **5 order statuses**:
  `RECEIVED`, `ON_PROCESS`, `READY_FOR_PICKUP`, `COMPLETED`, `CANCELLED`.
- `prd-mobile.md` §18 followed **8 statuses**:
  `RECEIVED`, `INSPECTION`, `CLEANING`, `DRYING`, `QC`,
  `READY_FOR_PICKUP`, `COMPLETED`, `CANCELLED` — while simultaneously
  claiming to defer to backend transitions.
- `prd-backend.md` §2.2 and §6.2 stated that each order **item** (shoe) may
  carry its own workflow status, yet no table (`order_item_status_histories`),
  no endpoint, and no item-status vocabulary was ever specified.

Three candidate resolutions were considered:

1. **Two levels**: coarse 5-status on the order, granular 8-status workflow on
   each item (order status derived from item statuses).
2. **One level, 8 statuses** on the order (all items move in lockstep).
3. **One level, 5 statuses** on the order (granular workflow deferred).

## Decision

Adopt a **single-level, five-status lifecycle on the order** for the MVP:

```text
RECEIVED → ON_PROCESS → READY_FOR_PICKUP → COMPLETED
     └────────┴── CANCELLED (from RECEIVED or ON_PROCESS only)
```

Consequences for the specs:

1. **Order is the only entity with a status.** `order_items` does NOT carry a
   workflow `status` column in the MVP schema. Item-level workflow is a
   documented future phase (cleaning workflow / cleaner role, mobile §19-20).
2. **All items in an order move together** through the order lifecycle.
3. **Transition matrix** (enforced by the backend on `POST /orders/{id}/status`
   and `POST /orders/{id}/cancel`):

   | From \ To        | ON_PROCESS | READY_FOR_PICKUP | COMPLETED | CANCELLED |
   |------------------|:----------:|:----------------:|:---------:|:---------:|
   | RECEIVED         |     ✅     |        ❌        |     ❌    |     ✅    |
   | ON_PROCESS       |     —      |        ✅        |     ❌    |     ✅    |
   | READY_FOR_PICKUP |     ❌     |        —         |     ✅    |     ❌    |
   | COMPLETED        |     ❌     |        ❌        |     —     |     ❌    |
   | CANCELLED        |     ❌     |        ❌        |     ❌    |     —     |

   Status skips are rejected with `422`. Every successful transition writes an
   `order_status_histories` row.
4. **Guard rules** layered on the matrix (see ADR-0002 for payment details):
   - `COMPLETED` requires payment status `PAID` (force settlement).
   - `CANCELLED` requires a recorded refund when payments exist.
5. **`prd-mobile.md` §18 must be revised** to the 5-status vocabulary. The
   granular statuses (`INSPECTION`, `CLEANING`, `DRYING`, `QC`,
   `NEED_REWORK`) move to the future-phase cleaning workflow section.
6. **Photo types unaffected**: `AFTER`/`QC` photo types (ADR-0007) remain valid
   as evidence, even without item-level status, because they are attached to
   order items independently of workflow state.

## Alternatives Considered

### Two levels (5 on order, 8 on item)

- **Pros**: Most faithful to the operational reality that shoes in one order
  finish at different times; future cleaning workflow slots in naturally.
- **Cons**: Requires `order_item_status_histories`, per-item endpoints, derived
  order-status rules (e.g., order is `READY_FOR_PICKUP` when *all* items are
  QC-passed?), and UI for mixed-status orders — significant scope for a
  single-store MVP whose PRD defines no cleaner role yet.

### One level, 8 statuses on the order

- **Pros**: Keeps granular tracking without per-item complexity.
- **Cons**: All shoes move in lockstep anyway, so the extra states only add
  transition rules and UI without new information; it also contradicts the
  backend PRD's 5-status contract.

## Consequences

- **Positive**: Simplest contract for both clients; smallest transition matrix
  to test; dashboard aggregates stay trivial; audit log stays order-scoped.
- **Negative**: The shop cannot see that "shoe 1 of 2 is still drying" — staff
  track that outside the system during MVP. Operational granularity is
  deliberately postponed.
- **Neutral**: The DB design keeps `order_status_histories` at order level
  only; when item-level workflow arrives it adds its own table rather than
  retrofitting columns.

## Future Phase Note

The cleaning workflow phase (mobile §19-20, cleaner + QC roles) will introduce
`order_item_status_histories` and an item-status vocabulary
(`INSPECTION`, `CLEANING`, `DRYING`, `QC`, `NEED_REWORK`) with item-scoped
permissions. This ADR does not preclude it; it defines the MVP baseline it
builds upon.
