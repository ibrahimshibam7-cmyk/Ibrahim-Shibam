import {
  Customer,
  CustomerWithStats,
  Debt,
  Payment,
  AppNotification,
  UserSettings,
  ActivityItem,
  StatementItem,
  DebtStatus,
  Subscription,
  SubscriptionMonth,
  SubscriptionPayment,
  SubscriptionReminder,
  SubscriptionStats,
  PaymentMethod,
} from '../types';

const STORAGE_KEYS = {
  CUSTOMERS: 'hisabati_customers_v1',
  DEBTS: 'hisabati_debts_v1',
  PAYMENTS: 'hisabati_payments_v1',
  NOTIFICATIONS: 'hisabati_notifications_v1',
  SETTINGS: 'hisabati_settings_v1',
  SUBSCRIPTIONS: 'hisabati_subscriptions_v1',
  SUBSCRIPTION_MONTHS: 'hisabati_sub_months_v1',
  SUBSCRIPTION_PAYMENTS: 'hisabati_sub_payments_v1',
  SUBSCRIPTION_REMINDERS: 'hisabati_sub_reminders_v1',
};

export const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

export function getArabicMonthName(monthIndex1Based: number): string {
  return (
    ARABIC_MONTHS[Math.max(0, Math.min(11, monthIndex1Based - 1))] ||
    `شهر ${monthIndex1Based}`
  );
}

const DEFAULT_SETTINGS: UserSettings = {
  shopName: 'متجري',
  ownerName: 'المدير',
  ownerPhone: '',
  currency: 'ريال',
  darkMode: false,
  language: 'ar',
  appLockEnabled: true,
  pinCode: '1234',
  isLoggedIn: false,
  hasCompletedFirstLogin: false,
  whatsappDebtTemplate: `السلام عليكم [اسم العميل]

نود تذكيركم بأن المبلغ المتبقي في حسابكم هو [المتبقي] [العملة].

إجمالي الدين: [إجمالي الدين] [العملة]
إجمالي المسدد: [إجمالي المسدد] [العملة]
المتبقي: [المتبقي] [العملة]

شاكرين لكم حسن تعاونكم.`,
  whatsappPaymentTemplate: `السلام عليكم [اسم العميل]

تم تسجيل سداد بمبلغ [مبلغ السداد] [العملة] في حسابكم.

إجمالي المدفوع: [إجمالي المدفوع] [العملة]
المبلغ المتبقي: [المتبقي] [العملة]

شكرًا لكم.`,
};

function purgeMockDataIfNeeded() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const isClean = localStorage.getItem('hisabati_real_db_v2');
    if (!isClean) {
      // Purge any residual mock/seed data from previous sessions
      const rawCustomers = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      if (rawCustomers && (rawCustomers.includes('CUST-101') || rawCustomers.includes('أحمد بن علي') || rawCustomers.includes('باوزير'))) {
        localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
        localStorage.removeItem(STORAGE_KEYS.DEBTS);
        localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
        localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
      }
      localStorage.setItem('hisabati_real_db_v2', 'true');
    }
  } catch (e) {
    console.warn('Real DB initialization check failed', e);
  }
}

purgeMockDataIfNeeded();

type Listener = () => void;
const listeners = new Set<Listener>();

function notifyChange() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Error in database listener:', e);
    }
  });
}

