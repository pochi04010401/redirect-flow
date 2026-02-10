'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Copy, Check, BarChart3, Download, Trash2, Edit3, Eye } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { Redirect } from '@/types';
import { EditRedirectModal } from './EditRedirectModal';
import { ViewLogsModal } from './ViewLogsModal';

export function RedirectList() {
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [stats, setStats] = useState<Record<string, { total: number; unique: number }>>({});
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [editingRedirect, setEditingRedirect] = useState<Redirect | null>(null);
  const [viewingLogsRedirect, setViewingLogsRedirect] = useState<Redirect | null>(null);
  const supabase = createClient();

  const fetchRedirects = async () => {
    const { data, error } = await supabase
      .from('redirects')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setRedirects(data);
    
    const { data: logData } = await supabase
      .from('access_logs')
      .select('redirect_id, param_id');

    if (logData) {
      const s: Record<string, { total: number; unique: number; ids: Set<string> }> = {};
      logData.forEach(log => {
        if (!s[log.redirect_id]) s[log.redirect_id] = { total: 0, unique: 0, ids: new Set() };
        s[log.redirect_id].total++;
        if (log.param_id && !s[log.redirect_id].ids.has(log.param_id)) {
          s[log.redirect_id].ids.add(log.param_id);
          s[log.redirect_id].unique++;
        }
      });
      setStats(s);
    }
  };

  useEffect(() => {
    fetchRedirects();
  }, []);

  const copyToClipboard = (slug: string) => {
    const url = `${window.location.origin}/r/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const deleteRedirect = async (id: string) => {
    if (!confirm('本当に削除しますか？')) return;
    const { error } = await supabase.from('redirects').delete().eq('id', id);
    if (error) alert(`削除失敗: ${error.message}`);
    fetchRedirects();
  };

  const exportAllLogs = async () => {
    const { data: logs, error } = await supabase
      .from('access_logs')
      .select(`
        created_at,
        param_id,
        ip_address,
        user_agent,
        redirects ( slug, target_url )
      `)
      .order('created_at', { ascending: false });

    if (error || !logs) {
      alert('ログの取得に失敗しました');
      return;
    }

    const headers = ['日時', 'スラッグ', 'IDパラメータ', '転送先URL', 'IPアドレス', 'UserAgent'];
    const rows = logs.map((log: any) => [
      log.created_at,
      log.redirects?.slug || '',
      log.param_id || '',
      log.redirects?.target_url || '',
      log.ip_address || '',
      `"${log.user_agent?.replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `all_redirect_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-500" /> 発行済みURL一覧
        </h2>
        <button 
          onClick={exportAllLogs}
          className="btn-secondary text-sm flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" /> 全ログCSV出力
        </button>
      </div>
      
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left bg-white dark:bg-zinc-900 border-collapse">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase text-zinc-500">
              <th className="p-4">スラッグ / リンク</th>
              <th className="p-4">転送先</th>
              <th className="p-4">統計</th>
              <th className="p-4">通知</th>
              <th className="p-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {redirects.map((r) => (
              <tr key={r.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{r.slug}</code>
                    <button 
                      onClick={() => copyToClipboard(r.slug)}
                      className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                      title="URLをコピー"
                    >
                      {copiedSlug === r.slug ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                    </button>
                    <a href={`/r/${r.slug}`} target="_blank" className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors text-zinc-400 hover:text-indigo-500">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </td>
                <td className="p-4 max-w-xs">
                  <div className="truncate text-sm text-zinc-600 dark:text-zinc-400" title={r.target_url}>
                    {r.target_url}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black">{stats[r.id]?.total || 0}</span>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">Total</span>
                    <span className="text-lg font-black ml-2 text-indigo-500">{stats[r.id]?.unique || 0}</span>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">Unique</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-xs">
                    {r.notification_frequency === 'none' ? (
                      <span className="text-zinc-400">OFF</span>
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-indigo-500 font-bold">毎日6時</span>
                        <span className="text-zinc-500 truncate w-32">{r.notification_email}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-1">
                    <button 
                      onClick={() => setViewingLogsRedirect(r)}
                      className="p-2 text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-all"
                      title="アクセス詳細を表示"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setEditingRedirect(r)}
                      className="p-2 text-zinc-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition-all"
                      title="設定を編集"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteRedirect(r.id)}
                      className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                      title="削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {redirects.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-zinc-400 italic text-sm">
                  発行済みのURLがありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 編集モーダル */}
      {editingRedirect && (
        <EditRedirectModal 
          redirect={editingRedirect} 
          onClose={() => setEditingRedirect(null)} 
          onUpdated={fetchRedirects} 
        />
      )}

      {/* ログ表示モーダル */}
      {viewingLogsRedirect && (
        <ViewLogsModal 
          redirect={viewingLogsRedirect} 
          onClose={() => setViewingLogsRedirect(null)} 
        />
      )}
    </div>
  );
}
