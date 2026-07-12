# Coffee Loyalty Card — Design Spec

**Date:** 2026-07-12
**Status:** Approved by owner (design conversation)

## Summary

A web app that serves as a digital loyalty stamp card for a coffee shop. Customers sign up and get a personal QR code. At the counter, staff scan the QR from the admin page to add a stamp. At 10 stamps the customer earns a free coffee, the card auto-resets to 0, and the reward is banked until staff redeem it.

## Decisions Made

| Decision | Choice |
|---|---|
| Customer onboarding | Account signup (name + email/phone + password) |
| Reward rule | Buy 10, get 1 free (stamp card) |
| At 10th stamp | Card auto-resets to 0; reward is banked (customer can stack multiple rewards) |
| Scan method | Browser camera on admin's phone/tablet; manual code entry fallback |
| Admin access | One shared staff login |
| Tech stack | Next.js (App Router) + Supabase (Postgres, auth, RLS), deployed on Vercel |

## Data Model (Supabase / Postgres)

- **`profiles`** — one row per customer: `id` (auth user id), `name`, `email`/`phone`, `card_code` (random unguessable string, e.g. UUID), `current_stamps` (0–9), `created_at`.
- **`stamps`** — append-only log, one row per stamp: `id`, `customer_id`, `stamped_at`. Provides history for reports and disputes.
- **`rewards`** — one row per earned free coffee: `id`, `customer_id`, `earned_at`, `redeemed_at` (null until redeemed).

The QR code encodes only `card_code` — an opaque random token, no personal data. The QR is static; it never changes for a customer.

## User Journeys

### Customer
1. Visits site → signs up or logs in.
2. Lands on `/card`: large QR code, stamp meter (e.g. "3 / 10"), list of unredeemed rewards.
3. Shows QR at the counter; page refreshes stamp count after a scan.

### Admin (staff)
1. Opens `/admin` → logs in with shared staff account.
2. Taps **Scan** → browser camera reads customer QR (or types the card code manually).
3. Sees customer name + current stamps, with exactly one primary action based on state:
   - **Add Stamp** (default), or
   - **Redeem Free Coffee** (if an unredeemed reward exists).
4. Adding the 10th stamp: card resets to 0, a reward row is created, screen shows "Free coffee earned!"
5. Redeeming sets `redeemed_at` after an explicit confirm tap.

## Security Rules

- **Only admins can write stamps/rewards.** Enforced with Supabase Row Level Security at the database, not just UI. Customers can read only their own profile/stamps/rewards; all stamp/redeem writes go through server actions that verify the caller is the admin account.
- **Double-scan protection:** a stamp for the same customer within a short cooldown window (a few seconds) is ignored.
- **Redeem requires explicit confirmation** (value action).
- **Unknown QR:** admin sees "Card not recognized," never a silent failure.
- **Camera denied/unavailable:** admin screen falls back to manual card-code entry.

## App Structure

| Route | Purpose | Auth |
|---|---|---|
| `/` | Landing, login, signup | Public |
| `/card` | Customer loyalty card (QR, stamps, rewards) | Customer |
| `/admin` | Scan screen + stamp/redeem panel | Admin only |

Tech pieces:
- Next.js App Router; server actions for stamp/redeem mutations.
- Supabase for Postgres, email/password auth, RLS policies.
- QR generation library on `/card`; browser-camera QR reader library on `/admin`.
- Reward logic (increment, threshold=10, auto-reset, bank reward, redeem) kept in plain functions separate from DB/UI so rules are unit-testable and the threshold is one constant.

## Testing

- Unit tests for core rules: stamp increments; 10th stamp resets and banks a reward; redeem marks reward used; double-scan cooldown.
- Manual end-to-end pass before completion: sign up a test customer, scan as admin, stamp to 10, verify reward, redeem it — in the running app.

## Deployment

Deploy on Vercel (free tier) connected to a Supabase project. Single live URL serves customers and staff.

## Out of Scope (for now)

- Individual staff accounts / roles
- Points systems or variable reward rules
- Marketing emails, push notifications
- Multi-store support
- Native mobile apps (the web app is mobile-friendly)
