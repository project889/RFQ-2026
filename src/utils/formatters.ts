import { QuotationOrder, FinancialProgress } from '../types';

export function formatNumber(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '0.00';
  return Number(val).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function calcFinancialProgress(order: QuotationOrder): FinancialProgress {
  const totalAmount = order.amount || 0;
  const installments = order.installments || [];
  
  const billedAmount = installments.reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0);
  const paidAmount = installments
    .filter((inst) => inst.status === 'PAID')
    .reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0);

  const remainingBalance = Math.max(0, totalAmount - billedAmount);
  
  const billedPercentage = totalAmount > 0 ? Math.min(100, Math.round((billedAmount / totalAmount) * 100)) : 0;
  const paidPercentage = totalAmount > 0 ? Math.min(100, Math.round((paidAmount / totalAmount) * 100)) : 0;
  const remainingPercentage = Math.max(0, 100 - billedPercentage);

  const installmentCount = installments.length;
  const paidInstallmentCount = installments.filter((inst) => inst.status === 'PAID').length;

  const isFullyBilled = remainingBalance <= 0.01;
  const isFullyPaid = totalAmount > 0 && Math.abs(paidAmount - totalAmount) < 0.01;

  let statusText = 'ยังไม่ได้วางบิล (0%)';
  if (isFullyPaid) {
    statusText = `ชำระเงินครบแล้ว 100% (${installmentCount} งวด)`;
  } else if (isFullyBilled) {
    statusText = `วางบิลครบแล้ว 100% (${installmentCount} งวด)`;
  } else if (installmentCount > 0) {
    statusText = `วางบิลแล้ว ${billedPercentage}% (${installmentCount} งวด)`;
  }

  return {
    totalAmount,
    billedAmount,
    paidAmount,
    remainingBalance,
    remainingPercentage,
    billedPercentage,
    paidPercentage,
    installmentCount,
    paidInstallmentCount,
    isFullyBilled,
    isFullyPaid,
    statusText,
  };
}
