**LOYALTY APP**

Product Requirements Document

| **Version** | 1.0 - MVP  |
| ----------- | ---------- |
| **Status**  | Draft      |
| **Date**    | March 2026 |

# **1\. Product Overview**

Loyalty App is a digital loyalty card system built on Telegram. It replaces paper stamp cards for physical businesses - cafes, restaurants, barbershops, gyms - with a lightweight Telegram Mini App that customers access by scanning a QR code at the point of sale.

The core loop is simple:

- Customer scans QR code near the cashier
- Opens a Telegram Mini App - no download, no account creation
- Cashier records the purchase and awards points
- Customer accumulates points and redeems rewards

For the business owner, it converts anonymous foot traffic into a Telegram audience with purchase history attached. Every customer who scans becomes reachable for promotions, events, and re-engagement.

# **2\. Goals & Success Metrics**

**Product Goals**

- Eliminate paper loyalty cards for small businesses
- Give business owners a direct communication channel to their customers via Telegram
- Keep the customer experience under 30 seconds - scan, see balance, done
- Give cashiers a tool that works fast with minimal training

**MVP Success Metrics**

| **Metric**                          | **Target (first 30 days)**             |
| ----------------------------------- | -------------------------------------- |
| Customer registrations              | 50+ unique customers at pilot location |
| Points transactions                 | 200+ successful transactions logged    |
| Cashier errors                      | Less than 5% incorrect entries         |
| Customer repeat rate                | 30%+ of registered customers return    |
| Time-per-transaction (cashier side) | Under 15 seconds                       |

# **3\. User Roles**

The system has three distinct roles, each with a different interface and set of permissions.

| **Role**           | **Interface**                   | **Primary Responsibility**                                              |
| ------------------ | ------------------------------- | ----------------------------------------------------------------------- |
| **Customer**       | Telegram Mini App (via QR scan) | View points balance, transaction history, available rewards             |
| **Cashier**        | Telegram Bot (per-business, in staff group) | Add points after purchase, search customers, confirm redemptions |
| **Business Owner** | Admin web panel                 | Configure rewards, view analytics, manage cashier accounts, export data |

# **4\. Core User Flows**

## **4.1 First-Time Customer**

- Customer sees QR code near cashier or on table
- Scans QR with phone camera - opens Telegram Mini App directly
- Telegram prompts to share contact (name + phone number) - one tap
- Customer sees their new loyalty card: 0 points, welcome message
- After paying, cashier adds points - customer sees balance update in real time

## **4.2 Returning Customer - Earning Points**

- Customer pays for purchase
- Cashier opens cashier tool, searches customer by name or phone
- Selects customer, enters points amount, confirms
- Customer receives a Telegram notification: "+50 points at Beer House"
- Customer's balance updates instantly

## **4.3 Customer Redeeming a Reward**

- Customer opens Mini App, sees current balance and available rewards
- Taps the reward they want to redeem
- App shows a confirmation screen with a redemption code or QR
- Cashier validates the code and provides the reward
- Points are deducted from customer's balance
- Transaction appears in history as "Redeemed: Free Coffee"

## **4.4 Business Owner - Configuring Rewards**

- Owner logs into admin panel
- Creates a reward: name, description, required points
- Sets earn rate: e.g. 1 point per 100 AMD spent
- Activates or deactivates rewards at any time
- Views dashboard: total customers, transactions today, top customers

# **5\. User Stories**

## **5.1 Customer**

| **US-01**      | _As a customer,_ I want to join the loyalty program without downloading an app, _so that I can start earning points immediately without friction._ |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Acceptance** |                                                                                                                                                    |

| **US-02**      | _As a customer,_ I want to see my current points balance at any time, _so that I know how close I am to my next reward._ |
| -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Acceptance** |                                                                                                                          |

| **US-03**      | _As a customer,_ I want to receive a notification every time I earn points, _so that I trust the system is recording my purchases correctly._ |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Acceptance** |                                                                                                                                               |

| **US-04**      | _As a customer,_ I want to see my full transaction history, _so that I can verify all my past purchases and earnings._ |
| -------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Acceptance** |                                                                                                                        |

| **US-05**      | _As a customer,_ I want to browse available rewards and see how many points each requires, _so that I am motivated to keep coming back._ |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Acceptance** |                                                                                                                                          |

| **US-06**      | _As a customer,_ I want to redeem my points for a reward in a few taps, _so that The process is as easy as earning._ |
| -------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Acceptance** |                                                                                                                      |

## **5.2 Cashier**

| **US-07**      | _As a cashier,_ I want to quickly find a customer by name or phone number, _so that I can process the loyalty transaction without slowing down the queue._ |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Acceptance** |                                                                                                                                                            |

| **US-08**      | _As a cashier,_ I want to add points to a customer's account in under 15 seconds, _so that My workflow at the register stays efficient._ |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Acceptance** |                                                                                                                                          |

