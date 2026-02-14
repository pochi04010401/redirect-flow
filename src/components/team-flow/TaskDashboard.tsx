'use client';

import { useState, useEffect, useMemo } from 'react';
import { Activity, CheckCircle2, Trophy, Download, Calendar, Crown, Sparkles } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import useSWR from 'swr';
import { 
  formatCurrency, 
  formatNumber, 
  calculatePercentage, 
  getCurrentMonth,
  formatDateJP,
  fireConfetti,
  getNowJST,
  formatDate
} from '@/lib/team-flow-utils';
import type { Task, DashboardSummary, MemberStats, Member, RankingPeriod } from '@/types';
import { MemberFilter } from './MemberFilter';
import { toast } from 'sonner';
import { BusinessColumn } from './BusinessColumn';

const fetcher = async () => {
  const supabase = createClient();
  const currentMonth = getCurrentMonth();
  const now = getNowJST();
  const currentYear = now.getFullYear();

  const startOfMonth = `${currentMonth}-01`;
  const [y, m] = currentMonth.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const endOfMonth = `${currentMonth}-${String(lastDay).padStart(2, '0')}`;

  const [
    { data: goalsData },
    { data: tasks, error: tasksError },
    { data: rawAllTasks },
    { data: yearlyTasks },
    { data: recentTasks },
    { data: membersData }
  ] = await Promise.all([
    supabase.from('monthly_goals').select('*').eq('month', currentMonth),
    supabase.from('tasks').select('*, member:members(*)').in('status', ['pending', 'completed'])
      .or(`start_date.lte.${endOfMonth},scheduled_date.lte.${endOfMonth}`)
      .or(`end_date.gte.${startOfMonth},scheduled_date.gte.${startOfMonth}`),
    supabase.from('tasks').select('*, member:members(*)').neq('status', 'deleted').order('created_at', { ascending: false }),
    supabase.from('tasks').select('*, member:members(*)').gte('completed_at', `${currentYear}-01-01`).lte('completed_at', `${currentYear}-12-31`).eq('status', 'completed'),
    supabase.from('tasks').select('*').in('status', ['pending', 'completed']).order('completed_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false }).limit(5),
    supabase.from('members').select('*').order('created_at')
  ]);
  
  if (tasksError) throw tasksError;

  const goals = goalsData && goalsData.length > 0 ? goalsData[0] : null;
  
  const currentMonthTasks = (tasks || []).filter(t => {
    const start = t.start_date || t.scheduled_date;
    const end = t.end_date || t.scheduled_date;
    if (!start || !end) return false;
    return start <= endOfMonth && end >= startOfMonth;
  });

  const completedTasks = currentMonthTasks.filter(t => t.status === 'completed');
  const pendingTasks = currentMonthTasks.filter(t => t.status === 'pending');
  
  const summary: DashboardSummary = {
    completedAmount: completedTasks.reduce((sum, t) => sum + (t.amount || 0), 0),
    pendingAmount: pendingTasks.reduce((sum, t) => sum + (t.amount || 0), 0),
    completedPoints: completedTasks.reduce((sum, t) => sum + (t.points || 0), 0),
    pendingPoints: pendingTasks.reduce((sum, t) => sum + (t.points || 0), 0),
    targetAmount: goals?.target_amount || 10000000,
    targetPoints: goals?.target_points || 1000,
    recentActivities: recentTasks || [],
    monthlyCompletedCount: completedTasks.length,
  };

  const memberStats: MemberStats[] = (membersData || []).map(member => {
    const mTasks = currentMonthTasks.filter(t => t.member_id === member.id);
    const mCompleted = mTasks.filter(t => t.status === 'completed');
    return { 
      member, 
      totalAmount: mTasks.reduce((s, t) => s + (t.amount || 0), 0), 
      completedAmount: mCompleted.reduce((s, t) => s + (t.amount || 0), 0), 
      totalPoints: mTasks.reduce((s, t) => s + (t.points || 0), 0), 
      completedPoints: mCompleted.reduce((s, t) => s + (t.points || 0), 0), 
      taskCount: mTasks.length, 
      completedTaskCount: mCompleted.length 
    };
  });

  const yearlyMemberStats: MemberStats[] = (membersData || []).map(member => {
    const mTasks = yearlyTasks?.filter(t => t.member_id === member.id) || [];
    return { member, totalAmount: mTasks.reduce((s, t) => s + (t.amount || 0), 0), completedAmount: mTasks.reduce((s, t) => s + (t.amount || 0), 0), totalPoints: mTasks.reduce((s, t) => s + (t.points || 0), 0), completedPoints: mTasks.reduce((s, t) => s + (t.points || 0), 0), taskCount: mTasks.length, completedTaskCount: mTasks.length };
  });

  return {
    summary,
    memberStats,
    yearlyMemberStats,
    members: membersData || [],
    allTasks: rawAllTasks || []
  };
};

function RankingPeriodToggle({ period, onToggle }: { period: RankingPeriod; onToggle: (period: RankingPeriod) => void; }) {
  return (
    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs">
      <button onClick={() => onToggle('monthly')} className={`px-3 py-1 rounded-md transition-all ${period === 'monthly' ? 'bg-white dark:bg-zinc-700 shadow-sm text-indigo-600 dark:text-indigo-400 font-bold' : 'text-zinc-500'}`}>月間</button>
      <button onClick={() => onToggle('yearly')} className={`px-3 py-1 rounded-md transition-all ${period === 'yearly' ? 'bg-white dark:bg-zinc-700 shadow-sm text-indigo-600 dark:text-indigo-400 font-bold' : 'text-zinc-500'}`}>年間</button>
    </div>
  );
}

function Meter({ label, completed, pending, target, formatValue }: { label: string; completed: number; pending: number; target: number; formatValue: (n: number) => string; }) {
  const completedPercent = calculatePercentage(completed, target);
  const pendingPercent = calculatePercentage(completed + pending, target);
  const isGoalReached = completedPercent >= 100;

  useEffect(() => {
    if (isGoalReached) {
      const timer = setTimeout(() => fireConfetti(), 1000);
      return () => clearTimeout(timer);
    }
  }, [isGoalReached, completed]);

  return (
    <div className={`p-6 bg-white dark:bg-zinc-900 rounded-3xl border transition-all ${isGoalReached ? 'border-amber-400 shadow-lg shadow-amber-500/10' : 'border-zinc-200 dark:border-zinc-800'}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-1">
          <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{label} {label === '売上' && '(千円)'}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black">{formatValue(completed)}</span>
            <span className="text-xs text-zinc-500">/ {formatValue(target)}</span>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-3xl font-black leading-none ${isGoalReached ? 'text-amber-500' : 'text-indigo-600 dark:text-indigo-400'}`}>{completedPercent}%</span>
        </div>
      </div>
      <div className="relative h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-4">
        <div className="absolute top-0 left-0 h-full bg-indigo-200 dark:bg-indigo-900/50 transition-all duration-700" style={{ width: `${Math.min(pendingPercent, 100)}%` }} />
        <div className={`absolute top-0 left-0 h-full transition-all duration-1000 ${isGoalReached ? 'bg-gradient-to-r from-amber-400 to-yellow-300' : 'bg-indigo-600'}`} style={{ width: `${Math.min(completedPercent, 100)}%` }} />
      </div>
    </div>
  );
}

export function TaskDashboard() {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [rankingPeriod, setRankingPeriod] = useState<RankingPeriod>('monthly');

  const { data, error, isLoading } = useSWR('dashboard-data', fetcher, {
    revalidateOnFocus: true,
    revalidateIfStale: true
  });

  const filteredSummary = useMemo(() => {
    if (!data?.summary || !selectedMemberId) return data?.summary;
    const stat = data.memberStats.find(s => s.member.id === selectedMemberId);
    if (!stat) return data.summary;
    return { 
      ...data.summary, 
      completedAmount: stat.completedAmount, 
      pendingAmount: stat.totalAmount - stat.completedAmount, 
      completedPoints: stat.completedPoints, 
      pendingPoints: stat.totalPoints - stat.completedPoints, 
      recentActivities: data.summary.recentActivities.filter(t => t.member_id === selectedMemberId), 
      monthlyCompletedCount: stat.completedTaskCount 
    };
  }, [data, selectedMemberId]);

  if (isLoading) return <div className="p-8 text-center animate-pulse text-zinc-500 italic text-sm">Loading Team Stats...</div>;
  if (error) return <div className="p-8 text-center text-red-500 bg-red-50 rounded-2xl border border-red-100">Failed to load data.</div>;
  if (!data || !filteredSummary) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <MemberFilter members={data.members} selectedMemberId={selectedMemberId} onSelect={setSelectedMemberId} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Meter label="売上" completed={filteredSummary.completedAmount} pending={filteredSummary.pendingAmount} target={filteredSummary.targetAmount} formatValue={formatCurrency} />
        <Meter label="ポイント" completed={filteredSummary.completedPoints} pending={filteredSummary.pendingPoints} target={filteredSummary.targetPoints} formatValue={(n) => `${formatNumber(n)}pt`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" /> 売上ランキング</h3>
            <RankingPeriodToggle period={rankingPeriod} onToggle={setRankingPeriod} />
          </div>
          <div className="space-y-3">
            {(rankingPeriod === 'monthly' ? data.memberStats : data.yearlyMemberStats).sort((a,b) => b.completedAmount - a.completedAmount).slice(0,5).map((s, i) => (
              <div key={s.member.id} className="flex items-center gap-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                <span className="w-6 text-center font-black text-zinc-400">{i+1}</span>
                <div className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-700 shadow-sm" style={{ backgroundColor: s.member.color }} />
                <span className="flex-1 font-bold text-sm">{s.member.name}</span>
                <span className="font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(s.completedAmount)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <h3 className="font-bold flex items-center gap-2 mb-6"><Activity className="w-5 h-5 text-indigo-500" /> 最新アクティビティ</h3>
          <div className="space-y-3">
            {filteredSummary.recentActivities.map((t) => (
              <div key={t.id} className="flex items-center gap-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                <CheckCircle2 className={`w-5 h-5 ${t.status === 'completed' ? 'text-green-500' : 'text-zinc-300'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{t.title}</p>
                  <p className="text-[10px] text-zinc-500 uppercase">{t.completed_at ? formatDateJP(t.completed_at) : 'In Progress'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black">{formatCurrency(t.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
        <BusinessColumn />
      </div>
    </div>
  );
}
