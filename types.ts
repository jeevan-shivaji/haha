
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'BANK' | 'MOBILE_WALLET';

export type RecurrenceFrequency = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  paymentMethod: PaymentMethod;
  upiId?: string;
  isTaxDeductible?: boolean;
  recurrence?: {
    frequency: RecurrenceFrequency;
    endDate?: string;
  };
}

export interface Investment {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  type: 'STOCK' | 'CRYPTO' | 'ETF' | 'REAL_ESTATE' | 'GOLD' | 'SILVER';
}

export interface SIP {
  id: string;
  name: string;
  amount: number;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  nextDate: string;
  startDate?: string;
  active: boolean;
  type: 'STOCK' | 'CRYPTO' | 'ETF' | 'MUTUAL_FUND' | 'GOLD' | 'SILVER';
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  period: 'MONTHLY';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isTyping?: boolean;
}

export interface TaxDeductionInsight {
  transactionId: string;
  reason: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface FinancialMetric {
  label: string;
  value: string;
  change: number; // percentage
  trend: 'up' | 'down' | 'neutral';
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string; // Last 4 digits
  type: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'INVESTMENT';
  balance: number;
  lastSynced: string;
  color: string;
}
