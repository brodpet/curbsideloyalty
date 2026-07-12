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
