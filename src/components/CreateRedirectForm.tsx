'use client';

import { useState } from 'react';
import { Plus, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { generateSlug } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import { NotificationFrequency } from '@/types';

export function CreateRedirectForm({ onCreated }: { onCreated: () => void }) {
  const supabase = createClient();
  const [targetUrl, setTargetUrl] = useState('');
  const [notificationEmail, setNotificationEmail] = useState('');
  const [frequency, setFrequency] = useState<NotificationFrequency>('none');
  const [loading, setLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<{ message: string, code?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorInfo(null);

    try {
      const slug = generateSlug(12);
      const { error } = await supabase.from('redirects').insert({
        slug,
        target_url: targetUrl,
        notification_email: notificationEmail || null,
        notification_frequency: frequency,
      });

      if (error) {
        setErrorInfo({ 
          message: error.message, 
          code: error.code || `STATUS_${error.status}` 
        });
        return;
      }

      setTargetUrl('');
      setNotificationEmail('');
      setFrequency('none');
      onCreated();
    } catch (err: any) {
      console.error(err);
      setErrorInfo({ 
        message: err.message || '予期せぬエラーが発生しました',
        code: err.code || 'UNKNOWN_EXCEPTION'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl shadow-sm">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-zinc-900 dark:text-white">
        <Plus className="w-5 h-5 text-indigo-500" /> 新規URL発行
      </h2>

      {errorInfo && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex flex-col gap-1 text-sm text-red-600">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="font-bold">作成に失敗しました: {errorInfo.message}</span>
          </div>
          {errorInfo.code && (
            <div className="ml-7 mt-1 px-2 py-0.5 bg-red-100 rounded text-[10px] font-mono w-fit">
              Error Code: {errorInfo.code}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">転送先URL</label>
          <input
            type="url"
            required
            className="w-full p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="https://example.com"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">通知用メールアドレス</label>
            <input
              type="email"
              className="w-full p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="mike@example.com"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">通知頻度</label>
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

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          URLを発行する
        </button>
      </form>
    </div>
  );
}
