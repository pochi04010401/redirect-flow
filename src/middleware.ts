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

  // 環境変数が設定されていない、またはプレースホルダの場合は、認証をスキップしてアクセスを許可（設定を促すため）
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
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

    // getUser() を使ってセッションを確実に検証
    const { data: { user }, error } = await supabase.auth.getUser();

    // 転送用URL (/r/[slug]) は常に許可
    if (request.nextUrl.pathname.startsWith('/r/')) {
      return response;
    }

    // ログインページへのアクセス
    if (request.nextUrl.pathname.startsWith('/login')) {
      if (user) {
        // ログイン済みならトップへ
        return NextResponse.redirect(new URL('/', request.url));
      }
      return response;
    }

    // それ以外のページで未ログインならログイン画面へ
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } catch (e) {
    console.error('Middleware Error:', e);
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * 次のパスを除くすべてのリクエストパスにマッチ:
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化)
     * - favicon.ico (ファビコンファイル)
     * - その他画像ファイル
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
