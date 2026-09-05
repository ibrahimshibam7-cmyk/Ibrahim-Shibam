import React from 'react';
import { X, Bell, Check, Trash2, ArrowUpRight, ArrowDownLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationsModalProps {
  notifications: AppNotification[];
  onClose: () => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onSelectCustomer?: (customerId: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  notifications,
  onClose,
  onMarkAllAsRead,
  onClearAll,
  onSelectCustomer,
}) => {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      id="notifications-modal-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4 animate-fadeIn"
    >
      <div
        id="notifications-sheet"
        className="w-full sm:max-w-md bg-white dark:bg-slate-900 sm:rounded-3xl rounded-t-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                الإشعارات
              </h3>
              <p className="text-[11px] text-slate-400">
                {unreadCount > 0 ? `${unreadCount} إشعار غير مقروء` : 'كافة الإشعارات مقروءة'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                title="تحديد الكل كمقروء"
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-600 flex items-center justify-center transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                title="مسح الكل"
                className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 flex items-center justify-center transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="p-4 space-y-2.5 overflow-y-auto no-scrollbar flex-1">
          {notifications.length > 0 ? (
            notifications.map((notif) => {
              const isDebt = notif.type === 'new_debt';
              const isPayment = notif.type === 'payment_received';
              const isSettled = notif.type === 'full_settlement';

              const formattedDate = new Date(notif.date).toLocaleDateString('ar-YE', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (notif.customerId && onSelectCustomer) {
                      onSelectCustomer(notif.customerId);
                      onClose();
                    }
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    !notif.read
                      ? 'bg-teal-50/40 dark:bg-teal-950/20 border-teal-200/80 dark:border-teal-900/60'
                      : 'bg-white dark:bg-slate-900 border-slate-200/70 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${
                        isSettled
                          ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300'
                          : isDebt
                          ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300'
                          : isPayment
                          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-300'
                      }`}
                    >
                      {isSettled ? (
                        <span className="text-sm">🎉</span>
                      ) : isDebt ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : isPayment ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formattedDate}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <Bell className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                لا توجد إشعارات حاليًا
              </h4>
              <p className="text-[11px] text-slate-400">
                ستصلك هنا إشعارات بالديون الجديدة والمدفوعات والمستحقات.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
