import React from 'react';
import {
  LayoutDashboard,
  Users,
  Receipt,
  BarChart3,
  Settings,
  Plus,
  Calendar,
} from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  onOpenQuickAction: () => void;
  unreadNotifsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  onOpenQuickAction,
}) => {
  const leftNavItems: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
    { id: 'customers', label: 'العملاء', icon: Users },
    { id: 'subscriptions', label: 'الاشتراكات', icon: Calendar },
  ];

  const rightNavItems: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'debts', label: 'الديون', icon: Receipt },
    { id: 'reports', label: 'التقارير', icon: BarChart3 },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  return (
    <div
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#120e24]/95 backdrop-blur-md border-t border-violet-100 dark:border-violet-950/60 shadow-[0_-4px_25px_rgba(109,40,217,0.06)] transition-colors no-print"
    >
      <div className="max-w-md mx-auto px-2 py-1.5 flex items-center justify-between relative">
        {/* Left Items */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {leftNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                onClick={() => onChangeTab(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-2 sm:px-2.5 rounded-2xl transition-all ${
                  isActive
                    ? 'text-violet-600 dark:text-violet-400 font-bold'
                    : 'text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-4.5 h-4.5 sm:w-5 sm:h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                </div>
                <span className="text-[9.5px] sm:text-[10px] mt-0.5 tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Floating Action Button (Middle) */}
        <div className="relative -top-5 mx-0.5">
          <button
            id="fab-quick-action-btn"
            onClick={onOpenQuickAction}
            aria-label="إضافة سريعة"
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/35 hover:shadow-violet-500/50 active:scale-95 transition-all flex items-center justify-center border-4 border-[#f5f3ff] dark:border-[#0f0c1d]"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Right Items */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {rightNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                onClick={() => onChangeTab(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-2 sm:px-2.5 rounded-2xl transition-all ${
                  isActive
                    ? 'text-violet-600 dark:text-violet-400 font-bold'
                    : 'text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-4.5 h-4.5 sm:w-5 sm:h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                </div>
                <span className="text-[9.5px] sm:text-[10px] mt-0.5 tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};


