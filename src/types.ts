export type PaymentMethod = 'cash' | 'transfer' | 'other';

export type AccountStatus = 'debt' | 'settled';

export type DebtStatus = 'unpaid' | 'partially_paid' | 'paid';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  address?: string;
  notes?: string;
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
}

export interface CustomerWithStats extends Customer {
  totalDebt: number;
  totalPaid: number;
  remaining: number;
  status: AccountStatus;
  lastActivityDate?: string;
  debtsCount: number;
  paymentsCount: number;
}

export interface Debt {
  id: string;
  customerId: string;
  amount: number;
  description: string;
  debtDate: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
  status?: DebtStatus;
  paidAmount?: number;
}

export interface Payment {
  id: string;
  customerId: string;
  debtId?: string;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string; // ISO string
}

export type NotificationType =
  | 'new_debt'
  | 'payment_received'
  | 'full_settlement'
  | 'due_debt'
  | 'approaching_due';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  customerId?: string;
  customerName?: string;
  amount?: number;
  date: string;
  read: boolean;
}

export interface ActivityItem {
  id: string;
  type: 'debt' | 'payment' | 'customer';
  customerId: string;
  customerName: string;
  amount?: number;
  description: string;
  date: string;
  timestamp: number;
}

export interface StatementItem {
  id: string;
  type: 'debt' | 'payment';
  date: string;
  description: string;
  amount: number;
  runningBalance: number;
  method?: string;
  notes?: string;
}

export interface OverviewStats {
  totalDebts: number;
  totalPaid: number;
  totalRemaining: number;
  thisMonthPaid: number;
  totalCustomers: number;
  indebtedCustomersCount: number;
}

export interface MonthlyChartPoint {
  month: string;
  debts: number;
  payments: number;
}

export interface UserSettings {
  shopName: string;
  ownerName: string;
  ownerPhone: string;
  currency: string; // Default: 'ريال'
  shopLogo?: string; // Base64 Data URL
  darkMode: boolean;
  language: 'ar';
  appLockEnabled: boolean;
  pinCode?: string;
  isLoggedIn?: boolean;
  hasCompletedFirstLogin?: boolean;
  whatsappDebtTemplate?: string;
  whatsappPaymentTemplate?: string;
  whatsappSubscriptionTemplate?: string;
}

export type TabType =
  | 'dashboard'
  | 'customers'
  | 'subscriptions'
  | 'debts'
  | 'reports'
  | 'settings';

export type CustomerFilter = 'all' | 'debt' | 'settled';

export type CustomerSort = 'highest_debt' | 'latest_activity' | 'name';

export type DebtFilter = 'all' | 'unpaid' | 'partially_paid' | 'paid' | 'overdue';

export type ReportPeriod = 'today' | 'week' | 'month' | 'year' | 'custom';

// ===== MONTHLY SUBSCRIPTIONS TYPES =====
export type SubscriptionStatus = 'active' | 'paused';
export type SubscriptionMonthStatus = 'paid' | 'unpaid';

export interface Subscription {
  id: string; // SUB-XXXXXX
  customerId?: string;
  customerName: string;
  customerPhone: string;
  subscriptionType: string; // e.g. اشتراك شهري، إنترنت، نادي رياضي، كهرباء، مياه، إيجار، صيانة
  amount: number;
  currency: string;
  startDate: string; // YYYY-MM-DD
  dueDay: number; // 1 to 31
  reminderDaysBefore?: number; // أيام قبل موعد الاستحقاق أو يوم إرسال التذكير
  status: SubscriptionStatus; // 'active' | 'paused'
  notes?: string;
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
}

export interface SubscriptionMonth {
  id: string; // SUBM-XXXXXX
  subscriptionId: string;
  year: number; // e.g. 2026
  monthIndex: number; // 1 - 12
  monthLabel: string; // e.g. يوليو 2026
  amount: number;
  currency: string;
  status: SubscriptionMonthStatus; // 'paid' | 'unpaid'
  dueDate: string; // YYYY-MM-DD
  paidDate?: string; // YYYY-MM-DD
  paidAmount?: number;
  paymentMethod?: PaymentMethod;
  paymentId?: string;
  notes?: string;
  createdAt: string;
}

export interface SubscriptionPayment {
  id: string; // SUBP-XXXXXX
  subscriptionId: string;
  customerName: string;
  customerPhone: string;
  subscriptionType: string;
  monthIds: string[];
  monthsPaidLabels: string[];
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentDate: string; // YYYY-MM-DD
  receiptNumber: string; // REC-XXXX
  notes?: string;
  createdAt: string; // ISO string
}

export interface SubscriptionReminder {
  id: string;
  subscriptionId: string;
  voucherNumber: string; // REM-XXXX
  customerName: string;
  customerPhone: string;
  subscriptionType: string;
  currentMonth: string;
  amount: number;
  currency: string;
  unpaidMonths: { monthLabel: string; amount: number; dueDate?: string }[];
  totalDue: number;
  dueDate: string;
  issueDate: string;
  messageText: string;
  createdAt: string;
}

export interface SubscriptionStats {
  totalActiveSubscriptions: number;
  currentMonthTotalSubscriptions: number;
  currentMonthPaidCount: number;
  currentMonthUnpaidCount: number;
  currentMonthPaidAmount: number;
  currentMonthUnpaidAmount: number;
  totalDueAmount: number;
  totalArrearsAmount: number; // إجمالي المتأخرات للأشهر غير المسددة
  overdueCustomersCount: number; // عدد العملاء المتأخرين
  dueRemindersCount: number; // التذكيرات المستحقة
}