export const db = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  // ===== SETTINGS =====
  getSettings(): UserSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch (e) {
      console.error('Failed to load settings', e);
    }
    return DEFAULT_SETTINGS;
  },

  updateSettings(newSettings: Partial<UserSettings>): UserSettings {
    const current = this.getSettings();
    const updated = { ...current, ...newSettings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    notifyChange();
    return updated;
  },

  // ===== CUSTOMERS =====
  getCustomers(): Customer[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load customers', e);
      return [];
    }
  },

  getCustomerById(id: string): Customer | undefined {
    return this.getCustomers().find((c) => c.id === id);
  },

  getCustomerByPhone(phone: string, excludeId?: string): Customer | undefined {
    const clean = phone.trim();
    return this.getCustomers().find(
      (c) => c.phone.trim() === clean && (!excludeId || c.id !== excludeId)
    );
  },

  addCustomer(data: {
    name: string;
    phone: string;
    whatsapp?: string;
    address?: string;
    notes?: string;
  }): { success: boolean; customer?: Customer; error?: string } {
    const trimmedName = data.name.trim();
    const trimmedPhone = data.phone.trim();

    if (!trimmedName) {
      return { success: false, error: 'يرجى إدخال اسم العميل' };
    }
    if (!trimmedPhone) {
      return { success: false, error: 'يرجى إدخال رقم هاتف العميل' };
    }

    if (this.getCustomerByPhone(trimmedPhone)) {
      return {
        success: false,
        error: 'رقم الهاتف مسجل مسبقًا لعميل آخر. يرجى استخدام رقم مختلف.',
      };
    }

    const nowStr = new Date().toISOString();
    const newCustomer: Customer = {
      id: 'CUST-' + Date.now().toString().slice(-6),
      name: trimmedName,
      phone: trimmedPhone,
      whatsapp: data.whatsapp?.trim() || trimmedPhone,
      address: data.address?.trim() || '',
      notes: data.notes?.trim() || '',
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    const customers = this.getCustomers();
    customers.push(newCustomer);
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));

    this.addNotification({
      type: 'new_debt', // or registration
      title: 'إضافة عميل جديد',
      message: `تم إضافة العميل ${newCustomer.name} بنجاح`,
      customerId: newCustomer.id,
      customerName: newCustomer.name,
    });

    notifyChange();
    return { success: true, customer: newCustomer };
  },

  updateCustomer(
    id: string,
    data: Partial<Omit<Customer, 'id' | 'createdAt'>>
  ): { success: boolean; error?: string } {
    const customers = this.getCustomers();
    const index = customers.findIndex((c) => c.id === id);
    if (index === -1) {
      return { success: false, error: 'العميل غير موجود' };
    }

    if (data.phone) {
      const existing = this.getCustomerByPhone(data.phone, id);
      if (existing) {
        return {
          success: false,
          error: 'رقم الهاتف مسجل مسبقًا لعميل آخر.',
        };
      }
    }

    customers[index] = {
      ...customers[index],
      ...data,
      name: data.name?.trim() ?? customers[index].name,
      phone: data.phone?.trim() ?? customers[index].phone,
      whatsapp: data.whatsapp?.trim() ?? customers[index].whatsapp,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    notifyChange();
    return { success: true };
  },

  deleteCustomer(id: string): { success: boolean; error?: string } {
    const customers = this.getCustomers().filter((c) => c.id !== id);
    const debts = this.getDebts().filter((d) => d.customerId !== id);
    const payments = this.getPayments().filter((p) => p.customerId !== id);

    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));

    notifyChange();
    return { success: true };
  },

  // ===== DEBTS =====
  getDebts(): Debt[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DEBTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load debts', e);
      return [];
    }
  },

  getDebtsByCustomer(customerId: string): Debt[] {
    return this.getDebts().filter((d) => d.customerId === customerId);
  },

  addDebt(data: {
    customerId: string;
    amount: number;
    description: string;
    debtDate?: string;
    dueDate?: string;
    notes?: string;
  }): { success: boolean; debt?: Debt; error?: string } {
    const customer = this.getCustomerById(data.customerId);
    if (!customer) {
      return { success: false, error: 'العميل غير موجود' };
    }

    if (!data.amount || data.amount <= 0) {
      return { success: false, error: 'يرجى إدخال مبلغ صحيح أكبر من الصفر' };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const nowStr = new Date().toISOString();
    const newDebt: Debt = {
      id: 'DEBT-' + Date.now().toString().slice(-6),
      customerId: data.customerId,
      amount: Number(data.amount),
      description: data.description?.trim() || 'دين جديد',
      debtDate: data.debtDate || todayStr,
      dueDate: data.dueDate || undefined,
      notes: data.notes?.trim() || '',
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    const debts = this.getDebts();
    debts.push(newDebt);
    localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));

    const settings = this.getSettings();
    this.addNotification({
      type: 'new_debt',
      title: 'تسجيل دين جديد',
      message: `تم تسجيل دين بمبلغ ${newDebt.amount.toLocaleString()} ${settings.currency} على العميل ${customer.name}`,
      customerId: customer.id,
      customerName: customer.name,
      amount: newDebt.amount,
    });

    notifyChange();
    return { success: true, debt: newDebt };
  },

  deleteDebt(id: string): { success: boolean; error?: string } {
    const debts = this.getDebts().filter((d) => d.id !== id);
    localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
    notifyChange();
    return { success: true };
  },

  // ===== PAYMENTS =====
  getPayments(): Payment[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load payments', e);
      return [];
    }
  },

  getPaymentsByCustomer(customerId: string): Payment[] {
    return this.getPayments().filter((p) => p.customerId === customerId);
  },

  addPayment(data: {
    customerId: string;
    debtId?: string;
    amount: number;
    paymentDate?: string;
    paymentMethod: Payment['paymentMethod'];
    notes?: string;
  }): { success: boolean; payment?: Payment; isFullySettled?: boolean; error?: string } {
    const customer = this.getCustomerById(data.customerId);
    if (!customer) {
      return { success: false, error: 'العميل غير موجود' };
    }

    const stats = this.getCustomerStats(data.customerId);
    const amount = Number(data.amount);

    if (!amount || amount <= 0) {
      return { success: false, error: 'يرجى إدخال مبلغ سداد صحيح أكبر من الصفر' };
    }

    if (amount > stats.remaining) {
      return {
        success: false,
        error: `مبلغ السداد (${amount.toLocaleString()}) أكبر من المبلغ المتبقي على العميل (${stats.remaining.toLocaleString()})`,
      };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const newPayment: Payment = {
      id: 'PAY-' + Date.now().toString().slice(-6),
      customerId: data.customerId,
      debtId: data.debtId,
      amount: amount,
      paymentDate: data.paymentDate || todayStr,
      paymentMethod: data.paymentMethod || 'cash',
      notes: data.notes?.trim() || '',
      createdAt: new Date().toISOString(),
    };

    const payments = this.getPayments();
    payments.push(newPayment);
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));

    const settings = this.getSettings();
    const newRemaining = stats.remaining - amount;
    const isFullySettled = newRemaining <= 0;

    this.addNotification({
      type: isFullySettled ? 'full_settlement' : 'payment_received',
      title: isFullySettled ? 'تسديد الحساب بالكامل 🎉' : 'تسجيل عملية سداد',
      message: isFullySettled
        ? `قام العميل ${customer.name} بتسديد كامل حسابه المتبقي بمبلغ ${amount.toLocaleString()} ${settings.currency}!`
        : `تم استلام دفعة بمبلغ ${amount.toLocaleString()} ${settings.currency} من العميل ${customer.name}`,
      customerId: customer.id,
      customerName: customer.name,
      amount: amount,
    });

    notifyChange();
    return { success: true, payment: newPayment, isFullySettled };
  },

  deletePayment(id: string): { success: boolean; error?: string } {
    const payments = this.getPayments().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
    notifyChange();
    return { success: true };
  },

  // ===== DYNAMIC CALCULATIONS =====
  getCustomerStats(customerId: string): CustomerWithStats {
    const customer = this.getCustomerById(customerId);
    if (!customer) {
      throw new Error(`Customer with ID ${customerId} not found`);
    }

    const customerDebts = this.getDebtsByCustomer(customerId);
    const customerPayments = this.getPaymentsByCustomer(customerId);

    const totalDebt = customerDebts.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const totalPaid = customerPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const remaining = Math.max(0, totalDebt - totalPaid);
    const status: 'debt' | 'settled' = remaining > 0 ? 'debt' : 'settled';

    // Last activity date
    const allDates = [
      ...customerDebts.map((d) => d.debtDate || d.createdAt),
      ...customerPayments.map((p) => p.paymentDate || p.createdAt),
    ];
    allDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    const lastActivityDate = allDates[0] || customer.createdAt;

    return {
      ...customer,
      totalDebt,
      totalPaid,
      remaining,
      status,
      lastActivityDate,
      debtsCount: customerDebts.length,
      paymentsCount: customerPayments.length,
    };
  },

  getAllCustomersWithStats(): CustomerWithStats[] {
    const customers = this.getCustomers();
    const debts = this.getDebts();
    const payments = this.getPayments();

    return customers.map((customer) => {
      const custDebts = debts.filter((d) => d.customerId === customer.id);
      const custPayments = payments.filter((p) => p.customerId === customer.id);

      const totalDebt = custDebts.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
      const totalPaid = custPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const remaining = Math.max(0, totalDebt - totalPaid);
      const status: 'debt' | 'settled' = remaining > 0 ? 'debt' : 'settled';

      const allDates = [
        ...custDebts.map((d) => d.debtDate || d.createdAt),
        ...custPayments.map((p) => p.paymentDate || p.createdAt),
      ];
      allDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      const lastActivityDate = allDates[0] || customer.createdAt;

      return {
        ...customer,
        totalDebt,
        totalPaid,
        remaining,
        status,
        lastActivityDate,
        debtsCount: custDebts.length,
        paymentsCount: custPayments.length,
      };
    });
  },

  getOverviewStats() {
    const customersWithStats = this.getAllCustomersWithStats();
    const payments = this.getPayments();

    const totalDebts = customersWithStats.reduce((sum, c) => sum + c.totalDebt, 0);
    const totalPaid = customersWithStats.reduce((sum, c) => sum + c.totalPaid, 0);
    const totalRemaining = Math.max(0, totalDebts - totalPaid);
    const totalCustomers = customersWithStats.length;
    const indebtedCustomersCount = customersWithStats.filter((c) => c.remaining > 0).length;

    // This month's collections
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const thisMonthPaid = payments
      .filter((p) => {
        const d = new Date(p.paymentDate || p.createdAt);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      })
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return {
      totalDebts,
      totalPaid,
      totalRemaining,
      thisMonthPaid,
      totalCustomers,
      indebtedCustomersCount,
    };
  },

  // Get Detailed Account Statement for a Customer
  getCustomerStatement(customerId: string): StatementItem[] {
    const debts = this.getDebtsByCustomer(customerId);
    const payments = this.getPaymentsByCustomer(customerId);

    // Merge and sort ascending first to compute running balance
    interface RawEvent {
      id: string;
      type: 'debt' | 'payment';
      date: string;
      createdAt: string;
      description: string;
      amount: number;
      method?: string;
      notes?: string;
    }

    const events: RawEvent[] = [
      ...debts.map((d) => ({
        id: d.id,
        type: 'debt' as const,
        date: d.debtDate || d.createdAt.split('T')[0],
        createdAt: d.createdAt,
        description: d.description || 'دين جديد',
        amount: Number(d.amount),
        notes: d.notes,
      })),
      ...payments.map((p) => ({
        id: p.id,
        type: 'payment' as const,
        date: p.paymentDate || p.createdAt.split('T')[0],
        createdAt: p.createdAt,
        description:
          p.paymentMethod === 'cash'
            ? 'سداد نقدًا'
            : p.paymentMethod === 'transfer'
            ? 'سداد تحويل'
            : 'سداد',
        amount: Number(p.amount),
        method: p.paymentMethod,
        notes: p.notes,
      })),
    ];

    events.sort((a, b) => {
      const timeA = new Date(a.date + 'T00:00:00').getTime();
      const timeB = new Date(b.date + 'T00:00:00').getTime();
      if (timeA !== timeB) return timeA - timeB;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    let currentBalance = 0;
    const computedStatement: StatementItem[] = events.map((ev) => {
      if (ev.type === 'debt') {
        currentBalance += ev.amount;
      } else {
        currentBalance = Math.max(0, currentBalance - ev.amount);
      }
      return {
        id: ev.id,
        type: ev.type,
        date: ev.date,
        description: ev.description,
        amount: ev.amount,
        runningBalance: currentBalance,
        method: ev.method,
        notes: ev.notes,
      };
    });

    // Return descending (newest to oldest) as required by prompt
    return computedStatement.reverse();
  },

  // Recent Activity across the entire store
  getRecentActivity(limit = 10): ActivityItem[] {
    const customers = this.getCustomers();
    const debts = this.getDebts();
    const payments = this.getPayments();

    const customerMap = new Map(customers.map((c) => [c.id, c.name]));

    const items: ActivityItem[] = [
      ...customers.map((c) => ({
        id: 'act-c-' + c.id,
        type: 'customer' as const,
        customerId: c.id,
        customerName: c.name,
        description: 'إضافة عميل جديد',
        date: c.createdAt,
        timestamp: new Date(c.createdAt).getTime(),
      })),
      ...debts.map((d) => ({
        id: 'act-d-' + d.id,
        type: 'debt' as const,
        customerId: d.customerId,
        customerName: customerMap.get(d.customerId) || 'عميل محذوف',
        amount: d.amount,
        description: d.description || 'إضافة دين',
        date: d.debtDate || d.createdAt,
        timestamp: new Date(d.createdAt).getTime(),
      })),
      ...payments.map((p) => ({
        id: 'act-p-' + p.id,
        type: 'payment' as const,
        customerId: p.customerId,
        customerName: customerMap.get(p.customerId) || 'عميل محذوف',
        amount: p.amount,
        description: `تسجيل سداد (${
          p.paymentMethod === 'cash'
            ? 'نقدًا'
            : p.paymentMethod === 'transfer'
            ? 'تحويل'
            : 'أخرى'
        })`,
        date: p.paymentDate || p.createdAt,
        timestamp: new Date(p.createdAt).getTime(),
      })),
    ];

    items.sort((a, b) => b.timestamp - a.timestamp);
    return items.slice(0, limit);
  },

  // Monthly stats for charts (debts vs payments)
  getMonthlyChartData() {
    const debts = this.getDebts();
    const payments = this.getPayments();

    const monthNames = [
      'يناير',
      'فبراير',
      'مارس',
      'أبريل',
      'مايو',
      'يونيو',
      'يوليو',
      'أغسطس',
      'سبتمبر',
      'أكتوبر',
      'نوفمبر',
      'ديسمبر',
    ];

    const today = new Date();
    const result = [];

    // Last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const label = monthNames[month];

      const monthDebts = debts
        .filter((debt) => {
          const debtDate = new Date(debt.debtDate || debt.createdAt);
          return debtDate.getFullYear() === year && debtDate.getMonth() === month;
        })
        .reduce((sum, item) => sum + Number(item.amount), 0);

      const monthPayments = payments
        .filter((pay) => {
          const payDate = new Date(pay.paymentDate || pay.createdAt);
          return payDate.getFullYear() === year && payDate.getMonth() === month;
        })
        .reduce((sum, item) => sum + Number(item.amount), 0);

      result.push({
        month: label,
        year,
        monthIndex: month,
        debts: monthDebts,
        payments: monthPayments,
      });
    }

    return result;
  },

  // Debts with calculated status
  getAllDebtsWithStatus() {
    const debts = this.getDebts();
    const customers = this.getCustomers();
    const customerMap = new Map<string, Customer>(customers.map((c) => [c.id, c]));
    const todayStr = new Date().toISOString().split('T')[0];

    return debts.map((d) => {
      const customer = customerMap.get(d.customerId);
      const isOverdue = d.dueDate ? d.dueDate < todayStr : false;

      // We can also associate payments if debtId is linked, or fallback to general ratio
      return {
        ...d,
        customerName: customer ? customer.name : 'عميل غير معروف',
        customerPhone: customer ? customer.phone : '',
        customerWhatsapp: customer ? customer.whatsapp : '',
        isOverdue,
      };
    });
  },

  // ===== NOTIFICATIONS =====
  getNotifications(): AppNotification[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load notifications', e);
      return [];
    }
  },

  addNotification(data: Omit<AppNotification, 'id' | 'date' | 'read'>) {
    const notifications = this.getNotifications();
    const newNotif: AppNotification = {
      ...data,
      id: 'NOTIF-' + Date.now().toString(),
      date: new Date().toISOString(),
      read: false,
    };
    notifications.unshift(newNotif);
    // Keep max 50 notifications
    if (notifications.length > 50) notifications.pop();
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  },

  markNotificationAsRead(id: string) {
    const notifs = this.getNotifications().map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    notifyChange();
  },

  markAllNotificationsAsRead() {
    const notifs = this.getNotifications().map((n) => ({ ...n, read: true }));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    notifyChange();
  },

  clearAllNotifications() {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    notifyChange();
  },

  getUnreadNotificationsCount(): number {
    return this.getNotifications().filter((n) => !n.read).length;
  },

  // ===== MONTHLY SUBSCRIPTIONS =====
  getSubscriptions(): Subscription[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load subscriptions', e);
      return [];
    }
  },

  getSubscriptionById(id: string): Subscription | undefined {
    return this.getSubscriptions().find((s) => s.id === id);
  },

  addSubscription(data: {
    customerId?: string;
    customerName: string;
    customerPhone: string;
    subscriptionType: string;
    amount: number;
    currency?: string;
    startDate: string;
    dueDay: number;
    reminderDaysBefore?: number;
    status?: 'active' | 'paused';
    notes?: string;
  }): { success: boolean; subscription?: Subscription; error?: string } {
    const trimmedName = data.customerName.trim();
    const trimmedPhone = data.customerPhone.trim();
    const subType = data.subscriptionType.trim();

    if (!trimmedName) {
      return { success: false, error: 'يرجى إدخال اسم العميل' };
    }
    if (!trimmedPhone) {
      return { success: false, error: 'يرجى إدخال رقم هاتف العميل' };
    }
    if (!subType) {
      return { success: false, error: 'يرجى إدخال نوع الاشتراك' };
    }
    if (Number(data.amount) <= 0) {
      return { success: false, error: 'يرجى إدخال مبلغ اشتراك صالح أكبر من صفر' };
    }

    const settings = this.getSettings();
    const nowStr = new Date().toISOString();
    const subId = 'SUB-' + Date.now().toString().slice(-6);

    const newSub: Subscription = {
      id: subId,
      customerId: data.customerId || undefined,
      customerName: trimmedName,
      customerPhone: trimmedPhone,
      subscriptionType: subType,
      amount: Number(data.amount),
      currency: data.currency?.trim() || settings.currency || 'ريال',
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      dueDay: Math.min(31, Math.max(1, Number(data.dueDay) || 1)),
      reminderDaysBefore: data.reminderDaysBefore !== undefined ? Number(data.reminderDaysBefore) : 2,
      status: data.status || 'active',
      notes: data.notes?.trim() || '',
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    const subscriptions = this.getSubscriptions();
    subscriptions.unshift(newSub);
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subscriptions));

    // Automatically generate month records from start date up to current date
    this.ensureSubscriptionMonths(newSub.id);

    this.addNotification({
      type: 'new_debt',
      title: 'اشتراك شهري جديد',
      message: `تم إضافة اشتراك ${newSub.subscriptionType} للعميل ${newSub.customerName}`,
      customerId: newSub.customerId,
      customerName: newSub.customerName,
      amount: newSub.amount,
    });

    notifyChange();
    return { success: true, subscription: newSub };
  },

  updateSubscription(
    id: string,
    data: Partial<Omit<Subscription, 'id' | 'createdAt'>>
  ): { success: boolean; error?: string } {
    const subscriptions = this.getSubscriptions();
    const index = subscriptions.findIndex((s) => s.id === id);
    if (index === -1) {
      return { success: false, error: 'الاشتراك غير موجود' };
    }

    const current = subscriptions[index];
    const updated: Subscription = {
      ...current,
      ...data,
      customerName: data.customerName?.trim() ?? current.customerName,
      customerPhone: data.customerPhone?.trim() ?? current.customerPhone,
      subscriptionType: data.subscriptionType?.trim() ?? current.subscriptionType,
      amount: data.amount !== undefined ? Number(data.amount) : current.amount,
      currency: data.currency?.trim() ?? current.currency,
      dueDay: data.dueDay !== undefined ? Math.min(31, Math.max(1, Number(data.dueDay))) : current.dueDay,
      updatedAt: new Date().toISOString(),
    };

    subscriptions[index] = updated;
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subscriptions));

    // Ensure months reflect any changes
    this.ensureSubscriptionMonths(id);

    notifyChange();
    return { success: true };
  },

  deleteSubscription(id: string): { success: boolean; error?: string } {
    const subscriptions = this.getSubscriptions().filter((s) => s.id !== id);
    const months = this.getSubscriptionMonths().filter((m) => m.subscriptionId !== id);
    const payments = this.getSubscriptionPayments().filter((p) => p.subscriptionId !== id);
    const reminders = this.getSubscriptionReminders().filter((r) => r.subscriptionId !== id);

    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subscriptions));
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_MONTHS, JSON.stringify(months));
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_PAYMENTS, JSON.stringify(payments));
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_REMINDERS, JSON.stringify(reminders));

    notifyChange();
    return { success: true };
  },

  // ===== SUBSCRIPTION MONTHS =====
  getSubscriptionMonths(subscriptionId?: string): SubscriptionMonth[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_MONTHS);
      const list: SubscriptionMonth[] = data ? JSON.parse(data) : [];
      if (!subscriptionId) {
        return list;
      }
      return list
        .filter((m) => m.subscriptionId === subscriptionId)
        .sort((a, b) => a.year * 12 + a.monthIndex - (b.year * 12 + b.monthIndex));
    } catch (e) {
      console.error('Failed to load subscription months', e);
      return [];
    }
  },

  ensureSubscriptionMonths(subscriptionId: string): SubscriptionMonth[] {
    const sub = this.getSubscriptionById(subscriptionId);
    if (!sub) return [];

    let startYear = new Date().getFullYear();
    let startMonth = new Date().getMonth() + 1;

    if (sub.startDate) {
      const parts = sub.startDate.split('-');
      if (parts.length >= 2) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
          startYear = y;
          startMonth = m;
        }
      }
    }

    const today = new Date();
    const nowYear = today.getFullYear();
    const nowMonth = today.getMonth() + 1;

    // We generate from startYear/startMonth up to current year/month
    const requiredMonths: { year: number; monthIndex: number }[] = [];

    let currY = startYear;
    let currM = startMonth;

    // Safety guard to avoid runaway loops
    let safetyCounter = 0;
    while (
      safetyCounter < 120 &&
      (currY < nowYear || (currY === nowYear && currM <= nowMonth))
    ) {
      requiredMonths.push({ year: currY, monthIndex: currM });
      currM++;
      if (currM > 12) {
        currM = 1;
        currY++;
      }
      safetyCounter++;
    }

    // If start date is in the future, at least add the start month
    if (requiredMonths.length === 0) {
      requiredMonths.push({ year: startYear, monthIndex: startMonth });
    }

    const allStoredMonths = this.getSubscriptionMonths();
    let hasAdded = false;

    for (const req of requiredMonths) {
      // RULE: لا يتم إنشاء نفس الشهر مرتين لنفس الاشتراك
      const exists = allStoredMonths.some(
        (m) =>
          m.subscriptionId === sub.id &&
          m.year === req.year &&
          m.monthIndex === req.monthIndex
      );

      if (!exists) {
        const day = Math.min(28, sub.dueDay || 1);
        const dueFormatted = `${req.year}-${String(req.monthIndex).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const newMonthItem: SubscriptionMonth = {
          id: `SUBM-${sub.id.replace('SUB-', '')}-${req.year}-${String(req.monthIndex).padStart(2, '0')}`,
          subscriptionId: sub.id,
          year: req.year,
          monthIndex: req.monthIndex,
          monthLabel: `${getArabicMonthName(req.monthIndex)} ${req.year}`,
          amount: Number(sub.amount),
          currency: sub.currency,
          status: 'unpaid',
          dueDate: dueFormatted,
          createdAt: new Date().toISOString(),
        };
        allStoredMonths.push(newMonthItem);
        hasAdded = true;
      }
    }

    if (hasAdded) {
      localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_MONTHS, JSON.stringify(allStoredMonths));
      notifyChange();
    }

    return allStoredMonths
      .filter((m) => m.subscriptionId === subscriptionId)
      .sort((a, b) => a.year * 12 + a.monthIndex - (b.year * 12 + b.monthIndex));
  },

  addCustomSubscriptionMonth(
    subscriptionId: string,
    year: number,
    monthIndex: number
  ): { success: boolean; month?: SubscriptionMonth; error?: string } {
    const sub = this.getSubscriptionById(subscriptionId);
    if (!sub) return { success: false, error: 'الاشتراك غير موجود' };

    const allStoredMonths = this.getSubscriptionMonths();
    const exists = allStoredMonths.some(
      (m) =>
        m.subscriptionId === sub.id &&
        m.year === year &&
        m.monthIndex === monthIndex
    );
    if (exists) {
      return { success: false, error: 'هذا الشهر مسجل مسبقًا لهذا الاشتراك' };
    }

    const day = Math.min(28, sub.dueDay || 1);
    const dueFormatted = `${year}-${String(monthIndex).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const newMonthItem: SubscriptionMonth = {
      id: `SUBM-${sub.id.replace('SUB-', '')}-${year}-${String(monthIndex).padStart(2, '0')}`,
      subscriptionId: sub.id,
      year,
      monthIndex,
      monthLabel: `${getArabicMonthName(monthIndex)} ${year}`,
      amount: Number(sub.amount),
      currency: sub.currency,
      status: 'unpaid',
      dueDate: dueFormatted,
      createdAt: new Date().toISOString(),
    };

    allStoredMonths.push(newMonthItem);
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_MONTHS, JSON.stringify(allStoredMonths));
    notifyChange();

    return { success: true, month: newMonthItem };
  },

  updateSubscriptionMonth(
    monthId: string,
    data: Partial<SubscriptionMonth>
  ): { success: boolean; error?: string } {
    const allStoredMonths = this.getSubscriptionMonths();
    const idx = allStoredMonths.findIndex((m) => m.id === monthId);
    if (idx === -1) {
      return { success: false, error: 'سجل الشهر غير موجود' };
    }

    allStoredMonths[idx] = {
      ...allStoredMonths[idx],
      ...data,
    };
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_MONTHS, JSON.stringify(allStoredMonths));
    notifyChange();
    return { success: true };
  },

  // ===== RECORD SUBSCRIPTION PAYMENT =====
  recordSubscriptionPayment(data: {
    subscriptionId: string;
    monthIds: string[];
    amount: number;
    currency: string;
    paymentMethod: PaymentMethod;
    paymentDate?: string;
    notes?: string;
  }): { success: boolean; payment?: SubscriptionPayment; error?: string } {
    const sub = this.getSubscriptionById(data.subscriptionId);
    if (!sub) {
      return { success: false, error: 'الاشتراك غير موجود' };
    }
    if (!data.monthIds || data.monthIds.length === 0) {
      return { success: false, error: 'يرجى اختيار شهر واحد على الأقل لسداده' };
    }
    if (Number(data.amount) <= 0) {
      return { success: false, error: 'يرجى إدخال مبلغ سداد صالح' };
    }

    const payDate = data.paymentDate || new Date().toISOString().split('T')[0];
    const receiptNumber = `REC-SUB-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Date.now().toString().slice(-4)}`;
    const paymentId = 'SUBP-' + Date.now().toString().slice(-6);

    const allStoredMonths = this.getSubscriptionMonths();
    const paidMonthsLabels: string[] = [];

    // Mark each selected month as paid
    allStoredMonths.forEach((m) => {
      if (m.subscriptionId === sub.id && data.monthIds.includes(m.id)) {
        m.status = 'paid';
        m.paidDate = payDate;
        m.paidAmount = m.amount;
        m.paymentMethod = data.paymentMethod;
        m.paymentId = paymentId;
        if (data.notes) {
          m.notes = data.notes;
        }
        paidMonthsLabels.push(m.monthLabel);
      }
    });

    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_MONTHS, JSON.stringify(allStoredMonths));

    const newPayment: SubscriptionPayment = {
      id: paymentId,
      subscriptionId: sub.id,
      customerName: sub.customerName,
      customerPhone: sub.customerPhone,
      subscriptionType: sub.subscriptionType,
      monthIds: data.monthIds,
      monthsPaidLabels: paidMonthsLabels,
      amount: Number(data.amount),
      currency: data.currency || sub.currency,
      paymentMethod: data.paymentMethod,
      paymentDate: payDate,
      receiptNumber,
      notes: data.notes?.trim() || '',
      createdAt: new Date().toISOString(),
    };

    const allPayments = this.getSubscriptionPayments();
    allPayments.unshift(newPayment);
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_PAYMENTS, JSON.stringify(allPayments));

    this.addNotification({
      type: 'payment_received',
      title: 'تسجيل سداد اشتراك',
      message: `تم سداد ${newPayment.amount.toLocaleString()} ${newPayment.currency} لاشتراك ${sub.customerName} (${paidMonthsLabels.join('، ')})`,
      customerId: sub.customerId,
      customerName: sub.customerName,
      amount: newPayment.amount,
    });

    notifyChange();
    return { success: true, payment: newPayment };
  },

  getSubscriptionPayments(subscriptionId?: string): SubscriptionPayment[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_PAYMENTS);
      const list: SubscriptionPayment[] = data ? JSON.parse(data) : [];
      if (!subscriptionId) return list;
      return list.filter((p) => p.subscriptionId === subscriptionId);
    } catch (e) {
      console.error('Failed to load subscription payments', e);
      return [];
    }
  },

  getSubscriptionPaymentById(id: string): SubscriptionPayment | undefined {
    return this.getSubscriptionPayments().find((p) => p.id === id);
  },

  // ===== SUBSCRIPTION REMINDERS =====
  getSubscriptionReminders(subscriptionId?: string): SubscriptionReminder[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_REMINDERS);
      const list: SubscriptionReminder[] = data ? JSON.parse(data) : [];
      if (!subscriptionId) return list;
      return list.filter((r) => r.subscriptionId === subscriptionId);
    } catch (e) {
      console.error('Failed to load subscription reminders', e);
      return [];
    }
  },

  createSubscriptionReminder(data: {
    subscriptionId: string;
    customMessage?: string;
  }): SubscriptionReminder {
    const sub = this.getSubscriptionById(data.subscriptionId);
    if (!sub) {
      throw new Error('الاشتراك غير موجود');
    }

    const months = this.ensureSubscriptionMonths(sub.id);
    const unpaidMonths = months.filter((m) => m.status === 'unpaid');
    const totalDue = unpaidMonths.reduce((sum, m) => sum + Number(m.amount), 0);

    const now = new Date();
    const currentMonthLabel = `${getArabicMonthName(now.getMonth() + 1)} ${now.getFullYear()}`;
    const voucherNumber = `REM-SUB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Date.now().toString().slice(-4)}`;
    const issueDate = now.toISOString().split('T')[0];

    const dueDayFormatted = String(Math.min(28, sub.dueDay || 1)).padStart(2, '0');
    const currentDueDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${dueDayFormatted}`;

    const settings = this.getSettings();

    // Build the default unpaid breakdown list
    const unpaidListText =
      unpaidMonths.length > 0
        ? unpaidMonths
            .map((m) => `• ${m.monthLabel}: ${m.amount.toLocaleString()} ${sub.currency}`)
            .join('\n')
        : `• ${currentMonthLabel}: ${sub.amount.toLocaleString()} ${sub.currency}`;

    const defaultMsg = `السلام عليكم ورحمة الله وبركاته،
الأخ الفاضل / *${sub.customerName}* المحترم

نود تذكيركم بمستحقات *${sub.subscriptionType}*:
• قيمة الاشتراك الشهري: *${sub.amount.toLocaleString()} ${sub.currency}*
• موعد الاستحقاق: *يوم ${sub.dueDay} من كل شهر*
• الشهر الحالي: *${currentMonthLabel}*

📋 *الأشهر غير المسددة:*
${unpaidListText}

💰 *إجمالي المبلغ المستحق:* *${totalDue.toLocaleString()} ${sub.currency}*

شاكرين لكم حسن تعاونكم واهتمامكم.
${settings.shopName ? `— إدارة: *${settings.shopName}*` : ''}`;

    const reminder: SubscriptionReminder = {
      id: 'SUBR-' + Date.now().toString().slice(-6),
      subscriptionId: sub.id,
      voucherNumber,
      customerName: sub.customerName,
      customerPhone: sub.customerPhone,
      subscriptionType: sub.subscriptionType,
      currentMonth: currentMonthLabel,
      amount: Number(sub.amount),
      currency: sub.currency,
      unpaidMonths: unpaidMonths.map((m) => ({
        monthLabel: m.monthLabel,
        amount: Number(m.amount),
        dueDate: m.dueDate,
      })),
      totalDue,
      dueDate: currentDueDate,
      issueDate,
      messageText: data.customMessage || defaultMsg,
      createdAt: now.toISOString(),
    };

    const allReminders = this.getSubscriptionReminders();
    allReminders.unshift(reminder);
    if (allReminders.length > 100) allReminders.pop();
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_REMINDERS, JSON.stringify(allReminders));

    notifyChange();
    return reminder;
  },

  // ===== SUBSCRIPTION STATS =====
  getSubscriptionStats(): SubscriptionStats {
    const subscriptions = this.getSubscriptions();
    const activeSubs = subscriptions.filter((s) => s.status === 'active');
    const allMonths = this.getSubscriptionMonths();

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth() + 1;
    const todayStr = now.toISOString().split('T')[0];

    const currentMonthRecords = allMonths.filter(
      (m) => m.year === currentYear && m.monthIndex === currentMonthIndex
    );

    const currentMonthPaid = currentMonthRecords.filter((m) => m.status === 'paid');
    const currentMonthUnpaid = currentMonthRecords.filter((m) => m.status === 'unpaid');

    const currentMonthPaidAmount = currentMonthPaid.reduce(
      (sum, m) => sum + (Number(m.paidAmount) || Number(m.amount)),
      0
    );
    const currentMonthUnpaidAmount = currentMonthUnpaid.reduce(
      (sum, m) => sum + Number(m.amount),
      0
    );

    const allUnpaid = allMonths.filter((m) => m.status === 'unpaid');
    const totalDueAmount = allUnpaid.reduce((sum, m) => sum + Number(m.amount), 0);

    // Overdue months: unpaid AND dueDate < todayStr
    const overdueMonths = allUnpaid.filter((m) => m.dueDate <= todayStr);
    const totalArrearsAmount = overdueMonths.reduce((sum, m) => sum + Number(m.amount), 0);

    // Distinct customer/subscription IDs with overdue unpaid months
    const overdueSubIds = new Set(overdueMonths.map((m) => m.subscriptionId));
    const overdueCustomersCount = overdueSubIds.size;

    // Due reminders count: subscriptions that have at least 1 unpaid month whose dueDay is within reminder window or past due
    const dueRemindersCount = activeSubs.filter((sub) => {
      const subMonths = allMonths.filter((m) => m.subscriptionId === sub.id && m.status === 'unpaid');
      return subMonths.length > 0;
    }).length;

    return {
      totalActiveSubscriptions: activeSubs.length,
      currentMonthTotalSubscriptions: activeSubs.length,
      currentMonthPaidCount: currentMonthPaid.length,
      currentMonthUnpaidCount: currentMonthUnpaid.length,
      currentMonthPaidAmount,
      currentMonthUnpaidAmount,
      totalDueAmount,
      totalArrearsAmount,
      overdueCustomersCount,
      dueRemindersCount,
    };
  },

  // ===== BACKUP & RESTORE =====
  exportFullBackupJSON(): string {
    const backup = {
      version: 2,
      exportDate: new Date().toISOString(),
      customers: this.getCustomers(),
      debts: this.getDebts(),
      payments: this.getPayments(),
      settings: this.getSettings(),
      notifications: this.getNotifications(),
      subscriptions: this.getSubscriptions(),
      subscriptionMonths: this.getSubscriptionMonths(),
      subscriptionPayments: this.getSubscriptionPayments(),
      subscriptionReminders: this.getSubscriptionReminders(),
    };
    return JSON.stringify(backup, null, 2);
  },

  restoreFullBackupJSON(jsonString: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonString);
      if (!Array.isArray(data.customers) || !Array.isArray(data.debts) || !Array.isArray(data.payments)) {
        return { success: false, message: 'ملف النسخة الاحتياطية غير صالح أو تالف.' };
      }

      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(data.customers));
      localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(data.debts));
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(data.payments));
      if (data.settings) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
      }
      if (data.notifications) {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(data.notifications));
      }
      if (Array.isArray(data.subscriptions)) {
        localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(data.subscriptions));
      }
      if (Array.isArray(data.subscriptionMonths)) {
        localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_MONTHS, JSON.stringify(data.subscriptionMonths));
      }
      if (Array.isArray(data.subscriptionPayments)) {
        localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_PAYMENTS, JSON.stringify(data.subscriptionPayments));
      }
      if (Array.isArray(data.subscriptionReminders)) {
        localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_REMINDERS, JSON.stringify(data.subscriptionReminders));
      }

      notifyChange();
      return { success: true, message: 'تم استعادة النسخة الاحتياطية بنجاح!' };
    } catch (e) {
      console.error(e);
      return { success: false, message: 'تعذر قراءة ملف النسخة الاحتياطية. يرجى التأكد من الصيغة.' };
    }
  },

  exportCustomersCSV(): string {
    const customers = this.getAllCustomersWithStats();
    const headers = ['المعرف', 'الاسم', 'الهاتف', 'واتساب', 'إجمالي الديون', 'المسدد', 'المتبقي', 'الحالة', 'تاريخ الإضافة'];
    const rows = customers.map((c) => [
      c.id,
      `"${c.name}"`,
      `"${c.phone}"`,
      `"${c.whatsapp}"`,
      c.totalDebt,
      c.totalPaid,
      c.remaining,
      c.status === 'debt' ? 'عليه دين' : 'مسدد بالكامل',
      c.createdAt.split('T')[0],
    ]);
    return '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },

  exportDebtsCSV(): string {
    const debts = this.getDebts();
    const customers = new Map(this.getCustomers().map((c) => [c.id, c.name]));
    const headers = ['رقم الدين', 'معرف العميل', 'اسم العميل', 'المبلغ', 'الوصف', 'تاريخ الدين', 'تاريخ الاستحقاق', 'ملاحظات'];
    const rows = debts.map((d) => [
      d.id,
      d.customerId,
      `"${customers.get(d.customerId) || ''}"`,
      d.amount,
      `"${d.description || ''}"`,
      d.debtDate,
      d.dueDate || '',
      `"${d.notes || ''}"`,
    ]);
    return '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },

  exportPaymentsCSV(): string {
    const payments = this.getPayments();
    const customers = new Map(this.getCustomers().map((c) => [c.id, c.name]));
    const headers = ['رقم السداد', 'معرف العميل', 'اسم العميل', 'المبلغ', 'تاريخ السداد', 'طريقة الدفع', 'ملاحظات'];
    const rows = payments.map((p) => [
      p.id,
      p.customerId,
      `"${customers.get(p.customerId) || ''}"`,
      p.amount,
      p.paymentDate,
      p.paymentMethod === 'cash' ? 'نقدًا' : p.paymentMethod === 'transfer' ? 'تحويل' : 'أخرى',
      `"${p.notes || ''}"`,
    ]);
    return '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },

  // Reset all data (requires clear confirmation)
  resetAllData() {
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.DEBTS);
    localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.SUBSCRIPTIONS);
    localStorage.removeItem(STORAGE_KEYS.SUBSCRIPTION_MONTHS);
    localStorage.removeItem(STORAGE_KEYS.SUBSCRIPTION_PAYMENTS);
    localStorage.removeItem(STORAGE_KEYS.SUBSCRIPTION_REMINDERS);
    notifyChange();
  },

  // Aliases and Convenience Methods
  getCustomersWithStats(): CustomerWithStats[] {
    return this.getAllCustomersWithStats();
  },

  getRecentActivities(limit = 10): ActivityItem[] {
    return this.getRecentActivity(limit);
  },

  markAllNotificationsRead() {
    this.markAllNotificationsAsRead();
  },

  resetDatabase() {
    this.resetAllData();
  },

  exportBackupJSON(): void {
    const jsonStr = this.exportFullBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `hisabati_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  importBackupJSON(jsonString: string): boolean {
    const res = this.restoreFullBackupJSON(jsonString);
    return res.success;
  },

  exportCSV(type: 'customers' | 'debts' | 'payments'): void {
    let csvData = '';
    let filename = '';
    const dateStr = new Date().toISOString().split('T')[0];

    if (type === 'customers') {
      csvData = this.exportCustomersCSV();
      filename = `customers_${dateStr}.csv`;
    } else if (type === 'debts') {
      csvData = this.exportDebtsCSV();
      filename = `debts_${dateStr}.csv`;
    } else {
      csvData = this.exportPaymentsCSV();
      filename = `payments_${dateStr}.csv`;
    }

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
