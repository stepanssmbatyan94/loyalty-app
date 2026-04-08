# User Stories

Derived from `docs/draf_prd.md` v1.0 MVP. Acceptance criteria are filled in based on the screen designs (`docs/design/`) and PRD scope rules.

**Status legend:** `MVP` = in scope for v1.0 | `v1.1+` = planned post-MVP

---

## 5.1 Customer

---

### US-01 — Join without downloading an app
**Status:** `MVP`
**Epic mapping:** Epic 1 (F-04, B-01)

> _As a customer, I want to join the loyalty program without downloading an app, so that I can start earning points immediately without friction._

**Acceptance criteria:**
- [ ] Customer scans the business QR code with their phone camera
- [ ] Telegram opens the Mini App directly (no App Store redirect)
- [ ] Telegram prompts to share contact (name + phone number) — one tap
- [ ] On first open, a `LoyaltyCard` is auto-created for the customer at that business with 0 points
- [ ] Customer lands on the Home / My Card screen within 3 seconds of sharing contact
- [ ] If the customer has already registered, they see their existing balance (no duplicate card created)

---

### US-02 — See current points balance
**Status:** `MVP`
**Epic mapping:** Epic 3 (F-05, F-09, B-08)

> _As a customer, I want to see my current points balance at any time, so that I know how close I am to my next reward._

**Acceptance criteria:**
- [ ] Home screen displays current point balance prominently (large `display-lg` number on the loyalty card)
- [ ] Progress bar shows % progress toward the next available reward
- [ ] "X pts away" label shown next to the progress bar
- [ ] Motivational text shows the reward name they're approaching (e.g. "50 more points for a Free Pint")
- [ ] Balance updates in real time (or on next app open) after a cashier adds points
- [ ] 0-point empty state shows a welcome message, not a broken UI

---

### US-03 — Receive notification on earn/redeem
**Status:** `MVP`
**Epic mapping:** Epic 9 (B-21, B-22, B-23)

> _As a customer, I want to receive a notification every time I earn points, so that I trust the system is recording my purchases correctly._

**Acceptance criteria:**
- [ ] After a cashier adds points, customer receives a Telegram message within 5 seconds: e.g. "+50 points at Beer House! Your balance: 2,500 pts"
- [ ] After a redemption is confirmed by cashier, customer receives a Telegram message: e.g. "✅ Free Pint redeemed. Remaining balance: 1,950 pts"
- [ ] On first registration, customer receives a welcome message: e.g. "Welcome to Beer House Loyalty! You start with 0 points."
- [ ] Notifications come from the Beer House Telegram Bot (not a generic sender)
- [ ] Notification is sent even if the customer has the Mini App closed

---

### US-04 — Full transaction history
**Status:** `MVP`
**Epic mapping:** Epic 6 (F-18, F-19, F-20, B-13)

> _As a customer, I want to see my full transaction history, so that I can verify all my past purchases and earnings._

**Acceptance criteria:**
- [ ] Transaction History screen shows a chronological list of all earn and redeem events
- [ ] Each item shows: icon (earn=green, redeem=red), transaction name, date + time, and ±points
- [ ] Earn transactions show type label "Earned"; redeem transactions show "Redeemed"
- [ ] Default view shows last 30 days; footer note confirms "Showing your last 30 days of activity"
- [ ] Current loyalty balance is displayed at the top of the screen
- [ ] Empty state shown if no transactions yet
- [ ] List is paginated for customers with many transactions

---

### US-05 — Browse rewards catalog
**Status:** `MVP`
**Epic mapping:** Epic 4 (F-10, F-11, F-12, F-13, B-09)

> _As a customer, I want to browse available rewards and see how many points each requires, so that I am motivated to keep coming back._

**Acceptance criteria:**
- [ ] Rewards Catalog screen shows all active rewards for the business
- [ ] Each reward card displays: image, name, description, and points cost
- [ ] Rewards the customer can afford show an active "Redeem" button (gradient blue)
- [ ] Rewards the customer cannot yet afford show a disabled button with "Need X more pts" (X = pointsCost − currentBalance)
- [ ] Locked rewards are visually de-emphasized (reduced opacity, lock icon overlay)
- [ ] Current available balance is shown as a hero section at the top of the screen
- [ ] Inactive rewards (`isActive: false`) are not shown

