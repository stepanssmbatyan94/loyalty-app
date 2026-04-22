# Epic 12 — Finalizing Gaps

Closing functional and documentation gaps discovered during the full cross-reference of Epic 1–11 tickets against `user-stories.md`, `api-contract.md`, `draf_prd.md`, and `overview.md`.

**Gap source:** `docs/planning/` — see the gap analysis in `.claude/plans/`.

---

## Functional Tickets

---

## B-36b — GET + PATCH /api/v1/admin/businesses/:id

**SP:** 3 | **Layer:** BE | **Status:** Done
**Depends on:** B-36
**Blocks:** ADMIN-05 (detail page already calls these endpoints in its code)

### Why this is needed
`ADMIN-05` (Business Detail Page) already has `useBusiness(id)` and `useUpdateBusiness(id)` hooks that call `GET /admin/businesses/:id` and `PATCH /admin/businesses/:id`. B-36 only implemented the list (`GET /admin/businesses`) and create (`POST /admin/businesses`) — the single-resource read and update were never ticketed or added to the API contract.

### Endpoints to add

**GET /api/v1/admin/businesses/:id**

Auth: Super Admin JWT required

Response 200:
```json
{
  "id": "uuid",
  "name": "Beer House",
  "ownerEmail": "owner@beerhouse.am",
  "ownerFirstName": "Gevorg",
  "ownerLastName": "Mkrtchyan",
  "botUsername": "beer_house_bot",
  "botTokenMasked": "...abc123",
  "telegramGroupChatId": "-1001234567890",
  "webhookActive": true,
  "isActive": true,
  "totalCustomers": 142,
  "createdAt": "2023-10-01T00:00:00.000Z"
}
```

**PATCH /api/v1/admin/businesses/:id**

Auth: Super Admin JWT required

Request (all fields optional):
```json
{
  "name": "Beer House Updated",
  "isActive": false
}
```

Response 200: updated business object (same shape as GET response)

Errors:
- `404` — business not found
- `403` — caller is not superadmin

### Files to modify
- `backend/src/admin/admin.controller.ts` — add `@Get(':id')` and `@Patch(':id')` handlers
- `backend/src/admin/admin.service.ts` — add `findById(id)` and `updateById(id, dto)` methods
- `backend/src/admin/dto/update-business-admin.dto.ts` — already exists, extend if needed
- `backend/src/businesses/businesses.service.ts` — add `findByIdForAdmin()` or reuse `findById()`
- `docs/planning/api-contract.md` — add GET + PATCH /admin/businesses/:id entries

### Acceptance criteria
- [ ] `GET /admin/businesses/:id` returns full business detail (superadmin only)
- [ ] `PATCH /admin/businesses/:id` with `{ isActive: false }` deactivates the business
- [ ] `PATCH /admin/businesses/:id` with `{ isActive: true }` reactivates the business
- [ ] `GET /admin/businesses/:id` on non-existent ID returns 404
- [ ] Non-superadmin JWT returns 403 on both endpoints
- [ ] `botToken` is never returned — only `botTokenMasked` (last 6 chars)

### Definition of done
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] `api-contract.md` updated with both endpoint shapes

---

## B-23b — Customer Notification on Cashier Reject Redemption

**SP:** 2 | **Layer:** BOT | **Status:** Done
**Depends on:** B-23 (reject callback already exists), B-35
**Blocks:** nothing

### Why this is needed
B-23 already handles the reject callback and calls `redemptionsService.cancel()`. But there is no customer notification sent on cashier reject — the customer only sees their points returned silently. B-34 covers "confirm" notification, B-35 covers "auto-expiry" notification. The "cashier rejected" case is missing.

> **Note:** The reject callback handler itself is already implemented in B-23's implementation notes (`reject_redemption:*`). Only the notification send is missing.

### What needs to change

In `backend/src/telegram/handlers/confirm-redemption-handler.ts`, in the `reject_redemption` callback (already exists):

```ts
bot.callbackQuery(/^reject_redemption:(\d{6})$/, async (ctx) => {
  const code = ctx.match[1];
  const result = await this.redemptionsService.cancel(code); // already exists

  await ctx.editMessageText('Redemption rejected. Points have been returned to the customer.');
  await ctx.answerCallbackQuery();

  // ADD THIS: notify the customer
  await this.notificationsService.sendRedemptionRejectedNotification({
    cardId: result.cardId,
    rewardName: result.rewardName,
    pointsRefunded: result.pointsRefunded,
    newBalance: result.newBalance,
  });
});
```

