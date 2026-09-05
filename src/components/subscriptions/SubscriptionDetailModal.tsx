import React, { useState } from 'react';
import {
  X,
  Calendar,
  DollarSign,
  User,
  Phone,
  Tag,
  Clock,
  Bell,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Plus,
  Edit2,
  Trash2,
  CreditCard,
  MessageCircle,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import {
  Subscription,
  SubscriptionMonth,
  SubscriptionPayment,
  UserSettings,
} from '../../types';
import { db } from '../../services/db';
import { SubscriptionPaymentSection } from './SubscriptionPaymentSection';
import { SubscriptionReceiptVoucherModal } from './SubscriptionReceiptVoucherModal';

interface SubscriptionDetailModalProps {
  subscription: Subscription;
  months: SubscriptionMonth[];
  payments: SubscriptionPayment[];
  settings: UserSettings;
  onClose: () => void;
  onOpenRecordPayment: (sub: Subscription) => void;
  onOpenSendReminder: (sub: Subscription) => void;
  onOpenReminderVoucher: (sub: Subscription) => void;
  onOpenReceiptVoucher: (payment: SubscriptionPayment) => void;
  onOpenEdit: (sub: Subscription) => void;
  onDelete: (subId: string) => void;
  onRefresh: () => void;
}

export const SubscriptionDetailModal: React.FC<SubscriptionDetailModalProps> = ({
  subscription,
  months,
  payments,
  settings,
  onClose,
  onOpenRecordPayment,
  onOpenSendReminder,
  onOpenReminderVoucher,
  onOpenReceiptVoucher,
  onOpenEdit,
  onDelete,
  onRefresh,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'months' | 'record_payment' | 'payments'>('months');
  const [selectedMonthIdsForPayment, setSelectedMonthIdsForPayment] = useState<string[]>([]);
  const [activeReceiptPayment, setActiveReceiptPayment] = useState<SubscriptionPayment | null>(null);

  const unpaidMonths = months.filter((m) => m.status === 'unpaid');
  const paidMonths = months.filter((m) => m.status === 'paid');

  const totalUnpaidAmount = unpaidMonths.reduce((sum, m) => sum + Number(m.amount), 0);
  const totalPaidAmount = paidMonths.reduce(
    (sum, m) => sum + (Number(m.paidAmount) || Number(m.amount)),
    0
  );

  const handleAddNextMonth = () => {
    // Find the latest month recorded
    if (months.length === 0) return;
    const latest = months[months.length - 1];
    let nextYear = latest.year;
    let nextMonth = latest.monthIndex + 1;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear++;
    }

    const res = db.addCustomSubscriptionMonth(subscription.id, nextYear, nextMonth);
    if (res.success) {
      onRefresh();
    } else {
      alert(res.error || 'تعذر إضافة الشهر');
    }
  };

  const handleStartPaymentForMonth = (monthId: string) => {
    setSelectedMonthIdsForPayment([monthId]);
    setActiveSubTab('record_payment');
  };

  const handleStartPaymentAll = () => {
    setSelectedMonthIdsForPayment(unpaidMonths.map((m) => m.id));
    setActiveSubTab('record_payment');
  };

  return (
    <div
      id="subscription-detail-modal-overlay"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-2 sm:p-4 overflow-y-auto animate-fadeIn"
    >
      <div
        id="subscription-detail-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-scaleUp"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-700 via-indigo-700 to-purple-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  {subscription.customerName}
                </h2>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                    subscription.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
                      : 'bg-amber-500/20 text-amber-200 border-amber-400/30'
                  }`}
                >
                  {subscription.status === 'active' ? 'نشط' : 'متوقف'}
                </span>
              </div>
              <p className="text-xs text-violet-200 font-medium">
                {subscription.subscriptionType} — {subscription.customerPhone}
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

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Quick Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap pb-3 border-b border-slate-200/70 dark:border-slate-800">
            <button
              onClick={handleStartPaymentAll}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 ${
                activeSubTab === 'record_payment'
                  ? 'bg-emerald-700 text-white ring-2 ring-emerald-500 shadow-md shadow-emerald-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>تسجيل سداد</span>
              {unpaidMonths.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-800 text-white font-bold">
                  {unpaidMonths.length}
                </span>
              )}
            </button>
            <button
              onClick={() => onOpenSendReminder(subscription)}
              className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-violet-600/20 transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>إرسال تذكير واتساب</span>
            </button>
            <button
              onClick={() => onOpenReminderVoucher(subscription)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <Receipt className="w-4 h-4" />
              <span>سند تذكير</span>
            </button>
            <button
              onClick={handleAddNextMonth}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ إضافة شهر قادم</span>
            </button>
            <button
              onClick={() => onOpenEdit(subscription)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>تعديل</span>
            </button>
            <div className="mr-auto">
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold flex items-center gap-1 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف الاشتراك</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 p-1 rounded-xl border border-rose-200 dark:border-rose-900/60">
                  <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 px-1.5">
                    تأكيد الحذف؟
                  </span>
                  <button
                    onClick={() => {
                      onDelete(subscription.id);
                      onClose();
                    }}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black"
                  >
                    نعم
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold"
                  >
                    إلغاء
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/50">
              <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400 block">
                مبلغ الاشتراك الشهري
              </span>
              <span className="text-base sm:text-lg font-black text-violet-900 dark:text-violet-100">
                {subscription.amount.toLocaleString()} {subscription.currency}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                استحقاق يوم {subscription.dueDay} من كل شهر
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50">
              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 block">
                إجمالي غير المسدد ({unpaidMonths.length} شهر)
              </span>
              <span className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400">
                {totalUnpaidAmount.toLocaleString()} {subscription.currency}
              </span>
              <span className="text-[10px] text-rose-400 block mt-0.5">
                {unpaidMonths.length > 0 ? 'مستحق للمطالبة' : 'لا توجد متأخرات 🎉'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block">
                إجمالي المسدد ({paidMonths.length} شهر)
              </span>
              <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                {totalPaidAmount.toLocaleString()} {subscription.currency}
              </span>
              <span className="text-[10px] text-emerald-500 block mt-0.5">
                مدفوع وموثق
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                تاريخ بداية الاشتراك
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mt-1">
                {subscription.startDate}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                تذكير قبل {subscription.reminderDaysBefore} أيام
              </span>
            </div>
          </div>

          {/* Unpaid Warning Banner if any */}
          {unpaidMonths.length > 0 && activeSubTab !== 'record_payment' && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 dark:from-rose-950/30 dark:via-amber-950/20 dark:to-orange-950/20 border border-rose-200/70 dark:border-rose-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                <div>
                  <p className="text-xs font-black text-rose-900 dark:text-rose-200">
                    تنبيه متأخرات: يوجد {unpaidMonths.length} أشهر غير مسددة بإجمالي{' '}
                    {totalUnpaidAmount.toLocaleString()} {subscription.currency}
                  </p>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300">
                    يمكنك تسجيل السداد الآن واختيار الأشهر المراد سدادها وإصدار سند إيصال فوري.
                  </p>
                </div>
              </div>
              <button
                onClick={handleStartPaymentAll}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-sm shrink-0 flex items-center gap-1"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>سداد الآن</span>
              </button>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveSubTab('months')}
              className={`pb-2 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                activeSubTab === 'months'
                  ? 'border-violet-600 text-violet-600 dark:text-violet-400 font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>سجل الأشهر والحالات</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 font-bold">
                {months.length}
              </span>
            </button>

            <button
              onClick={() => {
                if (selectedMonthIdsForPayment.length === 0 && unpaidMonths.length > 0) {
                  setSelectedMonthIdsForPayment([unpaidMonths[0].id]);
                }
                setActiveSubTab('record_payment');
              }}
              className={`pb-2 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                activeSubTab === 'record_payment'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>تسجيل سداد</span>
              {unpaidMonths.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-bold animate-pulse">
                  {unpaidMonths.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSubTab('payments')}
              className={`pb-2 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                activeSubTab === 'payments'
                  ? 'border-violet-600 text-violet-600 dark:text-violet-400 font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>سجل سندات السداد ({payments.length})</span>
            </button>
          </div>

          {/* Tab 1: Months Table */}
          {activeSubTab === 'months' && (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <table className="w-full text-xs text-right divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-black">
                  <tr>
                    <th className="py-3 px-3.5">الشهر</th>
                    <th className="py-3 px-3">الاستحقاق</th>
                    <th className="py-3 px-3">المبلغ</th>
                    <th className="py-3 px-3">الحالة</th>
                    <th className="py-3 px-3">تاريخ السداد</th>
                    <th className="py-3 px-3">طريقة الدفع</th>
                    <th className="py-3 px-3 text-left">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                  {months.map((m) => {
                    const isPaid = m.status === 'paid';
                    return (
                      <tr
                        key={m.id}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                          !isPaid ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''
                        }`}
                      >
                        <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-white">
                          {m.monthLabel}
                        </td>
                        <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          {m.dueDate}
                        </td>
                        <td className="py-3 px-3 font-black text-slate-800 dark:text-slate-200">
                          {m.amount.toLocaleString()} {m.currency}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-lg border ${
                              isPaid
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            {isPaid ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span>مسدد</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3 text-rose-500" />
                                <span>غير مسدد</span>
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 dark:text-slate-400 text-[11px]">
                          {m.paidDate || '—'}
                        </td>
                        <td className="py-3 px-3 text-slate-500 dark:text-slate-400 text-[11px]">
                          {m.paymentMethod === 'cash'
                            ? 'نقدًا'
                            : m.paymentMethod === 'transfer'
                            ? 'تحويل بنكي'
                            : m.paymentMethod || '—'}
                        </td>
                        <td className="py-3 px-3 text-left">
                          {!isPaid ? (
                            <button
                              onClick={() => handleStartPaymentForMonth(m.id)}
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] transition-all shadow-sm active:scale-95 flex items-center gap-1"
                            >
                              <DollarSign className="w-3 h-3" />
                              <span>سداد</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5 justify-end">
                              <span className="text-[10px] text-emerald-600 font-bold">
                                تم السداد ✓
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 2: Inline Payment Recording Component */}
          {activeSubTab === 'record_payment' && (
            <SubscriptionPaymentSection
              subscription={subscription}
              months={months}
              settings={settings}
              preselectedMonthIds={selectedMonthIdsForPayment}
              onPaymentSuccess={(payment) => {
                onRefresh();
              }}
              onOpenReceiptVoucher={(payment) => {
                setActiveReceiptPayment(payment);
                onOpenReceiptVoucher(payment);
              }}
              onBackToMonths={() => setActiveSubTab('months')}
              onAddNextMonth={handleAddNextMonth}
            />
          )}

          {/* Tab 3: Payments Log */}
          {activeSubTab === 'payments' && (
            <div className="space-y-2">
              {payments.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-bold rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                  <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>لا توجد عمليات سداد مسجلة حتى الآن لهذا الاشتراك</p>
                  {unpaidMonths.length > 0 && (
                    <button
                      onClick={handleStartPaymentAll}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all"
                    >
                      تسجيل سداد الآن
                    </button>
                  )}
                </div>
              ) : (
                payments.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                          {p.receiptNumber}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {p.paymentDate}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        عن شهر: {p.monthsPaidLabels?.join('، ') || 'الشهر الحالي'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-left">
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 block">
                          {p.amount.toLocaleString()} {p.currency}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {p.paymentMethod === 'cash' ? 'نقدًا' : 'تحويل'}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setActiveReceiptPayment(p);
                          onOpenReceiptVoucher(p);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-emerald-500 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                      >
                        <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                        <span>سند الإيصال (طباعة)</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Notes if any */}
          {subscription.notes && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-bold text-slate-700 dark:text-slate-200">ملاحظات الاشتراك: </span>
              <span>{subscription.notes}</span>
            </div>
          )}
        </div>

        {/* Local Receipt Voucher Modal if opened from within the details page */}
        {activeReceiptPayment && (
          <SubscriptionReceiptVoucherModal
            payment={activeReceiptPayment}
            subscription={subscription}
            remainingDue={totalUnpaidAmount}
            settings={settings}
            onClose={() => setActiveReceiptPayment(null)}
          />
        )}
      </div>
    </div>
  );
};
