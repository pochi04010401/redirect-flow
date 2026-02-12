'use client';

import { useState } from 'react';
import { CreateRedirectForm } from '@/components/CreateRedirectForm';
import { RedirectList } from '@/components/RedirectList';
import { ArrowRightLeft, LogOut, RefreshCw } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey(prev => prev + 1);
    // 視覚的なフィードバックのために少し待つ
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-8 font-sans">
      <header className="max-w-6xl mx-auto mb-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20">
            <ArrowRightLeft className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic">RedirectFlow</h1>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">
              URL Management & Tracking
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-500 disabled:text-zinc-400 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /> 更新
          </button>
          <div className="text-xs font-mono text-zinc-400">
            v1.1.0
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-4 h-4" /> ログアウト
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-12">
        {/* 発行フォーム */}
        <section className="max-w-2xl">
          <CreateRedirectForm onCreated={handleRefresh} />
        </section>

        {/* 一覧リスト */}
        <section>
          <RedirectList key={refreshKey} />
        </section>
      </main>

      <footer className="max-w-6xl mx-auto mt-20 pt-8 border-t border-zinc-200 dark:border-zinc-800 text-center text-zinc-400 text-sm">
        &copy; 2026 RedirectFlow &bull; Optimized for PC
      </footer>
    </div>
  );
}