---

### US-06 — Redeem points in a few taps
**Status:** `MVP`
**Epic mapping:** Epic 5 (F-14, F-15, F-16, F-17, B-10, B-11, B-12)

> _As a customer, I want to redeem my points for a reward in a few taps, so that the process is as easy as earning._

**Acceptance criteria:**
- [ ] Customer taps "Redeem" on a reward card in the catalog
- [ ] Redemption screen appears with: reward name, large QR code, 6-digit redemption code, and countdown timer
- [ ] Timer shows "Expires in 04:59" and counts down in real time
- [ ] Timer turns red/warning color when under 60 seconds remaining
- [ ] Code expires after 5 minutes if not confirmed by cashier — customer sees an expired state
- [ ] Customer shows the screen to the bartender/server who scans or enters the code
- [ ] After cashier confirms, customer taps "Done" and is returned to the Home screen
- [ ] Points are deducted from balance immediately upon code generation (pre-authorised), not on cashier confirmation
- [ ] Tapping "Done" or closing the screen before cashier confirms should show a confirmation dialog

---

## 5.2 Cashier

---

### US-07 — Search customer by name or phone
**Status:** `MVP`
**Epic mapping:** Epic 7 (F-21, B-15)

> _As a cashier, I want to quickly find a customer by name or phone number, so that I can process the loyalty transaction without slowing down the queue._

**Acceptance criteria:**
- [ ] Cashier tool has a search input on the main screen
- [ ] Search works by partial name match (first or last) or full phone number
- [ ] Results appear within 1 second of typing (debounced ~300ms)
- [ ] Results show: customer name, phone, current points balance
- [ ] Minimum 2 characters required before search fires
- [ ] "No results" state shown clearly when no match found
- [ ] Tapping a result opens the customer's profile to add points

---

### US-08 — Add points in under 15 seconds
**Status:** `MVP`
**Epic mapping:** Epic 7 (F-22, F-23, B-14)

> _As a cashier, I want to add points to a customer's account in under 15 seconds, so that my workflow at the register stays efficient._

**Acceptance criteria:**
- [ ] Add points flow is max 3 taps: select customer → enter amount → confirm
- [ ] Points input is a numeric field; default focus on open
- [ ] Confirmation step shows: customer name, points being added, new total balance preview
- [ ] Submitting is possible via a single large CTA button ("Add Points")
- [ ] The entire flow from search result tap to success state takes under 15 seconds on a standard device

---

### US-09 — Confirm points were added
**Status:** `MVP`
**Epic mapping:** Epic 7 (F-23, B-14)

> _As a cashier, I want to confirm that points were successfully added before dismissing the customer, so that there are no disputes about missing points later._

**Acceptance criteria:**
- [ ] After successful points addition, a success state is shown with: customer name, points added (+X), new balance
- [ ] The success state is a full-screen or prominent confirmation — not just a toast
- [ ] Cashier must explicitly tap "Done" or "New Transaction" to dismiss
- [ ] Customer receives a Telegram notification at the same moment (US-03)
- [ ] If the API call fails, an error state is shown — not a silent failure

---

### US-10 — Validate a redemption code
**Status:** `MVP`
**Epic mapping:** Epic 7 (F-24, B-11, B-12)

> _As a cashier, I want to validate a customer's redemption code, so that I can confirm a reward claim is legitimate before providing it._

**Acceptance criteria:**
- [ ] Cashier tool has a "Validate Code" section/screen
- [ ] Cashier enters the 6-digit code shown on the customer's phone
- [ ] System responds with: reward name, customer name, and valid/invalid/expired status
- [ ] Valid code shows a green confirmation with reward details and a "Confirm Redemption" button
- [ ] Expired code shows a clear error: "Code expired — ask customer to generate a new one"
- [ ] Already-used code shows: "Already redeemed"
- [ ] After confirming, the code is marked as used and cannot be used again
- [ ] The cashier cannot confirm a code that is expired or already used

---

