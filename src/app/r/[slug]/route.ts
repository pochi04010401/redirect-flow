import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const paramId = searchParams.get('id') || searchParams.get('ID');

  const supabase = await createClient();

  // 1. 転送先を取得
  const { data: redirect, error } = await supabase
    .from('redirects')
    .select('id, target_url')
    .eq('slug', slug)
    .single();

  if (error || !redirect) {
    return NextResponse.json({ error: 'Redirect not found' }, { status: 404 });
  }

  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const ua = request.headers.get('user-agent') || 'unknown';

  // 2. ログ記録用のプロミス（awaitしない）
  const logPromise = supabase
    .from('access_logs')
    .insert({
      redirect_id: redirect.id,
      param_id: paramId,
      ip_address: ip,
      user_agent: ua,
    });

  // 3. 転送実行
  const response = NextResponse.redirect(new URL(redirect.target_url), 302);

  // Vercel / Next.js 15 の魔法: waitUntil
  // ユーザーには即座にレスポンスを返すが、裏でログ記録が完了するまでプロセスを維持する。
  // これで「爆速」と「確実な記録」を両立できる。
  if ((request as any).waitUntil) {
    (request as any).waitUntil(logPromise);
  } else {
    // ローカル環境等のフォールバック
    await logPromise;
  }

  return response;
}
