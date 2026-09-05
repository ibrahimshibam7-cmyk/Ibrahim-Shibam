import React, { useState } from 'react';
import {
  X,
  Plus,
  Calendar,
  DollarSign,
  User,
  Phone,
  Tag,
  Clock,
  Bell,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Customer, Subscription } from '../../types';

interface AddSubscriptionModalProps {
  customers: Customer[];
  initialSubscription?: Subscription;
  onClose: () => void;
  onSubmit: (data: {
    customerId?: string;
    customerName: string;
    customerPhone: string;
    subscriptionType: string;
    amount: number;
    currency: string;
    startDate: string;
    dueDay: number;
    reminderDaysBefore: number;
    status: 'active' | 'paused';
    notes?: string;
  }) => { success: boolean; error?: string };
  defaultCurrency: string;
}

const SUBSCRIPTION_TYPE_PRESETS = [
  'اشتراك شهري',
  'إنترنت فائق السرعة',
  'صالة رياضية / نادي',
  'خدمات وصيانة دورية',
  'اشتراك كهرباء',
  'اشتراك مياه',
  'إيجار عقار / محل',
  'برمجيات وسيرفرات',
  'اشتراك نقل / مواصلات',
  'حراسة وأمن',
];

export const AddSubscriptionModal: React.FC<AddSubscriptionModalProps> = ({
  customers,
  initialSubscription,
  onClose,
  onSubmit,
  defaultCurrency,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialSubscription?.customerId || ''
  );
  const [customerName, setCustomerName] = useState<string>(
    initialSubscription?.customerName || ''
  );
  const [customerPhone, setCustomerPhone] = useState<string>(
    initialSubscription?.customerPhone || ''
  );
  const [subscriptionType, setSubscriptionType] = useState<string>(
    initialSubscription?.subscriptionType || 'اشتراك شهري'
  );
  const [amount, setAmount] = useState<string>(
    initialSubscription ? String(initialSubscription.amount) : ''
  );
  const [currency, setCurrency] = useState<string>(
    initialSubscription?.currency || defaultCurrency || 'ريال'
  );
  const [startDate, setStartDate] = useState<string>(
    initialSubscription?.startDate || new Date().toISOString().split('T')[0]
  );
  const [dueDay, setDueDay] = useState<number>(
    initialSubscription?.dueDay || 1
  );
  const [reminderDaysBefore, setReminderDaysBefore] = useState<number>(
    initialSubscription?.reminderDaysBefore !== undefined
      ? initialSubscription.reminderDaysBefore
      : 2
  );
  const [status, setStatus] = useState<'active' | 'paused'>(
    initialSubscription?.status || 'active'
  );
  const [notes, setNotes] = useState<string>(initialSubscription?.notes || '');
  const [error, setError] = useState<string | null>(null);

  // Auto-fill when selecting an existing customer
  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    if (!customerId) return;
    const cust = customers.find((c) => c.id === customerId);
    if (cust) {
      setCustomerName(cust.name);
      setCustomerPhone(cust.phone || cust.whatsapp || '');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = customerName.trim();
    const trimmedPhone = customerPhone.trim();
    const trimmedType = subscriptionType.trim();
    const numAmount = parseFloat(amount);

    if (!trimmedName) {
      setError('يرجى إدخال اسم العميل');
      return;
    }
    if (!trimmedPhone) {
      setError('يرجى إدخال رقم هاتف العميل');
      return;
    }
    if (!trimmedType) {
      setError('يرجى تحديد أو إدخال نوع الاشتراك');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('يرجى إدخال مبلغ اشتراك صالح أكبر من صفر');
      return;
    }

    const res = onSubmit({
      customerId: selectedCustomerId || undefined,
      customerName: trimmedName,
      customerPhone: trimmedPhone,
      subscriptionType: trimmedType,
      amount: numAmount,
      currency: currency.trim() || 'ريال',
      startDate,
      dueDay: Math.min(31, Math.max(1, dueDay)),
      reminderDaysBefore,
      status,
      notes: notes.trim(),
    });

    if (!res.success) {
      setError(res.error || 'حدث خطأ أثناء حفظ الاشتراك');
    }
  };

  return (
    <div
      id="add-subscription-modal-overlay"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
    >
      <div
        id="add-subscription-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden my-auto animate-scaleUp"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                {initialSubscription ? 'تعديل بيانات الاشتراك' : 'إضافة اشتراك شهري جديد'}
              </h2>
              <p className="text-xs text-violet-100 font-medium">
                إدارة الأشهر والسداد والتذكيرات التلقائية
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer Selection or Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              <span>العميل</span>
            </label>
            {customers.length > 0 && (
              <div className="mb-2">
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleSelectCustomer(e.target.value)}
                  className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">-- اختر من العملاء المسجلين مسبقًا أو اكتب أدناه --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  required
                  placeholder="اسم العميل *"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <input
                  type="tel"
                  required
                  placeholder="رقم هاتف العميل (واتساب) *"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-left dir-ltr"
                />
              </div>
            </div>
          </div>

          {/* Subscription Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              <span>نوع الاشتراك *</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثال: اشتراك شهري، إنترنت، صالة رياضية..."
              value={subscriptionType}
              onChange={(e) => setSubscriptionType(e.target.value)}
              className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] text-slate-400 font-medium">نماذج سريعة:</span>
              {SUBSCRIPTION_TYPE_PRESETS.slice(0, 5).map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setSubscriptionType(preset)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                    subscriptionType === preset
                      ? 'bg-violet-600 text-white border-violet-600 font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-violet-50'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Amount and Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>مبلغ الاشتراك الشهري *</span>
              </label>
              <input
                type="number"
                min="1"
                step="any"
                required
                placeholder="مثال: 10000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-sm font-black px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                العملة
              </label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="ريال / ريال يمني"
                className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Timing: Start Date & Due Day */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>تاريخ بداية الاشتراك</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>يوم الاستحقاق الشهري</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">يوم</span>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={dueDay}
                  onChange={(e) => setDueDay(parseInt(e.target.value) || 1)}
                  className="w-20 text-center text-xs font-black px-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">من كل شهر</span>
              </div>
            </div>
          </div>

          {/* Reminder Timing & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>موعد إرسال التذكير</span>
              </label>
              <select
                value={reminderDaysBefore}
                onChange={(e) => setReminderDaysBefore(parseInt(e.target.value, 10))}
                className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value={0}>في نفس يوم الاستحقاق</option>
                <option value={1}>قبل يوم واحد من الاستحقاق</option>
                <option value={2}>قبل يومين من الاستحقاق (موصى به)</option>
                <option value={3}>قبل 3 أيام</option>
                <option value={5}>قبل 5 أيام</option>
                <option value={7}>قبل أسبوع</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                <span>حالة الاشتراك</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('active')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    status === 'active'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-300 inline-block"></span>
                  <span>نشط</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('paused')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    status === 'paused'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-300 inline-block"></span>
                  <span>متوقف</span>
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>ملاحظات إضافية</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: سرعة 20 ميجا، تم تركيب المودم، الحساب باسم فلان..."
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
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
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 active:scale-95 text-white text-xs font-black shadow-lg shadow-violet-500/25 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{initialSubscription ? 'حفظ التعديلات' : 'حفظ وإضافة الاشتراك'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
