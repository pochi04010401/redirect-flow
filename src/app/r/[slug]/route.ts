import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const paramId = searchParams.get('id');

  // 1. 転送先を取得
  const { data: redirect, error } = await supabase
    .from('redirects')
    .select('id, target_url')
    .eq('slug', slug)
    .single();

  if (error || !redirect) {
    return NextResponse.json({ error: 'Redirect not found' }, { status: 404 });
  }

  // 2. 非同期でログを記録（転送を優先するためawaitしない）
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const ua = request.headers.get('user-agent') || 'unknown';

  supabase
    .from('access_logs')
    .insert({
      redirect_id: redirect.id,
      param_id: paramId,
      ip_address: ip,
      user_agent: ua,
    })
    .then(({ error: logError }) => {
      if (logError) console.error('Failed to log access:', logError);
    });

  // 3. 転送実行
  return NextResponse.redirect(new URL(redirect.target_url), 302);
}
