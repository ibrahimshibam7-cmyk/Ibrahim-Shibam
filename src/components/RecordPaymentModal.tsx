import React, { useState } from 'react';
import { X, ArrowDownLeft, DollarSign, Calendar, FileText, User, MessageCircle, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CustomerWithStats, PaymentMethod, UserSettings } from '../types';
import { generatePaymentReceiptMessage, openWhatsAppChat } from '../services/whatsapp';

interface RecordPaymentModalProps {
  customers: CustomerWithStats[];
  preselectedCustomerId?: string;
  settings: UserSettings;
  onClose: () => void;
  onSubmit: (data: {
    customerId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDate?: string;
    notes?: string;
  }) => { success: boolean; isFullySettled?: boolean; error?: string };
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  customers,
  preselectedCustomerId,
  settings,
  onClose,
  onSubmit,
}) => {
  // Only customers with remaining debt
  const indebtedCustomers = customers.filter((c) => c.remaining > 0);

  const [customerId, setCustomerId] = useState(
    preselectedCustomerId || (indebtedCustomers.length > 0 ? indebtedCustomers[0].id : '')
  );
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successPaymentData, setSuccessPaymentData] = useState<{
    customerName: string;
    phone: string;
    amount: number;
    totalPaid: number;
    remaining: number;
    isFullySettled: boolean;
  } | null>(null);

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const currentRemaining = selectedCustomer ? selectedCustomer.remaining : 0;

  const handleQuickFillRemaining = () => {
    if (currentRemaining > 0) {
      setAmount(currentRemaining.toString());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError('يرجى اختيار العميل');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('يرجى إدخال مبلغ سداد صحيح أكبر من الصفر');
      return;
    }

    if (numAmount > currentRemaining) {
      setError(
        `لا يمكن تسجيل مبلغ سداد (${numAmount.toLocaleString()}) أكبر من المبلغ المتبقي على العميل (${currentRemaining.toLocaleString()} ${settings.currency})`
      );
      return;
    }

    const res = onSubmit({
      customerId,
      amount: numAmount,
      paymentMethod,
      paymentDate,
      notes: notes.trim(),
    });

    if (!res.success) {
      setError(res.error || 'حدث خطأ أثناء تسجيل السداد');
    } else {
      const isSettled = res.isFullySettled ?? (currentRemaining - numAmount <= 0);

      // Trigger celebration confetti if fully settled 🎉
      if (isSettled) {
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore if blocked
        }
      }

      // Show receipt / WhatsApp prompt dialog
      setSuccessPaymentData({
        customerName: selectedCustomer ? selectedCustomer.name : '',
        phone: selectedCustomer ? selectedCustomer.whatsapp || selectedCustomer.phone : '',
        amount: numAmount,
        totalPaid: (selectedCustomer ? selectedCustomer.totalPaid : 0) + numAmount,
        remaining: Math.max(0, currentRemaining - numAmount),
        isFullySettled: isSettled,
      });
    }
  };

  const handleSendWhatsAppReceipt = () => {
    if (!successPaymentData) return;
    const msg = generatePaymentReceiptMessage(
      successPaymentData.customerName,
      successPaymentData.amount,
      successPaymentData.totalPaid,
      successPaymentData.remaining,
      settings.currency
    );
    openWhatsAppChat(successPaymentData.phone, msg);
    onClose();
  };

  return (
    <div
      id="record-payment-modal-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4 animate-fadeIn"
    >
      <div
        id="record-payment-sheet"
        className="w-full sm:max-w-md bg-white dark:bg-slate-900 sm:rounded-3xl rounded-t-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Success Screen after Recording Payment */}
        {successPaymentData ? (
          <div className="p-6 text-center space-y-4 my-auto">
            <div
              className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
                successPaymentData.isFullySettled
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600'
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600'
              }`}
            >
              {successPaymentData.isFullySettled ? (
                <span className="text-3xl">🎉</span>
              ) : (
                <CheckCircle2 className="w-9 h-9" />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {successPaymentData.isFullySettled
                  ? 'تم تسديد حساب العميل بالكامل 🎉'
                  : 'تم تسجيل السداد بنجاح'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تم استلام مبلغ {successPaymentData.amount.toLocaleString()} {settings.currency} من {successPaymentData.customerName}
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>المبلغ المسدد:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {successPaymentData.amount.toLocaleString()} {settings.currency}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>المتبقي في الحساب:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {successPaymentData.remaining.toLocaleString()} {settings.currency}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                id="payment-send-wa-receipt-btn"
                onClick={handleSendWhatsAppReceipt}
                className="w-full h-12 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-600/30 hover:bg-emerald-700 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>إرسال إشعار للعميل عبر WhatsApp</span>
              </button>

              <button
                onClick={onClose}
                className="w-full h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                تم الإنتهاء
              </button>
            </div>
          </div>
        ) : (
          /* Payment Form */
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    تسجيل سداد
                  </h3>
                  {selectedCustomer && (
                    <span className="text-[11px] text-slate-400">
                      من: {selectedCustomer.name}
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                  <span>{error}</span>
                </div>
              )}

              {/* Customer Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>العميل <span className="text-rose-500">*</span></span>
                </label>
                {preselectedCustomerId ? (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white">
                    {selectedCustomer?.name}
                  </div>
                ) : (
                  <select
                    required
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
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

              {/* Outstanding Balance Reminder Banner */}
              {selectedCustomer && (
                <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-900/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-teal-700 dark:text-teal-300 font-semibold block">
                      المبلغ المتبقي حاليًا
                    </span>
                    <span className="text-base font-black text-teal-800 dark:text-teal-200">
                      {currentRemaining.toLocaleString()} {settings.currency}
                    </span>
                  </div>
                  {currentRemaining > 0 && (
                    <button
                      type="button"
                      onClick={handleQuickFillRemaining}
                      className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-teal-300 dark:border-teal-700 text-[11px] font-bold text-teal-700 dark:text-teal-300 hover:bg-teal-100 transition-colors"
                    >
                      تسديد كامل المبلغ
                    </button>
                  )}
                </div>
              )}

              {/* Payment Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>مبلغ السداد <span className="text-rose-500">*</span></span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    الحد الأقصى: {currentRemaining.toLocaleString()} {settings.currency}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    max={currentRemaining > 0 ? currentRemaining : undefined}
                    required
                    autoFocus
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-12 pr-4 pl-14 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-extrabold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                  />
                  <span className="absolute left-3 top-3.5 text-xs font-bold text-slate-400 pointer-events-none">
                    {settings.currency}
                  </span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  طريقة الدفع
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cash', label: 'نقدًا' },
                    { id: 'transfer', label: 'تحويل بنكي' },
                    { id: 'other', label: 'أخرى' },
                  ].map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                      className={`h-10 rounded-xl text-xs font-bold border transition-all ${
                        paymentMethod === method.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>تاريخ السداد</span>
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full h-11 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>ملاحظات (اختياري)</span>
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات حول الدفعة أو رقم الحوالة..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none"
                />
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  id="submit-payment-btn"
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-md shadow-emerald-600/30 hover:shadow-emerald-600/40 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>تسجيل السداد</span>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
