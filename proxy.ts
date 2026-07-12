import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

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
  const isAdmin =
    user?.email?.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase();

  if (!user && (path.startsWith('/card') || path.startsWith('/admin'))) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  if (path.startsWith('/admin') && !isAdmin) {
    return NextResponse.redirect(new URL('/card', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/card/:path*', '/admin/:path*'],
};
