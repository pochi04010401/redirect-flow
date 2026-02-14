'use client';

import { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Calendar, 
  Zap, 
  Loader2, 
  ChevronDown, 
  FileText, 
  Check
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { formatDate } from '@/lib/team-flow-utils';
import type { Member, TaskFormData } from '@/types';
import { toast } from 'sonner';

export function TaskForm({ members, onCreated }: { members: Member[], onCreated: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TaskFormData & { amountStr: string }>({
    title: '',
    amount: 0,
    amountStr: '',
    points: 0,
    member_id: members[0]?.id || '',
    start_date: formatDate(new Date()),
    end_date: formatDate(new Date()),
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return toast.error('案件名を入力してください');
    
    const numericAmount = formData.amountStr === '' ? 0 : Number(formData.amountStr);
    if (numericAmount < 0) return toast.error('売上にマイナスの数値は入力できません');

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
        .insert([{
          title: formData.title,
          amount: numericAmount * 1000,
          points: formData.points,
          member_id: formData.member_id,
          start_date: formData.start_date,
          end_date: formData.end_date,
          scheduled_date: formData.start_date,
          notes: formData.notes,
          status: 'pending'
        }]);

      if (error) throw error;
      toast.success('タスクを登録しました！');
      onCreated();
      // Reset form
      setFormData(prev => ({
        ...prev,
        title: '',
        amountStr: '',
        notes: ''
      }));
    } catch (err: any) {
      console.error('Registration error:', err);
      toast.error('登録に失敗しました: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20 text-white">
          <PlusCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-black uppercase">New Task</h3>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Add work to the stream</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Title</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Project name or client"
            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-6 py-4 text-zinc-900 dark:text-zinc-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-4 gap-2">
          {members.map((member) => {
            const isSelected = formData.member_id === member.id;
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => setFormData({ ...formData, member_id: member.id })}
                className={`group flex flex-col items-center gap-2 p-2 rounded-xl border transition-all ${
                  isSelected ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30' : 'border-zinc-100 dark:border-zinc-800 bg-transparent'
                }`}
              >
                <div className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-700 shadow-sm" style={{ backgroundColor: member.color }} />
                <span className={`text-[8px] font-bold truncate w-full text-center ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400'}`}>{member.name}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Revenue (kJPY)</label>
            <input
              type="number"
              value={formData.amountStr}
              onChange={(e) => setFormData({ ...formData, amountStr: e.target.value })}
              placeholder="0"
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-6 py-4 text-zinc-900 dark:text-zinc-100 font-black focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Points</label>
            <select
              value={formData.points}
              onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-6 py-4 text-zinc-900 dark:text-zinc-100 font-black focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
            >
              {[0, 10, 20, 30, 40, 50].map((pt) => <option key={pt} value={pt}>{pt} pt</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Start Date</label>
            <input
              type="date"
              required
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value, end_date: e.target.value > formData.end_date ? e.target.value : formData.end_date })}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">End Date</label>
            <input
              type="date"
              required
              value={formData.end_date}
              min={formData.start_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><span>CREATE TASK</span><PlusCircle className="w-5 h-5" /></>}
        </button>
      </form>
    </div>
  );
}
