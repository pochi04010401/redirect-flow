import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

export async function GET(request: NextRequest) {
  // セキュリティチェック
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = await createClient();

  try {
    const { data: redirects, error: rError } = await supabase
      .from('redirects')
      .select('*')
      .eq('notification_frequency', 'daily_6am');

    if (rError) throw rError;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const yesterdayIso = yesterday.toISOString();

    const isTest = request.nextUrl.searchParams.get('test') === 'true';

    for (const r of redirects) {
      if (!r.notification_email) continue;
      console.log(`Processing summary for: ${r.slug} -> ${r.notification_email}`);

      const { data: logs, error: lError } = await supabase
        .from('access_logs')
        .select('*')
        .eq('redirect_id', r.id)
        .gte('created_at', yesterdayIso);

      if (lError) {
        console.error(`Log fetch error for ${r.slug}:`, lError);
        continue;
      }

      // ログがある場合、またはテストモードの場合に送信
      if (logs.length > 0 || isTest) {
        const uniqueUsers = new Set(logs.map(l => l.param_id).filter(Boolean)).size;
        
        try {
          const { data, error: mailError } = await resend.emails.send({
            // ドメイン未認証の場合のフォールバック（テスト時など）
            from: process.env.RESEND_FROM_EMAIL || 'RedirectFlow <notifications@myclaw.ai>',
            to: r.notification_email,
            subject: `${isTest ? '[TEST] ' : ''}【RedirectFlow】集計レポート: ${r.slug}`,
            html: `
              <h1>${isTest ? 'テスト用 ' : ''}アクセス集計レポート</h1>
              <p><strong>対象URL:</strong> ${r.slug} (${r.target_url})</p>
              <p><strong>集計期間:</strong> ${yesterday.toLocaleDateString()} ${isTest ? '(テスト送信)' : ''}</p>
              <hr />
              <ul>
                <li><strong>総アクセス数:</strong> ${logs.length} 件</li>
                <li><strong>ユニークユーザー数(ID基準):</strong> ${uniqueUsers} 名</li>
              </ul>
              <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}">管理画面で詳細を確認する</a></p>
            `
          });

          if (mailError) {
            console.error(`Resend error for ${r.slug}:`, mailError);
          } else {
            console.log(`Email sent successfully for ${r.slug}:`, data?.id);
          }
        } catch (e) {
          console.error(`Exception during email send for ${r.slug}:`, e);
        }
      } else {
        console.log(`No logs for ${r.slug} since ${yesterdayIso}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to process batch' }, { status: 500 });
  }
}
