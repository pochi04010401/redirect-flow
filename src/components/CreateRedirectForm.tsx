'use client';

import { useState } from 'react';
import { Plus, RefreshCw, Mail, CheckCircle2 } from 'lucide-react';
import { generateSlug } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { NotificationFrequency } from '@/types';

export function CreateRedirectForm({ onCreated }: { onCreated: () => void }) {
  const [targetUrl, setTargetUrl] = useState('');
  const [notificationEmail, setNotificationEmail] = useState('');
  const [frequency, setFrequency] = useState<NotificationFrequency>('none');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const slug = generateSlug(12);
      const { error } = await supabase.from('redirects').insert({
        slug,
        target_url: targetUrl,
        notification_email: notificationEmail || null,
        notification_frequency: frequency,
      });

      if (error) throw error;

      setTargetUrl('');
      setNotificationEmail('');
      setFrequency('none');
      onCreated();
    } catch (err) {
      console.error(err);
      alert('作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl shadow-sm">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Plus className="w-5 h-5" /> 新規URL発行
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">転送先URL</label>
          <input
            type="url"
            required
            className="w-full p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent"
            placeholder="https://example.com"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">通知用メールアドレス</label>
            <input
              type="email"
              className="w-full p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent"
              placeholder="mike@example.com"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">通知頻度</label>
            <select
              className="w-full p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
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
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          URLを発行する
        </button>
      </form>
    </div>
  );
}
