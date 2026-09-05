import React from 'react';
import { Search, Bell, Moon, Sun, Settings, CalendarClock, ShieldCheck, LogOut } from 'lucide-react';
import { UserSettings } from '../types';

interface HeaderProps {
  settings: UserSettings;
  unreadCount: number;
  indebtedCount: number;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenReminders: () => void;
  onOpenSettings?: () => void;
  onToggleTheme: () => void;
  onLockApp?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  unreadCount,
  indebtedCount,
  onOpenSearch,
  onOpenNotifications,
  onOpenReminders,
  onOpenSettings,
  onToggleTheme,
  onLockApp,
  onLogout,
}) => {
  const displayName = settings.ownerName?.trim() || settings.shopName || 'صديقنا';
  const initialLetter = displayName.charAt(0) || 'م';

  return (
    <header
      id="app-top-header"
      className="sticky top-0 z-30 bg-[#f5f3ff]/90 dark:bg-[#0f0c1d]/90 backdrop-blur-md border-b border-violet-100 dark:border-violet-950/50 transition-colors no-print px-4 py-3"
    >
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* User Greeting & Shop Info */}
        <div className="flex items-center gap-2.5">
          <div
            onClick={onOpenSettings}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-md shadow-violet-500/20 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
            title="الملف الشخصي والإعدادات"
          >
            {initialLetter}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">مرحباً،</span>
              <h1 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                {displayName}!
              </h1>
            </div>
            <p className="text-[11px] font-semibold text-violet-600 dark:text-violet-400">
              {settings.shopName || 'حساباتي'}
            </p>
          </div>
        </div>

        {/* Action icons (Search, Reminders, Bell, Theme, Settings) */}
        <div className="flex items-center gap-1.5">
          {/* Quick Search */}
          <button
            id="header-search-btn"
            onClick={onOpenSearch}
            aria-label="بحث سريع"
            className="w-8.5 h-8.5 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Monthly Reminders */}
          <button
            id="header-reminders-btn"
            onClick={onOpenReminders}
            aria-label="التذكيرات"
            title="التذكيرات الذكية"
            className="w-8.5 h-8.5 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors relative shadow-xs"
          >
            <CalendarClock className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            {indebtedCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                {indebtedCount}
              </span>
            )}
          </button>

          {/* Notifications */}
          <button
            id="header-notifications-btn"
            onClick={onOpenNotifications}
            aria-label="الإشعارات"
            className="w-8.5 h-8.5 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors relative shadow-xs"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-violet-600 text-white text-[9px] font-bold flex items-center justify-center leading-none animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dark / Light Toggle */}
          <button
            id="header-theme-toggle-btn"
            onClick={onToggleTheme}
            aria-label="تبديل المظهر"
            className="w-8.5 h-8.5 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-xs"
          >
            {settings.darkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Settings Gear Icon (From Reference Image) */}
          {onOpenSettings && (
            <button
              id="header-settings-gear-btn"
              onClick={onOpenSettings}
              aria-label="الإعدادات"
              title="الإعدادات"
              className="w-8.5 h-8.5 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {/* App Lock if configured */}
          {settings.appLockEnabled && onLockApp && (
            <button
              id="header-lock-btn"
              onClick={onLockApp}
              title="قفل التطبيق وحماية الخصوصية"
              className="w-8.5 h-8.5 rounded-full flex items-center justify-center text-violet-600 dark:text-violet-400 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-xs"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>
          )}

          {/* Logout / Lock Session Button */}
          {onLogout && (
            <button
              id="header-logout-btn"
              onClick={onLogout}
              title="تسجيل الخروج وقفل الحساب"
              className="w-8.5 h-8.5 rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shadow-xs"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

