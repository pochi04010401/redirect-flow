'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Ghost, LogIn, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const router = useRouter();

  // 既にログインしているかチェック
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push('/');
      }
    };
    checkUser();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMsg({ type: 'error', text: `ログイン失敗: ${error.message}` });
        console.error('Login error:', error);
      } else if (data.user) {
        setMsg({ type: 'success', text: 'ログイン成功！リダイレクト中...' });
        // クッキーを確実に反映させてから移動
        router.refresh();
        router.push('/');
      } else {
        setMsg({ type: 'error', text: 'ユーザー情報が取得できませんでした' });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      setMsg({ type: 'error', text: `例外が発生しました: ${errorMessage}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col items-center mb-8">
          <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg mb-4">
            <Ghost className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight uppercase text-zinc-900 dark:text-white">RedirectFlow</h1>
          <p className="text-sm text-zinc-500 font-bold italic">Admin Login</p>
        </div>

        {msg && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm ${
            msg.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'
          }`}>
            {msg.type === 'error' ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />}
            {msg.text}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">Email</label>
            <input
              type="email"
              required
              className="w-full p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">Password</label>
            <input
              type="password"
              required
              className="w-full p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            Login
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
          <p className="text-xs text-zinc-400">
            ログインできない場合は、Vercelの環境変数が正しいか、<br />
            Supabaseでユーザーを作成済みか確認してね。👻
          </p>
        </div>
      </div>
    </div>
  );
}
