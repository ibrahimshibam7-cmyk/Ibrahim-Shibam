import React, { useState } from 'react';
import { Lock, Delete } from 'lucide-react';
import { UserSettings } from '../types';

interface AppLockProps {
  settings: UserSettings;
  onUnlock: () => void;
}

export const AppLock: React.FC<AppLockProps> = ({ settings, onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const targetPin = settings.pinCode || '1234';

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);

      if (newPin === targetPin) {
        setTimeout(onUnlock, 150);
      } else if (newPin.length === targetPin.length) {
        setError(true);
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 800);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError(false);
  };

  return (
    <div
      id="app-lock-screen"
      className="fixed inset-0 z-100 bg-slate-950 text-white flex flex-col items-center justify-center p-6 select-none"
    >
      <div className="w-full max-w-xs text-center space-y-6">
        {/* Icon & Store */}
        <div className="space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-teal-500/10 border border-teal-500/20 text-teal-400 mx-auto flex items-center justify-center shadow-lg shadow-teal-500/10">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black tracking-tight">{settings.shopName}</h2>
          <p className="text-xs text-slate-400">أدخل رمز PIN لفتح التطبيق</p>
        </div>

        {/* PIN Dots */}
        <div
          className={`flex items-center justify-center gap-3 py-2 ${
            error ? 'animate-bounce text-rose-500' : ''
          }`}
        >
          {Array.from({ length: targetPin.length }).map((_, i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full border transition-all ${
                pin.length > i
                  ? error
                    ? 'bg-rose-500 border-rose-500'
                    : 'bg-teal-400 border-teal-400 scale-110 shadow-sm shadow-teal-400/50'
                  : 'border-slate-700 bg-slate-900'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-rose-400 font-bold animate-fadeIn">
            رمز PIN غير صحيح، حاول مرة أخرى
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 pt-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleKeyPress(digit)}
              className="h-16 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-lg font-bold text-slate-100 active:scale-95 transition-all flex items-center justify-center"
            >
              {digit}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleKeyPress('0')}
            className="h-16 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-lg font-bold text-slate-100 active:scale-95 transition-all flex items-center justify-center"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-16 rounded-2xl bg-slate-900/40 hover:bg-slate-800/80 border border-slate-800/60 text-slate-400 hover:text-slate-200 active:scale-95 transition-all flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
