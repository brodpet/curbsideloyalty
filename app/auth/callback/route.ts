import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { User } from '@supabase/supabase-js';

// A brand-new user's first sign-in happens at the moment of creation, so the
// two timestamps are effectively equal; any returning user's last sign-in is later.
function isNewUser(user: User): boolean {
  if (!user.last_sign_in_at) return true;
  const created = new Date(user.created_at).getTime();
  const lastSignIn = new Date(user.last_sign_in_at).getTime();
  return Math.abs(lastSignIn - created) < 5000;
}

function errorRedirect(request: NextRequest, message: string) {
  return NextResponse.redirect(new URL('/?error=' + encodeURIComponent(message), request.url));
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const intent = request.nextUrl.searchParams.get('intent');
  if (!code) return errorRedirect(request, 'Could not sign in with Google');

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return errorRedirect(request, 'Could not sign in with Google');

  if (intent === 'login' && isNewUser(data.user)) {
    await supabase.auth.signOut();
    await createAdminClient().auth.admin.deleteUser(data.user.id);
    return errorRedirect(request, "No card found for that Google account. Choose 'New card' to create one.");
  }

  const isAdmin =
    data.user.email?.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase();
  return NextResponse.redirect(new URL(isAdmin ? '/admin' : '/card', request.url));
}
