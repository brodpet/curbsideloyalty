-- Customer profile, one per auth user. card_code is the opaque QR token.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  card_code uuid not null default gen_random_uuid() unique,
  current_stamps int not null default 0 check (current_stamps >= 0 and current_stamps < 10), -- keep in sync with STAMP_THRESHOLD in lib/loyalty.ts
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

-- Indexes for the hot paths: latest stamp per customer (cooldown check),
-- unredeemed rewards per customer, RLS filters.
create index stamps_customer_id_stamped_at_idx on public.stamps (customer_id, stamped_at desc);
create index rewards_unredeemed_idx on public.rewards (customer_id) where redeemed_at is null;

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
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', 'Customer'), coalesce(new.email, ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
