import React, { useState, useMemo } from 'react';
import {
  Search,
  UserPlus,
  Users,
  MessageCircle,
  Plus,
  ArrowDownLeft,
  ChevronLeft,
  ArrowUpDown,
  Phone,
  AlertCircle,
  CheckCircle2,
  Calendar,
  FileText,
} from 'lucide-react';
import { CustomerWithStats, CustomerFilter, CustomerSort, UserSettings } from '../types';
import { generateDebtReminderMessage, openWhatsAppChat } from '../services/whatsapp';

interface CustomersViewProps {
  customers: CustomerWithStats[];
  settings: UserSettings;
  onOpenAddCustomer: () => void;
  onOpenAddDebt: (customerId: string) => void;
  onOpenRecordPayment: (customerId: string) => void;
  onSelectCustomer: (customerId: string) => void;
  onOpenPrintStatement?: (customer: CustomerWithStats) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  settings,
  onOpenAddCustomer,
  onOpenAddDebt,
  onOpenRecordPayment,
  onSelectCustomer,
  onOpenPrintStatement,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<CustomerFilter>('all');
  const [activeSort, setActiveSort] = useState<CustomerSort>('highest_debt');

  // Filtered & Sorted Customers
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        // Search filter
        const q = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.whatsapp.includes(q) ||
          c.id.toLowerCase().includes(q);

        if (!matchesSearch) return false;

        // Status filter
        if (activeFilter === 'debt') return c.remaining > 0;
        if (activeFilter === 'settled') return c.remaining === 0;
        return true;
      })
      .sort((a, b) => {
        if (activeSort === 'highest_debt') {
          return b.remaining - a.remaining;
        }
        if (activeSort === 'latest_activity') {
          const dateA = new Date(a.lastActivityDate || a.createdAt).getTime();
          const dateB = new Date(b.lastActivityDate || b.createdAt).getTime();
          return dateB - dateA;
        }
        if (activeSort === 'name') {
          return a.name.localeCompare(b.name, 'ar');
        }
        return 0;
      });
  }, [customers, searchQuery, activeFilter, activeSort]);

  const debtCount = customers.filter((c) => c.remaining > 0).length;
  const settledCount = customers.filter((c) => c.remaining === 0).length;

  return (
    <div id="customers-view-container" className="space-y-4 pb-24 animate-fadeIn">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            العملاء
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            إجمالي {customers.length} عميل مسجل
          </p>
        </div>

        <button
          id="customers-add-customer-btn"
          onClick={onOpenAddCustomer}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-xs font-bold shadow-sm shadow-teal-600/30 hover:shadow-teal-600/40 active:scale-95 transition-all"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>+ عميل جديد</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          id="customers-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث بالاسم أو رقم الهاتف..."
          className="w-full h-11 pr-10 pl-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
        />
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
      </div>

      {/* Filter Tabs & Sort */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800'
            }`}
          >
            الكل ({customers.length})
          </button>

          <button
            onClick={() => setActiveFilter('debt')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              activeFilter === 'debt'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            عليهم ديون ({debtCount})
          </button>

          <button
            onClick={() => setActiveFilter('settled')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              activeFilter === 'settled'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            مسدد بالكامل ({settledCount})
          </button>
        </div>

        {/* Sort dropdown/button */}
        <div className="shrink-0">
          <select
            value={activeSort}
            onChange={(e) => setActiveSort(e.target.value as CustomerSort)}
            className="h-8 px-2 pr-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="highest_debt">أعلى دين</option>
            <option value="latest_activity">أحدث عملية</option>
            <option value="name">الاسم (أ-ي)</option>
          </select>
        </div>
      </div>

      {/* Customer List */}
      {filteredCustomers.length > 0 ? (
        <div className="space-y-3">
          {filteredCustomers.map((customer) => {
            const hasDebt = customer.remaining > 0;
            const lastDate = customer.lastActivityDate
              ? new Date(customer.lastActivityDate).toLocaleDateString('ar-YE', {
                  month: 'short',
                  day: 'numeric',
                })
              : 'جديد';

            return (
              <div
                key={customer.id}
                id={`customer-card-${customer.id}`}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3 transition-all hover:border-teal-500/40"
              >
                {/* Top Row: Name & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div
                    onClick={() => onSelectCustomer(customer.id)}
                    className="cursor-pointer flex-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {customer.name}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono">
                        #{customer.id.replace('CUST-', '')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span dir="ltr">{customer.phone}</span>
                      </span>
                      {customer.lastActivityDate && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>آخر عملية: {lastDate}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    {hasDebt ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[11px] font-bold border border-rose-200/60 dark:border-rose-900/60">
                        <AlertCircle className="w-3 h-3" />
                        عليه دين
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-200/60 dark:border-emerald-900/60">
                        <CheckCircle2 className="w-3 h-3" />
                        مسدد بالكامل
                      </span>
                    )}
                  </div>
                </div>

                {/* Financial Summary Grid */}
                <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">إجمالي الدين</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {customer.totalDebt.toLocaleString()}
                    </span>
                  </div>
                  <div className="border-x border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block mb-0.5">المسدد</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {customer.totalPaid.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">المتبقي</span>
                    <span
                      className={`text-xs font-black ${
                        hasDebt
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {customer.remaining.toLocaleString()} {settings.currency}
                    </span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  <button
                    onClick={() => onSelectCustomer(customer.id)}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 text-xs font-bold border border-teal-200/70 dark:border-teal-800/60 hover:bg-teal-100 flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>عرض الحساب</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onOpenAddDebt(customer.id)}
                    title="تسجيل دين جديد"
                    className="py-1.5 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-rose-500" />
                    <span>+ دين</span>
                  </button>

                  <button
                    onClick={() => onOpenRecordPayment(customer.id)}
                    title="تسجيل سداد"
                    disabled={!hasDebt}
                    className={`py-1.5 px-2.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors ${
                      hasDebt
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300'
                        : 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />
                    <span>سداد</span>
                  </button>

                  <button
                    onClick={() => {
                      const msg = generateDebtReminderMessage(customer, settings.currency);
                      openWhatsAppChat(customer.whatsapp || customer.phone, msg);
                    }}
                    title="إرسال رسالة واتساب"
                    className="py-1.5 px-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white text-xs font-bold border border-emerald-200/60 dark:border-emerald-900/60 flex items-center gap-1 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>واتساب</span>
                  </button>

                  {onOpenPrintStatement && (
                    <button
                      onClick={() => onOpenPrintStatement(customer)}
                      title="كشف حساب رسمي PDF"
                      className="py-1.5 px-2 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 hover:bg-violet-600 hover:text-white text-xs font-bold border border-violet-200/60 dark:border-violet-900/60 flex items-center justify-center transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty / No search results state */
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {searchQuery
              ? 'لم يتم العثور على عملاء يطابقون البحث'
              : 'لا يوجد عملاء حتى الآن'}
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {searchQuery
              ? 'تأكد من كتابة الاسم أو رقم الهاتف بشكل صحيح'
              : 'ابدأ بإضافة أول عميل لتسجيل حساباته ومتابعة الديون.'}
          </p>
          {!searchQuery && (
            <button
              onClick={onOpenAddCustomer}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold shadow-md shadow-teal-600/30 hover:bg-teal-700 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ إضافة أول عميل</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
