import React, { useState } from 'react';
import { X, Plus, DollarSign, Calendar, FileText, User } from 'lucide-react';
import { CustomerWithStats, UserSettings } from '../types';

interface AddDebtModalProps {
  customers: CustomerWithStats[];
  preselectedCustomerId?: string;
  settings: UserSettings;
  onClose: () => void;
  onSubmit: (data: {
    customerId: string;
    amount: number;
    description: string;
    debtDate?: string;
    dueDate?: string;
    notes?: string;
  }) => { success: boolean; error?: string };
}

export const AddDebtModal: React.FC<AddDebtModalProps> = ({
  customers,
  preselectedCustomerId,
  settings,
  onClose,
  onSubmit,
}) => {
  const [customerId, setCustomerId] = useState(
    preselectedCustomerId || (customers.length > 0 ? customers[0].id : '')
  );
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [debtDate, setDebtDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const selectedCustomer = customers.find((c) => c.id === customerId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError('يرجى اختيار العميل أولاً');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('يرجى إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }

    const res = onSubmit({
      customerId,
      amount: numAmount,
      description: description.trim() || 'فاتورة مشتريات / دين',
      debtDate,
      dueDate: dueDate || undefined,
      notes: notes.trim(),
    });

    if (!res.success) {
      setError(res.error || 'حدث خطأ أثناء تسجيل الدين');
    } else {
      onClose();
    }
  };

  return (
    <div
      id="add-debt-modal-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4 animate-fadeIn"
    >
      <div
        id="add-debt-sheet"
        className="w-full sm:max-w-md bg-white dark:bg-slate-900 sm:rounded-3xl rounded-t-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                تسجيل دين جديد
              </h3>
              {selectedCustomer && (
                <span className="text-[11px] text-slate-400">
                  على: {selectedCustomer.name}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
              <span>{error}</span>
            </div>
          )}

          {/* Customer Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-rose-500" />
              <span>العميل <span className="text-rose-500">*</span></span>
            </label>
            {preselectedCustomerId ? (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                <span>{selectedCustomer?.name}</span>
                <span className="text-[11px] text-slate-400">
                  (الرصيد الحالي: {selectedCustomer?.remaining.toLocaleString()} {settings.currency})
                </span>
              </div>
            ) : (
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              >
                <option value="" disabled>
                  اختر العميل...
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (المتبقي: {c.remaining.toLocaleString()} {settings.currency})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-rose-500" />
                <span>مبلغ الدين <span className="text-rose-500">*</span></span>
              </span>
              <span className="text-[11px] text-teal-600 dark:text-teal-400 font-bold">
                {settings.currency}
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0.01"
                required
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full h-12 pr-4 pl-14 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-extrabold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500"
              />
              <span className="absolute left-3 top-3.5 text-xs font-bold text-slate-400 pointer-events-none">
                {settings.currency}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              وصف الدين
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="مثال: فاتورة بضاعة، كيس أرز، مستلزمات..."
              className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
            />
          </div>

          {/* Debt Date & Due Date */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                <span>تاريخ الدين</span>
              </label>
              <input
                type="date"
                value={debtDate}
                onChange={(e) => setDebtDate(e.target.value)}
                className="w-full h-11 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>تاريخ الاستحقاق (اختياري)</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-11 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>ملاحظات إضافية</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي تفاصيل أخرى..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40 resize-none"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              id="submit-debt-btn"
              className="w-full h-12 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white text-xs font-bold shadow-md shadow-rose-600/30 hover:shadow-rose-600/40 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل الدين</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