| **US-09**      | _As a cashier,_ I want to confirm that points were successfully added before dismissing the customer, _so that There are no disputes about missing points later._ |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Acceptance** |                                                                                                                                                                   |

| **US-10**      | _As a cashier,_ I want to validate a customer's redemption code, _so that I can confirm a reward claim is legitimate before providing it._ |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Acceptance** |                                                                                                                                            |

| **US-11**      | _As a cashier,_ I want to see a short recent transaction log, _so that I can quickly reference the last few actions if a customer has a question._ |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Acceptance** |                                                                                                                                                    |

## **5.3 Business Owner**

| **US-12**      | _As a business owner,_ I want to set the points earn rate (e.g. 1 point per 100 AMD), _so that The loyalty economics match my business margins._ |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Acceptance** |                                                                                                                                                  |

| **US-13**      | _As a business owner,_ I want to create and manage rewards with custom point thresholds, _so that I can design a program that drives the behavior I want._ |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Acceptance** |                                                                                                                                                            |

| **US-14**      | _As a business owner,_ I want to see how many customers have joined and how active they are, _so that I can measure whether the loyalty program is working._ |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Acceptance** |                                                                                                                                                              |

| **US-15**      | _As a business owner,_ I want to view a list of my top customers ranked by points, _so that I can identify and reward my most loyal regulars._ |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Acceptance** |                                                                                                                                                |

| **US-16**      | _As a business owner,_ I want to send a Telegram broadcast to all my registered customers, _so that I can promote events, specials, or double-point days directly._ |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Acceptance** |                                                                                                                                                                     |

| **US-17**      | _As a business owner,_ I want to create separate cashier accounts with limited permissions, _so that I do not need to share my admin credentials with staff._ |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Acceptance** |                                                                                                                                                               |

# **6\. Scope**

## **6.1 In Scope - MVP**

- Customer registration via Telegram (name + phone)
- Points balance and transaction history in Mini App
- Telegram notification on every earn/redeem
- Cashier tool: customer search, add points, view recent log
- Reward catalog: define rewards with point cost
- Redemption flow: customer generates code, cashier validates
- Admin dashboard: basic metrics, reward management, earn rate config
- Single business location per account (MVP)

## **6.2 Out of Scope - MVP**

- Multiple locations per business
- POS system integration (Smart Systems / other)
- Tier-based loyalty (Silver / Gold / Platinum levels)
- Points expiry
- Referral program
- Broadcast messaging (planned for v1.1)
- Analytics export / CSV reports
- Multi-language support

## **6.3 Post-MVP Roadmap**

| **Version** | **Features**                                                              | **Priority** |
| ----------- | ------------------------------------------------------------------------- | ------------ |
| **v1.1**    | Broadcast messaging to all customers, points expiry, analytics export     | High         |
| **v1.2**    | Loyalty tiers (Silver / Gold / Platinum), referral program                | Medium       |
| **v1.3**    | Multiple locations per business, POS integration (Smart Systems API)      | Medium       |
| **v2.0**    | Multi-merchant platform, onboarding flow for new businesses, landing page | High         |

# **7\. Open Questions**

| **#** | **Question**                                                                           | **Owner**                  | **Resolution** |
| ----- | -------------------------------------------------------------------------------------- | -------------------------- | -------------- |
| **1** | What is the earn rate for the pilot (Beer House)? Fixed rate or per AMD spent?         | _Product + Business Owner_ | ✅ **Resolved:** Both modes supported. Default is `per_amd_spent` (1 pt per 100 AMD). Owner can switch to `fixed_per_visit` via admin panel. |
| **2** | How does the cashier access the tool - dedicated Telegram bot, or web URL on phone?    | _Product + Engineering_    | ✅ **Resolved:** Telegram Bot only. Each business has its own bot operating in a dedicated staff Telegram group. No web UI for cashiers. |
| **3** | Should redemption codes expire? If yes, what is the expiry window?                     | _Product_                  | ✅ **Resolved:** Yes, codes expire after 5 minutes. Points are pre-deducted on code generation and auto-refunded on expiry. Cron job runs every 30 seconds to expire pending codes. |
| **4** | What happens if a customer loses access to their Telegram account?                     | _Product + Engineering_    | ✅ **Resolved (descoped to v1.1):** MVP relies entirely on Telegram identity (socialId). Account recovery is out of scope for the pilot. Customers who lose Telegram access cannot recover their card without manual intervention by the business owner. |
| **5** | Do we need a privacy policy / data consent screen at registration for GDPR compliance? | _Product + Legal_          | ✅ **Resolved (descoped to v1.1):** Consent screen deferred. The MVP pilot (Beer House) is a closed deployment — full GDPR compliance screen planned for v1.1 before public rollout. |
| **6** | Is broadcast messaging needed for the pilot launch or can it wait for v1.1?            | _Product_                  | ✅ **Resolved:** Deferred to v1.1. Broadcast messaging (US-16) is explicitly out of MVP scope per PRD section 6.2. |