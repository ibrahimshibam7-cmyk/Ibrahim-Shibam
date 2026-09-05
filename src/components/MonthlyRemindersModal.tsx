import React, { useState } from 'react';
import { X, MessageCircle, CalendarClock, CheckSquare, Square, Send, Check, Phone } from 'lucide-react';
import { CustomerWithStats, UserSettings } from '../types';
import { generateDebtReminderMessage, openWhatsAppChat } from '../services/whatsapp';

interface MonthlyRemindersModalProps {
  customers: CustomerWithStats[];
  settings: UserSettings;
  onClose: () => void;
}

export const MonthlyRemindersModal: React.FC<MonthlyRemindersModalProps> = ({
  customers,
  settings,
  onClose,
}) => {
  // Only customers with outstanding debt
  const indebted = customers.filter((c) => c.remaining > 0);

  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>(
    indebted.map((c) => c.id)
  );
  const [sentCustomerIds, setSentCustomerIds] = useState<Set<string>>(new Set());
  const [currentBatchIndex, setCurrentBatchIndex] = useState<number | null>(null);

  const allSelected = selectedCustomerIds.length === indebted.length && indebted.length > 0;

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedCustomerIds([]);
    } else {
      setSelectedCustomerIds(indebted.map((c) => c.id));
    }
  };

  const handleToggleCustomer = (id: string) => {
    if (selectedCustomerIds.includes(id)) {
      setSelectedCustomerIds(selectedCustomerIds.filter((cid) => cid !== id));
    } else {
      setSelectedCustomerIds([...selectedCustomerIds, id]);
    }
  };

  const handleSendIndividual = (customer: CustomerWithStats) => {
    const msg = generateDebtReminderMessage(customer, settings.currency);
    openWhatsAppChat(customer.whatsapp || customer.phone, msg);
    setSentCustomerIds((prev) => new Set([...prev, customer.id]));
  };

  const handleStartBatchSending = () => {
    if (selectedCustomerIds.length === 0) return;
    setCurrentBatchIndex(0);
    const firstCust = indebted.find((c) => c.id === selectedCustomerIds[0]);
    if (firstCust) {
      handleSendIndividual(firstCust);
    }
  };

  const handleSendNextInBatch = () => {
    if (currentBatchIndex === null) return;
    const nextIndex = currentBatchIndex + 1;
    if (nextIndex < selectedCustomerIds.length) {
      setCurrentBatchIndex(nextIndex);
      const nextCust = indebted.find((c) => c.id === selectedCustomerIds[nextIndex]);
      if (nextCust) {
        handleSendIndividual(nextCust);
      }
    } else {
      setCurrentBatchIndex(null);
    }
  };

  return (
    <div
      id="monthly-reminders-modal-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4 animate-fadeIn"
    >
      <div
        id="monthly-reminders-sheet"
        className="w-full sm:max-w-lg bg-white dark:bg-slate-900 sm:rounded-3xl rounded-t-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <CalendarClock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                التذكيرات الشهرية
              </h3>
              <p className="text-[11px] text-slate-400">
                {indebted.length} عميل لديهم مبالغ متبقية
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Batch sending progress banner */}
        {currentBatchIndex !== null && (
          <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border-b border-teal-200/60 dark:border-teal-900/60 flex items-center justify-between">
            <div className="text-xs text-teal-800 dark:text-teal-200 font-bold">
              <span>جاري إرسال التذكيرات: </span>
              <span>{currentBatchIndex + 1} من {selectedCustomerIds.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSendNextInBatch}
                className="px-3 py-1 rounded-lg bg-teal-600 text-white text-xs font-bold shadow-sm hover:bg-teal-700"
              >
                {currentBatchIndex + 1 < selectedCustomerIds.length ? 'التالي ←' : 'إنهاء'}
              </button>
              <button
                onClick={() => setCurrentBatchIndex(null)}
                className="text-[11px] text-slate-500 hover:underline"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* Top Control Bar */}
        {indebted.length > 0 && (
          <div className="px-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <button
              onClick={handleToggleSelectAll}
              className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 hover:text-teal-600"
            >
              {allSelected ? (
                <CheckSquare className="w-4 h-4 text-teal-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>تحديد الكل ({indebted.length})</span>
            </button>

            <span className="text-[11px] text-slate-400">
              تم تحديد: {selectedCustomerIds.length}
            </span>
          </div>
        )}

        {/* Customers List */}
        <div className="p-4 space-y-2.5 overflow-y-auto no-scrollbar flex-1">
          {indebted.length > 0 ? (
            indebted.map((customer) => {
              const isSelected = selectedCustomerIds.includes(customer.id);
              const isSent = sentCustomerIds.has(customer.id);
              const lastActivity = customer.lastActivityDate
                ? new Date(customer.lastActivityDate).toLocaleDateString('ar-YE', {
                    month: 'short',
                    day: 'numeric',
                  })
                : '—';

              return (
                <div
                  key={customer.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 border-teal-500/50 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-1">
                      <button
                        onClick={() => handleToggleCustomer(customer.id)}
                        className="text-slate-400 hover:text-teal-600"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4.5 h-4.5 text-teal-600" />
                        ) : (
                          <Square className="w-4.5 h-4.5 text-slate-400" />
                        )}
                      </button>

                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {customer.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <span dir="ltr">{customer.whatsapp || customer.phone}</span>
                          <span>•</span>
                          <span>آخر سداد: {lastActivity}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-left shrink-0">
                      <div className="text-xs font-black text-rose-600 dark:text-rose-400">
                        {customer.remaining.toLocaleString()} {settings.currency}
                      </div>
                      <button
                        onClick={() => handleSendIndividual(customer)}
                        className={`mt-1 py-1 px-2 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors ${
                          isSent
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 hover:bg-emerald-500 hover:text-white'
                        }`}
                      >
                        {isSent ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>تم الفتح</span>
                          </>
                        ) : (
                          <>
                            <MessageCircle className="w-3 h-3" />
                            <span>إرسال تذكير</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <CalendarClock className="w-10 h-10 mx-auto text-emerald-500" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                لا توجد مبالغ متبقية على أي عميل!
              </h4>
              <p className="text-xs text-slate-500">
                كافة حسابات العملاء مسددة بالكامل حاليًا.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {indebted.length > 0 && (
          <div className="p-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
            <button
              onClick={handleStartBatchSending}
              disabled={selectedCustomerIds.length === 0}
              className={`flex-1 h-12 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all ${
                selectedCustomerIds.length > 0
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30 hover:bg-emerald-700 active:scale-98'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>
                إرسال التذكيرات ({selectedCustomerIds.length} عميل)
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
