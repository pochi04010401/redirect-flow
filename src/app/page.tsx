'use client';

import { useState, Suspense } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { CreateRedirectForm } from '@/components/CreateRedirectForm';
import { RedirectList } from '@/components/RedirectList';
import { TaskDashboard } from '@/components/team-flow/TaskDashboard';
import { TaskList } from '@/components/team-flow/TaskList';
import { TaskForm } from '@/components/team-flow/TaskForm';
import { RefreshCw } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import useSWR from 'swr';
import { Toaster } from 'sonner';
import { useSearchParams, useRouter } from 'next/navigation';

const membersFetcher = async () => {
  const supabase = createClient();
  const { data } = await supabase.from('members').select('*').order('name');
  return data || [];
};

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeView = searchParams.get('view') || 'redirects';
  
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: members } = useSWR('members-list', membersFetcher);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey(prev => prev + 1);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const setView = (view: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', view);
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex font-sans">
      <Toaster position="top-center" richColors />
      <Sidebar activeView={activeView} onViewChange={setView} />
      
      <div className="flex-1 lg:ml-64 transition-all duration-300 min-h-screen flex flex-col">
        <header className="p-6 lg:p-8 pb-0 flex items-center justify-between">
          <div>
            <h2 className="text-2xl lg:text-3xl font-black tracking-tight uppercase">
              {activeView === 'redirects' ? 'Redirects' : 
               activeView === 'tasks' ? 'Dashboard' : 
               activeView === 'list' ? 'Task List' : 
               activeView === 'input' ? 'New Task' : 'Settings'}
            </h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1">
              FlowHub Management System
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-500 disabled:text-zinc-400 transition-all bg-indigo-50 dark:bg-indigo-950/30 px-4 py-2 rounded-xl"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>
            <div className="hidden sm:block text-xs font-mono text-zinc-400">v2.1.0</div>
          </div>
        </header>

        <main className="p-6 lg:p-8 space-y-12 flex-1">
          {activeView === 'redirects' && (
            <div key={refreshKey} className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section className="max-w-2xl">
                <CreateRedirectForm onCreated={handleRefresh} />
              </section>
              <section>
                <RedirectList />
              </section>
            </div>
          )}

          {activeView === 'tasks' && (
            <section key={refreshKey} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <TaskDashboard />
            </section>
          )}

          {activeView === 'list' && (
            <section key={refreshKey} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <TaskList />
            </section>
          )}

          {activeView === 'input' && (
            <section className="max-w-lg mx-auto animate-in fade-in zoom-in-95 duration-500">
              {members && (
                <TaskForm 
                  members={members} 
                  onCreated={() => {
                    handleRefresh();
                    setView('tasks');
                  }} 
                />
              )}
            </section>
          )}
          
          {activeView === 'settings' && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-lg font-bold mb-4 uppercase tracking-wider">System Configuration</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl flex items-center justify-between">
                    <span className="text-sm font-bold">Theme Mode</span>
                    <span className="text-xs text-zinc-500">Auto (System)</span>
                  </div>
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl flex items-center justify-between">
                    <span className="text-sm font-bold">Database Instance</span>
                    <span className="text-xs text-indigo-500 font-mono">Supabase-CQFE</span>
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>

        <footer className="p-8 border-t border-zinc-200 dark:border-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-widest flex justify-between">
          <span>&copy; 2026 FlowHub Unified</span>
          <span>Optimized for PC & Mobile</span>
        </footer>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading Hub...</div>}>
      <HomeContent />
    </Suspense>
  );
}
