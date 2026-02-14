'use client';

import { useState } from 'react';
import { 
  X, 
  Trash2, 
  Save, 
  Loader2, 
  Zap, 
  Check, 
  ArrowRight,
  Layout
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { getContrastColor } from '@/lib/team-flow-utils';
import type { Member, Task } from '@/types';
import { toast } from 'sonner';

export function TaskEditModal({ 
  task, 
  members, 
  onClose, 
  onUpdate 
}: { 
  task: Task; 
  members: Member[]; 
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: task.title,
    amount: task.amount / 1000,
    points: task.points,
    member_id: task.member_id,
    start_date: task.start_date,
    end_date: task.end_date,
    status: task.status,
    notes: task.notes || ''
  });

  const handleUpdate = async () => {
    if (formData.amount < 0) return toast.error('売上にマイナスの数値は入力できません');

    setLoading(true);
    try {
      const supabase = createClient();
      if (formData.end_date < formData.start_date) {
        toast.error('終了日は開始日以降の日付にしてください');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('tasks')
        .update({
          ...formData,
          amount: formData.amount * 1000,
          scheduled_date: formData.start_date,
          completed_at: formData.status === 'completed' ? (task.completed_at || new Date().toISOString()) : null
        })
        .eq('id', task.id);

      if (error) throw error;
      toast.success('更新しました');
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Update error:', err);
      toast.error('更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('本当にこのタスクを削除しますか？')) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('tasks').update({ status: 'deleted' }).eq('id', task.id);
      if (error) throw error;
      toast.success('タスクを削除しました');
      onUpdate();
      onClose();
    } catch (err) {
      toast.error('削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600">
              <Layout className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black uppercase">Edit Task</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <X className="w-6 h-6 text-zinc-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Title</label>
              <input className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-5 py-4 text-zinc-900 dark:text-zinc-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
              {(['pending', 'completed'] as const).map(s => (
                <button key={s} type="button" onClick={() => setFormData({...formData, status: s})} className={`flex-1 py-3 text-xs font-black rounded-lg transition-all ${formData.status === s ? 'bg-white dark:bg-zinc-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-zinc-500'}`}>{s === 'pending' ? 'Active' : 'Done'}</button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Assignee</label>
            <div className="grid grid-cols-4 gap-2">
              {members.map((member) => {
                const isSelected = formData.member_id === member.id;
                return (
                  <button key={member.id} type="button" onClick={() => setFormData({ ...formData, member_id: member.id })} className={`flex flex-col items-center gap-2 p-2 rounded-2xl border transition-all ${isSelected ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30' : 'border-zinc-100 dark:border-zinc-800 bg-transparent'}`}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: member.color }}>{isSelected && <Check className="w-4 h-4" style={{ color: getContrastColor(member.color) }} />}</div>
                    <span className={`text-[9px] font-bold truncate w-full text-center ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500'}`}>{member.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Revenue (kJPY)</label>
              <input type="number" className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-5 py-4 text-zinc-900 dark:text-zinc-100 font-black focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Points</label>
              <select value={formData.points} onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-5 py-4 text-zinc-900 dark:text-zinc-100 font-black focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-all">
                {[0, 10, 20, 30, 40, 50].map((pt) => <option key={pt} value={pt}>{pt} pt</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Start Date</label>
              <input type="date" className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-4 text-zinc-900 dark:text-zinc-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">End Date</label>
              <input type="date" className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-4 text-zinc-900 dark:text-zinc-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
            </div>
          </div>

          <div className="space-y-1 pb-4">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Notes</label>
            <textarea className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-5 py-4 min-h-[100px] text-zinc-900 dark:text-zinc-100 font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Additional details..." />
          </div>
        </div>

        <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex gap-3">
          <button type="button" disabled={loading} onClick={handleDelete} className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 text-red-600 hover:bg-red-100 transition-all disabled:opacity-50">{loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Trash2 className="w-6 h-6" />}</button>
          <button type="button" disabled={loading} onClick={handleUpdate} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-3 disabled:opacity-50">{loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-6 h-6" /> <span>SAVE CHANGES</span></>}</button>
        </div>
      </div>
    </div>
  );
}
