'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, User, Monitor, Download, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { Redirect, AccessLog } from '@/types';

export function ViewLogsModal({ 
  redirect, 
  onClose 
}: { 
  redirect: Redirect; 
  onClose: () => void;
}) {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('access_logs')
        .select('*')
        .eq('redirect_id', redirect.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (data) setLogs(data);
      setLoading(false);
    };

    fetchLogs();
  }, [redirect.id, supabase]);

  const exportCurrentLogs = () => {
    if (logs.length === 0) return;

    const headers = ['日時', 'IDパラメータ', 'IPアドレス', 'UserAgent'];
    const rows = logs.map(log => [
      log.created_at,
      log.param_id || '',
      log.ip_address || '',
      `"${log.user_agent?.replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `logs_${redirect.slug}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[80vh] animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <code className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded">{redirect.slug}</code> のアクセスログ
            </h3>
            <p className="text-xs text-zinc-500 mt-1 truncate max-w-md">{redirect.target_url}</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={exportCurrentLogs}
              disabled={logs.length === 0}
              className="btn-secondary text-sm flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> CSV出力
            </button>
            <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-0">
          {loading ? (
            <div className="flex items-center justify-center h-full text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-zinc-400 italic">
              まだアクセスがありません
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white dark:bg-zinc-900 shadow-sm z-10">
                <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase text-zinc-500">
                  <th className="p-4 flex items-center gap-1"><Calendar className="w-3 h-3" /> アクセス日時</th>
                  <th className="p-4"><div className="flex items-center gap-1"><User className="w-3 h-3" /> IDパラメータ</div></th>
                  <th className="p-4">IPアドレス</th>
                  <th className="p-4 flex items-center gap-1"><Monitor className="w-3 h-3" /> ブラウザ/環境</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50 text-xs">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                    <td className="p-4 whitespace-nowrap text-zinc-500 font-mono">{new Date(log.created_at).toLocaleString('ja-JP')}</td>
                    <td className="p-4"><span className="font-bold text-indigo-600 dark:text-indigo-400">{log.param_id || '-'}</span></td>
                    <td className="p-4 text-zinc-400">{log.ip_address || '-'}</td>
                    <td className="p-4 truncate max-w-xs text-zinc-500" title={log.user_agent || ''}>{log.user_agent || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/30 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400 text-center uppercase tracking-widest font-bold">
          Showing last {logs.length} access logs
        </div>
      </div>
    </div>
  );
}
