import React from 'react';
import {
  UserPlus,
  ArrowDownLeft,
  ChevronLeft,
  MessageCircle,
  Plus,
  Users,
  Receipt,
  BarChart3,
  Settings,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Calendar,
} from 'lucide-react';
import { CustomerWithStats, ActivityItem, UserSettings, TabType } from '../types';
import { generateDebtReminderMessage, openWhatsAppChat } from '../services/whatsapp';

interface DashboardViewProps {
  overviewStats: {
    totalDebts: number;
    totalPaid: number;
    totalRemaining: number;
    thisMonthPaid: number;
    totalCustomers: number;
    indebtedCustomersCount: number;
  };
  monthlyChartData?: Array<{
    month: string;
    debts: number;
    payments: number;
  }>;
  recentActivity: ActivityItem[];
  customers: CustomerWithStats[];
  settings: UserSettings;
  onNavigateTab: (tab: TabType) => void;
  onOpenAddCustomer: () => void;
  onOpenAddDebt: (customerId?: string) => void;
  onOpenRecordPayment: (customerId?: string) => void;
  onSelectCustomer: (customerId: string) => void;
  onOpenReminders: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  overviewStats,
  recentActivity,
  customers,
  settings,
  onNavigateTab,
  onOpenAddCustomer,
  onOpenAddDebt,
  onOpenRecordPayment,
  onSelectCustomer,
  onOpenReminders,
}) => {
  const safeOverview = {
    totalDebts: Number(overviewStats?.totalDebts) || 0,
    totalPaid: Number(overviewStats?.totalPaid) || 0,
    totalRemaining: Number(overviewStats?.totalRemaining) || 0,
    thisMonthPaid: Number(overviewStats?.thisMonthPaid) || 0,
    totalCustomers: Number(overviewStats?.totalCustomers) || 0,
    indebtedCustomersCount: Number(overviewStats?.indebtedCustomersCount) || 0,
  };

  const topDebtors = [...(customers || [])]
    .filter((c) => (Number(c.remaining) || 0) > 0)
    .sort((a, b) => (Number(b.remaining) || 0) - (Number(a.remaining) || 0))
    .slice(0, 4);

  const todayFormatted = new Intl.DateTimeFormat('ar-SA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const handleQuickWhatsApp = (e: React.MouseEvent, customer: CustomerWithStats) => {
    e.stopPropagation();
    const phone = customer.whatsapp || customer.phone;
    if (!phone) return;
    const msg = generateDebtReminderMessage(customer, settings.currency);
    openWhatsAppChat(phone, msg);
  };

  return (
    <div id="dashboard-view-container" className="space-y-4 pb-24 animate-fadeIn">
      {/* 1. HERO BALANCE CARD (Inspired by the user's reference image) */}
      <div
        id="hero-balance-container"
        className="rounded-3xl bg-white dark:bg-slate-900 border border-violet-100 dark:border-violet-950/60 shadow-lg shadow-violet-500/5 overflow-hidden transition-all"
      >
        {/* Upper Gradient Section */}
        <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-white p-5 relative overflow-hidden">
          {/* Subtle Decorative Curves */}
          <div className="absolute -right-8 -bottom-12 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute right-4 bottom-2 w-32 h-16 border-b-2 border-white/10 rounded-full pointer-events-none transform -rotate-12" />

          {/* Top Label & Date */}
          <div className="flex items-center justify-between text-violet-100 text-xs font-medium mb-2.5">
            <span>إجمالي الديون المتبقية</span>
            <span className="text-[11px] opacity-85 font-mono">{todayFormatted}</span>
          </div>

          {/* Large Hero Balance */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-black tracking-tight text-white">
              {safeOverview.totalRemaining.toLocaleString()}
            </span>
            <span className="text-sm font-bold text-violet-200">{settings.currency}</span>
          </div>

          {/* Month-to-date Collection & Status Pill */}
          <div className="flex items-center justify-between pt-1 text-xs border-t border-white/15">
            <div className="flex items-center gap-1.5 text-violet-100 text-[11px]">
              <span>تحصيل هذا الشهر:</span>
              <span className="font-bold text-white">
                {safeOverview.thisMonthPaid.toLocaleString()} {settings.currency}
              </span>
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-400/25 border border-emerald-300/30 text-emerald-100 text-[10px] font-bold">
              <span>▲ نشط</span>
              {safeOverview.indebtedCustomersCount > 0 && (
                <span>({safeOverview.indebtedCustomersCount} عملاء)</span>
              )}
            </div>
          </div>
        </div>

        {/* Lower 4 Circular Action Buttons (Exact arrangement from reference photo) */}
        <div className="grid grid-cols-4 gap-2 p-3.5 bg-slate-50/80 dark:bg-slate-900/90 text-center">
          {/* 1. Add Debt */}
          <button
            id="action-add-debt"
            onClick={() => onOpenAddDebt()}
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-full bg-white dark:bg-slate-800 border border-violet-100 dark:border-violet-900/50 shadow-sm text-violet-700 dark:text-violet-300 flex items-center justify-center group-hover:scale-105 group-active:scale-95 transition-all">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              تسجيل دين
            </span>
          </button>

          {/* 2. Record Payment */}
          <button
            id="action-record-payment"
            onClick={() => onOpenRecordPayment()}
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-full bg-white dark:bg-slate-800 border border-violet-100 dark:border-violet-900/50 shadow-sm text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 group-active:scale-95 transition-all">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              تسجيل سداد
            </span>
          </button>

          {/* 3. Add Customer */}
          <button
            id="action-add-customer"
            onClick={onOpenAddCustomer}
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-full bg-white dark:bg-slate-800 border border-violet-100 dark:border-violet-900/50 shadow-sm text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 group-active:scale-95 transition-all">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              عميل جديد
            </span>
          </button>

          {/* 4. Reminders */}
          <button
            id="action-reminders"
            onClick={onOpenReminders}
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-full bg-white dark:bg-slate-800 border border-violet-100 dark:border-violet-900/50 shadow-sm text-violet-600 dark:text-violet-400 flex items-center justify-center group-hover:scale-105 group-active:scale-95 transition-all">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              التذكيرات
            </span>
          </button>
        </div>
      </div>

      {/* 2. PROMINENT SMART ASSISTANT CARD (Matches 'AI StockBit Assistant' in reference photo) */}
      <div
        id="smart-assistant-banner"
        onClick={onOpenReminders}
        className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-3.5 flex items-center justify-between shadow-md shadow-violet-500/15 cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-black tracking-tight flex items-center gap-1.5">
              <span>مساعد تذكيرات WhatsApp</span>
              {safeOverview.indebtedCustomersCount > 0 && (
                <span className="bg-white/20 text-white px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                  {safeOverview.indebtedCustomersCount} مستحق
                </span>
              )}
            </h3>
            <p className="text-[11px] text-violet-100 mt-0.5">
              أرسل مطالبات دورية وكشوف حساب بنقرة واحدة
            </p>
          </div>
        </div>
        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0">
          <ChevronLeft className="w-4 h-4" />
        </div>
      </div>

      {/* 3. SIMPLE MENU LIST (Matches the 3-item list in reference photo) */}
      <div
        id="simple-menu-list"
        className="rounded-2xl bg-white dark:bg-slate-900 border border-violet-100 dark:border-violet-950/60 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden"
      >
        {/* Item 1: Customers */}
        <button
          onClick={() => onNavigateTab('customers')}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-violet-50/40 dark:hover:bg-violet-950/20 active:bg-violet-50 transition-colors text-right"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                دليل العملاء وكشوف الحساب
              </span>
              <span className="text-[10px] text-slate-400">
                {safeOverview.totalCustomers} عميل مسجل
              </span>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </button>

        {/* Item 2: Subscriptions */}
        <button
          onClick={() => onNavigateTab('subscriptions')}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-violet-50/40 dark:hover:bg-violet-950/20 active:bg-violet-50 transition-colors text-right"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                الاشتراكات الشهرية
              </span>
              <span className="text-[10px] text-slate-400">
                متابعة الاشتراكات الدورية، الدفعات، وسندات التذكير
              </span>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </button>

        {/* Item 3: Debts */}
        <button
          onClick={() => onNavigateTab('debts')}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-violet-50/40 dark:hover:bg-violet-950/20 active:bg-violet-50 transition-colors text-right"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                سجل الديون والمستحقات
              </span>
              <span className="text-[10px] text-slate-400">
                إجمالي الديون {safeOverview.totalDebts.toLocaleString()} {settings.currency}
              </span>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </button>

        {/* Item 3: Reports */}
        <button
          onClick={() => onNavigateTab('reports')}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-violet-50/40 dark:hover:bg-violet-950/20 active:bg-violet-50 transition-colors text-right"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                التقارير والإحصائيات
              </span>
              <span className="text-[10px] text-slate-400">
                ملخص الأرباح، الكشوفات، والتصدير
              </span>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </button>

        {/* Item 4: Settings */}
        <button
          onClick={() => onNavigateTab('settings')}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-violet-50/40 dark:hover:bg-violet-950/20 active:bg-violet-50 transition-colors text-right"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                النسخ الاحتياطي والإعدادات
              </span>
              <span className="text-[10px] text-slate-400">
                قفل التطبيق، العملة، واسم المحل
              </span>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* 4. RECENT ACTIVITY / TOP INDEBTED CUSTOMERS (Clean & Minimal) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
            العملاء الأكثر استحقاقاً
          </h3>
          <button
            onClick={() => onNavigateTab('customers')}
            className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-0.5"
          >
            <span>عرض الكل</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {customers.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-violet-200 dark:border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-500 mx-auto flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                لا يوجد عملاء حتى الآن
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                ابدأ بإضافة أول عميل لك لتسجيل الديون والسدادات بسهولة
              </p>
            </div>
            <button
              onClick={onOpenAddCustomer}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-bold shadow-xs hover:bg-violet-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ إضافة عميل</span>
            </button>
          </div>
        ) : topDebtors.length === 0 ? (
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-400">
            لا توجد ديون معلقة حالياً — الحسابات مسددة بالكامل ✨
          </div>
        ) : (
          <div className="space-y-2">
            {topDebtors.map((customer) => (
              <div
                key={customer.id}
                onClick={() => onSelectCustomer(customer.id)}
                className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-violet-50 dark:border-slate-800/80 shadow-xs flex items-center justify-between hover:border-violet-300 active:scale-[0.99] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-bold text-xs flex items-center justify-center">
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {customer.name}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      {customer.phone || 'لا يوجد هاتف'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-left">
                    <span className="text-xs font-black text-rose-600 dark:text-rose-400 block">
                      {(Number(customer.remaining) || 0).toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-400">{settings.currency}</span>
                  </div>

                  {(customer.whatsapp || customer.phone) && (
                    <button
                      onClick={(e) => handleQuickWhatsApp(e, customer)}
                      title="مراسلة عبر واتساب"
                      className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. QUICK RECENT TRANSACTIONS (Optional mini-feed) */}
      {recentActivity.length > 0 && (
        <div className="space-y-2 pt-1">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 px-1">
            آخر العمليات
          </h3>
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-violet-50 dark:border-slate-800/80 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden shadow-xs">
            {recentActivity.slice(0, 3).map((act) => (
              <div key={act.id} className="px-3.5 py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      act.type === 'debt'
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50'
                        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50'
                    }`}
                  >
                    {act.type === 'debt' ? (
                      <Plus className="w-3 h-3" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">
                      {act.customerName}
                    </span>
                    <span className="text-[10px] text-slate-400">{act.date}</span>
                  </div>
                </div>

                <div className="text-left font-bold text-[11px]">
                  <span className={act.type === 'debt' ? 'text-rose-600' : 'text-emerald-600'}>
                    {act.type === 'debt' ? '+' : '-'}
                    {(Number(act.amount) || 0).toLocaleString()} {settings.currency}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
