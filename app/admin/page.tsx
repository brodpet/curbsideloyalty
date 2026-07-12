import { logout } from '@/app/auth/actions';
import { Brand } from '@/app/ui/brand';
import { LogoutIcon } from '@/app/ui/icons';
import { AdminScanner } from './scanner';

export default function AdminPage() {
  return (
    <main className="admin-page page-shell">
      <header className="app-header">
        <Brand compact />
        <div className="header-actions">
          <span className="status-chip">Staff mode</span>
          <form action={logout}>
            <button className="text-button" type="submit">
              <LogoutIcon size={16} />
              Log out
            </button>
          </form>
        </div>
      </header>

      <div className="page-content">
        <header className="admin-intro">
          <div>
            <span className="eyebrow">Counter / scan card</span>
            <h1>Ready for the next customer.</h1>
          </div>
          <p className="admin-intro__aside">Scan a QR code to look up a loyalty ticket, add a stamp, or redeem a reward.</p>
        </header>
        <AdminScanner />
      </div>
    </main>
  );
}
