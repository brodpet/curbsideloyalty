# Coffee Loyalty Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A web app where coffee customers sign up, get a personal QR loyalty card, staff scan it to add stamps, and the 10th stamp banks a free-coffee reward (card auto-resets).

**Architecture:** Single Next.js (App Router) app with three routes: `/` (login/signup), `/card` (customer QR + stamp meter), `/admin` (staff scanner). Supabase provides Postgres, email/password auth, and RLS. All stamp/redeem writes go through server actions that verify the shared admin account and then use the service-role client (RLS denies all client writes). Reward rules live in pure functions in `lib/loyalty.ts`, unit-tested with Vitest.

**Tech Stack:** Next.js (App Router, TypeScript, Tailwind), Supabase (`@supabase/supabase-js`, `@supabase/ssr`), `qrcode.react` (QR display), `@yudiel/react-qr-scanner` (camera scan), Vitest.

**Spec:** `docs/superpowers/specs/2026-07-12-coffee-loyalty-card-design.md`

---

## File Structure

```
Curbside/
├── app/
│   ├── page.tsx                  # Landing: login + signup forms
│   ├── layout.tsx                # (from create-next-app)
│   ├── auth/actions.ts           # signup / login / logout server actions
│   ├── card/
│   │   ├── page.tsx              # Customer card (server component)
│   │   └── refresh.tsx           # Client component: polls router.refresh()
│   └── admin/
│       ├── page.tsx              # Admin gate (server component)
│       ├── scanner.tsx           # Client component: camera + result panel
│       └── actions.ts            # lookupCard / addStamp / redeemReward
├── lib/
│   ├── loyalty.ts                # Pure reward rules (threshold, cooldown)
│   └── supabase/
│       ├── client.ts             # Browser client
│       ├── server.ts             # Server client (cookies)
│       └── admin.ts              # Service-role client (server only)
├── middleware.ts                 # Session refresh + route protection
├── supabase/schema.sql           # Tables, RLS, signup trigger
├── tests/loyalty.test.ts         # Unit tests for reward rules
└── .env.local                    # Supabase keys + ADMIN_EMAIL (not committed)
```

---

### Task 1: Scaffold the Next.js app

**Files:**
- Create: entire Next.js scaffold in the repo root (`c:/Users/BRODPET/BRODPETCODE/Curbside`)

- [ ] **Step 1: Scaffold Next.js in the current directory**

The repo already contains `docs/` and `.git`, so scaffold into a temp dir and move files in (create-next-app refuses non-empty dirs):

```bash
cd "c:/Users/BRODPET/BRODPETCODE/Curbside"
npx create-next-app@latest curbside-tmp --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --yes
# Move everything up (including dotfiles), then remove temp dir
mv curbside-tmp/* curbside-tmp/.gitignore curbside-tmp/.* . 2>/dev/null; rmdir curbside-tmp
```

Verify: `ls` shows `package.json`, `app/`, `next.config.ts`.

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr qrcode.react @yudiel/react-qr-scanner
```

- [ ] **Step 3: Install and wire Vitest**

```bash
npm install -D vitest
```

Add to `package.json` scripts:

```json
"test": "vitest run"
```

- [ ] **Step 4: Verify the dev server boots**

Run: `npm run dev` (background), fetch `http://localhost:3000`, expect HTTP 200, then stop it.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with Supabase, QR, and Vitest deps"
```

---

### Task 2: Core loyalty rules (pure functions, TDD)

**Files:**
- Create: `lib/loyalty.ts`
- Test: `tests/loyalty.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/loyalty.test.ts
import { describe, it, expect } from 'vitest';
import { applyStamp, isWithinCooldown, STAMP_THRESHOLD, STAMP_COOLDOWN_MS } from '../lib/loyalty';

describe('applyStamp', () => {
  it('increments stamps below the threshold', () => {
    expect(applyStamp(0)).toEqual({ newStamps: 1, rewardEarned: false });
    expect(applyStamp(8)).toEqual({ newStamps: 9, rewardEarned: false });
  });

  it('auto-resets to 0 and banks a reward on the 10th stamp', () => {
    expect(applyStamp(STAMP_THRESHOLD - 1)).toEqual({ newStamps: 0, rewardEarned: true });
  });

  it('rejects out-of-range stamp counts', () => {
    expect(() => applyStamp(-1)).toThrow();
    expect(() => applyStamp(STAMP_THRESHOLD)).toThrow(); // card should never hold 10
  });
});

