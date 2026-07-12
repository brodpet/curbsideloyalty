import { redirect } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/auth/actions';
import { CoffeeCupIcon, LogoutIcon, ScanIcon } from '@/app/ui/icons';
import { Brand } from '@/app/ui/brand';
import { StampRail } from '@/app/ui/stamp-rail';
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

  const availableRewards = freeCoffees ?? 0;
  const firstName = profile.name.trim().split(/\s+/)[0] || 'there';
  const stampsToGo = STAMP_THRESHOLD - profile.current_stamps;

  return (
    <main className="customer-page page-shell">
      <AutoRefresh />
      <header className="app-header">
        <Brand compact />
        <div className="header-actions">
          <span className="status-chip">Card is live</span>
          <form action={logout}>
            <button className="text-button" type="submit">
              <LogoutIcon size={16} />
              Log out
            </button>
          </form>
        </div>
      </header>

      <div className="page-content">
        <div className="customer-grid">
          <section className="customer-intro" aria-labelledby="card-heading">
            <span className="eyebrow">Personal loyalty card</span>
            <h1 id="card-heading">Good morning, {firstName}.</h1>
            <p className="customer-intro__lead">
              Keep this ticket handy when you order. Your progress updates automatically after a stamp.
            </p>

            <div className="progress-summary">
              <div className="progress-summary__number">{profile.current_stamps}/{STAMP_THRESHOLD}</div>
              <p className="progress-summary__copy">
                {stampsToGo === 1
                  ? 'One more stamp and your next coffee is on us.'
                  : `${stampsToGo} stamps to your next free coffee.`}
              </p>
            </div>
          </section>

          <div className="ticket-column">
            <section className="ticket-card ticket-card--lime" aria-labelledby="ticket-heading">
              <div className="ticket-card__header">
                <div>
                  <div className="ticket-code">Customer loyalty ticket</div>
                  <h2 className="ticket-card__title" id="ticket-heading">Show this at the counter</h2>
                </div>
                <div className="ticket-code">#{profile.card_code.slice(0, 6)}</div>
              </div>
              <div className="ticket-card__rule" />
              <div className="ticket-card__body">
                <div className="qr-frame">
                  <QRCodeSVG
                    bgColor="#ffffff"
                    fgColor="#171311"
                    level="M"
                    marginSize={1}
                    size={220}
                    title="Your Curbside loyalty QR code"
                    value={profile.card_code}
                  />
                </div>
                <div className="ticket-card__details">
                  <div className="ticket-card__detail">
                    <ScanIcon size={21} />
                    <span>Ask the barista to scan your card.</span>
                  </div>
                  <div className="ticket-card__detail">
                    <CoffeeCupIcon size={21} />
                    <span>Every tenth stamp becomes a free coffee.</span>
                  </div>
                </div>
              </div>
              <div className="ticket-card__footer">
                <span>Keep this screen open</span>
                <span>Ready when you are →</span>
              </div>
            </section>

            <section className="stamp-card" aria-labelledby="stamps-heading">
              <div className="stamp-card__header">
                <h2 className="stamp-card__title" id="stamps-heading">Your stamp run</h2>
                <span className="stamp-count">{profile.current_stamps} / {STAMP_THRESHOLD} stamps</span>
              </div>
              <StampRail currentStamps={profile.current_stamps} threshold={STAMP_THRESHOLD} />
              <p className="stamp-card__caption">The last stamp resets the rail and adds a reward to your pocket.</p>
            </section>

            <section
              aria-live="polite"
              className={`reward-pocket${availableRewards === 0 ? ' reward-pocket--empty' : ''}`}
            >
              <div className="reward-pocket__content">
                <CoffeeCupIcon size={30} />
                <div>
                  <div className="ticket-code">Reward pocket</div>
                  {availableRewards > 0 ? (
                    <>
                      <div className="reward-pocket__title">{availableRewards} free coffee{availableRewards === 1 ? '' : 's'} waiting</div>
                      <p className="reward-pocket__copy">Show this card at the counter to redeem one.</p>
                    </>
                  ) : (
                    <>
                      <div className="reward-pocket__title">Nothing in the pocket yet</div>
                      <p className="reward-pocket__copy">Keep collecting. Your first reward arrives at stamp ten.</p>
                    </>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
