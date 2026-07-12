import { redirect } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/auth/actions';
import { Brand } from '@/app/ui/brand';
import { CoffeeCupIcon, LogoutIcon, ScanIcon } from '@/app/ui/icons';
import { StampRail } from '@/app/ui/stamp-rail';
import { STAMP_THRESHOLD } from '@/lib/loyalty';
import { AutoRefresh } from './refresh';
import { Greeting } from './greeting';

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

  const availableRewards = freeCoffees ?? 0;

  return (
    <main className="customer-page page-shell">
      <AutoRefresh />
      <div className="customer-layout">
        <aside className="customer-side">
          <div className="customer-side__top">
            <Brand />
            <form action={logout}>
              <button aria-label="Log out" className="side-icon-button" type="submit">
                <LogoutIcon size={18} />
              </button>
            </form>
          </div>

          <div className="customer-side__middle">
            <div className="loyalty-script">Loyalty Card</div>
            <p className="customer-side__note">A small thank-you for making Curbside part of your everyday.</p>
          </div>

          <div className="customer-side__footer">
            <span><CoffeeCupIcon size={17} /> Curbside Café</span>
            <span><ScanIcon size={17} /> Your card is ready</span>
          </div>
        </aside>

        <section className="customer-main" aria-labelledby="card-heading">
          <div className="customer-main__inner">
            <div className="customer-greeting">
              <span className="eyebrow">Personal loyalty card</span>
              <Greeting name={profile.name.trim().split(/\s+/)[0] || 'Sipster'} />
              <p>Thank you for being our loyal customer!</p>
            </div>

            <div className="customer-stamps">
              <StampRail currentStamps={profile.current_stamps} threshold={STAMP_THRESHOLD} />
            </div>

            <p className="customer-reward-line">Get 1 free drink on your 10th order</p>

            {availableRewards > 0 && (
              <div aria-live="polite" className="customer-reward-ready" role="status">
                <CoffeeCupIcon size={22} />
                <span>You have {availableRewards} free drink{availableRewards === 1 ? '' : 's'} ready to redeem.</span>
              </div>
            )}

            <details className="qr-drawer">
              <summary>
                <span><ScanIcon size={19} /> Show my QR at the counter</span>
                <span className="qr-drawer__hint">Tap to open</span>
              </summary>
              <div className="qr-drawer__body">
                <div className="qr-frame">
                  <QRCodeSVG
                    bgColor="#f7f4e8"
                    fgColor="#2b4c35"
                    level="M"
                    marginSize={1}
                    size={210}
                    title="Your Curbside loyalty QR code"
                    value={profile.card_code}
                  />
                </div>
                <div>
                  <div className="ticket-code">Your scan code</div>
                  <p>Open this panel when you are ready to collect your next stamp.</p>
                  <span className="qr-drawer__code">#{profile.card_code.slice(0, 6)}</span>
                </div>
              </div>
            </details>
          </div>
        </section>
      </div>
    </main>
  );
}
