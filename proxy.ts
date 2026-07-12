import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

function redirectPreservingCookies(base: NextResponse, url: URL): NextResponse {
  const redirect = NextResponse.redirect(url);
  base.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const inCard = path === '/card' || path.startsWith('/card/');
  const inAdmin = path === '/admin' || path.startsWith('/admin/');
  const isAdmin =
    user?.email?.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase();

  if (!user && (inCard || inAdmin)) {
    return redirectPreservingCookies(response, new URL('/', request.url));
  }
  if (inAdmin && !isAdmin) {
    return redirectPreservingCookies(response, new URL('/card', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/card/:path*', '/admin/:path*'],
};
