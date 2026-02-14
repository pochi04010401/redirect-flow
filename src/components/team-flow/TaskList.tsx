'use client';

import { useState, useEffect, useMemo } from 'react';
import { Clock, Loader2, Check, Edit2, CheckCircle2, CheckCircle, Search, Filter, Zap, Calendar } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { formatDate, formatCurrency, fireConfetti } from '@/lib/team-flow-utils';
import type { Task, Member, TaskStatus } from '@/types';
import { TaskEditModal } from './TaskEditModal';
import { MemberFilter } from './MemberFilter';
import { toast } from 'sonner';

function StatusFilter({ status, onSelect }: { status: TaskStatus | 'all', onSelect: (s: any) => void }) {
  return (
    <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
      {['pending', 'completed', 'all'].map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
            status === s ? 'bg-white dark:bg-zinc-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 hover:text-zinc-900'
          }`}
        >
          {s === 'pending' ? 'Active' : s === 'completed' ? 'Done' : 'All'}
        </button>
      ))}
    </div>
  );
}

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingTask, setUpdatingTask] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const [{ data: mData }, { data: tData }] = await Promise.all([
        supabase.from('members').select('*').order('name'),
        supabase.from('tasks').select('*, member:members(*)').neq('status', 'deleted').order('end_date', { ascending: true })
      ]);
      if (mData) setMembers(mData);
      if (tData) setTasks(tData);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchMember = !selectedMemberId || t.member_id === selectedMemberId;
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchSearch = !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchMember && matchStatus && matchSearch;
    });
  }, [tasks, selectedMemberId, statusFilter, searchQuery]);

  const handleToggleStatus = async (task: Task) => {
    if (updatingTask === task.id) return;
    setUpdatingTask(task.id);
    const newStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      const supabase = createClient();
      const { error } = await supabase.from('tasks').update({ 
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null
      }).eq('id', task.id);
      if (error) throw error;
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
      if (newStatus === 'completed') {
        fireConfetti();
        toast.success('Task marked as completed!');
      }
    } catch (err) {
      toast.error('Update failed');
    } finally {
      setUpdatingTask(null);
    }
  };

  if (loading) return <div className="py-20 text-center text-zinc-500 italic">Syncing Task List...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-4 justify-between bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <MemberFilter members={members} selectedMemberId={selectedMemberId} onSelect={setSelectedMemberId} />
        </div>
        <StatusFilter status={statusFilter} onSelect={setStatusFilter} />
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filteredTasks.map(task => {
          const isCompleted = task.status === 'completed';
          const isCancelled = task.status === 'cancelled';
          const overdue = !isCompleted && !isCancelled && task.end_date < formatDate(new Date());

          return (
            <div 
              key={task.id}
              onClick={() => setEditingTask(task)}
              className={`
                group relative bg-white dark:bg-zinc-900 p-5 rounded-3xl border transition-all cursor-pointer hover:shadow-md
                ${isCompleted ? 'opacity-60 border-zinc-100 dark:border-zinc-800' : 
                  overdue ? 'border-red-200 dark:border-red-900/30 bg-red-50/30 dark:bg-red-950/10' : 
                  'border-zinc-200 dark:border-zinc-800'}
              `}
            >
              <div className="flex items-start gap-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleToggleStatus(task); }}
                  className={`
                    w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all flex-shrink-0
                    ${isCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:border-green-500 hover:text-green-500'}
                  `}
                >
                  {updatingTask === task.id ? <Loader2 className="w-5 h-5 animate-spin" /> : isCompleted ? <Check className="w-6 h-6 stroke-[3]" /> : <CheckCircle2 className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity" />}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-black truncate ${isCompleted ? 'text-zinc-400 line-through' : ''}`}>{task.title}</h3>
                    {overdue && <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[8px] font-black uppercase rounded-full">Overdue</span>}
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs font-bold text-zinc-500">
                    <span className="text-indigo-600 dark:text-indigo-400">{formatCurrency(task.amount)}</span>
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-500" />{task.points}pt</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: task.member?.color }} />
                      <span>{task.member?.name}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    <Calendar className="w-3 h-3" />
                    <span>{task.start_date}</span>
                    <span>→</span>
                    <span>{task.end_date}</span>
                  </div>
                </div>
                
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Edit2 className="w-4 h-4 text-zinc-300" />
                </div>
              </div>
            </div>
          );
        })}
        {filteredTasks.length === 0 && (
          <div className="py-20 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-400 italic">No tasks found matching your criteria.</p>
          </div>
        )}
      </div>

      {editingTask && (
        <TaskEditModal 
          task={editingTask} 
          members={members} 
          onClose={() => setEditingTask(null)} 
          onUpdate={fetchTasks} 
        />
      )}
    </div>
  );
}
