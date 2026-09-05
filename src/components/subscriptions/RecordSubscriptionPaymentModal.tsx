import React, { useState } from 'react';
import {
  X,
  Check,
  DollarSign,
  Calendar,
  CreditCard,
  FileText,
  AlertCircle,
  Receipt,
  User,
} from 'lucide-react';
import {
  Subscription,
  SubscriptionMonth,
  SubscriptionPayment,
  PaymentMethod,
} from '../../types';

interface RecordSubscriptionPaymentModalProps {
  subscription: Subscription;
  months: SubscriptionMonth[];
  onClose: () => void;
  onSubmit: (data: {
    subscriptionId: string;
    monthIds: string[];
    amount: number;
    currency: string;
    paymentMethod: PaymentMethod;
    paymentDate?: string;
    notes?: string;
  }) => { success: boolean; payment?: SubscriptionPayment; error?: string };
  onSuccessWithReceipt: (payment: SubscriptionPayment) => void;
}

export const RecordSubscriptionPaymentModal: React.FC<RecordSubscriptionPaymentModalProps> = ({
  subscription,
  months,
  onClose,
  onSubmit,
  onSuccessWithReceipt,
}) => {
  const unpaidMonths = months.filter((m) => m.status === 'unpaid');

  // By default, pre-select the first unpaid month (or all unpaid if 1)
  const [selectedMonthIds, setSelectedMonthIds] = useState<string[]>(
    unpaidMonths.length > 0 ? [unpaidMonths[0].id] : []
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Compute total for selected months
  const selectedMonths = months.filter((m) => selectedMonthIds.includes(m.id));
  const computedTotal = selectedMonths.reduce((sum, m) => sum + Number(m.amount), 0);

  const toggleMonth = (id: string) => {
    setSelectedMonthIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllUnpaid = () => {
    setSelectedMonthIds(unpaidMonths.map((m) => m.id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedMonthIds.length === 0) {
      setError('يرجى تحديد شهر واحد على الأقل لسداد قيمته');
      return;
    }

    if (computedTotal <= 0) {
      setError('مبلغ السداد غير صالح');
      return;
    }

    const res = onSubmit({
      subscriptionId: subscription.id,
      monthIds: selectedMonthIds,
      amount: computedTotal,
      currency: subscription.currency,
      paymentMethod,
      paymentDate,
      notes: notes.trim(),
    });

    if (res.success && res.payment) {
      onSuccessWithReceipt(res.payment);
    } else {
      setError(res.error || 'فشلت عملية حفظ السداد');
    }
  };

  return (
    <div
      id="record-subscription-payment-modal-overlay"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
    >
      <div
        id="record-subscription-payment-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden my-auto animate-scaleUp"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                تسجيل سداد اشتراك شهري
              </h2>
              <p className="text-xs text-emerald-100 font-medium">
                {subscription.customerName} — {subscription.subscriptionType}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer Summary Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-xs">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  {subscription.customerName}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {subscription.customerPhone}
                </p>
              </div>
            </div>
            <div className="text-left">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {subscription.amount.toLocaleString()} {subscription.currency} / شهر
              </span>
            </div>
          </div>

          {/* Month Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>اختر الأشهر المراد سدادها *</span>
              </label>
              {unpaidMonths.length > 1 && (
                <button
                  type="button"
                  onClick={selectAllUnpaid}
                  className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  تحديد كافة غير المسدد ({unpaidMonths.length})
                </button>
              )}
            </div>

            {unpaidMonths.length === 0 ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-center text-xs font-bold text-emerald-700 dark:text-emerald-300">
                جميع الأشهر السابقة مسددة بالكامل لهذا الاشتراك 🎉
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                {unpaidMonths.map((m) => {
                  const isChecked = selectedMonthIds.includes(m.id);
                  return (
                    <div
                      key={m.id}
                      onClick={() => toggleMonth(m.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer select-none transition-all flex items-center justify-between ${
                        isChecked
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-100 shadow-sm'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-emerald-300 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                            isChecked
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold">{m.monthLabel}</p>
                          <p className="text-[10px] text-slate-400">
                            استحقاق: {m.dueDate}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        {m.amount.toLocaleString()} {m.currency}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Amount Calculation Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/80 dark:border-emerald-900/60 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                إجمالي المبلغ المحسوب للسداد ({selectedMonthIds.length} شهر)
              </p>
              <p className="text-xl font-black text-emerald-700 dark:text-emerald-300 tracking-tight">
                {computedTotal.toLocaleString()} {subscription.currency}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Receipt className="w-6 h-6" />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>طريقة الدفع</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cash', label: 'نقداً' },
                { id: 'transfer', label: 'تحويل بنكي' },
                { id: 'other', label: 'أخرى' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                    paymentMethod === m.id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>تاريخ السداد</span>
            </label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>ملاحظات السداد (اختياري)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: رقم الحوالة، تم التسليم باليد..."
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={selectedMonthIds.length === 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 active:scale-95 text-white text-xs font-black shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>تأكيد السداد وإصدار الإيصال</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
