import React, { useRef, useState } from 'react';
import {
  X,
  Printer,
  Download,
  MessageCircle,
  CheckCircle2,
  Receipt,
  User,
  Phone,
  Calendar,
  CreditCard,
  Loader2,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { SubscriptionPayment, Subscription, UserSettings } from '../../types';
import { openWhatsAppChat, generateSubscriptionReceiptMessage } from '../../services/whatsapp';

interface SubscriptionReceiptVoucherModalProps {
  payment: SubscriptionPayment;
  subscription?: Subscription;
  remainingDue?: number;
  settings: UserSettings;
  onClose: () => void;
}

export const SubscriptionReceiptVoucherModal: React.FC<SubscriptionReceiptVoucherModalProps> = ({
  payment,
  subscription,
  remainingDue = 0,
  settings,
  onClose,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const voucherRef = useRef<HTMLDivElement>(null);

  const issueDate = new Date(payment.createdAt || payment.paymentDate).toLocaleDateString('ar-YE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const paymentMethodLabel =
    payment.paymentMethod === 'cash'
      ? 'نقدًا'
      : payment.paymentMethod === 'transfer'
      ? 'تحويل بنكي'
      : payment.paymentMethod;

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
      pdf.save(`سند_إيصال_اشتراك_${payment.customerName.replace(/\s+/g, '_')}_${payment.receiptNumber}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleShareWhatsApp = () => {
    const text = generateSubscriptionReceiptMessage({
      customerName: payment.customerName,
      subscriptionType: payment.subscriptionType,
      monthsPaid: payment.monthsPaidLabels || [],
      amountPaid: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      receiptNumber: payment.receiptNumber,
      paymentDate: payment.paymentDate,
      remainingDue,
    });
    openWhatsAppChat(payment.customerPhone, text);
  };

  return (
    <div
      id="subscription-receipt-voucher-modal"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[94vh] print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none animate-scaleUp"
      >
        {/* Modal Top Bar (hidden during print) */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between print:hidden border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span className="text-xs sm:text-sm font-black tracking-tight">
              سند إيصال سداد اشتراك رسمي
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>طباعة</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all"
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
              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all"
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
            {/* Header Badge */}
            <div className="mb-5 py-1.5 px-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-center font-black text-xs tracking-wide flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>سند إيصال سداد اشتراك شهري رسمي — معتمد</span>
            </div>

            {/* Shop Header */}
            <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4 mb-4">
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {settings.shopName || 'متجري'}
                </h1>
                <p className="text-xs font-bold text-slate-600">
                  {settings.ownerName ? `بإدارة: ${settings.ownerName}` : 'إدارة الحسابات'}
                </p>
                {settings.ownerPhone && (
                  <p className="text-xs text-slate-500 dir-ltr text-right">
                    هاتف: {settings.ownerPhone}
                  </p>
                )}
              </div>
              <div className="text-left space-y-1">
                <div className="px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-300 inline-block">
                  <span className="text-xs font-mono font-black text-emerald-900">
                    {payment.receiptNumber}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  تاريخ السداد: {payment.paymentDate}
                </p>
              </div>
            </div>

            {/* Customer & Subscription Info */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-4 text-xs">
              <div>
                <span className="text-slate-500 font-bold block text-[11px]">اسم العميل / المشترك:</span>
                <span className="font-black text-slate-900 text-sm block mt-0.5">
                  {payment.customerName}
                </span>
                <span className="text-slate-600 block dir-ltr text-right mt-0.5 text-[11px]">
                  {payment.customerPhone}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block text-[11px]">نوع الاشتراك:</span>
                <span className="font-bold text-violet-700 text-sm block mt-0.5">
                  {payment.subscriptionType}
                </span>
                <span className="text-slate-600 block mt-0.5 text-[11px]">
                  طريقة السداد: {paymentMethodLabel}
                </span>
              </div>
            </div>

            {/* Paid Amount Highlight Box */}
            <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-300 flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-black text-emerald-900 block">
                  المبلغ المستلم والمسدد:
                </span>
                <span className="text-[11px] text-emerald-700 font-medium">
                  عن شهر: {payment.monthsPaidLabels?.join('، ') || 'الشهر الحالي'}
                </span>
              </div>
              <div className="text-left">
                <span className="text-2xl sm:text-3xl font-black text-emerald-800 tracking-tight">
                  {payment.amount.toLocaleString()} {payment.currency}
                </span>
              </div>
            </div>

            {/* Breakdown of Months Paid */}
            {payment.monthsPaidLabels && payment.monthsPaidLabels.length > 0 && (
              <div className="mb-4 text-xs">
                <span className="text-slate-500 font-bold block mb-1.5">الأشهر المسددة بموجب هذا الإيصال:</span>
                <div className="flex flex-wrap gap-2">
                  {payment.monthsPaidLabels.map((lbl, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg bg-emerald-100/70 border border-emerald-300 font-bold text-emerald-800"
                    >
                      ✓ {lbl}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes if any */}
            {payment.notes && (
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs mb-4">
                <span className="font-bold text-slate-700">ملاحظات: </span>
                <span className="text-slate-600">{payment.notes}</span>
              </div>
            )}

            {/* Remaining Due Banner if any */}
            {remainingDue > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between mb-4">
                <span>المتبقي المستحق على المشترك (أشهر أخرى):</span>
                <span className="font-black text-amber-800">
                  {remainingDue.toLocaleString()} {payment.currency}
                </span>
              </div>
            )}

            {/* Footer / Stamp Area */}
            <div className="border-t border-slate-200 pt-4 flex items-end justify-between text-xs text-slate-500">
              <div>
                <p className="font-bold text-slate-700 mb-6">المستلم / أمين الصندوق</p>
                <div className="border-b border-dashed border-slate-400 w-32"></div>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-emerald-300 flex items-center justify-center text-[10px] text-emerald-600 font-bold mx-auto mb-1">
                  سداد معتمد ✓
                </div>
                <span className="text-[10px] text-slate-400">سند إلكتروني موثق</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
