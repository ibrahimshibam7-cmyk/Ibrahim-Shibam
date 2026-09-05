import React, { useState, useMemo } from 'react';
import {
  Calendar,
  DollarSign,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Bell,
  Receipt,
  User,
  Phone,
  MessageCircle,
  Tag,
  AlertTriangle,
  ChevronLeft,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import {
  Subscription,
  SubscriptionMonth,
  SubscriptionPayment,
  Customer,
  UserSettings,
} from '../../types';
import { db, getArabicMonthName } from '../../services/db';
import { AddSubscriptionModal } from './AddSubscriptionModal';
import { RecordSubscriptionPaymentModal } from './RecordSubscriptionPaymentModal';
import { SendSubscriptionReminderModal } from './SendSubscriptionReminderModal';
import { SubscriptionReminderVoucherModal } from './SubscriptionReminderVoucherModal';
import { SubscriptionReceiptVoucherModal } from './SubscriptionReceiptVoucherModal';
import { SubscriptionDetailModal } from './SubscriptionDetailModal';

interface SubscriptionsViewProps {
  subscriptions: Subscription[];
  customers: Customer[];
  settings: UserSettings;
  onRefresh: () => void;
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({
  subscriptions,
  customers,
  settings,
  onRefresh,
}) => {
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [selectedSubForDetail, setSelectedSubForDetail] = useState<Subscription | null>(null);
  const [selectedSubForPayment, setSelectedSubForPayment] = useState<Subscription | null>(null);
  const [selectedSubForReminder, setSelectedSubForReminder] = useState<Subscription | null>(null);
  const [selectedSubForVoucher, setSelectedSubForVoucher] = useState<Subscription | null>(null);
  const [receiptVoucherPayment, setReceiptVoucherPayment] = useState<SubscriptionPayment | null>(null);

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'overdue'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');

  // Month records cache for fast aggregation
  const allMonths = useMemo(() => db.getSubscriptionMonths(), [subscriptions]);
  const stats = useMemo(() => db.getSubscriptionStats(), [subscriptions, allMonths]);

  // Current date info
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth() + 1;
  const currentMonthLabel = `${getArabicMonthName(currentMonthIndex)} ${currentYear}`;

  // Unique types and currencies for filters
  const uniqueTypes = useMemo(() => {
    const types = new Set<string>();
    subscriptions.forEach((s) => {
      if (s.subscriptionType) types.add(s.subscriptionType);
    });
    return Array.from(types);
  }, [subscriptions]);

  const uniqueCurrencies = useMemo(() => {
    const curr = new Set<string>();
    subscriptions.forEach((s) => {
      if (s.currency) curr.add(s.currency);
    });
    return Array.from(curr);
  }, [subscriptions]);

  // Filtered subscriptions
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = sub.customerName.toLowerCase().includes(query);
        const matchPhone = sub.customerPhone.includes(query);
        const matchType = sub.subscriptionType.toLowerCase().includes(query);
        if (!matchName && !matchPhone && !matchType) return false;
      }

      // Status Filter
      if (statusFilter === 'active' && sub.status !== 'active') return false;
      if (statusFilter === 'paused' && sub.status !== 'paused') return false;
      if (statusFilter === 'overdue') {
        const subUnpaid = allMonths.filter(
          (m) => m.subscriptionId === sub.id && m.status === 'unpaid'
        );
        if (subUnpaid.length === 0) return false;
      }

      // Type Filter
      if (typeFilter !== 'all' && sub.subscriptionType !== typeFilter) return false;

      // Currency Filter
      if (currencyFilter !== 'all' && sub.currency !== currencyFilter) return false;

      return true;
    });
  }, [subscriptions, searchQuery, statusFilter, typeFilter, currencyFilter, allMonths]);

  // Actions
  const handleAddOrEditSubmit = (data: any) => {
    if (editingSubscription) {
      const res = db.updateSubscription(editingSubscription.id, data);
      if (res.success) {
        setIsAddModalOpen(false);
        setEditingSubscription(null);
        onRefresh();
      }
      return res;
    } else {
      const res = db.addSubscription(data);
      if (res.success) {
        setIsAddModalOpen(false);
        onRefresh();
      }
      return res;
    }
  };

  const handleRecordPaymentSubmit = (data: any) => {
    const res = db.recordSubscriptionPayment(data);
    if (res.success) {
      onRefresh();
    }
    return res;
  };

  const handleDeleteSubscription = (subId: string) => {
    db.deleteSubscription(subId);
    setSelectedSubForDetail(null);
    onRefresh();
  };

  return (
    <div id="subscriptions-view" className="space-y-5 animate-fadeIn pb-16">
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-600/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              الاشتراكات الشهرية
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
              {stats.totalActiveSubscriptions} نشط
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            إدارة اشتراكات العملاء الدورية، متابعة الأشهر، تسجيل السداد، والتذكير التلقائي
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingSubscription(null);
              setIsAddModalOpen(true);
            }}
            id="btn-add-subscription"
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 active:scale-95 text-white text-xs font-black shadow-lg shadow-violet-500/25 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>إضافة اشتراك جديد</span>
          </button>
        </div>
      </div>

      {/* KPI Dashboard Summary Cards (as specified) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
        {/* Card 1: Active Subscriptions */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              الاشتراكات النشطة
            </span>
            <div className="w-7 h-7 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {stats.totalActiveSubscriptions}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              مشترك مسجل في النظام
            </span>
          </div>
        </div>

        {/* Card 2: Current Month Status */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              الشهر الحالي ({currentMonthLabel})
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <div>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                {stats.currentMonthPaidCount}
              </span>
              <span className="text-[10px] text-emerald-600/80 mr-1 font-bold">مسدد</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <div>
              <span className="text-lg font-black text-rose-600 dark:text-rose-400">
                {stats.currentMonthUnpaidCount}
              </span>
              <span className="text-[10px] text-rose-600/80 mr-1 font-bold">غير مسدد</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5">
            مسدد {stats.currentMonthPaidAmount.toLocaleString()} {settings.currency || 'ريال'}
          </span>
        </div>

        {/* Card 3: Total Due Amount */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              إجمالي المبالغ المستحقة
            </span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              {stats.totalDueAmount.toLocaleString()}
            </span>
            <span className="text-xs text-amber-600/80 font-bold mr-1">
              {settings.currency || 'ريال'}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              كافة الأشهر غير المسددة
            </span>
          </div>
        </div>

        {/* Card 4: Overdue Arrears */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              إجمالي المتأخرات والعملاء
            </span>
            <div className="w-7 h-7 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
              {stats.totalArrearsAmount.toLocaleString()}
            </span>
            <span className="text-xs text-rose-600/80 font-bold mr-1">
              {settings.currency || 'ريال'}
            </span>
            <span className="text-[10px] text-rose-500 block mt-0.5 font-bold">
              {stats.overdueCustomersCount} عميل متأخر عن السداد
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls Bar */}
      <div className="p-3 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          {/* Search Field */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="البحث باسم العميل، الهاتف، أو نوع الاشتراك..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-semibold pr-9 pl-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'active', label: 'النشط' },
              { id: 'overdue', label: 'عليه متأخرات ⚠️' },
              { id: 'paused', label: 'المتوقف' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as any)}
                className={`text-xs font-bold px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
                  statusFilter === f.id
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filters: Type & Currency */}
        {(uniqueTypes.length > 1 || uniqueCurrencies.length > 1) && (
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            {uniqueTypes.length > 1 && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold">نوع الاشتراك:</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 text-xs"
                >
                  <option value="all">كافة الأنواع</option>
                  {uniqueTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {uniqueCurrencies.length > 1 && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold">العملة:</span>
                <select
                  value={currencyFilter}
                  onChange={(e) => setCurrencyFilter(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 text-xs"
                >
                  <option value="all">كافة العملات</option>
                  {uniqueCurrencies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Subscriptions Cards List */}
      {filteredSubscriptions.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-violet-50 dark:bg-violet-950/40 text-violet-500 mx-auto flex items-center justify-center">
            <Calendar className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-200">
              {searchQuery ? 'لا توجد نتائج مطابقة لبحثك' : 'لا توجد اشتراكات شهرية مسجلة بعد'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              ابدأ بإضافة اشتراكات شهرية لعملائك لجدولة الاستحقاقات الشهرية وإرسال رسائل التذكير
              التلقائية عبر واتساب.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingSubscription(null);
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-violet-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة أول اشتراك الآن</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredSubscriptions.map((sub) => {
            const subMonths = allMonths.filter((m) => m.subscriptionId === sub.id);
            const unpaidSubMonths = subMonths.filter((m) => m.status === 'unpaid');
            const totalSubDue = unpaidSubMonths.reduce((sum, m) => sum + Number(m.amount), 0);

            // Current month status for this subscription
            const currMonthRecord = subMonths.find(
              (m) => m.year === currentYear && m.monthIndex === currentMonthIndex
            );
            const isCurrentMonthPaid = currMonthRecord?.status === 'paid';

            return (
              <div
                key={sub.id}
                className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700 transition-all flex flex-col justify-between group"
              >
                {/* Top Customer Info */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                          {sub.customerName}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                            sub.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                          }`}
                        >
                          {sub.status === 'active' ? 'نشط' : 'متوقف'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 dir-ltr text-right">
                        {sub.customerPhone}
                      </p>
                    </div>

                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                      {sub.subscriptionType}
                    </span>
                  </div>

                  {/* Financial & Due Day Info */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-bold">
                        قيمة الاشتراك الشهري:
                      </span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        {sub.amount.toLocaleString()} {sub.currency}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-bold">
                        يوم الاستحقاق:
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        يوم {sub.dueDay} من كل شهر
                      </span>
                    </div>

                    {/* Current Month Badge */}
                    <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">الشهر الحالي ({getArabicMonthName(currentMonthIndex)}):</span>
                      <span
                        className={`font-black text-[11px] px-2 py-0.5 rounded-md ${
                          isCurrentMonthPaid
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {isCurrentMonthPaid ? 'مسدد ✓' : 'غير مسدد ⚠️'}
                      </span>
                    </div>
                  </div>

                  {/* Unpaid Arrears Callout if any */}
                  {unpaidSubMonths.length > 0 ? (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-900/50 flex items-center justify-between text-xs">
                      <span className="font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>الأشهر المتأخرة ({unpaidSubMonths.length}):</span>
                      </span>
                      <span className="font-black text-rose-700 dark:text-rose-300">
                        {totalSubDue.toLocaleString()} {sub.currency}
                      </span>
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-center text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      كافة الأشهر مسددة بالكامل 🎉
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedSubForDetail(sub)}
                    className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>التفاصيل والسجل</span>
                  </button>

                  <button
                    onClick={() => setSelectedSubForPayment(sub)}
                    className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1 shadow-sm shadow-emerald-600/20 transition-all active:scale-95"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>تسجيل سداد</span>
                  </button>

                  <button
                    onClick={() => setSelectedSubForReminder(sub)}
                    className="py-2 px-3 rounded-xl bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/40 dark:hover:bg-violet-900/50 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 text-xs font-bold flex items-center justify-center gap-1 transition-all"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                    <span>تذكير واتساب</span>
                  </button>

                  <button
                    onClick={() => setSelectedSubForVoucher(sub)}
                    className="py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold flex items-center justify-center gap-1 transition-all"
                  >
                    <Receipt className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>سند تذكير</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODALS */}
      {/* 1. Add / Edit Subscription Modal */}
      {isAddModalOpen && (
        <AddSubscriptionModal
          customers={customers}
          initialSubscription={editingSubscription || undefined}
          defaultCurrency={settings.currency || 'ريال'}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingSubscription(null);
          }}
          onSubmit={handleAddOrEditSubmit}
        />
      )}

      {/* 2. Subscription Details Modal */}
      {selectedSubForDetail && (
        <SubscriptionDetailModal
          subscription={selectedSubForDetail}
          months={allMonths.filter((m) => m.subscriptionId === selectedSubForDetail.id)}
          payments={db.getSubscriptionPayments(selectedSubForDetail.id)}
          settings={settings}
          onClose={() => setSelectedSubForDetail(null)}
          onOpenRecordPayment={(sub) => {
            setSelectedSubForDetail(null);
            setSelectedSubForPayment(sub);
          }}
          onOpenSendReminder={(sub) => {
            setSelectedSubForDetail(null);
            setSelectedSubForReminder(sub);
          }}
          onOpenReminderVoucher={(sub) => {
            setSelectedSubForDetail(null);
            setSelectedSubForVoucher(sub);
          }}
          onOpenReceiptVoucher={(payment) => {
            setReceiptVoucherPayment(payment);
          }}
          onOpenEdit={(sub) => {
            setSelectedSubForDetail(null);
            setEditingSubscription(sub);
            setIsAddModalOpen(true);
          }}
          onDelete={handleDeleteSubscription}
          onRefresh={onRefresh}
        />
      )}

      {/* 3. Record Subscription Payment Modal */}
      {selectedSubForPayment && (
        <RecordSubscriptionPaymentModal
          subscription={selectedSubForPayment}
          months={allMonths.filter((m) => m.subscriptionId === selectedSubForPayment.id)}
          onClose={() => setSelectedSubForPayment(null)}
          onSubmit={handleRecordPaymentSubmit}
          onSuccessWithReceipt={(payment) => {
            setSelectedSubForPayment(null);
            setReceiptVoucherPayment(payment);
          }}
        />
      )}

      {/* 4. Send Reminder Modal */}
      {selectedSubForReminder && (
        <SendSubscriptionReminderModal
          subscription={selectedSubForReminder}
          months={allMonths.filter((m) => m.subscriptionId === selectedSubForReminder.id)}
          onClose={() => setSelectedSubForReminder(null)}
          onOpenReminderVoucher={() => {
            const sub = selectedSubForReminder;
            setSelectedSubForReminder(null);
            setSelectedSubForVoucher(sub);
          }}
        />
      )}

      {/* 5. Official Reminder Voucher Modal */}
      {selectedSubForVoucher && (
        <SubscriptionReminderVoucherModal
          subscription={selectedSubForVoucher}
          months={allMonths.filter((m) => m.subscriptionId === selectedSubForVoucher.id)}
          settings={settings}
          onClose={() => setSelectedSubForVoucher(null)}
        />
      )}

      {/* 6. Official Payment Receipt Voucher Modal */}
      {receiptVoucherPayment && (
        <SubscriptionReceiptVoucherModal
          payment={receiptVoucherPayment}
          settings={settings}
          onClose={() => setReceiptVoucherPayment(null)}
        />
      )}
    </div>
  );
};
