export type PreQtStatus = 
  | 'NEW_REQUEST' 
  | 'PENDING_INFO' 
  | 'WAITING_SUPPLIER' 
  | 'REVIEW' 
  | 'DONE_QT' 
  | 'CANCELLED'
  | 'IN_REVIEW' // Legacy support
  | 'READY_FOR_QT' // Legacy support
  | 'CONVERTED'; // Legacy support

export type QtStatus = 
  | 'IN_PROGRESS' 
  | 'REVISING' 
  | 'FINAL' 
  | 'AWARDED' 
  | 'LOST' 
  | 'CANCELLED'
  | 'PENDING_INFO' // Legacy support
  | 'COMPLETED' // Legacy support
  | 'DONE_NO_QT' // Legacy support
  | 'FAILED'; // Legacy support

export type ChildBillingStatus = 'PENDING' | 'BILLED' | 'PAID' | 'OVERDUE';

export interface ChildBilling {
  id: string;
  orderId: string; // ID of parent QuotationOrder
  qtNo: string;
  soNo?: string;
  installmentNo: number; // e.g. 1, 2, 3
  installmentTitle: string; // e.g., "งวดที่ 1: มัดจำ 30%"
  ivNo: string; // e.g., "IV2607-001-1"
  billingDate: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  amount: number;
  percentage: number; // calculated % of order total
  status: ChildBillingStatus;
  paidDate?: string;
  notes?: string;
  createdAt: string;
}

export interface QuotationOrder {
  id: string;
  qtNo: string;
  qtDate: string;
  receivedInfoDate?: string;
  submissionDueDate?: string;
  priceSentDate?: string;
  customerName: string;
  project?: string;
  issuedBy: string;
  salesPerson: string;
  createdBy?: string;
  description: string;
  amount: number; // Total contract/order value
  status: QtStatus;
  soNo?: string;
  soDate?: string;
  woNo?: string;
  woDate?: string;
  installments: ChildBilling[]; // Array of Child Billings / Invoices
  notes?: string;
}

export interface PreQuotation {
  id: string;
  preNo: string;
  receivedDate: string;
  customerName: string;
  project?: string;
  description: string;
  estimatedAmount: number;
  submissionDueDate?: string;
  salesPerson: string;
  issuedBy: string;
  status: PreQtStatus;
  convertedQtNo?: string;
  remarks?: string;
}

export interface FinancialProgress {
  totalAmount: number;
  billedAmount: number;
  paidAmount: number;
  remainingBalance: number;
  remainingPercentage: number;
  billedPercentage: number;
  paidPercentage: number;
  installmentCount: number;
  paidInstallmentCount: number;
  isFullyBilled: boolean;
  isFullyPaid: boolean;
  statusText: string;
}