**`sendRedemptionRejectedNotification()` message to customer:**
```
❌ {rewardName} redemption was not confirmed by the cashier.
{pts} pts have been returned. Balance: {balance} pts
```

### Files to modify
- `backend/src/telegram/handlers/confirm-redemption-handler.ts` — add notification call in reject branch
- `backend/src/telegram/telegram.service.ts` (or notifications service) — add `sendRedemptionRejectedNotification()`
- `backend/src/redemptions/redemptions.service.ts` — ensure `cancel()` returns `{ cardId, rewardName, pointsRefunded, newBalance }`

### Acceptance criteria
- [ ] When cashier taps "Reject", customer receives a Telegram message with the rejection reason
- [ ] Notification message includes reward name, points refunded, new balance
- [ ] Notification sent even if customer has the Mini App open
- [ ] Bot message in group still shows "Redemption rejected. Points returned." (existing behavior preserved)
- [ ] `cancel()` service method returns enough data for notification (no extra DB call needed)

### Definition of done
- [ ] `npm run lint` passes
- [ ] Manual test: reject a redemption → customer receives notification in Telegram

---

## B-20b — Fixed-Per-Visit Earn Mode Path in Bot

**SP:** 3 | **Layer:** BOT | **Status:** Done
**Depends on:** B-20, B-28 (PATCH /businesses/me/settings supports `earnRateMode`)
**Blocks:** nothing

### Why this is needed
B-20 (`Bot: Handle Cashier Amount Reply`) is hardwired for `per_amd_spent` only: it always waits for a numeric AMD amount before sending the confirm keyboard. When a business sets `earnRateMode: 'fixed_per_visit'`, the cashier scan should immediately send a confirm keyboard with the fixed points amount — no amount entry step.

### Current flow (per_amd_spent only)
```
QR Scan → B-19 sends "Enter amount" → cashier types AMD → B-20 calculates pts → B-21 confirm
```

### New flow for fixed_per_visit
```
QR Scan → B-19 checks earnRateMode → if fixed_per_visit: skip amount step → send confirm keyboard directly with earnRateValue pts
```

### What needs to change

**In B-19 (`scan-handler.ts`):** after loading the business, branch on `earnRateMode`:

```ts
async handleScan(cardId: string, scanToken: string) {
  // ... existing validation ...
  const business = await this.businessesService.findById(card.businessId);

  if (business.earnRateMode === 'fixed_per_visit') {
    // Skip amount entry — send confirm keyboard immediately
    const pts = business.earnRateValue; // fixed points amount
    await this.telegramService.sendFixedPointsConfirm(business, {
      cardId,
      customerName,
      currentBalance: card.points,
      pts,
    });
  } else {
    // per_amd_spent — existing behavior: send "Enter amount" message
    await this.telegramService.sendScanNotification(business, { cardId, customerName, currentBalance: card.points });
  }

  return { status: 'scan_accepted', customerName };
}
```

**New `sendFixedPointsConfirm()` message to group:**
```
🍺 Loyalty Scan

Customer: Armen Petrosyan
Current balance: 2,450 pts
Points to add: +50 pts (fixed visit reward)

[✅ Approve] [❌ Cancel]
```

**B-20 (amount-handler):** no change needed — it only fires when there is a `pendingScan` context, which is only set in the `per_amd_spent` path.

**B-21 (approve-handler):** already handles `approve:{cardId}:{pts}` — reuse as-is.

### Files to modify
- `backend/src/loyalty-cards/loyalty-cards.service.ts` — branch on `earnRateMode` in `handleScan()`
- `backend/src/telegram/telegram.service.ts` — add `sendFixedPointsConfirm()` method
- `docs/planning/tickets/epic-7-telegram-bot.md` — add note to B-19 and B-20 about this branch

### Acceptance criteria
- [ ] Business with `earnRateMode: 'per_amd_spent'`: QR scan still triggers "Enter amount" message (existing behavior unchanged)
- [ ] Business with `earnRateMode: 'fixed_per_visit'`: QR scan skips amount entry, sends Approve/Cancel keyboard directly
- [ ] Fixed-visit confirm message shows the fixed points amount from `earnRateValue`
- [ ] Cashier taps Approve → correct fixed points added to card
- [ ] No pending scan context stored in fixed-visit mode (amount-handler is not triggered)
- [ ] Changing earn mode in owner panel takes effect on next scan

### Definition of done
- [ ] `npm run lint` passes
- [ ] Manual test: set earn mode to fixed_per_visit in owner panel, scan QR, confirm skips amount entry

---

