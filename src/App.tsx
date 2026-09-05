import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  ArrowDownLeft,
  UserPlus,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Calendar,
} from 'lucide-react';
import {
  TabType,
  CustomerWithStats,
  Debt,
  Payment,
  AppNotification,
  UserSettings,
  OverviewStats,
  ActivityItem,
  MonthlyChartPoint,
  PaymentMethod,
  Subscription,
} from './types';
import { db } from './services/db';

// UI Components
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { CustomersView } from './components/CustomersView';
import { DebtsView } from './components/DebtsView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { SubscriptionsView } from './components/subscriptions/SubscriptionsView';
import { ErrorBoundary } from './components/ErrorBoundary';

// Modals & Sheets
import { CustomerDetailModal } from './components/CustomerDetailModal';
import { AddCustomerModal } from './components/AddCustomerModal';
import { AddDebtModal } from './components/AddDebtModal';
import { RecordPaymentModal } from './components/RecordPaymentModal';
import { MonthlyRemindersModal } from './components/MonthlyRemindersModal';
import { NotificationsModal } from './components/NotificationsModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { PrintStatementModal } from './components/PrintStatementModal';
import { AppLock } from './components/AppLock';
import { LoginModal } from './components/LoginModal';

export default function App() {
  // DB State
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [settings, setSettings] = useState<UserSettings>(db.getSettings());
  const [overviewStats, setOverviewStats] = useState<OverviewStats>(db.getOverviewStats());
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [monthlyChart, setMonthlyChart] = useState<MonthlyChartPoint[]>([]);

  // Navigation & View State
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Modals & Dialogs State
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerWithStats | null>(null);
  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);
  const [debtTargetCustomerId, setDebtTargetCustomerId] = useState<string | undefined>(undefined);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [paymentTargetCustomerId, setPaymentTargetCustomerId] = useState<string | undefined>(undefined);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isMonthlyRemindersOpen, setIsMonthlyRemindersOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [printingCustomer, setPrintingCustomer] = useState<CustomerWithStats | null>(null);

  // Security, App Lock & Privacy Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const authSession =
        localStorage.getItem('hisabati_auth_active') ||
        sessionStorage.getItem('hisabati_auth_active');
      const s = db.getSettings();
      // If user hasn't completed first-time setup, always require LoginModal
      if (!s.hasCompletedFirstLogin) {
        return false;
      }
      if (s.appLockEnabled) {
        return authSession === 'true';
      }
      return authSession === 'true' || s.isLoggedIn === true;
    } catch {
      return false;
    }
  });

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const s = db.getSettings();
    return Boolean(s.appLockEnabled && s.pinCode);
  });

  // Dark Mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const s = db.getSettings();
    return s.darkMode || false;
  });

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  }, []);

  // Reload all data from db engine
  const refreshData = useCallback(() => {
    const custs = db.getCustomersWithStats();
    const d = db.getDebts();
    const p = db.getPayments();
    const subs = db.getSubscriptions();
    const notifs = db.getNotifications();
    const s = db.getSettings();
    const stats = db.getOverviewStats();
    const acts = db.getRecentActivities(15);
    const chart = db.getMonthlyChartData();

    setCustomers(custs);
    setDebts(d);
    setPayments(p);
    setSubscriptions(subs);
    setNotifications(notifs);
    setSettings(s);
    setOverviewStats(stats);
    setRecentActivities(acts);
    setMonthlyChart(chart);
  }, []);

  // Initial load & subscribe to db changes
  useEffect(() => {
    refreshData();
    const unsubscribe = db.subscribe(refreshData);
    return () => unsubscribe();
  }, [refreshData]);

  // Sync dark mode class on HTML element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleToggleTheme = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    db.updateSettings({ darkMode: nextMode });
  };

  // Currently selected customer object & statement
  const currentCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  const currentCustomerStatement = useMemo(() => {
    if (!selectedCustomerId) return [];
    return db.getCustomerStatement(selectedCustomerId);
  }, [selectedCustomerId, debts, payments]);

  // Actions
  const handleAddOrUpdateCustomer = (data: {
    name: string;
    phone: string;
    whatsapp?: string;
    address?: string;
    notes?: string;
  }) => {
    if (editingCustomer) {
      const res = db.updateCustomer(editingCustomer.id, data);
      if (res.success) {
        showToast(`تم تحديث بيانات العميل ${data.name}`);
        setEditingCustomer(null);
        return { success: true };
      }
      return { success: false, error: res.error };
    } else {
      const res = db.addCustomer(data);
      if (res.success) {
        showToast(`تم إضافة العميل ${data.name} بنجاح`);
        return { success: true };
      }
      return { success: false, error: res.error };
    }
  };

  const handleDeleteCustomer = (customerId: string) => {
    const cust = customers.find((c) => c.id === customerId);
    db.deleteCustomer(customerId);
    showToast(`تم حذف حساب العميل ${cust ? cust.name : ''} بنجاح`);
    if (selectedCustomerId === customerId) {
      setSelectedCustomerId(null);
    }
  };

  const handleAddDebt = (data: {
    customerId: string;
    amount: number;
    description: string;
    debtDate?: string;
    dueDate?: string;
    notes?: string;
  }) => {
    const res = db.addDebt(data);
    if (res.success) {
      const cust = customers.find((c) => c.id === data.customerId);
      showToast(`تم تسجيل دين بمبلغ ${data.amount.toLocaleString()} ${settings.currency} على ${cust?.name}`);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const handleDeleteDebt = (debtId: string) => {
    db.deleteDebt(debtId);
    showToast('تم حذف سجل الدين بنجاح');
  };

  const handleRecordPayment = (data: {
    customerId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDate?: string;
    notes?: string;
  }) => {
    const res = db.addPayment(data);
    if (res.success) {
      const cust = customers.find((c) => c.id === data.customerId);
      showToast(`تم تسجيل سداد بمبلغ ${data.amount.toLocaleString()} ${settings.currency}`);
      return { success: true, isFullySettled: res.isFullySettled };
    }
    return { success: false, error: res.error };
  };

  const handleDeleteTransaction = (type: 'debt' | 'payment', id: string) => {
    if (type === 'debt') {
      db.deleteDebt(id);
      showToast('تم حذف سجل الدين بنجاح');
    } else {
      db.deletePayment(id);
      showToast('تم حذف سجل السداد بنجاح');
    }
  };

  const handleUpdateSettings = (newSettings: Partial<UserSettings>) => {
    db.updateSettings(newSettings);
    showToast('تم حفظ الإعدادات بنجاح');
  };

  const handleExportBackup = () => {
    db.exportBackupJSON();
    showToast('تم تحميل ملف النسخة الاحتياطية بنجاح');
  };

  const handleImportBackup = (jsonString: string) => {
    const ok = db.importBackupJSON(jsonString);
    if (ok) {
      showToast('تم استعادة النسخة الاحتياطية بنجاح');
      refreshData();
      return true;
    }
    return false;
  };

  const handleExportCSV = (type: 'customers' | 'debts' | 'payments') => {
    db.exportCSV(type);
    showToast('تم استخراج الملف بنجاح');
  };

  const handleResetDatabase = () => {
    db.resetDatabase();
    refreshData();
    showToast('تم مسح جميع البيانات والبدء من جديد');
  };

  const handleLoginSuccess = (params?: {
    shopName?: string;
    ownerName?: string;
    ownerPhone?: string;
    currency?: string;
    pinCode?: string;
    rememberMe: boolean;
  }) => {
    const updated: Partial<UserSettings> = {
      isLoggedIn: true,
      hasCompletedFirstLogin: true,
    };
    if (params?.shopName) updated.shopName = params.shopName;
    if (params?.ownerName) updated.ownerName = params.ownerName;
    if (params?.ownerPhone !== undefined) updated.ownerPhone = params.ownerPhone;
    if (params?.currency) updated.currency = params.currency;
    if (params?.pinCode) {
      updated.pinCode = params.pinCode;
      updated.appLockEnabled = true;
    }

    const saved = db.updateSettings(updated);
    setSettings(saved);

    if (params?.rememberMe) {
      localStorage.setItem('hisabati_auth_active', 'true');
      sessionStorage.removeItem('hisabati_auth_active');
    } else {
      sessionStorage.setItem('hisabati_auth_active', 'true');
      localStorage.removeItem('hisabati_auth_active');
    }

    setIsAuthenticated(true);
    setIsLocked(false);
    showToast(
      `مرحباً بك يا ${saved.ownerName || 'المدير'}! تم فتح حسابات ${saved.shopName} بنجاح`,
      'success'
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('hisabati_auth_active');
    sessionStorage.removeItem('hisabati_auth_active');
    db.updateSettings({ isLoggedIn: false });
    setIsAuthenticated(false);
    setIsLocked(true);
    showToast('تم تسجيل الخروج وقفل الحساب لحماية خصوصية بياناتك', 'success');
  };

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;
  const indebtedCount = overviewStats.indebtedCustomersCount;

  // Privacy Guard: If user is not authenticated or opening for first time, shield entire financial data
  if (!isAuthenticated) {
    return (
      <div
        id="app-auth-container"
        className="min-h-screen bg-[#ece9fc] dark:bg-[#090714] font-sans antialiased text-slate-900 dark:text-slate-100 flex items-center justify-center p-3 sm:p-4 selection:bg-violet-600 selection:text-white relative"
      >
        <LoginModal
          settings={settings}
          isFirstTime={!settings.hasCompletedFirstLogin}
          onLoginSuccess={handleLoginSuccess}
        />

        {/* Floating Toast Notification */}
        {toast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-60 w-11/12 max-w-sm pointer-events-none animate-bounce">
            <div
              className={`p-3 rounded-2xl shadow-xl backdrop-blur-md flex items-center gap-2.5 text-xs font-bold text-white border ${
                toast.type === 'success'
                  ? 'bg-emerald-600/95 border-emerald-500/50'
                  : 'bg-rose-600/95 border-rose-500/50'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      id="app-root-container"
      className="min-h-screen bg-[#ece9fc] dark:bg-[#090714] font-sans antialiased text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-violet-600 selection:text-white"
    >
      {/* App Lock Overlay */}
      {isLocked && (
        <AppLock
          settings={settings}
          onUnlock={() => setIsLocked(false)}
        />
      )}

      {/* Main App Canvas: Mobile-First Constrained Container */}
      <div className="w-full max-w-md mx-auto min-h-screen bg-[#f7f5ff] dark:bg-[#0f0c1d] border-x border-violet-100 dark:border-violet-950/40 flex flex-col relative shadow-2xl">
        {/* Top Header */}
        <Header
          settings={settings}
          unreadCount={unreadNotifsCount}
          indebtedCount={indebtedCount}
          onOpenSearch={() => setIsGlobalSearchOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenReminders={() => setIsMonthlyRemindersOpen(true)}
          onOpenSettings={() => setActiveTab('settings')}
          onToggleTheme={handleToggleTheme}
          onLockApp={handleLogout}
          onLogout={handleLogout}
        />

        {/* Floating Toast Notification */}
        {toast && (
          <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm pointer-events-none animate-bounce">
            <div
              className={`p-3 rounded-2xl shadow-xl backdrop-blur-md flex items-center gap-2.5 text-xs font-bold text-white border ${
                toast.type === 'success'
                  ? 'bg-emerald-600/95 border-emerald-500/50'
                  : 'bg-rose-600/95 border-rose-500/50'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span className="flex-1">{toast.message}</span>
            </div>
          </div>
        )}

        {/* Active View Container */}
        <main className="flex-1 px-4 pt-3">
          <ErrorBoundary>
            {activeTab === 'dashboard' && (
              <DashboardView
                overviewStats={overviewStats}
                monthlyChartData={monthlyChart}
                recentActivity={recentActivities}
                customers={customers}
                settings={settings}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onOpenAddDebt={() => {
                  setDebtTargetCustomerId(undefined);
                  setIsAddDebtOpen(true);
                }}
                onOpenRecordPayment={() => {
                  setPaymentTargetCustomerId(undefined);
                  setIsRecordPaymentOpen(true);
                }}
                onOpenAddCustomer={() => {
                  setEditingCustomer(null);
                  setIsAddCustomerOpen(true);
                }}
                onSelectCustomer={(customerId) => setSelectedCustomerId(customerId)}
                onOpenReminders={() => setIsMonthlyRemindersOpen(true)}
              />
            )}

            {activeTab === 'customers' && (
              <CustomersView
                customers={customers}
                settings={settings}
                onSelectCustomer={(customerId) => setSelectedCustomerId(customerId)}
                onOpenAddCustomer={() => {
                  setEditingCustomer(null);
                  setIsAddCustomerOpen(true);
                }}
                onOpenAddDebt={(customerId) => {
                  setDebtTargetCustomerId(customerId);
                  setIsAddDebtOpen(true);
                }}
                onOpenRecordPayment={(customerId) => {
                  setPaymentTargetCustomerId(customerId);
                  setIsRecordPaymentOpen(true);
                }}
                onOpenPrintStatement={(cust) => {
                  setPrintingCustomer(cust);
                }}
              />
            )}

            {activeTab === 'subscriptions' && (
              <SubscriptionsView
                subscriptions={subscriptions}
                customers={customers}
                settings={settings}
                onRefresh={refreshData}
              />
            )}

            {activeTab === 'debts' && (
              <DebtsView
                debts={debts}
                customers={customers}
                settings={settings}
                onOpenAddDebt={() => {
                  setDebtTargetCustomerId(undefined);
                  setIsAddDebtOpen(true);
                }}
                onOpenRecordPayment={(customerId) => {
                  setPaymentTargetCustomerId(customerId);
                  setIsRecordPaymentOpen(true);
                }}
                onSelectCustomer={(customerId) => setSelectedCustomerId(customerId)}
                onDeleteDebt={handleDeleteDebt}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView
                customers={customers}
                debts={debts}
                payments={payments}
                settings={settings}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onExportBackup={handleExportBackup}
                onImportBackup={handleImportBackup}
                onExportCSV={handleExportCSV}
                onResetDatabase={handleResetDatabase}
                isDarkMode={isDarkMode}
                onToggleTheme={handleToggleTheme}
                onLogout={handleLogout}
              />
            )}
          </ErrorBoundary>
        </main>

        {/* Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onChangeTab={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenQuickAction={() => setIsQuickActionOpen(true)}
          unreadNotifsCount={unreadNotifsCount}
        />
      </div>

      {/* Quick Action Bottom Sheet Menu */}
      {isQuickActionOpen && (
        <div
          id="quick-action-overlay"
          onClick={() => setIsQuickActionOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-end p-0 sm:p-4 animate-fadeIn"
        >
          <div
            id="quick-action-sheet"
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl p-4 space-y-3 animate-slideUp"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  إجراء سريع
                </h3>
              </div>
              <button
                onClick={() => setIsQuickActionOpen(false)}
                className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-1">
              <button
                onClick={() => {
                  setIsQuickActionOpen(false);
                  setDebtTargetCustomerId(undefined);
                  setIsAddDebtOpen(true);
                }}
                className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-center hover:bg-rose-100 active:scale-95 transition-all space-y-1.5"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white mx-auto flex items-center justify-center shadow-md shadow-rose-600/30">
                  <Plus className="w-4.5 h-4.5" />
                </div>
                <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 block">
                  تسجيل دين
                </span>
              </button>

              <button
                onClick={() => {
                  setIsQuickActionOpen(false);
                  setPaymentTargetCustomerId(undefined);
                  setIsRecordPaymentOpen(true);
                }}
                className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 text-center hover:bg-emerald-100 active:scale-95 transition-all space-y-1.5"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white mx-auto flex items-center justify-center shadow-md shadow-emerald-600/30">
                  <ArrowDownLeft className="w-4.5 h-4.5" />
                </div>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 block">
                  تسجيل سداد
                </span>
              </button>

              <button
                onClick={() => {
                  setIsQuickActionOpen(false);
                  setEditingCustomer(null);
                  setIsAddCustomerOpen(true);
                }}
                className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-900/60 text-center hover:bg-teal-100 active:scale-95 transition-all space-y-1.5"
              >
                <div className="w-9 h-9 rounded-xl bg-teal-600 text-white mx-auto flex items-center justify-center shadow-md shadow-teal-600/30">
                  <UserPlus className="w-4.5 h-4.5" />
                </div>
                <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 block">
                  عميل جديد
                </span>
              </button>

              <button
                onClick={() => {
                  setIsQuickActionOpen(false);
                  setActiveTab('subscriptions');
                }}
                className="p-3 rounded-2xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200/80 dark:border-violet-900/60 text-center hover:bg-violet-100 active:scale-95 transition-all space-y-1.5"
              >
                <div className="w-9 h-9 rounded-xl bg-violet-600 text-white mx-auto flex items-center justify-center shadow-md shadow-violet-600/30">
                  <Calendar className="w-4.5 h-4.5" />
                </div>
                <span className="text-[11px] font-bold text-violet-700 dark:text-violet-300 block">
                  الاشتراكات
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Detail Sheet */}
      {currentCustomer && (
        <CustomerDetailModal
          customer={currentCustomer}
          statement={currentCustomerStatement}
          settings={settings}
          onClose={() => setSelectedCustomerId(null)}
          onOpenAddDebt={(cid) => {
            setDebtTargetCustomerId(cid);
            setIsAddDebtOpen(true);
          }}
          onOpenRecordPayment={(cid) => {
            setPaymentTargetCustomerId(cid);
            setIsRecordPaymentOpen(true);
          }}
          onOpenEditCustomer={(cust) => {
            setEditingCustomer(cust);
            setIsAddCustomerOpen(true);
          }}
          onOpenPrintStatement={(cust) => {
            setPrintingCustomer(cust);
          }}
          onDeleteCustomer={handleDeleteCustomer}
          onDeleteTransaction={handleDeleteTransaction}
        />
      )}

      {/* Add / Edit Customer Modal */}
      {isAddCustomerOpen && (
        <AddCustomerModal
          initialCustomer={editingCustomer || undefined}
          onClose={() => {
            setIsAddCustomerOpen(false);
            setEditingCustomer(null);
          }}
          onSubmit={handleAddOrUpdateCustomer}
        />
      )}

      {/* Add Debt Modal */}
      {isAddDebtOpen && (
        <AddDebtModal
          customers={customers}
          preselectedCustomerId={debtTargetCustomerId}
          settings={settings}
          onClose={() => {
            setIsAddDebtOpen(false);
            setDebtTargetCustomerId(undefined);
          }}
          onSubmit={handleAddDebt}
        />
      )}

      {/* Record Payment Modal */}
      {isRecordPaymentOpen && (
        <RecordPaymentModal
          customers={customers}
          preselectedCustomerId={paymentTargetCustomerId}
          settings={settings}
          onClose={() => {
            setIsRecordPaymentOpen(false);
            setPaymentTargetCustomerId(undefined);
          }}
          onSubmit={handleRecordPayment}
        />
      )}

      {/* Monthly Reminders Modal */}
      {isMonthlyRemindersOpen && (
        <MonthlyRemindersModal
          customers={customers}
          settings={settings}
          onClose={() => setIsMonthlyRemindersOpen(false)}
        />
      )}

      {/* Notifications Modal */}
      {isNotificationsOpen && (
        <NotificationsModal
          notifications={notifications}
          onClose={() => setIsNotificationsOpen(false)}
          onMarkAllAsRead={() => {
            db.markAllNotificationsRead();
            showToast('تم تحديد جميع الإشعارات كمقروءة');
          }}
          onClearAll={() => {
            db.clearAllNotifications();
            showToast('تم مسح جميع الإشعارات');
          }}
          onSelectCustomer={(cid) => {
            setSelectedCustomerId(cid);
            setIsNotificationsOpen(false);
          }}
        />
      )}

      {/* Global Search Modal */}
      {isGlobalSearchOpen && (
        <GlobalSearchModal
          customers={customers}
          debts={debts}
          settings={settings}
          onClose={() => setIsGlobalSearchOpen(false)}
          onSelectCustomer={(cid) => {
            setSelectedCustomerId(cid);
            setIsGlobalSearchOpen(false);
          }}
        />
      )}

      {/* Print Statement Modal */}
      {printingCustomer && (
        <PrintStatementModal
          customer={printingCustomer}
          statement={db.getCustomerStatement(printingCustomer.id)}
          settings={settings}
          onClose={() => setPrintingCustomer(null)}
        />
      )}
    </div>
  );
}
