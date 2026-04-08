# Telegram Bot Flows

Each business has a dedicated Telegram Bot added to its staff group. The bot handles two cashier workflows: **earning points** and **validating redemptions**. It also sends notifications to customers.

---

## Bot Architecture

| Item | Value |
|---|---|
| Bot type | One bot per business (separate `BOT_TOKEN` per business) |
| Bot location | Added to a business Telegram group (staff channel) |
| Webhook | `POST https://api.yourdomain.com/api/v1/telegram/webhook/{businessId}` |
| Authorization | Bot only processes messages from `chat.id === business.telegramGroupChatId` |
| Cashier identity | Validated by `from.id` matching a registered cashier's `telegramUserId` in DB |

---

## Flow 1 — Earn Points (Customer Scans QR)

### Step-by-step

```
1. Customer opens Telegram Mini App
2. Customer shows their Loyalty Card screen (contains a QR code)
3. Cashier scans the QR with their phone camera

   QR encodes: https://api.yourdomain.com/api/v1/scan/{cardId}/{scanToken}
   scanToken = short-lived HMAC token (expires in 5 min, single-use)

4. Scanning the QR opens a URL in the cashier's browser
   → Backend validates scanToken, identifies customer by cardId
   → Backend sends a message to the business Telegram group via the business bot:

   ┌─────────────────────────────────────┐
   │ 🍺 Loyalty Scan                     │
   │                                     │
   │ Customer: Armen Petrosyan           │
   │ Current balance: 2,450 pts          │
   │                                     │
   │ Enter purchase amount in AMD:       │
   └─────────────────────────────────────┘

5. Cashier types the purchase amount in the group (e.g. "3500")

6. Bot reads the message, calculates points:
   pts = floor(amount / 100) = floor(3500 / 100) = 35 pts

   Bot replies with inline keyboard:

   ┌─────────────────────────────────────┐
   │ ✅ Confirm Points                   │
   │                                     │
   │ Customer: Armen Petrosyan           │
   │ Purchase: 3,500 AMD                 │
   │ Points to add: +35 pts              │
   │ New balance: 2,485 pts              │
   │                                     │
   │  [✅ Approve]   [❌ Cancel]         │
   └─────────────────────────────────────┘

7. Cashier taps [✅ Approve]

8. Backend:
   - Creates earn Transaction record (points: 35, cashierId: cashier's telegramId, cardId)
   - Updates LoyaltyCard.points += 35
   - Updates LoyaltyCard.totalPointsEarned += 35
   - Invalidates scan token (single-use)

9. Bot edits the message to show success:

   ┌─────────────────────────────────────┐
   │ ✅ Points Added                     │
   │                                     │
   │ Customer: Armen Petrosyan           │
   │ +35 pts added                       │
   │ New balance: 2,485 pts              │
   └─────────────────────────────────────┘

10. Customer receives Telegram notification from the business bot:
    "✅ +35 points at Beer House! Your balance is now 2,485 pts 🍺"
```

### Edge cases

| Scenario | Bot response |
|---|---|
| Scan token expired (>5 min) | "❌ This QR code has expired. Ask the customer to refresh their card." |
| Scan token already used | "❌ This QR has already been processed." |
| Cashier not in registered list | Bot ignores the message silently |
| Cashier enters invalid amount (text, 0, negative) | "⚠️ Please enter a valid amount in AMD (e.g. 3500)" |
| Cashier taps Cancel | "Transaction cancelled." (no points added) |

---

## Flow 2 — Validate & Confirm Redemption

### Step-by-step

```
1. Customer taps "Redeem" on a reward in the Mini App
2. Mini App calls POST /api/v1/redemptions
   → Backend pre-deducts points from LoyaltyCard
   → Generates 6-digit code (e.g. "459 201") + QR data
   → Sets 5-minute expiry TTL

3. Customer sees Redemption screen:
   - Reward name ("Free Pint")
   - Large QR code
   - 6-digit code: 459 201
   - Countdown timer: 04:59 → ...

4. Customer shows screen to cashier

5. Cashier has two options:

   Option A — Type the code:
     Cashier types in the Telegram group: "459201"
     (Bot detects 6-digit numeric input as a redemption code)

   Option B — Scan QR:
     Cashier scans the QR on the customer's phone
     QR opens: https://api.yourdomain.com/api/v1/redemptions/validate/459201
     Backend auto-posts validation result to the group

6. Bot looks up the code, replies with inline keyboard:

   ┌─────────────────────────────────────┐
   │ 🎁 Redemption Request               │
   │                                     │
   │ Reward: Free Pint                   │
   │ Customer: Armen Petrosyan           │
   │ Points cost: 500 pts                │
   │ Expires in: 03:42                   │
   │                                     │
   │  [✅ Confirm]   [❌ Reject]         │
   └─────────────────────────────────────┘

7. Cashier taps [✅ Confirm]

8. Backend:
   - Marks redemption code as used
   - Creates redeem Transaction record
   - Points already deducted (step 2) — no further deduction needed
   - Sends customer notification

9. Bot edits message:

   ┌─────────────────────────────────────┐
   │ ✅ Redemption Confirmed             │
   │                                     │
   │ Free Pint — served to Armen P.      │
   │ -500 pts deducted                   │
   └─────────────────────────────────────┘

10. Customer receives notification:
    "✅ Free Pint redeemed at Beer House! Remaining balance: 1,950 pts"

11. Customer's Mini App: "Done" button navigates back to Home, balance updated
```

### Edge cases

| Scenario | Bot response |
|---|---|
| Code already expired (5 min) | "❌ Code 459201 has expired. Points were automatically refunded to the customer." |
| Code already used | "❌ Code 459201 was already confirmed." |
| Code not found | "❌ Code 459201 not found. Double-check with the customer." |
| Cashier taps Reject | Points are refunded to customer; notification: "Your redemption was cancelled. Points have been returned." |
| Customer closes app before cashier confirms | Code still valid until expiry; cashier can still confirm |

---

## Flow 3 — Customer Notifications (Outbound Only)

These are one-way messages sent by the business bot to the **customer's private Telegram chat** (not the group).

| Event | Message |
|---|---|
| First registration | "🍺 Welcome to Beer House Loyalty! Your card is ready. You currently have 0 points. Start earning today!" |
| Points earned | "✅ +{pts} points at Beer House! Your balance is now {balance} pts." |
| Redemption confirmed | "✅ {rewardName} redeemed at Beer House! Remaining balance: {balance} pts." |
| Redemption code expired (auto-refund) | "⏱ Your redemption code expired. {pts} points have been returned to your balance. Total: {balance} pts." |

**Note:** The business bot sends messages to the customer's private chat. This requires the customer to have **started a conversation** with the bot first. On first Mini App open, the app should prompt: "Enable notifications → open @BeerHouseBot and tap Start."

---

## Bot Commands (in group)

| Command | Who | Description |
|---|---|---|
| `/balance <phone or name>` | Cashier | Look up a customer's current balance without scanning |
| `/history` | Cashier | Show last 10 transactions in this business |
| `/help` | Anyone | Show available commands |

---

## Bot Message Rate Limits

- Telegram allows ~30 messages/second per bot
- For a single-location pilot, this is not a concern
- Bot messages to the group are sequential (one pending scan at a time per cashier)
