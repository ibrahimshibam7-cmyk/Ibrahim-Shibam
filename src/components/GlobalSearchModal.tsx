import React, { useState, useMemo } from 'react';
import { Search, X, User, Receipt, ArrowDownLeft, ChevronLeft } from 'lucide-react';
import { CustomerWithStats, Debt, UserSettings } from '../types';

interface GlobalSearchModalProps {
  customers: CustomerWithStats[];
  debts: Debt[];
  settings: UserSettings;
  onClose: () => void;
  onSelectCustomer: (customerId: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  customers,
  debts,
  settings,
  onClose,
  onSelectCustomer,
}) => {
  const [query, setQuery] = useState('');

  const customerMap = useMemo(() => {
    return new Map(customers.map((c) => [c.id, c]));
  }, [customers]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { matchingCustomers: [], matchingDebts: [] };

    const matchingCustomers = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.whatsapp && c.whatsapp.includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
    );

    const matchingDebts = debts.filter((d) => {
      const cust = customerMap.get(d.customerId);
      const custName = cust ? cust.name.toLowerCase() : '';
      const desc = (d.description || '').toLowerCase();
      const amountStr = d.amount.toString();
      return desc.includes(q) || custName.includes(q) || amountStr.includes(q);
    });

    return { matchingCustomers, matchingDebts };
  }, [query, customers, debts, customerMap]);

  return (
    <div
      id="global-search-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-start p-4 pt-12 animate-fadeIn"
    >
      <div
        id="global-search-box"
        className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
      >
        {/* Search Input Bar */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <Search className="w-5 h-5 text-teal-600 mr-1 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بالاسم، رقم الهاتف، أو المبلغ..."
            className="flex-1 h-10 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-slate-400 hover:text-slate-600 px-2"
            >
              مسح
            </button>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="p-4 space-y-4 overflow-y-auto no-scrollbar flex-1">
          {query.trim() === '' ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              اكتب اسم عميل أو رقم هاتف أو مبلغ دين للبحث السريع في كامل النظام
            </div>
          ) : results.matchingCustomers.length === 0 && results.matchingDebts.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              لم يتم العثور على أي نتائج تطابق "{query}"
            </div>
          ) : (
            <>
              {/* Customers matches */}
              {results.matchingCustomers.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 block">
                    العملاء المطابقون ({results.matchingCustomers.length}):
                  </span>
                  <div className="space-y-1.5">
                    {results.matchingCustomers.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          onSelectCustomer(c.id);
                          onClose();
                        }}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-slate-200/70 dark:border-slate-800 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                              {c.name}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-mono" dir="ltr">
                              {c.phone}
                            </span>
                          </div>
                        </div>

                        <div className="text-left flex items-center gap-1.5">
                          <span
                            className={`text-xs font-black ${
                              c.remaining > 0
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {c.remaining.toLocaleString()} {settings.currency}
                          </span>
                          <ChevronLeft className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Debts matches */}
              {results.matchingDebts.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-bold text-slate-400 block">
                    سجلات الديون المطابقة ({results.matchingDebts.length}):
                  </span>
                  <div className="space-y-1.5">
                    {results.matchingDebts.map((d) => {
                      const cust = customerMap.get(d.customerId);
                      return (
                        <div
                          key={d.id}
                          onClick={() => {
                            if (cust) {
                              onSelectCustomer(cust.id);
                              onClose();
                            }
                          }}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200/70 dark:border-slate-800 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                              <Receipt className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                {d.description || 'دين'}
                              </h4>
                              <span className="text-[10px] text-slate-400">
                                العميل: {cust ? cust.name : 'غير محدد'}
                              </span>
                            </div>
                          </div>

                          <div className="text-left font-black text-xs text-rose-600 dark:text-rose-400">
                            {d.amount.toLocaleString()} {settings.currency}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
