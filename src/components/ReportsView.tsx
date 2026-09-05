import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  TrendingUp,
  CreditCard,
  AlertCircle,
  Users,
  Printer,
  Download,
  CheckCircle2,
  Clock,
  ArrowDownLeft,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { CustomerWithStats, Debt, Payment, ReportPeriod, UserSettings } from '../types';

interface ReportsViewProps {
  customers: CustomerWithStats[];
  debts: Debt[];
  payments: Payment[];
  settings: UserSettings;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  customers,
  debts,
  payments,
  settings,
}) => {
  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [customFrom, setCustomFrom] = useState(
    new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  );
  const [customTo, setCustomTo] = useState(new Date().toISOString().split('T')[0]);

  // Date range filter calculation
  const dateRange = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (period === 'today') {
      return { from: todayStr, to: todayStr, label: 'اليوم' };
    }
    if (period === 'week') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return { from: d.toISOString().split('T')[0], to: todayStr, label: 'هذا الأسبوع' };
    }
    if (period === 'month') {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: d.toISOString().split('T')[0], to: todayStr, label: 'هذا الشهر' };
    }
    if (period === 'year') {
      const d = new Date(now.getFullYear(), 0, 1);
      return { from: d.toISOString().split('T')[0], to: todayStr, label: 'هذا العام' };
    }
    return { from: customFrom, to: customTo, label: `من ${customFrom} إلى ${customTo}` };
  }, [period, customFrom, customTo]);

  // Filtered debts and payments in the selected period
  const periodDebts = useMemo(() => {
    return debts.filter((d) => {
      const date = d.debtDate || d.createdAt.split('T')[0];
      return date >= dateRange.from && date <= dateRange.to;
    });
  }, [debts, dateRange]);

  const periodPayments = useMemo(() => {
    return payments.filter((p) => {
      const date = p.paymentDate || p.createdAt.split('T')[0];
      return date >= dateRange.from && date <= dateRange.to;
    });
  }, [payments, dateRange]);

  const periodTotalDebts = periodDebts.reduce((sum, d) => sum + Number(d.amount), 0);
  const periodTotalPayments = periodPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const periodNetBalance = Math.max(0, periodTotalDebts - periodTotalPayments);

  // Overall Collections Breakdown
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).toISOString().split('T')[0];
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];

  const dailyCollection = payments
    .filter((p) => (p.paymentDate || p.createdAt.split('T')[0]) === todayStr)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const weeklyCollection = payments
    .filter((p) => (p.paymentDate || p.createdAt.split('T')[0]) >= startOfWeek)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const monthlyCollection = payments
    .filter((p) => (p.paymentDate || p.createdAt.split('T')[0]) >= startOfMonth)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const yearlyCollection = payments
    .filter((p) => (p.paymentDate || p.createdAt.split('T')[0]) >= startOfYear)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  // Monthly chart calculation for the last 6 months
  const monthlyData = useMemo(() => {
    const monthsMap: { [key: string]: { month: string; debts: number; payments: number } } = {};
    const curr = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(curr.getFullYear(), curr.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthName = d.toLocaleDateString('ar-YE', { month: 'short' });
      monthsMap[key] = { month: monthName, debts: 0, payments: 0 };
    }

    debts.forEach((debt) => {
      const dateStr = debt.debtDate || debt.createdAt;
      const key = dateStr.slice(0, 7);
      if (monthsMap[key]) {
        monthsMap[key].debts += Number(debt.amount) || 0;
      }
    });

    payments.forEach((payment) => {
      const dateStr = payment.paymentDate || payment.createdAt;
      const key = dateStr.slice(0, 7);
      if (monthsMap[key]) {
        monthsMap[key].payments += Number(payment.amount) || 0;
      }
    });

    return Object.values(monthsMap);
  }, [debts, payments]);

  const hasChartData = useMemo(() => {
    return monthlyData.some((m) => m.debts > 0 || m.payments > 0);
  }, [monthlyData]);

  // Customer segments
  const topDebtors = [...customers]
    .filter((c) => c.remaining > 0)
    .sort((a, b) => b.remaining - a.remaining)
    .slice(0, 5);

  const fullySettledCustomers = customers.filter((c) => c.remaining === 0 && c.totalPaid > 0);

  const overdueDebts = debts.filter((d) => {
    return d.dueDate && d.dueDate < todayStr;
  });

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div id="reports-view-container" className="space-y-4 pb-24 animate-fadeIn">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            التقارير المالية
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            تحليل شامل للديون والتحصيلات
          </p>
        </div>

        <button
          onClick={handlePrintReport}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all no-print"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>تصدير التقرير</span>
        </button>
      </div>

      {/* Period Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 no-print">
        {[
          { id: 'today', label: 'اليوم' },
          { id: 'week', label: 'هذا الأسبوع' },
          { id: 'month', label: 'هذا الشهر' },
          { id: 'year', label: 'هذا العام' },
          { id: 'custom', label: 'تحديد فترة' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setPeriod(tab.id as ReportPeriod)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
              period === tab.id
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Custom Date Range Inputs */}
      {period === 'custom' && (
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 grid grid-cols-2 gap-2 no-print">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
              من تاريخ:
            </label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="w-full h-10 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
              إلى تاريخ:
            </label>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="w-full h-10 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* Period Overview Cards */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span>تقرير الفترة:</span>
          <span className="font-bold text-teal-400">{dateRange.label}</span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="p-2.5 rounded-xl bg-white/10">
            <span className="text-[10px] text-rose-300 block mb-1">الديون المسجلة</span>
            <div className="text-sm font-black text-rose-400">
              {periodTotalDebts.toLocaleString()}
            </div>
            <span className="text-[9px] text-slate-400">{settings.currency}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/10">
            <span className="text-[10px] text-emerald-300 block mb-1">المبالغ المحصلة</span>
            <div className="text-sm font-black text-emerald-400">
              {periodTotalPayments.toLocaleString()}
            </div>
            <span className="text-[9px] text-slate-400">{settings.currency}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/10">
            <span className="text-[10px] text-teal-300 block mb-1">صافي الفرق</span>
            <div className="text-sm font-black text-white">
              {periodNetBalance.toLocaleString()}
            </div>
            <span className="text-[9px] text-slate-400">{settings.currency}</span>
          </div>
        </div>
      </div>

      {/* Monthly Trends Chart */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span>مقارنة الديون والتحصيلات الشهرية</span>
          </h3>
          <span className="text-[11px] text-slate-400">آخر 6 أشهر</span>
        </div>

        {hasChartData ? (
          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900/95 text-white p-2.5 rounded-xl text-xs space-y-1 shadow-xl border border-slate-700">
                          <p className="font-bold text-slate-200">{label}</p>
                          <p className="text-rose-400">
                            الديون: {Number(payload[0]?.value || 0).toLocaleString()} {settings.currency}
                          </p>
                          <p className="text-emerald-400">
                            التحصيل: {Number(payload[1]?.value || 0).toLocaleString()} {settings.currency}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="left"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
                  formatter={(val) => (val === 'debts' ? 'الديون' : 'التحصيلات')}
                />
                <Bar dataKey="debts" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={14} />
                <Bar dataKey="payments" fill="#10b981" radius={[4, 4, 0, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-1.5">
            <BarChart3 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              لا توجد بيانات كافية لعرض الرسم البياني.
            </p>
            <p className="text-[11px] text-slate-400">
              سيظهر الرسم البياني تلقائيًا بمجرد تسجيل ديون أو دفعات جديدة.
            </p>
          </div>
        )}
      </div>

      {/* Collections Velocity Report */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>تقرير التحصيل (السرعة والدورية)</span>
          </h3>
          <span className="text-[11px] text-slate-400">إجمالي {payments.length} دفعة</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">التحصيل اليومي:</span>
            <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
              {dailyCollection.toLocaleString()} {settings.currency}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">التحصيل الأسبوعي:</span>
            <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
              {weeklyCollection.toLocaleString()} {settings.currency}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">التحصيل الشهري:</span>
            <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {monthlyCollection.toLocaleString()} {settings.currency}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">التحصيل السنوي:</span>
            <div className="text-base font-black text-teal-600 dark:text-teal-400 mt-0.5">
              {yearlyCollection.toLocaleString()} {settings.currency}
            </div>
          </div>
        </div>
      </div>

      {/* Customers Segmentation Report */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <Users className="w-4 h-4 text-teal-600" />
          <span>تقرير حالة العملاء</span>
        </h3>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/60">
            <span className="text-[10px] text-rose-600 dark:text-rose-400 block mb-0.5">
              عليهم ديون
            </span>
            <span className="text-lg font-black text-rose-700 dark:text-rose-300">
              {customers.filter((c) => c.remaining > 0).length}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60">
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mb-0.5">
              سددوا بالكامل
            </span>
            <span className="text-lg font-black text-emerald-700 dark:text-emerald-300">
              {fullySettledCustomers.length}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/60">
            <span className="text-[10px] text-amber-600 dark:text-amber-400 block mb-0.5">
              ديون متأخرة
            </span>
            <span className="text-lg font-black text-amber-700 dark:text-amber-300">
              {overdueDebts.length}
            </span>
          </div>
        </div>
      </div>

      {/* Top Debtors Table */}
      {topDebtors.length > 0 && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2.5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            العملاء الأكثر مديونية
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {topDebtors.map((c, i) => (
              <div key={c.id} className="py-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold flex items-center justify-center text-[10px]">
                    {i + 1}
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {c.name}
                    </span>
                    <span className="text-[10px] text-slate-400">{c.phone}</span>
                  </div>
                </div>
                <div className="text-left font-black text-rose-600 dark:text-rose-400">
                  {c.remaining.toLocaleString()} {settings.currency}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
