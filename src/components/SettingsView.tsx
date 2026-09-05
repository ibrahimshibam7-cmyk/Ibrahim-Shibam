import React, { useState, useRef } from 'react';
import {
  Settings,
  Store,
  DollarSign,
  Lock,
  Download,
  Upload,
  FileSpreadsheet,
  Moon,
  Sun,
  ShieldCheck,
  AlertTriangle,
  Save,
  Check,
  MessageSquare,
  Image as ImageIcon,
  Trash2,
  Camera,
  LogOut,
} from 'lucide-react';
import { UserSettings } from '../types';
import { db } from '../services/db';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onExportBackup: () => void;
  onImportBackup: (jsonContent: string) => boolean;
  onExportCSV: (type: 'customers' | 'debts' | 'payments') => void;
  onResetDatabase: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onLogout?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onExportBackup,
  onImportBackup,
  onExportCSV,
  onResetDatabase,
  isDarkMode,
  onToggleTheme,
  onLogout,
}) => {
  const [shopName, setShopName] = useState(settings.shopName);
  const [ownerName, setOwnerName] = useState(settings.ownerName);
  const [ownerPhone, setOwnerPhone] = useState(settings.ownerPhone);
  const [currency, setCurrency] = useState(settings.currency);
  const [shopLogo, setShopLogo] = useState(settings.shopLogo || '');
  const [appLockEnabled, setAppLockEnabled] = useState(settings.appLockEnabled);
  const [pinCode, setPinCode] = useState(settings.pinCode || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      shopName: shopName.trim() || 'متجري',
      ownerName: ownerName.trim(),
      ownerPhone: ownerPhone.trim(),
      currency: currency.trim() || 'ريال',
      shopLogo: shopLogo || undefined,
      appLockEnabled,
      pinCode: appLockEnabled ? pinCode : undefined,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize image to max 400x400 to keep localStorage efficient
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 400;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/png', 0.85);
          setShopLogo(dataUrl);
          onUpdateSettings({ shopLogo: dataUrl });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = () => {
    setShopLogo('');
    onUpdateSettings({ shopLogo: undefined });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = onImportBackup(content);
        if (ok) {
          alert('تم استعادة النسخة الاحتياطية بنجاح!');
        } else {
          alert('الملف غير صالح أو تالف. يرجى اختيار ملف نسخة احتياطية صحيح.');
        }
      }
    };
    reader.readAsText(file);
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div id="settings-view-container" className="space-y-4 pb-24 animate-fadeIn">
      {/* Top Header */}
      <div className="pt-1">
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          الإعدادات والأمان
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          تخصيص التطبيق والنسخ الاحتياطي والبيانات
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4" />
          <span>تم حفظ التعديلات بنجاح!</span>
        </div>
      )}

      {/* General Information Form */}
      <form
        onSubmit={handleSaveGeneral}
        className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3.5"
      >
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Store className="w-4 h-4 text-teal-600" />
          <span>بيانات المحل التجاري</span>
        </h3>

        {/* Store Name */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            اسم المحل أو النشاط
          </label>
          <input
            type="text"
            required
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          />
        </div>

        {/* Owner Name & Phone */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              اسم التاجر / المالك
            </label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              رقم هاتف المحل
            </label>
            <input
              type="tel"
              dir="ltr"
              value={ownerPhone}
              onChange={(e) => setOwnerPhone(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-right"
            />
          </div>
        </div>

        {/* Store Logo / Stamp */}
        <div className="space-y-1.5 pt-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>شعار المحل أو الختم التجاري (يظهر في كشف الحساب والـ PDF)</span>
            </span>
            {shopLogo && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="text-[11px] text-rose-500 hover:text-rose-600 flex items-center gap-1 font-semibold"
              >
                <Trash2 className="w-3 h-3" />
                <span>إزالة الشعار</span>
              </button>
            )}
          </label>

          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoUpload}
          />

          <div className="flex items-center gap-3">
            {shopLogo ? (
              <div className="relative group w-20 h-20 rounded-2xl border-2 border-dashed border-teal-400 dark:border-teal-600 p-1 bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                <img
                  src={shopLogo}
                  alt="شعار المحل"
                  className="max-h-full max-w-full object-contain rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="absolute inset-0 bg-black/50 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity rounded-xl gap-0.5"
                >
                  <Camera className="w-4 h-4" />
                  <span>تغيير</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-500 bg-slate-50 dark:bg-slate-800/60 flex flex-col items-center justify-center text-slate-400 hover:text-teal-600 transition-colors shrink-0"
              >
                <Camera className="w-5 h-5 mb-1 text-slate-400" />
                <span className="text-[10px] font-bold">رفع شعار</span>
              </button>
            )}

            <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <p className="font-medium text-slate-700 dark:text-slate-300">
                {shopLogo ? 'تم تعيين الشعار بنجاح' : 'لم يتم رفع شعار حتى الآن'}
              </p>
              <p className="text-[10px] text-slate-400">
                يُنصح برفع صورة واضحة بصيغة PNG أو JPG بخلفية شفافة أو بيضاء لتظهر بأعلى جودة في فواتير وكشوفات PDF المطبوعة.
              </p>
              {!shopLogo && (
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline pt-0.5"
                >
                  <span>+ اختر صورة الشعار من جهازك</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Currency selection */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>العملة المعتمدة</span>
            <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">
              الحالية: {currency}
            </span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              'ريال يمني',
              'ريال سعودي',
              'درهم إماراتي',
              'جنيه مصري',
              'دينار كويتي',
              'دولار أمريكي',
            ].map((cur) => (
              <button
                type="button"
                key={cur}
                onClick={() => setCurrency(cur)}
                className={`h-10 rounded-xl text-xs font-bold border transition-all ${
                  currency === cur
                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {cur}
              </button>
            ))}
          </div>
        </div>

        {/* PIN Lock Settings */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-teal-600" />
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  قفل التطبيق برمز PIN
                </h4>
                <p className="text-[10px] text-slate-400">
                  طلب رمز سري عند فتح التطبيق لحماية خصوصية الحسابات
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={appLockEnabled}
              onChange={(e) => setAppLockEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
            />
          </div>

          {appLockEnabled && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                رمز PIN السري (4 أرقام)
              </label>
              <input
                type="password"
                maxLength={6}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                placeholder="أدخل 4 أرقام..."
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono tracking-widest text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40"
              />
            </div>
          )}
        </div>

        {/* Save button */}
        <button
          type="submit"
          className="w-full h-11 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-md hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>حفظ إعدادات المحل</span>
        </button>

        {/* Session Security & Logout */}
        {onLogout && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                تسجيل الخروج وقفل البيانات
              </p>
              <p className="text-[10px] text-slate-400">
                إغلاق الجلسة الحالية وإظهار شاشة تسجيل الدخول لحماية الخصوصية
              </p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/60 text-xs font-bold flex items-center gap-1.5 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        )}
      </form>

      {/* Theme Settings */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isDarkMode ? (
            <Moon className="w-5 h-5 text-teal-400" />
          ) : (
            <Sun className="w-5 h-5 text-amber-500" />
          )}
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              المظهر (الوضع الليلي / النهاري)
            </h4>
            <p className="text-[10px] text-slate-400">
              {isDarkMode ? 'الوضع الليلي مفعل حاليًا' : 'الوضع النهاري مفعل حاليًا'}
            </p>
          </div>
        </div>
        <button
          onClick={onToggleTheme}
          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
        >
          {isDarkMode ? 'نهاري' : 'ليلي'}
        </button>
      </div>

      {/* Backup & Restore */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Download className="w-4 h-4 text-teal-600" />
          <span>النسخ الاحتياطي والاستعادة</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          احتفظ بنسخة من جميع بياناتك (العملاء، الديون، المدفوعات) لاستعادتها في أي وقت أو نقلها لجهاز آخر.
        </p>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onExportBackup}
            className="h-11 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-900/60 text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-teal-100 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>تصدير نسخة (JSON)</span>
          </button>

          <label className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-200 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>استعادة نسخة</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* CSV Exports */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500 block">
            تصدير كشوفات بصيغة Excel / CSV:
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => onExportCSV('customers')}
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-teal-500 flex items-center justify-center gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
              <span>كشف العملاء</span>
            </button>
            <button
              onClick={() => onExportCSV('debts')}
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-rose-500 flex items-center justify-center gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-rose-500" />
              <span>كشف الديون</span>
            </button>
            <button
              onClick={() => onExportCSV('payments')}
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-emerald-500 flex items-center justify-center gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              <span>كشف السداد</span>
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 space-y-2">
        <h4 className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4" />
          <span>منطقة الخطر</span>
        </h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          مسح جميع البيانات والديون من الجهاز والبدء من جديد.
        </p>
        <button
          onClick={() => setShowResetConfirm(true)}
          className="w-full h-10 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors"
        >
          تصفير ومسح جميع البيانات
        </button>
      </div>

      {/* Reset confirmation dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                تأكيد مسح البيانات بالكامل؟
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                سيتم حذف كافة العملاء والديون والمدفوعات نهائيًا. تأكد من أخذ نسخة احتياطية أولاً!
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  onResetDatabase();
                  setShowResetConfirm(false);
                }}
                className="py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
              >
                تأكيد المسح
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
