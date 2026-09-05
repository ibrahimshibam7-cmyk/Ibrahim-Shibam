import React, { useRef, useState } from 'react';
import {
  X,
  Printer,
  Download,
  MessageCircle,
  AlertTriangle,
  Store,
  Calendar,
  Clock,
  User,
  Phone,
  ShieldCheck,
  Check,
  Loader2,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Subscription, SubscriptionMonth, UserSettings } from '../../types';
import { openWhatsAppChat, generateSubscriptionReminderMessage } from '../../services/whatsapp';
import { getArabicMonthName } from '../../services/db';

interface SubscriptionReminderVoucherModalProps {
  subscription: Subscription;
  months: SubscriptionMonth[];
  settings: UserSettings;
  onClose: () => void;
}

export const SubscriptionReminderVoucherModal: React.FC<SubscriptionReminderVoucherModalProps> = ({
  subscription,
  months,
  settings,
  onClose,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copied, setCopied] = useState(false);
  const voucherRef = useRef<HTMLDivElement>(null);

  const unpaidMonths = months.filter((m) => m.status === 'unpaid');
  const totalDue = unpaidMonths.reduce((sum, m) => sum + Number(m.amount), 0);

  const now = new Date();
  const currentMonthLabel = `${getArabicMonthName(now.getMonth() + 1)} ${now.getFullYear()}`;
  const voucherNumber = `REM-SUB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${subscription.id.replace('SUB-', '')}`;

  const issueDate = now.toLocaleDateString('ar-YE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!voucherRef.current) return;
    try {
      setIsGeneratingPdf(true);
      const canvas = await html2canvas(voucherRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = 210;
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;
      const contentHeight = (canvas.height * contentWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, contentHeight);
      pdf.save(`سند_تذكير_${subscription.customerName.replace(/\s+/g, '_')}_${voucherNumber}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleShareWhatsApp = () => {
    const text = generateSubscriptionReminderMessage({
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
    openWhatsAppChat(subscription.customerPhone, text);
  };

  return (
    <div
      id="subscription-reminder-voucher-modal"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[94vh] print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none"
      >
        {/* Modal Top Bar (hidden during print) */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between print:hidden border-b border-slate-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-xs sm:text-sm font-black tracking-tight">
              معاينة سند التذكير بمستحقات الاشتراك
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>طباعة</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>تحميل PDF</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>واتساب</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Voucher Document Container */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-slate-100/60 dark:bg-slate-950/40 print:bg-white print:p-0">
          <div
            ref={voucherRef}
            className="bg-white text-slate-900 p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 print:border-none print:shadow-none mx-auto max-w-xl font-sans"
            style={{ direction: 'rtl' }}
          >
            {/* Header Disclaimer Badge */}
            <div className="mb-5 py-1.5 px-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-center font-black text-xs tracking-wide">
              ⚠️ سند تذكير بمستحقات اشتراك — وليس سند إيصال سداد
            </div>

            {/* Shop Header */}
            <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4 mb-4">
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {settings.shopName || 'متجري'}
                </h1>
                <p className="text-xs font-bold text-slate-600">
                  {settings.ownerName ? `بإدارة: ${settings.ownerName}` : 'إدارة المشتركين'}
                </p>
                {settings.ownerPhone && (
                  <p className="text-xs text-slate-500 dir-ltr text-right">
                    هاتف: {settings.ownerPhone}
                  </p>
                )}
              </div>
              <div className="text-left space-y-1">
                <div className="px-3 py-1 rounded-lg bg-slate-100 border border-slate-300 inline-block">
                  <span className="text-[11px] font-mono font-bold text-slate-800">
                    {voucherNumber}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  التاريخ: {issueDate}
                </p>
              </div>
            </div>

            {/* Customer & Subscription Info Box */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-4 text-xs">
              <div>
                <span className="text-slate-500 font-bold block text-[11px]">اسم العميل / المشترك:</span>
                <span className="font-black text-slate-900 text-sm block mt-0.5">
                  {subscription.customerName}
                </span>
                <span className="text-slate-600 block dir-ltr text-right mt-0.5 text-[11px]">
                  {subscription.customerPhone}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block text-[11px]">نوع الاشتراك:</span>
                <span className="font-bold text-violet-700 text-sm block mt-0.5">
                  {subscription.subscriptionType}
                </span>
                <span className="text-slate-600 block mt-0.5 text-[11px]">
                  قيمة الاشتراك: {subscription.amount.toLocaleString()} {subscription.currency} / شهر
                </span>
              </div>
            </div>

            {/* Notice Statement */}
            <p className="text-xs text-slate-700 leading-relaxed mb-4">
              نود إحاطتكم علمًا بأن الأشهر الموضحة أدناه مستحقة السداد، ونرجو منكم التكرم
              بالمبادرة بتسديدها لضمان استمرار الخدمة بانتظام:
            </p>

            {/* Unpaid Months Table */}
            <table className="w-full text-xs border-collapse mb-4 border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-black border-b border-slate-300">
                  <th className="py-2 px-3 text-right">#</th>
                  <th className="py-2 px-3 text-right">الشهر المستحق</th>
                  <th className="py-2 px-3 text-right">تاريخ الاستحقاق</th>
                  <th className="py-2 px-3 text-left">المبلغ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {unpaidMonths.map((m, idx) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-500 font-mono">{idx + 1}</td>
                    <td className="py-2 px-3 font-bold text-slate-800">{m.monthLabel}</td>
                    <td className="py-2 px-3 text-slate-600">{m.dueDate}</td>
                    <td className="py-2 px-3 text-left font-black text-slate-900">
                      {m.amount.toLocaleString()} {m.currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total Due Callout Box */}
            <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 flex items-center justify-between mb-6">
              <div>
                <span className="text-xs font-black text-amber-900 block">
                  إجمالي المبلغ المستحق المطلوب سداده:
                </span>
                <span className="text-[11px] text-amber-700 font-medium">
                  عدد الأشهر غير المسددة: {unpaidMonths.length} شهر
                </span>
              </div>
              <div className="text-left">
                <span className="text-xl sm:text-2xl font-black text-amber-900 tracking-tight">
                  {totalDue.toLocaleString()} {subscription.currency}
                </span>
              </div>
            </div>

            {/* Footer / Stamp Area */}
            <div className="border-t border-slate-200 pt-4 flex items-end justify-between text-xs text-slate-500">
              <div>
                <p className="font-bold text-slate-700 mb-6">إدارة الحسابات والاشتراكات</p>
                <div className="border-b border-dashed border-slate-400 w-32"></div>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400 font-bold mx-auto mb-1">
                  الختم الرسمي
                </div>
                <span className="text-[10px] text-slate-400">إشعار صادر آليًا</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
