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
