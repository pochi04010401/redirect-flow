'use client';

import { useState } from 'react';
import { X, Save, RefreshCw } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { Redirect, NotificationFrequency } from '@/types';

export function EditRedirectModal({ 
  redirect, 
  onClose, 
  onUpdated 
}: { 
  redirect: Redirect; 
  onClose: () => void; 
  onUpdated: () => void;
}) {
  const [targetUrl, setTargetUrl] = useState(redirect.target_url);
  const [notificationEmail, setNotificationEmail] = useState(redirect.notification_email || '');
  const [frequency, setFrequency] = useState<NotificationFrequency>(redirect.notification_frequency);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('redirects')
        .update({
          target_url: targetUrl,
          notification_email: notificationEmail || null,
          notification_frequency: frequency,
          updated_at: new Date().toISOString(),
        })
        .eq('id', redirect.id);

      if (error) throw error;
      onUpdated();
      onClose();
    } catch (err: any) {
      alert(`更新に失敗しました: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-lg font-bold">URL設定の編集</h3>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleUpdate} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-500">スラッグ（変更不可）</label>
            <input
              type="text"
              disabled
              className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 opacity-50 cursor-not-allowed"
              value={redirect.slug}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">転送先URL</label>
            <input
              type="url"
              required
              className="w-full p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">通知用メールアドレス</label>
              <input
                type="email"
                className="w-full p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                value={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">通知頻度</label>
              <select
                className="w-full p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as NotificationFrequency)}
              >
                <option value="none">送らない</option>
                <option value="daily_6am">翌朝6時 (集計通知)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              変更を保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
