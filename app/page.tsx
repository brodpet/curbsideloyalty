import { AuthPanel } from './auth/auth-panel';
import { Brand } from './ui/brand';
import { CoffeeCupIcon, ScanIcon, TicketIcon } from './ui/icons';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="auth-page page-shell">
      <div className="auth-page__inner">
        <section className="auth-hero" aria-labelledby="home-heading">
          <header className="auth-hero__header">
            <Brand />
            <span className="eyebrow">10 stamps / 1 coffee</span>
          </header>

          <div className="auth-hero__copy">
            <span className="eyebrow">Your everyday coffee, kept track of</span>
            <h1 id="home-heading">
              Your next <span>coffee</span> starts here.
            </h1>
            <p className="auth-hero__lead">
              Collect a stamp with every purchase. When the ticket is full, your next cup is on us.
            </p>

            <div className="hero-ticket" aria-label="Ten stamps earn one free coffee">
              <div>
                <div className="hero-ticket__label">Curbside coffee club</div>
                <div className="hero-ticket__title">10 cups → 1 on us</div>
              </div>
              <div className="hero-ticket__number">10</div>
            </div>
          </div>

          <div className="how-it-works" aria-label="How the loyalty card works">
            <div className="how-it-works__item">
              <TicketIcon size={21} />
              <span>Make a purchase</span>
            </div>
            <div className="how-it-works__item">
              <ScanIcon size={21} />
              <span>Show your QR card</span>
            </div>
            <div className="how-it-works__item">
              <CoffeeCupIcon size={21} />
              <span>Enjoy the next one free</span>
            </div>
          </div>
        </section>

        <AuthPanel error={error} />
      </div>
    </main>
  );
}