describe('isWithinCooldown', () => {
  const now = Date.parse('2026-07-12T10:00:00Z');

  it('is false when there is no previous stamp', () => {
    expect(isWithinCooldown(null, now)).toBe(false);
  });

  it('is true when the last stamp is within the cooldown window', () => {
    const last = new Date(now - STAMP_COOLDOWN_MS + 1000).toISOString();
    expect(isWithinCooldown(last, now)).toBe(true);
  });

  it('is false when the last stamp is older than the cooldown window', () => {
    const last = new Date(now - STAMP_COOLDOWN_MS - 1000).toISOString();
    expect(isWithinCooldown(last, now)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/loyalty.test.ts`
Expected: FAIL — cannot resolve `../lib/loyalty`.

- [ ] **Step 3: Implement `lib/loyalty.ts`**

```typescript
// lib/loyalty.ts
export const STAMP_THRESHOLD = 10;
export const STAMP_COOLDOWN_MS = 5_000;

export function applyStamp(currentStamps: number): { newStamps: number; rewardEarned: boolean } {
  if (!Number.isInteger(currentStamps) || currentStamps < 0 || currentStamps >= STAMP_THRESHOLD) {
    throw new Error(`Invalid stamp count: ${currentStamps}`);
  }
  const next = currentStamps + 1;
  if (next === STAMP_THRESHOLD) {
    return { newStamps: 0, rewardEarned: true };
  }
  return { newStamps: next, rewardEarned: false };
}

export function isWithinCooldown(lastStampedAt: string | null, nowMs: number): boolean {
  if (!lastStampedAt) return false;
  return nowMs - Date.parse(lastStampedAt) < STAMP_COOLDOWN_MS;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/loyalty.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/loyalty.ts tests/loyalty.test.ts
git commit -m "feat: core loyalty rules - stamp increment, 10-stamp reward, scan cooldown"
```

---

### Task 3: Supabase project, schema, and clients

**Files:**
- Create: `supabase/schema.sql`, `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts`, `.env.local`, `.env.example`

- [ ] **Step 1: Create the Supabase project (user action — pause and ask)**

Ask the project owner to:
1. Create a free project at https://supabase.com/dashboard
2. From Project Settings → API, provide: Project URL, `anon` public key, `service_role` secret key.
3. Decide the shared staff email (e.g. `staff@yourshop.com`).

Do not proceed until the keys are available.

- [ ] **Step 2: Write the schema with RLS**

```sql
-- supabase/schema.sql
-- Customer profile, one per auth user. card_code is the opaque QR token.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  card_code uuid not null default gen_random_uuid() unique,
  current_stamps int not null default 0 check (current_stamps >= 0 and current_stamps < 10),
  created_at timestamptz not null default now()
);

-- Append-only stamp history.
create table public.stamps (
  id bigint generated always as identity primary key,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  stamped_at timestamptz not null default now()
);

-- Earned free coffees; redeemed_at null until used.
create table public.rewards (
  id bigint generated always as identity primary key,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  earned_at timestamptz not null default now(),
  redeemed_at timestamptz
);

alter table public.profiles enable row level security;
alter table public.stamps enable row level security;
alter table public.rewards enable row level security;

-- Customers may READ only their own rows. No insert/update/delete policies:
-- all writes happen server-side with the service-role key (bypasses RLS).
create policy "read own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "read own stamps" on public.stamps
  for select using (auth.uid() = customer_id);
create policy "read own rewards" on public.rewards
  for select using (auth.uid() = customer_id);

-- Auto-create a profile row when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', 'Customer'), new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Step 3: Apply the schema**

Paste `supabase/schema.sql` into the Supabase Dashboard → SQL Editor and run it. Expected: "Success. No rows returned."
Also, in Dashboard → Authentication → Sign In / Providers → Email: **disable "Confirm email"** (counter signups should work instantly; can re-enable later).

- [ ] **Step 4: Create the shared staff account**

In Dashboard → Authentication → Users → "Add user" → "Create new user": the staff email + a strong password, with **Auto Confirm** checked. (The trigger gives it a profile row too; that's harmless.)

- [ ] **Step 5: Write env files**

```bash
# .env.local  (real values; git-ignored by create-next-app)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR-SERVICE-ROLE-KEY
ADMIN_EMAIL=staff@yourshop.com
```

Also create `.env.example` with the same keys and placeholder values, and commit only `.env.example`.

- [ ] **Step 6: Write the three Supabase client helpers**

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component; middleware refreshes sessions.
          }
        },
      },
    }
  );
}
```

```typescript
// lib/supabase/admin.ts
// SERVER ONLY: service-role client bypasses RLS. Never import in client code.
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
```

- [ ] **Step 7: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add supabase/schema.sql lib/supabase .env.example
git commit -m "feat: Supabase schema with RLS, signup trigger, and client helpers"
```

