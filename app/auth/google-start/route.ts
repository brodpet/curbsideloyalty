import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Opened in a popup window so the Google OAuth pages run top-level.
// Google returns 403 when its sign-in flow is loaded inside an iframe,
// which is how the PWA shell embeds this site.
export async function GET(request: NextRequest) {
  const intent = request.nextUrl.searchParams.get('intent') === 'login' ? 'login' : 'signup';
  const origin = request.nextUrl.origin;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${origin}/auth/callback?intent=${intent}&popup=1` },
  });

  if (error || !data.url) {
    return NextResponse.redirect(
      new URL('/?error=' + encodeURIComponent('Could not start Google sign-in'), request.url)
    );
  }
  return NextResponse.redirect(data.url);
}
