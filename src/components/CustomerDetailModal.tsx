import React, { useState } from 'react';
import {
  X,
  Phone,
  MessageCircle,
  Plus,
  ArrowDownLeft,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Printer,
  Trash2,
  Edit2,
  FileText,
  Clock,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Building,
} from 'lucide-react';
import { CustomerWithStats, StatementItem, UserSettings } from '../types';
import { generateDebtReminderMessage, openWhatsAppChat } from '../services/whatsapp';
import { db } from '../services/db';

interface CustomerDetailModalProps {
  customer: CustomerWithStats;
  statement: StatementItem[];
  settings: UserSettings;
  onClose: () => void;
  onOpenAddDebt: (customerId: string) => void;
  onOpenRecordPayment: (customerId: string) => void;
  onOpenEditCustomer: (customer: CustomerWithStats) => void;
  onOpenPrintStatement: (customer: CustomerWithStats) => void;
  onDeleteCustomer: (customerId: string) => void;
  onDeleteTransaction: (type: 'debt' | 'payment', id: string) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  statement,
  settings,
  onClose,
  onOpenAddDebt,
  onOpenRecordPayment,
  onOpenEditCustomer,
  onOpenPrintStatement,
  onDeleteCustomer,
  onDeleteTransaction,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [txToDelete, setTxToDelete] = useState<{ type: 'debt' | 'payment'; id: string } | null>(null);

  const hasDebt = customer.remaining > 0;

  const handleWhatsAppClick = () => {
    const msg = generateDebtReminderMessage(customer, settings.currency);
    openWhatsAppChat(customer.whatsapp || customer.phone, msg);
  };

  const handlePhoneCall = () => {
    window.location.href = `tel:${customer.phone}`;
  };

  return (
    <div
      id="customer-detail-modal-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4 overflow-y-auto animate-fadeIn"
    >
      <div
        id="customer-detail-sheet"
        className="w-full sm:max-w-lg bg-white dark:bg-slate-900 sm:rounded-3xl rounded-t-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                حساب العميل
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                #{customer.id.replace('CUST-', '')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onOpenPrintStatement(customer)}
              title="طباعة / استخراج كشف حساب"
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-600 flex items-center justify-center transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={() => onOpenEditCustomer(customer)}
              title="تعديل بيانات العميل"
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-600 flex items-center justify-center transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              title="حذف العميل"
              className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 flex items-center justify-center transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 space-y-4 overflow-y-auto no-scrollbar flex-1">
          {/* Customer Profile Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-teal-50/30 dark:from-slate-800/80 dark:to-teal-950/20 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {customer.name}
                </h2>
                {customer.address && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                    <Building className="w-3 h-3 text-slate-400" />
                    <span>{customer.address}</span>
                  </p>
                )}
              </div>

              {/* Status Badge */}
              <div>
                {hasDebt ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-900">
                    <AlertCircle className="w-3.5 h-3.5" />
                    عليه دين
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-900">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    مسدد بالكامل
                  </span>
                )}
              </div>
            </div>

            {/* Phone & WhatsApp details */}
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
              <button
                onClick={handlePhoneCall}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-teal-500"
              >
                <Phone className="w-3.5 h-3.5 text-teal-600" />
                <span dir="ltr">{customer.phone}</span>
              </button>

              <button
                onClick={handleWhatsAppClick}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span dir="ltr">{customer.whatsapp || customer.phone}</span>
              </button>
            </div>

            {customer.notes && (
              <div className="mt-2.5 p-2 rounded-xl bg-white/60 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                <span className="font-bold text-slate-700 dark:text-slate-300">ملاحظات: </span>
                {customer.notes}
              </div>
            )}
          </div>