---

### Task 4: Auth — signup, login, logout, landing page

**Files:**
- Create: `app/auth/actions.ts`
- Modify: `app/page.tsx` (replace scaffold content)

- [ ] **Step 1: Write the auth server actions**

```typescript
// app/auth/actions.ts
'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function signup(formData: FormData): Promise<void> {
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!name || !email || password.length < 6) {
    redirect('/?error=' + encodeURIComponent('Name, email, and a 6+ character password are required'));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) redirect('/?error=' + encodeURIComponent(error.message));
  redirect('/card');
}

export async function login(formData: FormData): Promise<void> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect('/?error=' + encodeURIComponent('Invalid email or password'));

  redirect(email.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase() ? '/admin' : '/card');
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
```

- [ ] **Step 2: Replace `app/page.tsx` with the landing page**

```tsx
// app/page.tsx
import { login, signup } from './auth/actions';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-8 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">☕ Curbside Loyalty</h1>
        <p className="mt-1 text-sm text-gray-500">Buy 10 coffees, get 1 free</p>
      </div>

      {error && (
        <p className="rounded bg-red-100 p-3 text-sm text-red-700">{error}</p>
      )}

      <form action={login} className="flex flex-col gap-3">
        <h2 className="font-semibold">Log in</h2>
        <input name="email" type="email" required placeholder="Email" className="rounded border p-2" />
        <input name="password" type="password" required placeholder="Password" className="rounded border p-2" />
        <button className="rounded bg-black p-2 font-medium text-white">Log in</button>
      </form>

      <form action={signup} className="flex flex-col gap-3">
        <h2 className="font-semibold">New here? Sign up</h2>
        <input name="name" required placeholder="Your name" className="rounded border p-2" />
        <input name="email" type="email" required placeholder="Email" className="rounded border p-2" />
        <input name="password" type="password" required minLength={6} placeholder="Password (6+ chars)" className="rounded border p-2" />
        <button className="rounded border border-black p-2 font-medium">Create my card</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 3: Verify signup works end-to-end**

Run `npm run dev`, open `http://localhost:3000`, sign up a test customer (e.g. `test1@example.com`). Expected: redirect to `/card` (404 for now — page comes in Task 6). In Supabase Dashboard → Table Editor → `profiles`: one row exists with a `card_code` and `current_stamps = 0`.

- [ ] **Step 4: Commit**

```bash
git add app/auth/actions.ts app/page.tsx
git commit -m "feat: email/password signup, login, logout with landing page"
```

---

### Task 5: Middleware — session refresh + route protection

**Files:**
- Create: `middleware.ts` (repo root)

