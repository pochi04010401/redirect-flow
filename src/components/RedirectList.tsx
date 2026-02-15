'use client';

import { useState, useEffect, useCallback } from 'react';
import { ExternalLink, Copy, Check, BarChart3, Download, Trash2, Edit3, Eye, RefreshCw } from 'lucide-react';
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const supabase = createClient();

  const fetchRedirects = useCallback(async () => {
    setIsRefreshing(true);
    const { data, error } = await supabase
      .from('redirects')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setRedirects(data);
    
    const { data: statsData, error: statsError } = await supabase
      .rpc('get_redirect_stats');

    if (statsData) {
      const s: Record<string, { total: number; unique: number }> = {};
      statsData.forEach((row: any) => {
        s[row.redirect_id] = { 
          total: row.total_count, 
          unique: row.unique_count 
        };
      });
      setStats(s);
    }
    
    setTimeout(() => setIsRefreshing(false), 300);
  }, [supabase]);

  useEffect(() => {
    fetchRedirects();
  }, [fetchRedirects]);

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

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-500" /> URL List
          <button 
            onClick={fetchRedirects}
            disabled={isRefreshing}
            className="p-2 text-zinc-400 hover:text-indigo-500 transition-all rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </h2>
      </div>
      
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase text-zinc-400 tracking-widest">
              <th className="p-5">Slug / Link</th>
              <th className="p-5">Target</th>
              <th className="p-5">Analytics</th>
              <th className="p-5">Notification</th>
              <th className="p-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {redirects.map((r) => (
              <tr key={r.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="p-5">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{r.slug}</code>
                    <button onClick={() => copyToClipboard(r.slug)} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-all">
                      {copiedSlug === r.slug ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                    </button>
                    <a href={`/r/${r.slug}`} target="_blank" className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-all text-zinc-400 hover:text-indigo-500">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </td>
                <td className="p-5 max-w-xs">
                  <div className="truncate text-xs font-medium text-zinc-500" title={r.target_url}>{r.target_url}</div>
                </td>
                <td className="p-5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-black">{stats[r.id]?.total || 0}</span>
                    <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-tighter">Total</span>
                    <span className="text-base font-black ml-2 text-indigo-500">{stats[r.id]?.unique || 0}</span>
                    <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-tighter">Unique</span>
                  </div>
                </td>
                <td className="p-5">
                  <div className="text-[10px]">
                    {r.notification_frequency === 'none' ? <span className="text-zinc-300">OFF</span> : (
                      <div className="flex flex-col">
                        <span className="text-indigo-500 font-black">DAILY 6AM</span>
                        <span className="text-zinc-400 truncate w-32">{r.notification_email}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-5">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setViewingLogsRedirect(r)} className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-all"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => setEditingRedirect(r)} className="p-2 text-zinc-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-xl transition-all"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => deleteRedirect(r.id)} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {redirects.map((r) => (
          <div key={r.id} className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <code className="text-base font-black text-indigo-600 dark:text-indigo-400">{r.slug}</code>
              <div className="flex items-center gap-1">
                <button onClick={() => copyToClipboard(r.slug)} className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  {copiedSlug === r.slug ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                </button>
                <a href={`/r/${r.slug}`} target="_blank" className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-zinc-400">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Target URL</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 break-all line-clamp-2">{r.target_url}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 py-3 border-y border-zinc-50 dark:border-zinc-800">
              <div>
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total</p>
                <p className="text-xl font-black">{stats[r.id]?.total || 0}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Unique</p>
                <p className="text-xl font-black text-indigo-500">{stats[r.id]?.unique || 0}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-[10px]">
                {r.notification_frequency !== 'none' && <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-lg font-black uppercase">Daily 6AM</span>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setViewingLogsRedirect(r)} className="p-3 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 rounded-2xl"><Eye className="w-5 h-5" /></button>
                <button onClick={() => setEditingRedirect(r)} className="p-3 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 rounded-2xl"><Edit3 className="w-5 h-5" /></button>
                <button onClick={() => deleteRedirect(r.id)} className="p-3 bg-red-50 dark:bg-red-950/30 text-red-500 rounded-2xl"><Trash2 className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {redirects.length === 0 && (
        <div className="py-20 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 italic text-sm">
          No redirects found.
        </div>
      )}

      {editingRedirect && <EditRedirectModal redirect={editingRedirect} onClose={() => setEditingRedirect(null)} onUpdated={fetchRedirects} />}
      {viewingLogsRedirect && <ViewLogsModal redirect={viewingLogsRedirect} onClose={() => setViewingLogsRedirect(null)} />}
    </div>
  );
}
