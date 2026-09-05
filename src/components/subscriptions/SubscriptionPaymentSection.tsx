import React, { useState, useEffect } from 'react';
import {
  Check,
  DollarSign,
  Calendar,
  CreditCard,
  FileText,
  AlertCircle,
  Receipt,
  CheckCircle2,
  Printer,
  Sparkles,
  Plus,
  ArrowRight,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import {
  Subscription,
  SubscriptionMonth,
  SubscriptionPayment,
  PaymentMethod,
  UserSettings,
} from '../../types';
import { db } from '../../services/db';

interface SubscriptionPaymentSectionProps {
  subscription: Subscription;
  months: SubscriptionMonth[];
  settings: UserSettings;
  preselectedMonthIds?: string[];
  onPaymentSuccess: (payment: SubscriptionPayment) => void;
  onOpenReceiptVoucher: (payment: SubscriptionPayment) => void;
  onBackToMonths: () => void;
  onAddNextMonth?: () => void;
}

export const SubscriptionPaymentSection: React.FC<SubscriptionPaymentSectionProps> = ({
  subscription,
  months,
  settings,
  preselectedMonthIds = [],
  onPaymentSuccess,
  onOpenReceiptVoucher,
  onBackToMonths,
  onAddNextMonth,
}) => {
  const unpaidMonths = months.filter((m) => m.status === 'unpaid');

  // Month selection state
  const [selectedMonthIds, setSelectedMonthIds] = useState<string[]>(() => {
    if (preselectedMonthIds && preselectedMonthIds.length > 0) {
      return preselectedMonthIds.filter((id) =>
        unpaidMonths.some((um) => um.id === id)
      );
    }
    // Default to the first unpaid month if available
    return unpaidMonths.length > 0 ? [unpaidMonths[0].id] : [];
  });

  // Sync if preselectedMonthIds changes externally
  useEffect(() => {
    if (preselectedMonthIds && preselectedMonthIds.length > 0) {
      setSelectedMonthIds(
        preselectedMonthIds.filter((id) => unpaidMonths.some((um) => um.id === id))
      );
    }
  }, [preselectedMonthIds]);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success state after completing payment
  const [completedPayment, setCompletedPayment] = useState<SubscriptionPayment | null>(null);

  // Calculate sum of selected months
  const selectedMonths = months.filter((m) => selectedMonthIds.includes(m.id));
  const totalAmountToPay = selectedMonths.reduce(
    (sum, m) => sum + Number(m.amount),
    0
  );

  const toggleMonth = (id: string) => {
    setSelectedMonthIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
    setError(null);
  };

  const selectAllUnpaid = () => {
    setSelectedMonthIds(unpaidMonths.map((m) => m.id));
    setError(null);
  };

  const deselectAll = () => {
    setSelectedMonthIds([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedMonthIds.length === 0) {
      setError('يرجى اختيار شهر واحد على الأقل لسداد قيمته');
      return;
    }

    if (totalAmountToPay <= 0) {
      setError('إجمالي المبلغ المختار غير صالح');
      return;
    }

    try {
      setIsSubmitting(true);

      // Execute database update
      const res = db.recordSubscriptionPayment({
        subscriptionId: subscription.id,
        monthIds: selectedMonthIds,
        amount: totalAmountToPay,
        currency: subscription.currency,
        paymentMethod,
        paymentDate,
        notes: notes.trim(),
      });

      if (res.success && res.payment) {
        setCompletedPayment(res.payment);
        onPaymentSuccess(res.payment);
      } else {
        setError(res.error || 'تعذر تسجيل السداد في قاعدة البيانات');
      }
    } catch (err) {
      console.error('Payment submission error:', err);
      setError('حدث خطأ أثناء حفظ السداد. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Success state view: Shows receipt issuance button & print option
  if (completedPayment) {
    return (
      <div
        id="subscription-payment-success-card"
        className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-emerald-50/80 via-white to-emerald-50/40 dark:from-emerald-950/30 dark:via-slate-900 dark:to-emerald-950/20 border-2 border-emerald-200 dark:border-emerald-800/80 text-center animate-fadeIn space-y-6"
      >
        {/* Animated Checkmark */}
        <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            تم تحديث قاعدة البيانات بنجاح
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            تم تسجيل سداد الاشتراك بنجاح!
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            تم تحديث حالة الأشهر المحددة إلى (مسدد) وتوثيق الإيصال برقم تسلسلي معتمد.
          </p>
        </div>

        {/* Voucher summary box */}
        <div className="max-w-md mx-auto p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm text-right space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2.5">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
              رقم سند الإيصال:
            </span>
            <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
              {completedPayment.receiptNumber}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2.5">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
              المبلغ المسدد:
            </span>
            <span className="text-base font-black text-slate-900 dark:text-white">
              {completedPayment.amount.toLocaleString()} {completedPayment.currency}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2.5">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
              الأشهر المسددة:
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {completedPayment.monthsPaidLabels?.join('، ') || 'الشهر الحالي'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
              تاريخ وطريقة السداد:
            </span>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {completedPayment.paymentDate} (
              {completedPayment.paymentMethod === 'cash'
                ? 'نقدًا'
                : completedPayment.paymentMethod === 'transfer'
                ? 'تحويل بنكي'
                : completedPayment.paymentMethod}
              )
            </span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {/* Issue Official Receipt Voucher Button (Requested by user) */}
          <button
            id="issue-receipt-voucher-btn"
            onClick={() => onOpenReceiptVoucher(completedPayment)}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            <span>إصدار ومعاينة سند الإيصال المعتمد</span>
          </button>

          <button
            onClick={() => {
              setCompletedPayment(null);
              // Reset selection to remaining unpaid months
              const updatedUnpaid = months.filter(
                (m) => m.status === 'unpaid' && !selectedMonthIds.includes(m.id)
              );
              setSelectedMonthIds(updatedUnpaid.length > 0 ? [updatedUnpaid[0].id] : []);
            }}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل سداد آخر</span>
          </button>

          <button
            onClick={onBackToMonths}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة لسجل الأشهر</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. Main Payment Form
  return (
    <div
      id="subscription-payment-recorder-form"
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-sm space-y-5 animate-fadeIn"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              تسجيل سداد اشتراك
            </h3>
            <p className="text-[11px] text-slate-400">
              حدد الشهر أو الأشهر المراد سدادها وتحديث حالتها في قاعدة البيانات
            </p>
          </div>
        </div>

        {unpaidMonths.length > 0 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={selectAllUnpaid}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 hover:bg-violet-100 transition-colors cursor-pointer"
            >
              تحديد كل غير المسدد ({unpaidMonths.length})
            </button>
            {selectedMonthIds.length > 0 && (
              <button
                type="button"
                onClick={deselectAll}
                className="text-[11px] font-bold px-2 py-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                إلغاء التحديد
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Case A: All months paid */}
      {unpaidMonths.length === 0 ? (
        <div className="p-6 text-center rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <Check className="w-6 h-6" />
          </div>
          <p className="text-xs font-black text-emerald-900 dark:text-emerald-200">
            جميع الأشهر الحالية لهذا المشترك مسددة بالكامل!
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            لا توجد أي متأخرات مستحقة. إذا كان العميل يرغب في السداد مقدماً لشهر قادم، يمكنك إضافة الشهر التالي الآن.
          </p>
          {onAddNextMonth && (
            <button
              type="button"
              onClick={onAddNextMonth}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ إضافة الشهر القادم وسداده مقدماً</span>
            </button>
          )}
        </div>
      ) : (
        /* Case B: Selection of Months */
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Months Selection Grid */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
              اختر الشهر أو الأشهر المسددة:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
              {unpaidMonths.map((m) => {
                const isSelected = selectedMonthIds.includes(m.id);
                const isDueOverdue = new Date(m.dueDate) < new Date();
                return (
                  <div
                    key={m.id}
                    onClick={() => toggleMonth(m.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                      isSelected
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                          {m.monthLabel}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          الاستحقاق: {m.dueDate}
                          {isDueOverdue && (
                            <span className="text-rose-500 font-bold mr-1">
                              (متأخر)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="text-left">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                        {m.amount.toLocaleString()} {m.currency}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dynamic Summary of Selected Months */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                إجمالي المبلغ المحدد للسداد:
              </span>
              <span className="text-[11px] text-slate-400">
                {selectedMonths.length > 0
                  ? `تم تحديد ${selectedMonths.length} أشهر: (${selectedMonths
                      .map((m) => m.monthLabel)
                      .join('، ')})`
                  : 'لم يتم تحديد أي شهر بعد'}
              </span>
            </div>
            <div className="text-left">
              <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400">
                {totalAmountToPay.toLocaleString()} {subscription.currency}
              </span>
            </div>
          </div>

          {/* Payment Method & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Payment Method */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                طريقة الدفع:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    paymentMethod === 'cash'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  نقدًا (كاش)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('transfer')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    paymentMethod === 'transfer'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  تحويل بنكي
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('other')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    paymentMethod === 'other'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  شبكة / أخرى
                </button>
              </div>
            </div>

            {/* Payment Date */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                تاريخ السداد:
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              ملاحظات أو رقم الإيداع / الحوالة (اختياري):
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: حوالة عبر الكريمي، أو سداد كاش باليد..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              disabled={isSubmitting || selectedMonthIds.length === 0}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'جاري التحديث والحفظ...'
                  : `تأكيد سداد (${totalAmountToPay.toLocaleString()} ${subscription.currency})`}
              </span>
            </button>

            <button
              type="button"
              onClick={onBackToMonths}
              className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
