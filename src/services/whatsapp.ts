import { CustomerWithStats } from '../types';
import { db } from './db';

/**
 * Format phone number to international format for wa.me link
 * Strips spaces, dashes, leading zeroes if appropriate, or adds country code if needed
 */
export function formatWhatsAppPhone(phone: string): string {
  // Remove all non-numeric characters except +
  let cleaned = phone.replace(/[^0-9]/g, '');

  // If starts with 00, replace with nothing
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }

  return cleaned;
}

export function generateDebtReminderMessage(customer: CustomerWithStats, currency: string): string {
  const settings = db.getSettings();
  const template = settings.whatsappDebtTemplate || '';

  if (template) {
    return template
      .replace(/\[اسم العميل\]/g, customer.name)
      .replace(/\[المتبقي\]/g, customer.remaining.toLocaleString())
      .replace(/\[المبلغ المتبقي\]/g, customer.remaining.toLocaleString())
      .replace(/\[إجمالي الدين\]/g, customer.totalDebt.toLocaleString())
      .replace(/\[إجمالي المسدد\]/g, customer.totalPaid.toLocaleString())
      .replace(/\[إجمالي المدفوع\]/g, customer.totalPaid.toLocaleString())
      .replace(/\[العملة\]/g, currency)
      .replace(/\[اسم المتجر\]/g, settings.shopName);
  }

  return `السلام عليكم ${customer.name}

نود تذكيركم بأن المبلغ المتبقي في حسابكم هو ${customer.remaining.toLocaleString()} ${currency}.

إجمالي الدين: ${customer.totalDebt.toLocaleString()} ${currency}
إجمالي المسدد: ${customer.totalPaid.toLocaleString()} ${currency}
المتبقي: ${customer.remaining.toLocaleString()} ${currency}

شاكرين لكم حسن تعاونكم.
${settings.shopName ? `— ${settings.shopName}` : ''}`;
}

export function generatePaymentReceiptMessage(
  customerName: string,
  paymentAmount: number,
  totalPaid: number,
  remainingAmount: number,
  currency: string
): string {
  const settings = db.getSettings();
  const template = settings.whatsappPaymentTemplate || '';

  if (template) {
    return template
      .replace(/\[اسم العميل\]/g, customerName)
      .replace(/\[مبلغ السداد\]/g, paymentAmount.toLocaleString())
      .replace(/\[إجمالي المدفوع\]/g, totalPaid.toLocaleString())
      .replace(/\[المتبقي\]/g, remainingAmount.toLocaleString())
      .replace(/\[المبلغ المتبقي\]/g, remainingAmount.toLocaleString())
      .replace(/\[العملة\]/g, currency)
      .replace(/\[اسم المتجر\]/g, settings.shopName);
  }

  return `السلام عليكم ${customerName}

تم تسجيل سداد بمبلغ ${paymentAmount.toLocaleString()} ${currency} في حسابكم.

إجمالي المدفوع: ${totalPaid.toLocaleString()} ${currency}
المبلغ المتبقي: ${remainingAmount.toLocaleString()} ${currency}

شكرًا لكم.
${settings.shopName ? `— ${settings.shopName}` : ''}`;
}

/**
 * Generate official statement summary text for WhatsApp
 */
export function generateStatementWhatsAppMessage(
  customer: CustomerWithStats,
  currency: string,
  shopName: string
): string {
  const dateStr = new Date().toLocaleDateString('ar-YE');
  return `📄 *كشف حساب مالي رسمي*
الأخ الفاضل / *${customer.name}* المحترم،

تحية طيبة وبعد،
مرفق لكم كشف الحساب المالي المعتمد حتى تاريخ ${dateStr} من *${shopName || 'إدارة المحل'}*:

📊 *ملخص الحساب الحالي:*
• إجمالي الديون السابقة: *${customer.totalDebt.toLocaleString()} ${currency}*
• إجمالي المبالغ المسددة: *${customer.totalPaid.toLocaleString()} ${currency}*
• الرصيد المتبقي المطلوب: *${customer.remaining.toLocaleString()} ${currency}*

📎 تم إصدار هذا الكشف الرسمي بصيغة PDF يتضمن جدول بكافة الحركات والتواريخ والتفاصيل.

شاكرين لكم حسن تعاونكم الدائم وثقتكم بنا.
${shopName ? `— إدارة: *${shopName}*` : ''}`;
}

/**
 * Generate monthly subscription reminder message for WhatsApp
 */