          {/* 3 Stat Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center">
              <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                إجمالي الديون
              </span>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                {customer.totalDebt.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400">{settings.currency}</span>
            </div>

            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center">
              <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                إجمالي المسدد
              </span>
              <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                {customer.totalPaid.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400">{settings.currency}</span>
            </div>

            <div
              className={`p-3 rounded-2xl text-center border ${
                hasDebt
                  ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-900 text-rose-600 dark:text-rose-400'
                  : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              <span className="text-[10px] font-bold block mb-1">
                المبلغ المتبقي
              </span>
              <div className="text-base font-black">
                {customer.remaining.toLocaleString()}
              </div>
              <span className="text-[10px] font-semibold">{settings.currency}</span>
            </div>
          </div>

          {/* Main Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onOpenAddDebt(customer.id)}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white text-xs font-bold shadow-sm shadow-rose-600/30 hover:shadow-rose-600/40 active:scale-95 flex items-center justify-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة دين</span>
            </button>

            <button
              onClick={() => onOpenRecordPayment(customer.id)}
              disabled={!hasDebt}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                hasDebt
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-600/30 hover:shadow-emerald-600/40 active:scale-95'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-50'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>تسجيل سداد</span>
            </button>

            <button
              onClick={handleWhatsAppClick}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm shadow-emerald-600/30 hover:bg-emerald-700 active:scale-95 flex items-center justify-center gap-1.5 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
          </div>

          {/* Account Statement / Transaction Ledger (Newest to Oldest) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-teal-600" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  سجل الحساب والعمليات
                </h4>
              </div>
              <button
                type="button"
                onClick={() => onOpenPrintStatement(customer)}
                className="px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 hover:bg-violet-100 text-[11px] font-bold border border-violet-200/70 dark:border-violet-800/60 flex items-center gap-1 transition-colors"
                title="استخراج كشف حساب رسمي بصيغة PDF ومشاركته عبر واتساب"
              >
                <FileText className="w-3.5 h-3.5 text-violet-600" />
                <span>كشف حساب رسمي PDF</span>
              </button>
            </div>

            {statement.length > 0 ? (
              <div className="space-y-2.5">
                {statement.map((item) => {
                  const isDebt = item.type === 'debt';
                  const formattedDate = new Date(item.date).toLocaleDateString('ar-YE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  });

                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                              isDebt
                                ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                                : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                            }`}
                          >
                            {isDebt ? '+' : '-'}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white block">
                              {isDebt ? 'دين جديد' : 'سداد'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {item.description}
                            </span>
                          </div>
                        </div>

                        <div className="text-left flex items-center gap-2">
                          <div>
                            <div
                              className={`text-sm font-black ${
                                isDebt
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {isDebt ? '+' : '-'} {item.amount.toLocaleString()}{' '}
                              {settings.currency}
                            </div>
                            <span className="text-[10px] text-slate-400 block text-right">
                              {formattedDate}
                            </span>
                          </div>

                          {/* Delete transaction item button */}
                          <button
                            onClick={() => setTxToDelete({ type: item.type, id: item.id })}
                            title="حذف هذه العملية"
                            className="w-6 h-6 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition-colors opacity-80 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Running Balance after this operation */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                        <span className="text-slate-400">الرصيد المتبقي بعد العملية:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {item.runningBalance.toLocaleString()} {settings.currency}
                        </span>
                      </div>

                      {item.notes && (
                        <div className="text-[10px] text-slate-500 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-lg">
                          {item.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800">
                <Clock className="w-6 h-6 mx-auto mb-1 text-slate-300 dark:text-slate-600" />
                <p className="text-xs">لا توجد عمليات مسجلة في سجل هذا العميل بعد.</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Close Bar */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>

      {/* Delete Customer Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                حذف حساب العميل؟
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                هل أنت متأكد من حذف العميل <span className="font-bold text-slate-800 dark:text-slate-200">{customer.name}</span> وجميع سجلات ديونه ومدفوعاته؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  onDeleteCustomer(customer.id);
                  setShowDeleteConfirm(false);
                  onClose();
                }}
                className="py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Transaction Confirmation Dialog */}
      {txToDelete && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                حذف هذه العملية؟
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                سيتم حذف {txToDelete.type === 'debt' ? 'سجل الدين' : 'سجل السداد'} وإعادة احتساب رصيد العميل فورًا.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTxToDelete(null)}
                className="py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  onDeleteTransaction(txToDelete.type, txToDelete.id);
                  setTxToDelete(null);
                }}
                className="py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
              >
                تأكيد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
