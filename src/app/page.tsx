'use client';

import { useState, useEffect } from 'react';
import { CreateRedirectForm } from '@/components/CreateRedirectForm';
import { RedirectList } from '@/components/RedirectList';
import { Ghost, ArrowRightLeft, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-8">
      <header className="max-w-6xl mx-auto mb-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20">
            <ArrowRightLeft className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic">RedirectFlow</h1>
            <p className="text-xs text-zinc-500 font-bold flex items-center gap-1">
              <Ghost className="w-3 h-3" /> Powered by nono (JK Ghost)
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
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
