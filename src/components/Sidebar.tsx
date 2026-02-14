'use client';

import { 
  ArrowRightLeft, 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  X,
  PlusCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const menuItems = [
    { id: 'redirects', label: 'Redirects', icon: ArrowRightLeft },
    { id: 'tasks', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'list', label: 'Task List', icon: ChevronRight },
    { id: 'input', label: 'New Task', icon: PlusCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleMobileMenu = () => setIsMobileOpen(!isMobileOpen);

  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        onClick={toggleMobileMenu}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-indigo-600 text-white rounded-lg shadow-lg"
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed top-0 left-0 h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 z-40
          ${isCollapsed ? 'w-20' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full p-4">
          {/* Logo */}
          <div className={`flex items-center gap-3 mb-10 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="p-2 bg-indigo-600 rounded-xl flex-shrink-0">
              <ArrowRightLeft className="w-6 h-6 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-lg font-black tracking-tighter uppercase italic">FlowHub</h1>
                <p className="text-[8px] text-zinc-500 font-black uppercase">Integrated Control</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    setIsMobileOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-xl transition-all
                    ${isActive 
                      ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold' 
                      : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100'}
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
            <button
              onClick={toggleSidebar}
              className={`hidden lg:flex w-full items-center gap-3 p-3 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
            >
              {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <><ChevronLeft className="w-5 h-5" /> <span>Collapse</span></>}
            </button>
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 p-3 text-zinc-400 hover:text-red-500 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
            >
              <LogOut className="w-5 h-5" />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div 
          onClick={toggleMobileMenu}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
        />
      )}
    </>
  );
}
