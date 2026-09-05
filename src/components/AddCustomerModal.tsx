import React, { useState } from 'react';
import { X, UserPlus, Phone, MapPin, FileText, User } from 'lucide-react';
import { CustomerWithStats } from '../types';

interface AddCustomerModalProps {
  initialCustomer?: CustomerWithStats;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    phone: string;
    whatsapp?: string;
    address?: string;
    notes?: string;
  }) => { success: boolean; error?: string };
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  initialCustomer,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState(initialCustomer?.name || '');
  const [phone, setPhone] = useState(initialCustomer?.phone || '');
  const [whatsapp, setWhatsapp] = useState(initialCustomer?.whatsapp || '');
  const [address, setAddress] = useState(initialCustomer?.address || '');
  const [notes, setNotes] = useState(initialCustomer?.notes || '');
  const [sameAsPhone, setSameAsPhone] = useState(
    !initialCustomer || initialCustomer.whatsapp === initialCustomer.phone
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('يرجى إدخال اسم العميل');
      return;
    }
    if (!phone.trim()) {
      setError('يرجى إدخال رقم الهاتف');
      return;
    }

    const wa = sameAsPhone ? phone.trim() : (whatsapp.trim() || phone.trim());
    const res = onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      whatsapp: wa,
      address: address.trim(),
      notes: notes.trim(),
    });

    if (!res.success) {
      setError(res.error || 'حدث خطأ أثناء حفظ العميل');
    } else {
      onClose();
    }
  };

  return (
    <div
      id="add-customer-modal-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4 animate-fadeIn"
    >
      <div
        id="add-customer-sheet"
        className="w-full sm:max-w-md bg-white dark:bg-slate-900 sm:rounded-3xl rounded-t-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {initialCustomer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
              <span>{error}</span>
            </div>
          )}

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-teal-600" />
              <span>اسم العميل <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: محمد عبدالله الصالحي"
              className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-teal-600" />
              <span>رقم الهاتف <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="tel"
              required
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="770000000 أو +967..."
              className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 text-right"
            />
          </div>

          {/* WhatsApp toggle & input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                رقم WhatsApp
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sameAsPhone}
                  onChange={(e) => setSameAsPhone(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span>نفس رقم الهاتف</span>
              </label>
            </div>

            {!sameAsPhone && (
              <input
                type="tel"
                dir="ltr"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="رقم الواتساب..."
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 text-right"
              />
            )}
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              <span>العنوان (اختياري)</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="مثال: صنعاء - شارع حائل"
              className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-teal-600" />
              <span>ملاحظات (اختياري)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي تفاصيل أو ملاحظات خاصة بالعميل..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              id="save-customer-submit-btn"
              className="w-full h-12 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-xs font-bold shadow-md shadow-teal-600/30 hover:shadow-teal-600/40 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{initialCustomer ? 'تحديث بيانات العميل' : 'حفظ العميل'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
