import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowDownLeft,
  ChevronLeft,
  Trash2,
} from 'lucide-react';
import { Debt, CustomerWithStats, DebtFilter, UserSettings } from '../types';

interface DebtsViewProps {
  debts: Debt[];
  customers: CustomerWithStats[];
  settings: UserSettings;
  onOpenAddDebt: () => void;
  onOpenRecordPayment: (customerId: string) => void;
  onSelectCustomer: (customerId: string) => void;
  onDeleteDebt: (debtId: string) => void;
}

export const DebtsView: React.FC<DebtsViewProps> = ({
  debts,
  customers,
  settings,
  onOpenAddDebt,
  onOpenRecordPayment,
  onSelectCustomer,
  onDeleteDebt,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<DebtFilter>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const customerMap = useMemo(() => {
    return new Map(customers.map((c) => [c.id, c]));
  }, [customers]);

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredDebts = useMemo(() => {
    return debts
      .filter((d) => {
        const customer = customerMap.get(d.customerId);
        const customerName = customer ? customer.name.toLowerCase() : '';
        const desc = (d.description || '').toLowerCase();
        const q = searchQuery.trim().toLowerCase();

        const matchesSearch =
          !q ||
          customerName.includes(q) ||
          desc.includes(q) ||
          (customer && customer.phone.includes(q));

        if (!matchesSearch) return false;

        const isOverdue = d.dueDate ? d.dueDate < todayStr : false;
        const customerRemaining = customer ? customer.remaining : 0;
        const isSettled = customerRemaining === 0;

        if (activeFilter === 'overdue') return isOverdue && !isSettled;
        if (activeFilter === 'paid') return isSettled;
        if (activeFilter === 'unpaid') return !isSettled;
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.debtDate || a.createdAt).getTime();
        const dateB = new Date(b.debtDate || b.createdAt).getTime();
        return dateB - dateA;
      });
  }, [debts, customerMap, searchQuery, activeFilter, todayStr]);

  const totalDebtsAmount = debts.reduce((sum, d) => sum + Number(d.amount), 0);

  return (
    <div id="debts-view-container" className="space-y-4 pb-24 animate-fadeIn">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            سجل الديون
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            إجمالي {debts.length} دين مسجل بقيمة {totalDebtsAmount.toLocaleString()}{' '}
            {settings.currency}
          </p>
        </div>

        <button
          id="debts-add-debt-btn"
          onClick={onOpenAddDebt}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white text-xs font-bold shadow-sm shadow-rose-600/30 hover:shadow-rose-600/40 active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ دين جديد</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          id="debts-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث باسم العميل أو وصف الدين..."
          className="w-full h-11 pr-10 pl-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all"
        />
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {[
          { id: 'all', label: `الكل (${debts.length})` },
          { id: 'unpaid', label: 'غير مسددة' },
          { id: 'paid', label: 'مسددة' },
          { id: 'overdue', label: 'متأخرة السداد' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as DebtFilter)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
              activeFilter === tab.id
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Debts List */}
      {filteredDebts.length > 0 ? (
        <div className="space-y-3">
          {filteredDebts.map((debt) => {
            const customer = customerMap.get(debt.customerId);
            const isOverdue = debt.dueDate ? debt.dueDate < todayStr : false;
            const customerRemaining = customer ? customer.remaining : 0;
            const isSettled = customerRemaining === 0;

            const formattedDebtDate = new Date(debt.debtDate).toLocaleDateString('ar-YE', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={debt.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2.5"
              >
                {/* Top: Customer & Amount */}
                <div className="flex items-start justify-between gap-2">
                  <div
                    onClick={() => customer && onSelectCustomer(customer.id)}
                    className="cursor-pointer flex-1"
                  >
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white hover:text-teal-600 transition-colors">
                      {customer ? customer.name : 'عميل غير مسجل'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {debt.description || 'دين جديد'}
                    </p>
                  </div>

                  <div className="text-left shrink-0">
                    <div className="text-sm font-black text-rose-600 dark:text-rose-400">
                      {debt.amount.toLocaleString()} {settings.currency}
                    </div>
                    {/* Status badge */}
                    {isSettled ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        مسدد
                      </span>
                    ) : isOverdue ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        <Clock className="w-3 h-3" />
                        متأخر
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                        <AlertCircle className="w-3 h-3" />
                        غير مسدد
                      </span>
                    )}
                  </div>
                </div>

                {/* Dates Row */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>تاريخ الدين: {formattedDebtDate}</span>
                  </span>

                  {debt.dueDate && (
                    <span
                      className={`flex items-center gap-1 font-semibold ${
                        isOverdue && !isSettled
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-500'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>الاستحقاق: {debt.dueDate}</span>
                    </span>
                  )}
                </div>

                {debt.notes && (
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                    {debt.notes}
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    {customer && (
                      <button
                        onClick={() => onSelectCustomer(customer.id)}
                        className="text-xs text-teal-600 dark:text-teal-400 font-bold flex items-center gap-0.5 hover:underline"
                      >
                        <span>حساب العميل</span>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {customer && customer.remaining > 0 && (
                      <button
                        onClick={() => onOpenRecordPayment(customer.id)}
                        className="py-1 px-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200/60 dark:border-emerald-900/60 hover:bg-emerald-100 flex items-center gap-1"
                      >
                        <ArrowDownLeft className="w-3 h-3" />
                        <span>تسجيل سداد</span>
                      </button>
                    )}

                    <button
                      onClick={() => setDeleteConfirmId(debt.id)}
                      title="حذف هذا الدين"
                      className="w-7 h-7 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty Debts */
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {searchQuery
              ? 'لم يتم العثور على ديون تطابق البحث'
              : 'لا توجد ديون مسجلة بعد'}
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {searchQuery
              ? 'جرّب البحث باسم عميل آخر'
              : 'يمكنك تسجيل أول دين على عميل جديد أو موجود الآن.'}
          </p>
          {!searchQuery && (
            <button
              onClick={onOpenAddDebt}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-600/30 hover:bg-rose-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ تسجيل أول دين</span>
            </button>
          )}
        </div>
      )}

      {/* Delete Debt Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                حذف سجل الدين؟
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                هل أنت متأكد من حذف هذا الدين؟ سيتم تحديث رصيد العميل تلقائيًا بعد الحذف.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  onDeleteDebt(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
