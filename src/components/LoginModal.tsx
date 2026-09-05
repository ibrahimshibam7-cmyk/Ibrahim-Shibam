import React, { useState, useMemo } from 'react';
import {
  Lock,
  Unlock,
  ShieldCheck,
  Eye,
  EyeOff,
  Store,
  User,
  Phone,
  KeyRound,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  LogIn,
  Coins,
  FileText,
  MessageCircle,
  Delete,
  ChevronLeft,
  Settings2,
} from 'lucide-react';
import { UserSettings } from '../types';

interface LoginModalProps {
  settings: UserSettings;
  isFirstTime?: boolean;
  onLoginSuccess: (params?: {
    shopName?: string;
    ownerName?: string;
    ownerPhone?: string;
    currency?: string;
    pinCode?: string;
    rememberMe: boolean;
  }) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  settings,
  isFirstTime = false,
  onLoginSuccess,
}) => {
  // Mode: 'login' (standard login with PIN) or 'setup' (first time onboarding / setup)
  const [activeMode, setActiveMode] = useState<'login' | 'setup'>(
    isFirstTime || !settings.hasCompletedFirstLogin ? 'setup' : 'login'
  );

  // Form State for Login
  const [enteredPin, setEnteredPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for Setup / Personalization
  const [shopName, setShopName] = useState(settings.shopName || '');
  const [ownerName, setOwnerName] = useState(settings.ownerName || '');
  const [ownerPhone, setOwnerPhone] = useState(settings.ownerPhone || '');
  const [currency, setCurrency] = useState(settings.currency || 'ريال');
  const [newPin, setNewPin] = useState(settings.pinCode || '1234');
  const [confirmPin, setConfirmPin] = useState(settings.pinCode || '1234');
  const [showNewPin, setShowNewPin] = useState(false);

  // Dynamic Arabic greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) {
      return { text: 'صباح الخير والبركة', icon: '☀️' };
    } else if (hour >= 12 && hour < 17) {
      return { text: 'طاب يومك بكل خير', icon: '🌤️' };
    } else {
      return { text: 'مساء الخير والمسرات', icon: '🌙' };
    }
  }, []);

  const targetPin = settings.pinCode || '1234';

  // Handle standard PIN keypad or input
  const handleKeypadPress = (digit: string) => {
    if (enteredPin.length < 6) {
      const nextPin = enteredPin + digit;
      setEnteredPin(nextPin);
      setErrorMsg(null);

      // Auto-validate if PIN matches length
      if (nextPin === targetPin) {
        setIsSubmitting(true);
        setTimeout(() => {
          onLoginSuccess({ rememberMe });
        }, 300);
      } else if (nextPin.length >= targetPin.length) {
        setErrorMsg('رمز PIN غير صحيح، يُرجى التأكد والمحاولة مجدداً');
      }
    }
  };

  const handleKeypadDelete = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // If PIN lock is set or default
    if (settings.appLockEnabled && settings.pinCode) {
      if (enteredPin !== settings.pinCode) {
        setErrorMsg('رمز PIN السري غير صحيح. حاول مرة أخرى');
        return;
      }
    } else if (settings.pinCode && enteredPin !== settings.pinCode) {
      // If PIN is set but appLock flag is not, still check PIN if entered
      setErrorMsg('رمز الدخول غير صحيح');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onLoginSuccess({ rememberMe });
    }, 350);
  };

  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!shopName.trim()) {
      setErrorMsg('يُرجى إدخال اسم المحل أو النشاط التجاري');
      return;
    }

    if (newPin && newPin.length < 4) {
      setErrorMsg('يجب أن يتكون رمز PIN من 4 أرقام على الأقل');
      return;
    }

    if (newPin !== confirmPin) {
      setErrorMsg('رمز PIN وتأكيده غير متطابقين');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onLoginSuccess({
        shopName: shopName.trim(),
        ownerName: ownerName.trim() || 'المدير',
        ownerPhone: ownerPhone.trim(),
        currency: currency.trim() || 'ريال',
        pinCode: newPin || '1234',
        rememberMe,
      });
    }, 400);
  };

  return (
    <div
      id="welcome-login-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
      dir="rtl"
    >
      <div
        id="welcome-login-card"
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col my-auto transition-all"
      >
        {/* Top Welcoming Header Banner */}
        <div className="relative p-6 bg-gradient-to-br from-violet-600 via-indigo-600 to-teal-700 text-white overflow-hidden text-center">
          {/* Decorative Background Circles */}
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-teal-400/10 rounded-full blur-xl pointer-events-none" />

          {/* Store Logo or App Icon */}
          <div className="relative mx-auto mb-3 flex items-center justify-center">
            {settings.shopLogo ? (
              <div className="w-16 h-16 rounded-2xl bg-white p-1.5 shadow-lg shadow-black/20 flex items-center justify-center overflow-hidden border-2 border-white/50">
                <img
                  src={settings.shopLogo}
                  alt={settings.shopName}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center shadow-lg border border-white/30">
                <Store className="w-8 h-8" />
              </div>
            )}
          </div>

          {/* Welcoming Greeting */}
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-bold text-white/90 mb-1">
              <span>{greeting.icon}</span>
              <span>{greeting.text}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {settings.shopName ? settings.shopName : 'تطبيق حساباتي'}
            </h1>
            <p className="text-xs text-violet-100/90 max-w-xs mx-auto font-medium">
              نظامك الذكي والموثوق لإدارة ديون وحسابات العملاء بأمان وخصوصية تامة
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveMode('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeMode === 'login'
                ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-300 shadow-xs border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>تسجيل الدخول</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode('setup');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeMode === 'setup'
                ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-300 shadow-xs border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>{isFirstTime || !settings.hasCompletedFirstLogin ? 'تهيئة المتجر لأول مرة' : 'تحديث بيانات الحساب'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Privacy & Confidentiality Guarantee Banner */}
          <div className="p-3 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-900/60 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed text-teal-900 dark:text-teal-200 font-medium">
              <span className="font-extrabold block text-teal-950 dark:text-teal-100">
                خصوصية وأمان بياناتك محمية 100%
              </span>
              بيانات الديون، سجلات العملاء، وسندات القبض مخزنة محلياً ومشفرة على جهازك بسرية تامة ولا يمكن لأحد الوصول إليها بدون تصريح.
            </div>
          </div>

          {/* Error Message if any */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* MODE 1: Standard Quick Login Screen */}
          {activeMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="text-center space-y-1">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  مرحباً بك مجدداً،
                </span>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  {settings.ownerName ? `المدير: ${settings.ownerName}` : 'تسجيل دخول المدير'}
                </h2>
                <p className="text-[11px] text-slate-400">
                  أدخل رمز PIN السري لفتح الدفاتر وحماية خصوصية الحسابات
                </p>
              </div>

              {/* PIN Dots Display */}
              <div className="flex items-center justify-center gap-2.5 py-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full border-2 transition-all ${
                      enteredPin.length > i
                        ? 'bg-violet-600 border-violet-600 scale-110 shadow-sm shadow-violet-600/40'
                        : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800'
                    }`}
                  />
                ))}
              </div>

              {/* Text Input Option with Visibility Toggle */}
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  maxLength={6}
                  value={enteredPin}
                  onChange={(e) => {
                    setEnteredPin(e.target.value.replace(/\D/g, ''));
                    setErrorMsg(null);
                  }}
                  placeholder="أدخل رمز PIN (مثال: 1234)..."
                  className="w-full h-11 px-4 pr-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono tracking-widest text-center text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40 font-bold"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute left-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Numeric Keypad for fast touch on mobile / tablet */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleKeypadPress(d)}
                    className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-violet-50 dark:hover:bg-violet-950/50 hover:text-violet-700 dark:hover:text-violet-300 text-slate-900 dark:text-slate-100 font-bold text-base transition-all active:scale-95 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-center"
                  >
                    {d}
                  </button>
                ))}
                <div className="flex items-center justify-center">
                  <span className="text-[10px] text-slate-400 font-mono">حساباتي</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-violet-50 dark:hover:bg-violet-950/50 hover:text-violet-700 dark:hover:text-violet-300 text-slate-900 dark:text-slate-100 font-bold text-base transition-all active:scale-95 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-center"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleKeypadDelete}
                  className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 text-slate-600 dark:text-slate-300 font-bold transition-all active:scale-95 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-center"
                  title="مسح"
                >
                  <Delete className="w-4 h-4" />
                </button>
              </div>

              {/* Remember Me Option */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
                  />
                  <span>تذكر تسجيل الدخول على هذا الجهاز</span>
                </label>

                <button
                  type="button"
                  onClick={() => setActiveMode('setup')}
                  className="text-violet-600 dark:text-violet-400 hover:underline font-bold text-[11px]"
                >
                  تعديل البيانات؟
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm shadow-md shadow-violet-600/30 hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>{isSubmitting ? 'جاري التحقق والدخول...' : 'تسجيل الدخول وفتح الحسابات'}</span>
              </button>
            </form>
          )}

          {/* MODE 2: First-Time Setup / Personalization Form */}
          {activeMode === 'setup' && (
            <form onSubmit={handleSetupSubmit} className="space-y-3.5">
              <div className="text-center space-y-0.5 pb-1">
                <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>تهيئة حساب متجرك لأول مرة</span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  خصص اسم محلك وعملتك لإنشاء كشوفات الحساب وحماية بياناتك برمز سري
                </p>
              </div>

              {/* Store Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Store className="w-3.5 h-3.5 text-violet-600" />
                  <span>اسم المحل / النشاط التجاري *</span>
                </label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="مثال: بقالة الأمل، مركز النور التجاري..."
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                />
              </div>

              {/* Owner Name & Phone Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-teal-600" />
                    <span>اسم المدير / التاجر</span>
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="مثال: أبو محمد"
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                    <span>العملة المعتمدة</span>
                  </label>
                  <input
                    type="text"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    placeholder="ريال، ر.س، د.إ..."
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                </div>
              </div>

              {/* Owner Phone */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>رقم هاتف المتجر / واتساب (اختياري للإيصالات)</span>
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  placeholder="+967..."
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40 text-left font-mono"
                />
              </div>

              {/* Private PIN Setting */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-rose-500" />
                    <span>رمز PIN السري (4 أرقام)</span>
                  </label>
                  <input
                    type={showNewPin ? 'text' : 'password'}
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="مثال: 1234"
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono tracking-widest text-center text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>تأكيد الرمز</span>
                  </label>
                  <input
                    type={showNewPin ? 'text' : 'password'}
                    maxLength={6}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="أعد إدخال الرمز"
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono tracking-widest text-center text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40 font-bold"
                  />
                </div>
              </div>

              {/* Show/Hide PIN toggle */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <button
                  type="button"
                  onClick={() => setShowNewPin(!showNewPin)}
                  className="text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 font-bold"
                >
                  {showNewPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showNewPin ? 'إخفاء الرمز' : 'إظهار الرمز'}</span>
                </button>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
                  />
                  <span>تذكرني على هذا الجهاز</span>
                </label>
              </div>

              {/* Setup Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-md shadow-emerald-600/30 hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2 mt-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'جاري حفظ الإعدادات وفتح الحسابات...'
                    : 'حفظ البيانات وبدء استخدام حساباتي'}
                </span>
              </button>
            </form>
          )}

          {/* Quick Feature Badges Footer */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 flex items-center justify-center gap-1">
              <FileText className="w-3 h-3 text-violet-600" />
              <span>كشوفات PDF</span>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 flex items-center justify-center gap-1">
              <MessageCircle className="w-3 h-3 text-emerald-600" />
              <span>إيصالات واتساب</span>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3 text-teal-600" />
              <span>قفل مشفر</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
