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

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('name, card_code, current_stamps')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) redirect('/');

  const { count: freeCoffees, error: rewardsError } = await supabase
    .from('rewards')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', user.id)
    .is('redeemed_at', null);
  if (rewardsError) console.error('rewards count failed', rewardsError);

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
