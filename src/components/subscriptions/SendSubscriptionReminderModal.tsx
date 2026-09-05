import React, { useState } from 'react';
import {
  X,
  Send,
  MessageCircle,
  Copy,
  Check,
  Calendar,
  AlertTriangle,
  Receipt,
  Edit3,
} from 'lucide-react';
import { Subscription, SubscriptionMonth } from '../../types';
import {
  openWhatsAppChat,
  generateSubscriptionReminderMessage,
} from '../../services/whatsapp';
import { db, getArabicMonthName } from '../../services/db';

interface SendSubscriptionReminderModalProps {
  subscription: Subscription;
  months: SubscriptionMonth[];
  onClose: () => void;
  onOpenReminderVoucher: () => void;
}

export const SendSubscriptionReminderModal: React.FC<SendSubscriptionReminderModalProps> = ({
  subscription,
  months,
  onClose,
  onOpenReminderVoucher,
}) => {
  const unpaidMonths = months.filter((m) => m.status === 'unpaid');
  const totalDue = unpaidMonths.reduce((sum, m) => sum + Number(m.amount), 0);

  const now = new Date();
  const currentMonthLabel = `${getArabicMonthName(now.getMonth() + 1)} ${now.getFullYear()}`;

  const defaultMessage = generateSubscriptionReminderMessage({
    customerName: subscription.customerName,
    subscriptionType: subscription.subscriptionType,
    amount: subscription.amount,
    currency: subscription.currency,
    dueDay: subscription.dueDay,
    currentMonth: currentMonthLabel,
    unpaidMonths: unpaidMonths.map((m) => ({
      monthLabel: m.monthLabel,
      amount: Number(m.amount),
    })),
    totalDue,
  });

  const [messageText, setMessageText] = useState<string>(defaultMessage);
  const [copied, setCopied] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    // Record reminder event in database
    db.createSubscriptionReminder({
      subscriptionId: subscription.id,
      customMessage: messageText,
    });

    openWhatsAppChat(subscription.customerPhone, messageText);
    onClose();
  };

  return (
    <div
      id="send-subscription-reminder-modal-overlay"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
    >
      <div
        id="send-subscription-reminder-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden my-auto animate-scaleUp"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                إرسال تذكير بالاشتراك الشهري
              </h2>
              <p className="text-xs text-emerald-100 font-medium">
                عبر تطبيق واتساب مع تفاصيل الأشهر المستحقة
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

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Summary Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                العميل:
              </span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                {subscription.customerName} ({subscription.customerPhone})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                نوع وقيمة الاشتراك:
              </span>
              <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
                {subscription.subscriptionType} — {subscription.amount.toLocaleString()} {subscription.currency}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>إجمالي الأشهر غير المسددة ({unpaidMonths.length}):</span>
              </span>
              <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                {totalDue.toLocaleString()} {subscription.currency}
              </span>
            </div>
          </div>

          {/* Unpaid Months Pills */}
          {unpaidMonths.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                الأشهر المدرجة في التذكير:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {unpaidMonths.map((m) => (
                  <span
                    key={m.id}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 flex items-center gap-1"
                  >
                    <Calendar className="w-3 h-3 text-rose-500" />
                    <span>{m.monthLabel}</span>
                    <span className="text-rose-400 font-normal">({m.amount} {m.currency})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Message Text Area / Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>نص رسالة الواتساب:</span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-[11px] text-violet-600 dark:text-violet-400 hover:underline font-bold flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isEditing ? 'معاينة' : 'تعديل النص'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
                </button>
              </div>
            </div>

            {isEditing ? (
              <textarea
                rows={8}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full text-xs font-mono p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
              />
            ) : (
              <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-xs font-medium text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed max-h-56 overflow-y-auto">
                {messageText}
              </div>
            )}
          </div>

          {/* Quick Notice */}
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-[11px] flex items-center justify-between">
            <span>هل تود طباعة أو مشاركة إشعار رسمي مطبوع؟</span>
            <button
              type="button"
              onClick={onOpenReminderVoucher}
              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all"
            >
              <Receipt className="w-3 h-3" />
              <span>سند تذكير</span>
            </button>
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
              type="button"
              onClick={handleSendWhatsApp}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 active:scale-95 text-white text-xs font-black shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>إرسال عبر واتساب الآن</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
