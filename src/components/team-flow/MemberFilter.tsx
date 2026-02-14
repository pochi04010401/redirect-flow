'use client';

import { useState } from 'react';
import { Users, ChevronDown } from 'lucide-react';
import type { Member } from '@/types';

export function MemberFilter({
  members,
  selectedMemberId,
  onSelect
}: {
  members: Member[];
  selectedMemberId: string | null;
  onSelect: (memberId: string | null) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedMember = members.find(m => m.id === selectedMemberId);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
      >
        {selectedMember ? (
          <>
            <div 
              className="w-5 h-5 rounded-full"
              style={{ backgroundColor: selectedMember.color }}
            />
            <span className="text-sm font-bold">{selectedMember.name}</span>
          </>
        ) : (
          <>
            <Users className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-bold">全員</span>
          </>
        )}
        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 z-50 overflow-hidden">
            <button
              onClick={() => {
                onSelect(null);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${
                !selectedMemberId ? 'bg-indigo-50 dark:bg-indigo-950/30' : ''
              }`}
            >
              <Users className="w-5 h-5 text-zinc-400" />
              <span className="text-sm font-bold">全員</span>
            </button>
            {members.map(member => (
              <button
                key={member.id}
                onClick={() => {
                  onSelect(member.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${
                  selectedMemberId === member.id ? 'bg-indigo-50 dark:bg-indigo-950/30' : ''
                }`}
              >
                <div 
                  className="w-5 h-5 rounded-full"
                  style={{ backgroundColor: member.color }}
                />
                <span className="text-sm font-bold">{member.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