- [ ] **Step 1: Write the middleware**

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAdmin =
    user?.email?.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase();

  if (!user && (path.startsWith('/card') || path.startsWith('/admin'))) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  if (path.startsWith('/admin') && !isAdmin) {
    return NextResponse.redirect(new URL('/card', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/card/:path*', '/admin/:path*'],
};
```

- [ ] **Step 2: Verify protection**

With dev server running and logged out (clear cookies or use a private window): visiting `/card` and `/admin` both redirect to `/`. Logged in as the test customer: `/admin` redirects to `/card`.

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: middleware session refresh and route protection for /card and /admin"
```

---

### Task 6: Customer card page

**Files:**
- Create: `app/card/page.tsx`, `app/card/refresh.tsx`

- [ ] **Step 1: Write the auto-refresh client component**

```tsx
// app/card/refresh.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function AutoRefresh({ intervalMs = 5000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
```

- [ ] **Step 2: Write the card page (server component)**

```tsx
// app/card/page.tsx
import { redirect } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/auth/actions';
import { STAMP_THRESHOLD } from '@/lib/loyalty';
import { AutoRefresh } from './refresh';

export default async function CardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, card_code, current_stamps')
    .eq('id', user.id)
    .single();
  if (!profile) redirect('/');

  const { count: freeCoffees } = await supabase
    .from('rewards')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', user.id)
    .is('redeemed_at', null);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center gap-6 p-6">
      <AutoRefresh />
      <h1 className="text-2xl font-bold">Hi, {profile.name} ☕</h1>

      <div className="rounded-xl border bg-white p-4 shadow">
        <QRCodeSVG value={profile.card_code} size={240} marginSize={2} title="Your loyalty card" />
      </div>
      <p className="text-xs text-gray-500">Show this code at the counter</p>

      <div className="flex gap-2" aria-label={`${profile.current_stamps} of ${STAMP_THRESHOLD} stamps`}>
        {Array.from({ length: STAMP_THRESHOLD }, (_, i) => (
          <span
            key={i}
            className={`h-5 w-5 rounded-full border ${
              i < profile.current_stamps ? 'bg-amber-700' : 'bg-gray-100'
            }`}
          />
        ))}
      </div>
      <p className="font-medium">
        {profile.current_stamps} / {STAMP_THRESHOLD} stamps
      </p>

      {(freeCoffees ?? 0) > 0 && (
        <p className="rounded-lg bg-green-100 px-4 py-3 font-semibold text-green-800">
          🎉 You have {freeCoffees} free coffee{freeCoffees === 1 ? '' : 's'} to redeem!
        </p>
      )}

      <form action={logout}>
        <button className="text-sm text-gray-400 underline">Log out</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 3: Verify visually**

Log in as the test customer, open `/card`. Expected: QR code renders, 0/10 stamps, no reward banner.

- [ ] **Step 4: Commit**

```bash
git add app/card
git commit -m "feat: customer card page with QR code, stamp meter, and reward banner"
```

---

### Task 7: Admin server actions — lookup, stamp, redeem

**Files:**
- Create: `app/admin/actions.ts`

- [ ] **Step 1: Write the admin actions**

```typescript
// app/admin/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyStamp, isWithinCooldown } from '@/lib/loyalty';

export type CardState = {
  ok: boolean;
  message?: string;
  customer?: {
    cardCode: string;
    name: string;
    currentStamps: number;
    unredeemedRewards: number;
  };
  rewardEarned?: boolean;
};

async function requireAdmin(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email?.toLowerCase() !== process.env.ADMIN_EMAIL?.toLowerCase()) {
    return 'Not authorized';
  }
  return null;
}

async function fetchCardState(cardCode: string): Promise<CardState> {
  const db = createAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('id, name, current_stamps')
    .eq('card_code', cardCode)
    .single();
  if (!profile) return { ok: false, message: 'Card not recognized' };

  const { count } = await db
    .from('rewards')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', profile.id)
    .is('redeemed_at', null);

  return {
    ok: true,
    customer: {
      cardCode,
      name: profile.name,
      currentStamps: profile.current_stamps,
      unredeemedRewards: count ?? 0,
    },
  };
}

export async function lookupCard(cardCode: string): Promise<CardState> {
  const denied = await requireAdmin();
  if (denied) return { ok: false, message: denied };
  return fetchCardState(cardCode.trim());
}

export async function addStamp(cardCode: string): Promise<CardState> {
  const denied = await requireAdmin();
  if (denied) return { ok: false, message: denied };

  const db = createAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('id, current_stamps')
    .eq('card_code', cardCode.trim())
    .single();
  if (!profile) return { ok: false, message: 'Card not recognized' };

  // Double-scan protection: ignore if last stamp is within the cooldown.
  const { data: lastStamp } = await db
    .from('stamps')
    .select('stamped_at')
    .eq('customer_id', profile.id)
    .order('stamped_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (isWithinCooldown(lastStamp?.stamped_at ?? null, Date.now())) {
    const state = await fetchCardState(cardCode.trim());
    return { ...state, message: 'Just stamped — ignored duplicate scan' };
  }

  const { newStamps, rewardEarned } = applyStamp(profile.current_stamps);

  const { error: stampError } = await db
    .from('stamps')
    .insert({ customer_id: profile.id });
  if (stampError) return { ok: false, message: 'Failed to add stamp — try again' };

  const { error: updateError } = await db
    .from('profiles')
    .update({ current_stamps: newStamps })
    .eq('id', profile.id);
  if (updateError) return { ok: false, message: 'Failed to update card — try again' };

  if (rewardEarned) {
    const { error: rewardError } = await db
      .from('rewards')
      .insert({ customer_id: profile.id });
    if (rewardError) return { ok: false, message: 'Stamp added but reward failed — check manually' };
  }

  const state = await fetchCardState(cardCode.trim());
  return { ...state, rewardEarned };
}

export async function redeemReward(cardCode: string): Promise<CardState> {
  const denied = await requireAdmin();
  if (denied) return { ok: false, message: denied };

  const db = createAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('id')
    .eq('card_code', cardCode.trim())
    .single();
  if (!profile) return { ok: false, message: 'Card not recognized' };

  const { data: reward } = await db
    .from('rewards')
    .select('id')
    .eq('customer_id', profile.id)
    .is('redeemed_at', null)
    .order('earned_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!reward) return { ok: false, message: 'No free coffee to redeem' };

  const { error } = await db
    .from('rewards')
    .update({ redeemed_at: new Date().toISOString() })
    .eq('id', reward.id);
  if (error) return { ok: false, message: 'Failed to redeem — try again' };

  const state = await fetchCardState(cardCode.trim());
  return { ...state, message: 'Free coffee redeemed ✅' };
}
```

- [ ] **Step 2: Verify it compiles and unit tests still pass**

Run: `npx tsc --noEmit && npx vitest run`
Expected: no type errors, all tests pass.

- [ ] **Step 3: Commit**

```bash
git add app/admin/actions.ts
git commit -m "feat: admin server actions - lookup, add stamp with cooldown, redeem reward"
```

---

### Task 8: Admin scan page

**Files:**
- Create: `app/admin/page.tsx`, `app/admin/scanner.tsx`

- [ ] **Step 1: Write the admin page (server component gate)**

```tsx
// app/admin/page.tsx
import { logout } from '@/app/auth/actions';
import { AdminScanner } from './scanner';

export default function AdminPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Staff — Scan Card</h1>
        <form action={logout}>
          <button className="text-sm text-gray-400 underline">Log out</button>
        </form>
      </div>
      <AdminScanner />
    </main>
  );
}
```

- [ ] **Step 2: Write the scanner client component**

```tsx
// app/admin/scanner.tsx
'use client';