### US-11 — Recent transaction log (cashier)
**Status:** `MVP`
**Epic mapping:** Epic 7 (F-25)

> _As a cashier, I want to see a short recent transaction log, so that I can quickly reference the last few actions if a customer has a question._

**Acceptance criteria:**
- [ ] Cashier tool shows the last 10 transactions processed (all cashiers at the business, not just current session)
- [ ] Each entry shows: customer name, transaction type (earn/redeem), points, timestamp
- [ ] Log updates automatically after each new transaction without page refresh
- [ ] Log is read-only — cashier cannot edit or delete entries from this view

---

## 5.3 Business Owner

---

### US-12 — Set the points earn rate
**Status:** `MVP`
**Epic mapping:** Epic 8 (F-28, B-18)

> _As a business owner, I want to set the points earn rate (e.g. 1 point per 100 AMD), so that the loyalty economics match my business margins._

**Acceptance criteria:**
- [ ] Admin panel has an "Earn Rate" settings section
- [ ] Owner can choose between two modes: **Fixed per visit** (e.g. 50 pts per scan) or **Per AMD spent** (e.g. 1 pt per 100 AMD)
- [ ] Changing the earn rate takes effect immediately for all new transactions
- [ ] Current active earn rate is clearly displayed
- [ ] Changing earn rate does not affect historical transactions

---

### US-13 — Create and manage rewards
**Status:** `MVP`
**Epic mapping:** Epic 8 (F-27, B-17)

> _As a business owner, I want to create and manage rewards with custom point thresholds, so that I can design a program that drives the behavior I want._

**Acceptance criteria:**
- [ ] Owner can create a reward with: name, description, points cost, optional image, active/inactive toggle
- [ ] Owner can edit any field of an existing reward at any time
- [ ] Owner can deactivate a reward (it disappears from the customer catalog immediately)
- [ ] Owner can delete a reward (soft-delete; historical transactions referencing it are preserved)
- [ ] Rewards list shows all rewards (active and inactive) with their status
- [ ] Points cost must be a positive integer

---

### US-14 — Dashboard metrics
**Status:** `MVP`
**Epic mapping:** Epic 8 (F-29, B-19)

> _As a business owner, I want to see how many customers have joined and how active they are, so that I can measure whether the loyalty program is working._

**Acceptance criteria:**
- [ ] Dashboard shows: total registered customers, transactions today, total points issued all-time
- [ ] "Transactions today" updates in real time (or on page refresh)
- [ ] Dashboard is the default landing page after owner login

---

### US-15 — Top customers by points
**Status:** `MVP`
**Epic mapping:** Epic 8 (F-30, B-20)

> _As a business owner, I want to view a list of my top customers ranked by points, so that I can identify and reward my most loyal regulars._

**Acceptance criteria:**
- [ ] Admin panel has a "Top Customers" view
- [ ] List is ranked by `totalPointsEarned` (lifetime, not current balance)
- [ ] Each entry shows: rank, customer name, phone, total points earned, current balance
- [ ] List is paginated (20 per page)
- [ ] Owner can search/filter within the list

---

### US-16 — Broadcast messaging
**Status:** `v1.1` — Out of MVP scope

> _As a business owner, I want to send a Telegram broadcast to all my registered customers, so that I can promote events, specials, or double-point days directly._

**Note:** Explicitly excluded from MVP per PRD section 6.2. Planned for v1.1. Do not build in the current sprint cycle.

---

### US-17 — Cashier account management
**Status:** `MVP`
**Epic mapping:** Epic 7 (F-26, B-16)

> _As a business owner, I want to create separate cashier accounts with limited permissions, so that I do not need to share my admin credentials with staff._

**Acceptance criteria:**
- [ ] Owner can create a cashier account by entering name + phone number (or email)
- [ ] Cashier receives an invite/login link via Telegram or email
- [ ] Cashier role has access to: customer search, add points, validate redemption code, recent log
- [ ] Cashier role has NO access to: reward management, earn rate config, analytics, other cashier accounts
- [ ] Owner can deactivate a cashier account instantly (revokes access)
- [ ] Owner sees a list of all cashier accounts and their status (active/inactive)