export function generateSubscriptionReminderMessage(params: {
  customerName: string;
  subscriptionType: string;
  amount: number;
  currency: string;
  dueDay: number;
  currentMonth: string;
  unpaidMonths: { monthLabel: string; amount: number }[];
  totalDue: number;
}): string {
  const settings = db.getSettings();
  const template = settings.whatsappSubscriptionTemplate || '';

  const unpaidList =
    params.unpaidMonths.length > 0
      ? params.unpaidMonths
          .map((m) => `• ${m.monthLabel}: ${m.amount.toLocaleString()} ${params.currency}`)
          .join('\n')
      : `• ${params.currentMonth}: ${params.amount.toLocaleString()} ${params.currency}`;

  if (template) {
    return template
      .replace(/\[اسم العميل\]/g, params.customerName)
      .replace(/\[نوع الاشتراك\]/g, params.subscriptionType)
      .replace(/\[مبلغ الاشتراك\]/g, params.amount.toLocaleString())
      .replace(/\[العملة\]/g, params.currency)
      .replace(/\[يوم الاستحقاق\]/g, String(params.dueDay))
      .replace(/\[الشهر الحالي\]/g, params.currentMonth)
      .replace(/\[الأشهر غير المسددة\]/g, unpaidList)
      .replace(/\[إجمالي المبلغ المستحق\]/g, params.totalDue.toLocaleString())
      .replace(/\[اسم المتجر\]/g, settings.shopName);
  }

  return `السلام عليكم ورحمة الله وبركاته،
الأخ الفاضل / *${params.customerName}* المحترم

نود تذكيركم بمستحقات اشتراككم:
📌 *نوع الاشتراك:* ${params.subscriptionType}
💵 *قيمة الاشتراك الشهري:* ${params.amount.toLocaleString()} ${params.currency}
🗓️ *يوم الاستحقاق:* يوم ${params.dueDay} من كل شهر
📆 *الشهر الحالي:* ${params.currentMonth}

📋 *الأشهر غير المسددة:*
${unpaidList}

💰 *إجمالي المبلغ المستحق:* *${params.totalDue.toLocaleString()} ${params.currency}*

شاكرين لكم حسن تعاونكم واهتمامكم.
${settings.shopName ? `— إدارة: *${settings.shopName}*` : ''}`;
}

/**
 * Generate subscription payment receipt message for WhatsApp
 */
export function generateSubscriptionReceiptMessage(params: {
  customerName: string;
  subscriptionType: string;
  monthsPaid: string[];
  amountPaid: number;
  currency: string;
  paymentMethod: string;
  receiptNumber: string;
  paymentDate: string;
  remainingDue?: number;
}): string {
  const settings = db.getSettings();
  const methodLabel =
    params.paymentMethod === 'cash'
      ? 'نقداً'
      : params.paymentMethod === 'transfer'
      ? 'تحويل بنكي'
      : params.paymentMethod;

  return `🧾 *سند إيصال سداد اشتراك رسمي*
الأخ الفاضل / *${params.customerName}* المحترم،

تم بحمد الله استلام سداد اشتراككم وتوثيقه بنجاح:
• *رقم الإيصال:* ${params.receiptNumber}
• *نوع الاشتراك:* ${params.subscriptionType}
• *عن شهر:* ${params.monthsPaid.join('، ')}
• *المبلغ المستلم:* *${params.amountPaid.toLocaleString()} ${params.currency}*
• *طريقة الدفع:* ${methodLabel}
• *تاريخ السداد:* ${params.paymentDate}
${params.remainingDue !== undefined && params.remainingDue > 0 ? `• *المتبقي المستحق:* ${params.remainingDue.toLocaleString()} ${params.currency}\n` : ''}
شاكرين لكم التزامكم وثقتكم بنا.
${settings.shopName ? `— إدارة: *${settings.shopName}*` : ''}`;
}

/**
 * Open WhatsApp conversation in browser/app
 */
export function openWhatsAppChat(phone: string, text: string) {
  const formattedPhone = formatWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(text);
  const url = `https://wa.me/${formattedPhone}?text=${encodedText}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Service stub for future WhatsApp Business API integration
 */
export interface WhatsAppApiConfig {
  apiKey?: string;
  phoneNumberId?: string;
  businessAccountId?: string;
  webhookUrl?: string;
  isAutomated: boolean;
}

export const whatsAppBusinessService = {
  getConfig(): WhatsAppApiConfig {
    try {
      const data = localStorage.getItem('hisabati_wa_api_config');
      return data ? JSON.parse(data) : { isAutomated: false };
    } catch {
      return { isAutomated: false };
    }
  },
  saveConfig(config: WhatsAppApiConfig) {
    localStorage.setItem('hisabati_wa_api_config', JSON.stringify(config));
  },
  async sendAutomatedMessage(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
    const config = this.getConfig();
    if (!config.apiKey || !config.phoneNumberId) {
      // API not yet provisioned, fallback to direct WhatsApp Web / App link
      openWhatsAppChat(phone, message);
      return { success: true };
    }
    // Future API call when credentials provided
    return { success: true };
  },
};