import { useState, useTransition } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { lookupCard, addStamp, redeemReward, type CardState } from './actions';
import { STAMP_THRESHOLD } from '@/lib/loyalty';

export function AdminScanner() {
  const [state, setState] = useState<CardState | null>(null);
  const [cameraFailed, setCameraFailed] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [pending, startTransition] = useTransition();

  const scanning = state === null;

  function handleCode(code: string) {
    startTransition(async () => {
      setState(await lookupCard(code));
    });
  }

  function reset() {
    setState(null);
    setManualCode('');
  }

  if (scanning) {
    return (
      <div className="flex flex-col gap-4">
        {!cameraFailed ? (
          <div className="overflow-hidden rounded-xl border">
            <Scanner
              formats={['qr_code']}
              onScan={(codes) => {
                const value = codes[0]?.rawValue;
                if (value && !pending) handleCode(value);
              }}
              onError={() => setCameraFailed(true)}
            />
          </div>
        ) : (
          <p className="rounded bg-yellow-100 p-3 text-sm text-yellow-800">
            Camera unavailable — enter the card code manually below.
          </p>
        )}

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (manualCode.trim()) handleCode(manualCode);
          }}
        >
          <input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Or type card code"
            className="flex-1 rounded border p-2 text-sm"
          />
          <button className="rounded bg-black px-3 text-sm text-white" disabled={pending}>
            Look up
          </button>
        </form>
      </div>
    );
  }

  if (!state.ok || !state.customer) {
    return (
      <div className="flex flex-col gap-4">
        <p className="rounded bg-red-100 p-4 font-medium text-red-700">
          {state.message ?? 'Something went wrong'}
        </p>
        <button onClick={reset} className="rounded border p-3 font-medium">
          Scan another card
        </button>
      </div>
    );
  }

  const { customer } = state;
  const canRedeem = customer.unredeemedRewards > 0;

  return (
    <div className="flex flex-col gap-4">
      {state.rewardEarned && (
        <p className="rounded bg-green-100 p-4 text-center text-lg font-bold text-green-800">
          🎉 Free coffee earned!
        </p>
      )}
      {state.message && !state.rewardEarned && (
        <p className="rounded bg-blue-50 p-3 text-sm text-blue-800">{state.message}</p>
      )}

      <div className="rounded-xl border p-4">
        <p className="text-lg font-bold">{customer.name}</p>
        <p className="text-sm text-gray-600">
          {customer.currentStamps} / {STAMP_THRESHOLD} stamps
          {canRedeem && ` · ${customer.unredeemedRewards} free coffee available`}
        </p>
      </div>

      {canRedeem ? (
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              if (confirm(`Redeem a free coffee for ${customer.name}?`)) {
                setState(await redeemReward(customer.cardCode));
              }
            })
          }
          className="rounded bg-green-700 p-4 text-lg font-bold text-white disabled:opacity-50"
        >
          Redeem Free Coffee
        </button>
      ) : (
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setState(await addStamp(customer.cardCode));
            })
          }
          className="rounded bg-amber-700 p-4 text-lg font-bold text-white disabled:opacity-50"
        >
          Add Stamp
        </button>
      )}

      <button onClick={reset} className="rounded border p-3 font-medium">
        Scan another card
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/admin/page.tsx app/admin/scanner.tsx
git commit -m "feat: admin scan page with camera QR reader, manual fallback, stamp/redeem panel"
```

---

### Task 9: Manual end-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Full happy path**

With `npm run dev` running:
1. Private window → sign up `e2e@example.com` → `/card` shows QR, 0/10.
2. Copy the `card_code` from Supabase Table Editor (or scan the QR with a phone if testing on devices).
3. Normal window → log in as the staff account → `/admin`.
4. Use the manual code box (camera needs HTTPS/localhost + permission) → "Look up" → customer name and 0/10 shown.
5. Tap **Add Stamp** → 1/10. Tap again immediately → "ignored duplicate scan" message and still 1/10 (cooldown works).
6. Wait ~6s between taps; stamp up to 9/10, then one more → "🎉 Free coffee earned!", card shows 0/10, "1 free coffee available".
7. Customer window: `/card` auto-refreshes to 0/10 with the green reward banner.
8. Admin: look up again → **Redeem Free Coffee** button → confirm → "redeemed ✅"; reward banner gone on customer side.

- [ ] **Step 2: Security checks**

1. Logged out: `/card` and `/admin` redirect to `/`.
2. Logged in as customer: `/admin` redirects to `/card`.
3. In Supabase SQL Editor, verify RLS: `select * from profiles` under the `anon` role returns 0 rows (use the "Impersonate" / role dropdown).

- [ ] **Step 3: Run the full test suite**

Run: `npm run test && npx tsc --noEmit`
Expected: all pass.

- [ ] **Step 4: Commit any fixes found; final commit**

```bash
git add -A
git commit -m "chore: e2e verification fixes"
```

---

### Task 10 (optional, when ready): Deploy to Vercel

- [ ] **Step 1:** Push the repo to GitHub, import into Vercel.
- [ ] **Step 2:** Set the four env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`) in Vercel project settings.
- [ ] **Step 3:** Deploy; verify the happy path (Task 9 Step 1) on the live URL. Note: the camera scanner requires HTTPS, which Vercel provides — this is where real camera scanning gets verified.
