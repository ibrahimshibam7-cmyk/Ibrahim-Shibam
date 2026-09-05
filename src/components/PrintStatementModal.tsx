import React, { useState, useRef } from 'react';
import {
  X,
  Printer,
  MessageCircle,
  FileText,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Store,
  User,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  Building2,
  Check,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { CustomerWithStats, StatementItem, UserSettings } from '../types';
import {
  generateStatementWhatsAppMessage,
  openWhatsAppChat,
} from '../services/whatsapp';

interface PrintStatementModalProps {
  customer: CustomerWithStats;
  statement: StatementItem[];
  settings: UserSettings;
  onClose: () => void;
}

export const PrintStatementModal: React.FC<PrintStatementModalProps> = ({
  customer,
  statement,
  settings,
  onClose,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  const statementRef = useRef<HTMLDivElement>(null);

  const issueDate = new Date().toLocaleDateString('ar-YE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const issueTime = new Date().toLocaleTimeString('ar-YE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const statementNumber = `STMT-${customer.id.replace('CUST-', '')}-${new Date().getFullYear()}${String(
    new Date().getMonth() + 1
  ).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}`;

  const handlePrint = () => {
    window.print();
  };

  /**
   * Helper to capture the statement HTML and generate a high-res PDF Blob
   */
  const buildPdfBlob = async (): Promise<{ blob: Blob; filename: string }> => {
    const targetElement = statementRef.current;
    if (!targetElement) {
      throw new Error('تعذر العثور على محتوى الكشف');
    }

    // Capture using html2canvas with high scale for retina/print crispness
    const canvas = await html2canvas(targetElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: targetElement.scrollWidth || 800,
    });

    const imgData = canvas.toDataURL('image/png', 1.0);

    // Initialize A4 PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = 8; // 8mm margin
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    let heightLeft = contentHeight;
    let position = margin;

    // First page
    pdf.addImage(
      imgData,
      'PNG',
      margin,
      position,
      contentWidth,
      contentHeight,
      undefined,
      'FAST'
    );
    heightLeft -= pageHeight - margin * 2;

    // Multi-page handling for long statements
    while (heightLeft > 0) {
      position = heightLeft - contentHeight + margin;
      pdf.addPage();
      pdf.addImage(
        imgData,
        'PNG',
        margin,
        position,
        contentWidth,
        contentHeight,
        undefined,
        'FAST'
      );
      heightLeft -= pageHeight - margin * 2;
    }

    const cleanName = customer.name.replace(/[^\u0621-\u064Aa-zA-Z0-9]/g, '_');
    const todayStr = new Date().toISOString().split('T')[0];
    const filename = `كشف_حساب_${cleanName}_${todayStr}.pdf`;

    const blob = pdf.output('blob');
    return { blob, filename };
  };

  /**
   * Download the statement as a professional PDF file
   */
  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      setStatusMessage({ type: 'info', text: 'جاري إنشاء ملف الـ PDF بجودة عالية...' });

      const { blob, filename } = await buildPdfBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusMessage({
        type: 'success',
        text: 'تم تنزيل ملف كشف الحساب بصيغة PDF بنجاح!',
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error('PDF generation error:', err);
      setStatusMessage({
        type: 'error',
        text: 'حدث خطأ أثناء إنشاء ملف الـ PDF. يمكنك استخدام زر الطباعة مباشرة.',
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  /**
   * Share the PDF receipt via WhatsApp
   * Uses Web Share API with File when supported, or downloads PDF & opens WhatsApp conversation
   */
  const handleShareWhatsApp = async () => {
    const targetPhone = customer.whatsapp || customer.phone;

    try {
      setIsSharingWhatsApp(true);
      setStatusMessage({
        type: 'info',
        text: 'جاري معالجة الكشف وتجهيز الإيصال للمشاركة عبر واتساب...',
      });

      const { blob, filename } = await buildPdfBlob();
      const messageText = generateStatementWhatsAppMessage(
        customer,
        settings.currency,
        settings.shopName
      );

      // Create a real File object from the generated PDF blob
      const pdfFile = new File([blob], filename, { type: 'application/pdf' });

      // Check if navigator.share with files is supported (mobile browsers & modern web)
      if (
        typeof navigator !== 'undefined' &&
        navigator.canShare &&
        navigator.canShare({ files: [pdfFile] })
      ) {
        try {
          await navigator.share({
            title: `كشف حساب رسمي - ${customer.name}`,
            text: messageText,
            files: [pdfFile],
          });

          setStatusMessage({
            type: 'success',
            text: 'تمت مشاركة ملف الـ PDF كإيصال رسمي بنجاح!',
          });
          setTimeout(() => setStatusMessage(null), 4000);
          return;
        } catch (shareError) {
          // If user cancelled the share sheet, do not trigger fallback error
          if ((shareError as Error)?.name === 'AbortError') {
            setStatusMessage(null);
            return;
          }
          console.warn('Web Share API error, executing direct WhatsApp fallback:', shareError);
        }
      }

      // Fallback: Automatically download the PDF so the user has the physical receipt file,
      // and immediately open WhatsApp chat with the customer containing the formal statement message
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (targetPhone) {
        openWhatsAppChat(targetPhone, messageText);
        setStatusMessage({
          type: 'success',
          text: 'تم تنزيل ملف الـ PDF بنجاح وفتح محادثة واتساب لإرفاق الإيصال فوراً!',
        });
      } else {
        setStatusMessage({
          type: 'info',
          text: 'تم حفظ ملف الـ PDF على جهازك (لم يتم العثور على رقم هاتف مسجل للعميل).',
        });
      }

      setTimeout(() => setStatusMessage(null), 6000);
    } catch (err) {
      console.error('WhatsApp share error:', err);
      // Fallback: open WhatsApp text directly
      if (targetPhone) {
        const fallbackMsg = generateStatementWhatsAppMessage(
          customer,
          settings.currency,
          settings.shopName
        );
        openWhatsAppChat(targetPhone, fallbackMsg);
      }
      setStatusMessage({
        type: 'error',
        text: 'تم فتح المحادثة، يمكنك إرسال التقرير النصي للعميل مباشرة.',
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } finally {
      setIsSharingWhatsApp(false);
    }
  };

  return (
    <div
      id="print-statement-modal-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-2 sm:p-4 animate-fadeIn"
      dir="rtl"
    >
      {/* Comprehensive Custom Print & Typography CSS */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 10mm 12mm 10mm;
          }

          html, body {
            width: 100% !important;
            height: auto !important;
            min-height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            font-family: 'Cairo', 'Tajawal', -apple-system, BlinkMacSystemFont, sans-serif !important;
            direction: rtl !important;
            text-align: right !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            overflow: visible !important;
          }

          /* Hide everything outside the modal overlay */
          body > *:not(#root) {
            display: none !important;
          }
          #root > *:not(#print-statement-modal-overlay) {
            display: none !important;
          }

          /* Reset modal overlay for pure print display */
          #print-statement-modal-overlay {
            position: static !important;
            display: block !important;
            background: transparent !important;
            backdrop-filter: none !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            z-index: auto !important;
          }

          #print-statement-box {
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            max-height: none !important;
            background: transparent !important;
            overflow: visible !important;
            width: 100% !important;
            max-width: 100% !important;
            display: block !important;
          }

          .no-print {
            display: none !important;
          }

          /* The document itself */
          #printable-statement {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
            font-family: 'Cairo', 'Tajawal', sans-serif !important;
          }

          /* Force ink background graphics and colors */
          .print-badge,
          .print-header-badge,
          .print-stat-card,
          .print-table th,
          .print-table td,
          .print-tag {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* Avoid splitting elements across pages */
          .print-avoid-break,
          .print-header,
          .print-customer-box,
          .print-summary-grid,
          .print-signatures,
          .print-legal-notice,
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          thead {
            display: table-header-group !important;
          }

          tfoot {
            display: table-footer-group !important;
          }

          /* Table print styling */
          .print-table {
            width: 100% !important;
            border-collapse: collapse !important;
            border: 1.5px solid #0f172a !important;
          }

          .print-table th {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
            font-weight: 800 !important;
            border: 1px solid #94a3b8 !important;
            padding: 8px !important;
            text-align: right !important;
          }

          .print-table td {
            border: 1px solid #cbd5e1 !important;
            padding: 8px !important;
            text-align: right !important;
          }

          .print-table tfoot td {
            background-color: #f8fafc !important;
            border-top: 2px solid #0f172a !important;
            border-bottom: 3px double #0f172a !important;
            font-weight: 800 !important;
          }
        }
      `}</style>

      <div
        id="print-statement-box"
        className="w-full sm:max-w-3xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[96vh] flex flex-col font-['Cairo',sans-serif]"
      >
        {/* Top Control Bar (Hidden in Print) */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 bg-slate-50 dark:bg-slate-800/60 no-print">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>كشف حساب العميل الرسمي</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold">
                  حساباتي
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                تصدير PDF، طباعة فورية بدقة A4، ومشاركة الإيصال عبر واتساب
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Generate & Download PDF */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf || isSharingWhatsApp}
              className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              title="تصدير وتنزيل ملف PDF عالي الجودة"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>تحميل PDF</span>
            </button>

            {/* Send via WhatsApp (Official Receipt with PDF) */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              disabled={isGeneratingPdf || isSharingWhatsApp}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              title="مشاركة ملف الـ PDF كإيصال رسمي عبر واتساب"
            >
              {isSharingWhatsApp ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <MessageCircle className="w-3.5 h-3.5" />
              )}
              <span>إرسال عبر واتساب</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={isGeneratingPdf || isSharingWhatsApp}
              className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-xs hover:opacity-90 transition-opacity"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة الكشف</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Notification Banner */}
        {statusMessage && (
          <div
            className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b animate-fadeIn ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
                : statusMessage.type === 'info'
                ? 'bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900'
                : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : statusMessage.type === 'info' ? (
              <Loader2 className="w-4 h-4 shrink-0 animate-spin text-violet-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Scrollable Document Area (Holds the printable statement) */}
        <div className="p-3 sm:p-6 overflow-y-auto bg-slate-100 dark:bg-slate-950/40 flex justify-center">
          {/* Official Printable Statement Container */}
          <div
            ref={statementRef}
            id="printable-statement"
            className="w-full max-w-[760px] p-6 sm:p-8 bg-white text-slate-900 rounded-2xl shadow-md border border-slate-200 space-y-6 print:border-none print:shadow-none print:rounded-none relative"
            dir="rtl"
            style={{
              fontFamily: "'Cairo', 'Tajawal', sans-serif",
              direction: 'rtl',
              textAlign: 'right',
            }}
          >
            {/* Top Identity Accent Line ('حساباتي' Visual Signature) */}
            <div
              className="h-1.5 w-full rounded-full print-avoid-break"
              style={{
                background: 'linear-gradient(90deg, #0f766e 0%, #14b8a6 50%, #0f172a 100%)',
              }}
            />

            {/* Header: Store Identity & Document Details */}
            <div className="border-b-2 border-slate-900 pb-5 flex items-start justify-between gap-4 print-header print-avoid-break">
              {/* Right Side: Logo + Shop Details */}
              <div className="flex items-center gap-3.5">
                {settings.shopLogo ? (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-slate-300 p-1 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                    <img
                      src={settings.shopLogo}
                      alt={settings.shopName || 'شعار المحل'}
                      className="max-h-full max-w-full object-contain"
                      crossOrigin="anonymous"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-teal-800 text-white flex items-center justify-center shrink-0 shadow-xs border border-teal-900">
                    <Store className="w-7 h-7" />
                  </div>
                )}

                <div className="space-y-0.5">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                    {settings.shopName || 'المحل التجاري'}
                  </h1>
                  {settings.ownerName && (
                    <p className="text-xs text-slate-700 flex items-center gap-1 font-medium">
                      <span className="font-bold text-slate-900">بإدارة:</span>
                      <span>{settings.ownerName}</span>
                    </p>
                  )}
                  {settings.ownerPhone && (
                    <p className="text-xs text-slate-700 flex items-center gap-1 font-medium" dir="ltr">
                      <Phone className="w-3 h-3 text-teal-700" />
                      <span className="font-bold">{settings.ownerPhone}</span>
                    </p>
                  )}
                  <p className="text-[10px] text-teal-800 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-teal-600" />
                    <span>نظام حساباتي المعتمد لإدارة ديون ومدفوعات العملاء</span>
                  </p>
                </div>
              </div>

              {/* Left Side: Statement Badge & Serial */}
              <div className="text-left space-y-1 shrink-0">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-black tracking-wide shadow-xs print-header-badge">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  <span>كشف حساب مالي رسمي</span>
                </div>
                <p className="text-[11px] font-mono font-bold text-slate-600 text-left" dir="ltr">
                  #{statementNumber}
                </p>
                <p className="text-[11px] text-slate-600 font-medium flex items-center justify-end gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>تاريخ الإصدار: {issueDate}</span>
                </p>
                <p className="text-[10px] text-slate-400 font-medium text-left" dir="ltr">
                  {issueTime}
                </p>
                <div className="pt-0.5">
                  <span
                    className={`inline-block px-3 py-1 rounded-md text-[11px] font-extrabold border print-badge ${
                      customer.remaining > 0
                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    }`}
                  >
                    {customer.remaining > 0 ? 'مستحق السداد' : 'الحساب خالص ومسدد'}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Details Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 border-2 border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs print-customer-box print-avoid-break">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-900 flex items-center justify-center shrink-0 border border-teal-200">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-bold">اسم العميل:</span>
                  <span className="font-extrabold text-slate-950 text-sm">{customer.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0 border border-emerald-200">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-bold">رقم الهاتف:</span>
                  <span className="font-bold text-slate-950" dir="ltr">
                    {customer.whatsapp || customer.phone || 'غير مسجل'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center shrink-0 border border-slate-300">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-bold">العنوان / الملاحظات:</span>
                  <span className="font-medium text-slate-800 truncate max-w-[180px] block">
                    {customer.address || customer.notes || 'لا يوجد عنوان محدد'}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-3 gap-3 text-center print-summary-grid print-avoid-break">
              <div className="p-3 rounded-xl bg-slate-50 border-2 border-slate-200 print-stat-card">
                <span className="text-[11px] font-bold text-slate-600 block">إجمالي الديون</span>
                <span className="text-sm sm:text-base font-black text-slate-950 mt-0.5 block">
                  {customer.totalDebt.toLocaleString()} {settings.currency}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/80 border-2 border-emerald-300 print-stat-card">
                <span className="text-[11px] font-bold text-emerald-800 block">إجمالي المسدد</span>
                <span className="text-sm sm:text-base font-black text-emerald-800 mt-0.5 block">
                  {customer.totalPaid.toLocaleString()} {settings.currency}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/90 border-2 border-rose-400 print-stat-card shadow-xs">
                <span className="text-[11px] font-black text-rose-800 block">
                  الرصيد المتبقي المطلوب
                </span>
                <span className="text-base sm:text-lg font-black text-rose-800 mt-0.5 block">
                  {customer.remaining.toLocaleString()} {settings.currency}
                </span>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between print-avoid-break">
                <h4 className="text-xs font-black text-slate-950 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-teal-700" />
                  <span>جدول حركة الحساب والعمليات:</span>
                  <span className="text-[10px] font-normal text-slate-500">
                    ({statement.length} حركة مسجلة)
                  </span>
                </h4>
                <span className="text-[10px] text-slate-500 font-medium">
                  الترتيب الزمني للحركات (الأقدم للأحدث)
                </span>
              </div>

              <div className="border border-slate-300 rounded-xl overflow-hidden print-table-container">
                <table className="w-full text-xs text-right print-table">
                  <thead className="bg-slate-100 text-slate-900 font-black border-b-2 border-slate-300">
                    <tr>
                      <th className="p-2.5 w-10 text-center font-black">#</th>
                      <th className="p-2.5 font-black">التاريخ</th>
                      <th className="p-2.5 font-black">نوع العملية</th>
                      <th className="p-2.5 font-black">البيان / التفاصيل</th>
                      <th className="p-2.5 font-black">المبلغ</th>
                      <th className="p-2.5 text-slate-950 font-black">الرصيد بعد الحركة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {statement.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-500 font-bold">
                          لا توجد عمليات مسجلة في كشف حساب هذا العميل حتى الآن.
                        </td>
                      </tr>
                    ) : (
                      statement.map((item, idx) => {
                        const isDebt = item.type === 'debt';
                        return (
                          <tr
                            key={item.id}
                            className={`hover:bg-slate-50 transition-colors print-avoid-break ${
                              idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                            }`}
                          >
                            <td className="p-2.5 text-center text-slate-500 font-mono text-[11px] font-bold">
                              {idx + 1}
                            </td>
                            <td className="p-2.5 text-slate-800 font-semibold whitespace-nowrap">
                              {item.date}
                            </td>
                            <td className="p-2.5">
                              {isDebt ? (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 font-black text-[11px] border border-rose-300 print-tag">
                                  <span>+ دين</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-black text-[11px] border border-emerald-300 print-tag">
                                  <span>- سداد</span>
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-slate-800">
                              <div>
                                <span className="font-bold">{item.description}</span>
                                {item.notes && (
                                  <span className="text-[11px] text-slate-600 block">
                                    {item.notes}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-2.5 font-black whitespace-nowrap">
                              <span
                                className={isDebt ? 'text-rose-700' : 'text-emerald-700'}
                              >
                                {item.amount.toLocaleString()} {settings.currency}
                              </span>
                            </td>
                            <td className="p-2.5 font-black text-slate-950 whitespace-nowrap">
                              {item.runningBalance.toLocaleString()} {settings.currency}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {statement.length > 0 && (
                    <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-900 text-slate-900">
                      <tr>
                        <td colSpan={4} className="p-2.5 text-left font-black text-slate-950">
                          الرصيد الصافي النهائي المتبقي بذمة العميل:
                        </td>
                        <td colSpan={2} className="p-2.5 text-right font-black text-rose-800 text-sm">
                          {customer.remaining.toLocaleString()} {settings.currency}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Official Signatures & Seal Section */}
            <div className="pt-4 border-t-2 border-slate-200 grid grid-cols-2 gap-6 text-xs text-center print-signatures print-avoid-break">
              {/* Shop Stamp / Signature Box */}
              <div className="p-3.5 rounded-xl border-2 border-dashed border-slate-300 space-y-10 min-h-[100px] flex flex-col justify-between bg-slate-50/40">
                <span className="text-slate-700 font-black text-xs block">
                  ختم وتوقيع إدارة المحل:
                </span>
                <span className="text-[11px] text-slate-500 font-bold">
                  {settings.shopName || 'المتجر'} — مستند مالي معتمد
                </span>
              </div>

              {/* Customer Signature Box */}
              <div className="p-3.5 rounded-xl border-2 border-dashed border-slate-300 space-y-10 min-h-[100px] flex flex-col justify-between bg-slate-50/40">
                <span className="text-slate-700 font-black text-xs block">
                  توقيع واستلام العميل:
                </span>
                <span className="text-[11px] text-slate-500 font-bold">
                  {customer.name}
                </span>
              </div>
            </div>

            {/* Formal Legal Notice & System Footer */}
            <div className="pt-2 text-center text-[10px] text-slate-500 space-y-1 print-legal-notice print-avoid-break">
              <p className="font-semibold text-slate-600">
                تعتبر هذه الوثيقة كشف حساب مالي رسمي معتمد ومستخرج من الدفاتر المالية لنظام حساباتي. يُرجى مراجعة إدارة المحل في حال وجود أي استفسار أو ملاحظات خلال 3 أيام من تاريخه.
              </p>
              <div className="flex items-center justify-center gap-3 text-[9px] text-slate-400 font-mono pt-1">
                <span>تطبيق حساباتي لإدارة ديون ومدفوعات العملاء</span>
                <span>•</span>
                <span>تاريخ الطباعة: {issueDate} - {issueTime}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