## Documentation Tickets

> These tickets require only changes to `.md` files in `docs/planning/`. No code changes. Each is 1 SP.

---

## DOC-01 — Fix Wrong Ticket IDs in user-stories.md

**SP:** 1 | **Layer:** DOCS | **Status:** Done
**Depends on:** nothing
**Blocks:** nothing

### What's wrong
US-02 through US-17 in `docs/planning/user-stories.md` have incorrect epic mapping ticket IDs. The F-numbers and B-numbers reference tickets from wrong epics (e.g., US-03 maps to B-21/B-22/B-23 which are bot handlers, not notification tickets).

### Corrected mappings

| Story | Wrong | Correct |
|-------|-------|---------|
| US-02 | B-08 | B-10 |
| US-03 | B-21, B-22, B-23 | B-32, B-33, B-34, B-35 |
| US-04 | B-13 | B-17, F-18, F-19, F-20 |
| US-05 | B-09 | B-11, F-10, F-11, F-12, F-13 |
| US-06 | B-10, B-11 | B-12, B-13, B-14, B-15, B-16, F-14, F-15, F-16, F-17 |
| US-07 | F-21, B-15 | B-24, B-25, B-26 |
| US-08 | F-22, F-23, B-14 | B-19, B-20, B-21 |
| US-09 | F-23, B-14 | B-21, B-33 |
| US-10 | F-24, B-11, B-12 | B-14, B-22, B-23 |
| US-11 | F-25 | B-25 |
| US-12 | F-28, B-18 | F-23, B-28 |
| US-13 | F-27, B-17 | F-22, B-27 |
| US-14 | F-29, B-19 | F-24, B-29 |
| US-15 | F-30, B-20 | F-25, B-30 |
| US-17 | F-26, B-16 | F-26, B-31 |

### Files to modify
- `docs/planning/user-stories.md` — update `**Epic mapping:**` line for each affected story

### Acceptance criteria
- [ ] Every `**Epic mapping:**` line in user-stories.md references ticket IDs that exist in epics.md
- [ ] No stale references to non-existent ticket IDs (e.g., B-08)

---

## DOC-02 — Resolve ADMIN-01/ADMIN-02 Orphans in epics.md

**SP:** 1 | **Layer:** DOCS | **Status:** Done
**Depends on:** nothing

### What's wrong
`epics.md` lists ADMIN-01 (React app scaffold, 3 SP) and ADMIN-02 (Super admin login, 2 SP) under Epic 10. But `epic-10-super-admin.md` already notes at the top: "ADMIN-01 and ADMIN-02 have been moved to Epic 10.0." These tickets exist in epics.md but belong to Epic 10.0 under ADMIN-0-01 and ADMIN-0-02. The SP totals in epics.md are counted twice.

### What to fix
In `docs/planning/epics.md` Epic 10 table:
- Change ADMIN-01 status to `Superseded` and add note: "→ replaced by ADMIN-0-01 in Epic 10.0"
- Change ADMIN-02 status to `Superseded` and add note: "→ replaced by ADMIN-0-02 in Epic 10.0"
- Update Epic 10 SP total to exclude ADMIN-01 (3 SP) and ADMIN-02 (2 SP): ADMIN total = 9 SP
- Update grand total row accordingly

### Files to modify
- `docs/planning/epics.md` — Epic 10 table + grand total

### Acceptance criteria
- [ ] ADMIN-01 and ADMIN-02 rows marked `Superseded` with cross-reference to Epic 10.0
- [ ] Epic 10 ADMIN SP total updated (14 → 9 SP for Epic 10 standalone)
- [ ] Grand total updated to reflect no double-counting

---

## DOC-03 — Resolve US-15 Top Customers Search Gap

**SP:** 1 | **Layer:** DOCS | **Status:** Done
**Depends on:** nothing

### What's wrong
`user-stories.md` US-15 acceptance criteria includes: "Owner can search/filter within the list." Neither B-30, F-25, nor the API contract for `GET /api/v1/analytics/top-customers` has a `search` query parameter or any search/filter UI ticket.

### Decision required
Choose one option:

**Option A (descope):** Remove "Owner can search/filter within the list" from US-15 AC. Mark it as a v1.1 enhancement. The paginated sorted list is sufficient for MVP.

**Option B (add ticket):** Add `?search=<name_or_phone>` to `GET /api/v1/analytics/top-customers` and update B-30 AC + F-25 AC to include the search input.

> **Recommendation: Option A.** A paginated list of 20/page sorted by points earned is sufficient for MVP pilot (likely ≤ 200 customers). Search can be added in v1.1 once the owner actually needs it.

