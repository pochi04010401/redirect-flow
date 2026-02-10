import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: NextRequest) {
  // セキュリティチェック (Cronジョブからのアクセスであることを確認)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 1. 翌朝6時通知設定のURLを全取得
    const { data: redirects, error: rError } = await supabase
      .from('redirects')
      .select('*')
      .eq('notification_frequency', 'daily_6am');

    if (rError) throw rError;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const yesterdayIso = yesterday.toISOString();

    for (const r of redirects) {
      if (!r.notification_email) continue;

      // 2. 前日分のアクセスログを集計
      const { data: logs, error: lError } = await supabase
        .from('access_logs')
        .select('*')
        .eq('redirect_id', r.id)
        .gte('created_at', yesterdayIso);

      if (lError) continue;

      if (logs.length > 0) {
        // 3. メール送信
        const uniqueUsers = new Set(logs.map(l => l.param_id).filter(Boolean)).size;
        
        await resend.emails.send({
          from: 'RedirectFlow <notifications@myclaw.ai>',
          to: r.notification_email,
          subject: `【RedirectFlow】昨日の集計レポート: ${r.slug}`,
          html: `
            <h1>アクセス集計レポート</h1>
            <p><strong>対象URL:</strong> ${r.slug} (${r.target_url})</p>
            <p><strong>集計期間:</strong> ${yesterday.toLocaleDateString()}</p>
            <hr />
            <ul>
              <li><strong>総アクセス数:</strong> ${logs.length} 件</li>
              <li><strong>ユニークユーザー数(ID基準):</strong> ${uniqueUsers} 名</li>
            </ul>
            <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}">管理画面で詳細を確認する</a></p>
          `
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to process batch' }, { status: 500 });
  }
}
