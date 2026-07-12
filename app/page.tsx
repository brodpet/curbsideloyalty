import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AuthPanel } from './auth/auth-panel';
import { Brand } from './ui/brand';
import { CoffeeCupIcon, ScanIcon, TicketIcon } from './ui/icons';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect(
      user.email?.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()
        ? '/admin'
        : '/card'
    );
  }

  return (
    <main className="auth-page page-shell">
      <div className="auth-page__inner">
        <section className="auth-hero" aria-labelledby="home-heading">
          <header className="auth-hero__header">
            <Brand />
            <span className="eyebrow">10 stamps / 1 coffee</span>
          </header>

          <div className="auth-hero__copy">
            <span className="eyebrow">A little something for your coffee ritual</span>
            <div className="loyalty-script">Loyalty Card</div>
            <h1 id="home-heading">
              Your next <span>coffee</span> is waiting.
            </h1>
            <p className="auth-hero__lead">
              Collect a stamp with every order. When the card is full, your next drink is on us.
            </p>

            <div className="hero-ticket" aria-label="Ten stamps earn one free coffee">
              <div>
                <div className="hero-ticket__label">Curbside Café</div>
                <div className="hero-ticket__title">10 orders → 1 free drink</div>
              </div>
              <div className="hero-ticket__number">10</div>
            </div>
          </div>

          <div className="how-it-works" aria-label="How the loyalty card works">
            <div className="how-it-works__item">
              <TicketIcon size={21} />
              <span>Enjoy your order</span>
            </div>
            <div className="how-it-works__item">
              <ScanIcon size={21} />
              <span>Collect a stamp</span>
            </div>
            <div className="how-it-works__item">
              <CoffeeCupIcon size={21} />
              <span>Get the tenth on us</span>
            </div>
          </div>
        </section>

        <AuthPanel error={error} />
      </div>
    </main>
  );
}