### Files to modify
- `docs/planning/user-stories.md` — remove or annotate the search AC line in US-15
- (If Option B) `docs/planning/api-contract.md` + `docs/planning/tickets/epic-8-owner-admin.md`

### Acceptance criteria
- [ ] US-15 acceptance criteria is achievable with existing B-30 + F-25 tickets
- [ ] If descoped: AC line removed or marked "v1.1"

---

## DOC-04 — PRD Cleanup + Epic 10.0 Dependency Note

**SP:** 1 | **Layer:** DOCS | **Status:** Done
**Depends on:** nothing

### What's wrong

Three related documentation inconsistencies:

1. **`draf_prd.md` section 3** says Cashier interface is "Telegram Bot or web panel." Architecture decision is Bot only.
2. **`draf_prd.md` section 7** (Open Questions) — all 6 questions have been resolved but are never marked as such.
3. **`epic-10.0-owner-admin-migration.md`** has no explicit dependency note saying Epic 10 must be complete first.

### Changes to make

**draf_prd.md section 3:** Change cashier interface from "Telegram Bot or web panel" → "Telegram Bot (per-business, in staff group)"

**draf_prd.md section 7:** Add resolution line to each open question:

| # | Resolution |
|---|---|
| 1 | Per AMD spent — 1 pt per 100 AMD (configurable by owner in admin panel) |
| 2 | Telegram Bot in staff group — no web UI for cashiers |
| 3 | Yes, 5-minute expiry with auto-refund |
| 4 | Out of scope for MVP — user must contact support |
| 5 | Out of scope for MVP — to be reviewed before public launch |
| 6 | Deferred to v1.1 |

**epic-10.0-owner-admin-migration.md:** Add at the top of the file:
> **Depends on: Epic 10 (ADMIN-03, ADMIN-04, ADMIN-05, B-36 must all be Done).** Epic 10.0 extends the app built in Epic 10 — it cannot be started until the `admin/` app scaffold and super admin routes exist.

### Files to modify
- `docs/draf_prd.md` — section 3 (cashier interface), section 7 (open questions)
- `docs/planning/tickets/epic-10.0-owner-admin-migration.md` — add dependency note at top

### Acceptance criteria
- [ ] PRD section 3 cashier interface no longer mentions "web panel"
- [ ] Each open question in PRD section 7 has a clear "**Resolution:**" line
- [ ] Epic 10.0 ticket file starts with a clear "Depends on Epic 10" notice

---

## DOC-05 — Make PATCH /users/:id/status Explicit in B-31

**SP:** 1 | **Layer:** DOCS | **Status:** Done
**Depends on:** nothing

### What's wrong
The API contract documents `PATCH /api/v1/users/:id/status` with a `{ "status": "inactive" }` body. B-31 in epics.md says `POST/PATCH /api/v1/users` — the specific `/:id/status` variant is bundled in but never listed in B-31's acceptance criteria. F-26 (cashier management UI) calls this endpoint for the deactivate button.

### Files to modify
- `docs/planning/tickets/epic-8-owner-admin.md` — add `PATCH /api/v1/users/:id/status` to B-31 acceptance criteria
- `docs/planning/epics.md` — update B-31 title to `POST /api/v1/users + PATCH /api/v1/users/:id/status`

### Acceptance criteria
- [ ] B-31 AC explicitly mentions `PATCH /api/v1/users/:id/status` with `{ status: "active" | "inactive" }`
- [ ] The endpoint shape in the ticket matches the API contract

---

## DOC-06 — Confirm GET /api/v1/businesses/me in B-03

**SP:** 1 | **Layer:** DOCS | **Status:** Done
**Depends on:** nothing

### What's wrong
The API contract documents `GET /api/v1/businesses/me` as needed by the owner admin panel (for F-28 bot settings, F-29 language management, F-30 translation editor). This endpoint was likely implemented as part of B-03, but it is not in B-03's acceptance criteria and the API contract marks it without an explicit "Implemented in B-03" note.

### Files to modify
- `docs/planning/tickets/epic-2-core-domain.md` — add `GET /api/v1/businesses/me` to B-03 acceptance criteria
- `docs/planning/api-contract.md` — add `✅ Exists (B-03)` annotation to `GET /api/v1/businesses/me`

### Acceptance criteria
- [ ] B-03 AC mentions `GET /api/v1/businesses/me` returning the owner's business profile
- [ ] api-contract.md shows the implementation status annotation for this endpoint

---
