import React, { useState, useRef, useEffect } from 'react';
import { QuotationOrder, ChildBilling } from '../types';
import { calcFinancialProgress, formatNumber, formatDate } from '../utils/formatters';

interface FinancialProgressBarProps {
  order: QuotationOrder;
  onCreateChildBilling: (order: QuotationOrder) => void;
  onUpdateInstallmentStatus?: (orderId: string, installmentId: string, newStatus: ChildBilling['status']) => void;
  onDeleteInstallment?: (orderId: string, installmentId: string) => void;
  compact?: boolean;
}

export const FinancialProgressBar: React.FC<FinancialProgressBarProps> = ({
  order,
  onCreateChildBilling,
  onUpdateInstallmentStatus,
  onDeleteInstallment,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const progress = calcFinancialProgress(order);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Determine colors based on status
  let barColor = 'bg-blue-500';
  let badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
  let badgeIcon = 'fa-solid fa-receipt';

  if (progress.isFullyPaid) {
    barColor = 'bg-teal-500';
    badgeColor = 'bg-teal-50 text-teal-800 border-teal-300';
    badgeIcon = 'fa-solid fa-check-double';
  } else if (progress.isFullyBilled) {
    barColor = 'bg-emerald-500';
    badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    badgeIcon = 'fa-solid fa-circle-check';
  } else if (progress.installmentCount > 0) {
    barColor = 'bg-indigo-500';
    badgeColor = 'bg-indigo-50 text-indigo-800 border-indigo-200';
    badgeIcon = 'fa-solid fa-file-invoice-dollar';
  } else {
    barColor = 'bg-slate-300';
    badgeColor = 'bg-slate-50 text-slate-600 border-slate-200';
    badgeIcon = 'fa-regular fa-clock';
  }

  return (
    <div className="relative inline-block w-full" ref={containerRef}>
      {/* Trigger Area (Click to open) */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="group cursor-pointer p-1.5 rounded-xl hover:bg-slate-100/80 transition-all border border-transparent hover:border-slate-200"
      >
        {/* Header Tag / Label */}
        <div className="flex items-center justify-between text-xs font-semibold mb-1">
          <span className={`px-2 py-0.5 rounded-md border text-[11px] font-medium flex items-center gap-1.5 ${badgeColor}`}>
            <i className={`${badgeIcon} text-[10px]`}></i>
            <span>
              {progress.installmentCount > 0
                ? `Billing (${progress.installmentCount} งวด) • ${progress.billedPercentage}%`
                : 'ยังไม่วางบิล (0%)'}
            </span>
          </span>

          <span className="font-mono text-[11px] font-bold text-slate-700">
            ฿{formatNumber(progress.billedAmount)}
          </span>
        </div>

        {/* Progress Bar Track */}
        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden flex shadow-inner">
          {/* Paid Portion */}
          {progress.paidPercentage > 0 && (
            <div
              className="bg-teal-500 h-full transition-all duration-300"
              style={{ width: `${progress.paidPercentage}%` }}
              title={`ชำระแล้ว ${progress.paidPercentage}%`}
            />
          )}
          {/* Unpaid Billed Portion */}
          {progress.billedPercentage > progress.paidPercentage && (
            <div
              className="bg-blue-500 h-full transition-all duration-300"
              style={{
                width: `${progress.billedPercentage - progress.paidPercentage}%`,
              }}
              title={`วางบิลแล้วรอชำระ ${progress.billedPercentage - progress.paidPercentage}%`}
            />
          )}
        </div>

        {/* Footer info line */}
        <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
          <span>
            {progress.isFullyBilled ? (
              <span className="text-emerald-600 font-semibold">
                <i className="fa-solid fa-check mr-0.5"></i> ครบ 100%
              </span>
            ) : (
              <span className="text-amber-700 font-medium">
                คงเหลือบิล: ฿{formatNumber(progress.remainingBalance)} ({progress.remainingPercentage}%)
              </span>
            )}
          </span>
          <span className="text-slate-400 group-hover:text-amber-600 transition-colors flex items-center gap-0.5">
            คลิกดูรายละเอียด <i className="fa-solid fa-chevron-down text-[9px]"></i>
          </span>
        </div>
      </div>

      {/* Floating Popup / Tooltip Card */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-fadeIn text-slate-800">
          {/* Popup Header */}
          <div className="bg-slate-900 text-white p-3.5 flex justify-between items-center border-b border-slate-800">
            <div>
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <i className="fa-solid fa-chart-pie text-amber-400"></i>
                <span>สรุปการเงินและการวางบิล (Billing Breakdown)</span>
              </div>
              <div className="text-[11px] font-mono text-amber-300 mt-0.5">
                {order.qtNo} {order.soNo ? `/ SO: ${order.soNo}` : ''}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="text-slate-400 hover:text-white cursor-pointer p-1"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {/* Popup Financial Summary Metrics */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block">มูลค่าสัญญารวม (Total)</span>
              <span className="font-bold font-mono text-slate-800 text-sm">
                ฿{formatNumber(progress.totalAmount)}
              </span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block">วางบิลแล้ว (Billed)</span>
              <span className="font-bold font-mono text-blue-700 text-sm">
                ฿{formatNumber(progress.billedAmount)}{' '}
                <span className="text-[10px] text-slate-500">({progress.billedPercentage}%)</span>
              </span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block">คงเหลือออกบิล (Balance)</span>
              <span
                className={`font-bold font-mono text-sm ${
                  progress.remainingBalance > 0 ? 'text-amber-600' : 'text-emerald-600'
                }`}
              >
                ฿{formatNumber(progress.remainingBalance)}{' '}
                <span className="text-[10px]">({progress.remainingPercentage}%)</span>
              </span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block">ชำระแล้ว (Paid)</span>
              <span className="font-bold font-mono text-teal-700 text-sm">
                ฿{formatNumber(progress.paidAmount)}
              </span>
            </div>
          </div>

          {/* List of Child Billings / Invoices */}
          <div className="p-3 max-h-60 overflow-y-auto custom-scrollbar space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700 pb-1 border-b border-slate-100">
              <span>รายการงวดย่อย ({order.installments.length} งวด)</span>
              {order.installments.length === 0 && (
                <span className="text-[10px] text-slate-400 font-normal">ยังไม่มีงวดย่อย</span>
              )}
            </div>

            {order.installments.length === 0 ? (
              <div className="py-4 text-center text-slate-400 text-xs italic">
                <i className="fa-solid fa-file-invoice text-2xl mb-1 block opacity-50"></i>
                ยังไม่ได้สร้างใบวางบิล/ใบแจ้งหนี้งวดย่อย
              </div>
            ) : (
              order.installments.map((inst, idx) => (
                <div
                  key={inst.id}
                  className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs hover:border-brand-300 transition-all text-xs"
                >
                  <div className="flex justify-between items-start gap-1">
                    <div>
                      <div className="font-bold text-slate-800 text-[11px] line-clamp-1">
                        {inst.installmentTitle || `งวดที่ ${inst.installmentNo}`}
                      </div>
                      <div className="font-mono text-xs font-semibold text-brand-700 flex items-center gap-1 mt-0.5">
                        <i className="fa-solid fa-receipt text-[10px] text-brand-500"></i>
                        <span>{inst.ivNo}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-800">
                        ฿{formatNumber(inst.amount)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        ({inst.percentage}% ของยอดรวม)
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center text-[10px]">
                    <div className="text-slate-500">
                      <i className="fa-regular fa-calendar-check mr-1 text-slate-400"></i>
                      {formatDate(inst.billingDate)}
                      {inst.dueDate && (
                        <span className="ml-2 text-slate-400">
                          (Due: {formatDate(inst.dueDate)})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <select
                        value={inst.status || 'BILLED'}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          onUpdateInstallmentStatus?.(order.id, inst.id, e.target.value as any);
                        }}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none transition-all text-center appearance-none ${
                          inst.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : inst.status === 'BILLED'
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : inst.status === 'OVERDUE'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        <option value="PENDING" className="bg-white text-slate-800">
                          ⚪ รอเตรียมยื่นวางบิล
                        </option>
                        <option value="BILLED" className="bg-white text-slate-800">
                          ⏳ ยื่นวางบิลแล้ว
                        </option>
                        <option value="PAID" className="bg-white text-slate-800">
                          ✅ รับชำระแล้ว
                        </option>
                        <option value="OVERDUE" className="bg-white text-slate-800">
                          🔴 เกินกำหนดชำระ
                        </option>
                      </select>

                      {onDeleteInstallment && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`ลบงวด ${inst.ivNo} ใช่หรือไม่?`)) {
                              onDeleteInstallment(order.id, inst.id);
                            }
                          }}
                          className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                          title="ลบงวดย่อยนี้"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Action Footer: Create Child Billing */}
          <div className="p-3 bg-slate-50 border-t border-slate-200">
            {progress.remainingBalance > 0 ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  onCreateChildBilling(order);
                }}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2 px-3 rounded-xl shadow-md text-xs transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:scale-[1.01]"
              >
                <i className="fa-solid fa-plus-circle text-sm"></i>
                <span>+ ออกใบวางบิล/ใบแจ้งหนี้งวดใหม่</span>
                <span className="bg-emerald-800/40 text-emerald-100 text-[10px] px-1.5 py-0.5 rounded font-mono">
                  เหลือ ฿{formatNumber(progress.remainingBalance)}
                </span>
              </button>
            ) : (
              <div className="bg-emerald-100 text-emerald-800 text-center font-bold py-2 px-3 rounded-xl text-xs border border-emerald-300 flex items-center justify-center gap-1.5">
                <i className="fa-solid fa-circle-check text-emerald-600"></i>
                <span>วางบิลครบนมยอดสัญญา 100% แล้ว</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
