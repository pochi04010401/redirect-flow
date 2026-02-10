import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 環境変数が無い場合は、500エラーを避けるためにそのまま通す（ページ側でエラーが出る）
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
    return response;
  }

  // 転送用URL (/r/[slug]) は認証チェックをスキップ
  if (request.nextUrl.pathname.startsWith('/r/')) {
    return response;
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value,
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    // セッションを確認
    const { data: { session } } = await supabase.auth.getSession();

    const isLoginPage = request.nextUrl.pathname.startsWith('/login');

    if (session) {
      // ログイン済みでログインページにいようとしたらトップへ
      if (isLoginPage) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } else {
      // 未ログインでログインページ以外にいようとしたらログインページへ
      if (!isLoginPage) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
  } catch (e) {
    console.error('Middleware Error:', e);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
