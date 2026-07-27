import React, { useState } from 'react';
import { QuotationOrder, ChildBilling } from '../types';
import { formatNumber, formatDate } from '../utils/formatters';

interface BillingInvoicesTabProps {
  orders: QuotationOrder[];
  onOpenCreateChildBillingModal: (order: QuotationOrder) => void;
  onUpdateInstallmentStatus: (
    orderId: string,
    installmentId: string,
    newStatus: ChildBilling['status']
  ) => void;
  onDeleteInstallment: (orderId: string, installmentId: string) => void;
  onViewDetail: (order: QuotationOrder) => void;
}

export const BillingInvoicesTab: React.FC<BillingInvoicesTabProps> = ({
  orders,
  onOpenCreateChildBillingModal,
  onUpdateInstallmentStatus,
  onDeleteInstallment,
  onViewDetail,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Flat list of all child billings across all orders
  const allInstallments: Array<{ installment: ChildBilling; parentOrder: QuotationOrder }> = [];

  orders.forEach((order) => {
    (order.installments || []).forEach((inst) => {
      allInstallments.push({
        installment: inst,
        parentOrder: order,
      });
    });
  });

  // Calculate stats
  const totalCount = allInstallments.length;
  const totalValue = allInstallments.reduce((sum, item) => sum + (item.installment.amount || 0), 0);

  const paidItems = allInstallments.filter((item) => item.installment.status === 'PAID');
  const paidValue = paidItems.reduce((sum, item) => sum + (item.installment.amount || 0), 0);

  const pendingPaymentItems = allInstallments.filter((item) => item.installment.status === 'BILLED');
  const pendingPaymentValue = pendingPaymentItems.reduce((sum, item) => sum + (item.installment.amount || 0), 0);

  // Filtered list
  const filteredInstallments = allInstallments.filter(({ installment, parentOrder }) => {
    const s = searchTerm.toLowerCase();
    const matchSearch =
      !searchTerm ||
      installment.ivNo.toLowerCase().includes(s) ||
      installment.installmentTitle.toLowerCase().includes(s) ||
      installment.qtNo.toLowerCase().includes(s) ||
      (installment.soNo && installment.soNo.toLowerCase().includes(s)) ||
      parentOrder.customerName.toLowerCase().includes(s) ||
      (parentOrder.project && parentOrder.project.toLowerCase().includes(s));

    let matchStatus = true;
    if (statusFilter === 'BILLED') matchStatus = installment.status === 'BILLED';
    else if (statusFilter === 'PAID') matchStatus = installment.status === 'PAID';
    else if (statusFilter === 'PENDING') matchStatus = installment.status === 'PENDING';

    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-800 to-slate-800 p-5 rounded-2xl text-white shadow-md flex flex-wrap justify-between items-center gap-4">
        <div>
          <span className="bg-emerald-500/30 text-emerald-200 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border border-emerald-400/30">
            Child Billing & Invoices Management
          </span>
          <h2 className="text-xl font-bold mt-1">
            ทะเบียนใบบิลและใบแจ้งหนี้งวดย่อย (Child Invoices Master List)
          </h2>
          <p className="text-xs text-emerald-100 mt-1">
            รวบรวมรายการวางบิลรายงวด (IV) ทั้งหมดจากทุกคำสั่งซื้อ ติดตามสถานะการชำระเงินและครบกำหนดชำระ
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              งวดย่อยที่ออกบิลแล้วทั้งหมด
            </p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">
              {totalCount} <span className="text-xs font-normal text-slate-500">งวด</span>
            </h3>
            <p className="text-sm font-semibold text-teal-600 mt-1 font-mono">
              ฿{formatNumber(totalValue)}
            </p>
          </div>
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center text-xl">
            <i className="fa-solid fa-receipt"></i>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ยื่นวางบิลแล้ว (รอรับชำระ)
            </p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">
              {pendingPaymentItems.length} <span className="text-xs font-normal text-slate-500">งวด</span>
            </h3>
            <p className="text-sm font-semibold text-amber-600 mt-1 font-mono">
              ฿{formatNumber(pendingPaymentValue)}
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xl">
            <i className="fa-solid fa-clock-rotate-left"></i>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              รับชำระเงินเรียบร้อย (Paid)
            </p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">
              {paidItems.length} <span className="text-xs font-normal text-slate-500">งวด</span>
            </h3>
            <p className="text-sm font-semibold text-emerald-600 mt-1 font-mono">
              ฿{formatNumber(paidValue)}
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl">
            <i className="fa-solid fa-money-check-dollar"></i>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              อัตราการจัดเก็บเงิน (Collection Rate)
            </p>
            <h3 className="text-2xl font-bold text-blue-600 mt-1">
              {totalValue > 0 ? Math.round((paidValue / totalValue) * 100) : 0}%
            </h3>
            <p className="text-xs text-blue-600 mt-1">จากยอดวางบิลสะสม</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl">
            <i className="fa-solid fa-chart-line"></i>
          </div>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-6 relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-3 text-slate-400 text-sm"></i>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหา เลข IV, QT No., SO No., ชื่อลูกค้า, หัวข้องวด..."
              className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>

          <div className="md:col-span-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">-- สถานะการวางบิลทั้งหมด --</option>
              <option value="BILLED">⏳ ยื่นวางบิลแล้ว (รอรับชำระเงิน)</option>
              <option value="PAID">✅ รับชำระเงินเรียบร้อยแล้ว (Paid)</option>
              <option value="PENDING">⚪ รอเตรียมยื่นวางบิล</option>
            </select>
          </div>

          <div className="md:col-span-2 text-right text-xs text-slate-500 font-medium">
            แสดง {filteredInstallments.length} รายการงวด
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 text-xs font-semibold border-b border-slate-200 uppercase tracking-wider">
                <th className="py-3 px-4 w-40 whitespace-nowrap">เลขที่ IV / งวดที่</th>
                <th className="py-3 px-4 min-w-[200px] whitespace-nowrap">รายละเอียด/หัวข้องวด</th>
                <th className="py-3 px-4 w-44 whitespace-nowrap">อ้างอิง QT / SO</th>
                <th className="py-3 px-4 w-52 whitespace-nowrap">ลูกค้า / โครงการ</th>
                <th className="py-3 px-4 w-36 whitespace-nowrap">วันวางบิล / Due Date</th>
                <th className="py-3 px-4 text-right w-36 whitespace-nowrap">ยอดวางบิล (บาท)</th>
                <th className="py-3 px-4 w-36 text-center whitespace-nowrap">สถานะรับชำระ</th>
                <th className="py-3 px-4 w-28 text-center whitespace-nowrap">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredInstallments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <i className="fa-solid fa-receipt text-4xl mb-2 block opacity-50"></i>
                    <span>ยังไม่มีรายการวางบิลใบบิลงวดย่อย (Child IV)</span>
                  </td>
                </tr>
              ) : (
                filteredInstallments.map(({ installment, parentOrder }) => (
                  <tr key={installment.id} className="hover:bg-slate-50 transition-colors">
                    {/* IV No & Installment No */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                        <i className="fa-solid fa-receipt mr-1 text-emerald-600"></i>
                        {installment.ivNo}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-600 mt-1">
                        งวดที่ {installment.installmentNo}
                      </div>
                    </td>

                    {/* Title */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-semibold text-slate-800 text-xs">
                        {installment.installmentTitle}
                      </div>
                      {installment.notes && (
                        <div className="text-[11px] text-slate-500 italic mt-0.5">
                          หมายเหตุ: {installment.notes}
                        </div>
                      )}
                    </td>

                    {/* Parent Order Ref */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="text-xs font-bold text-brand-700 font-mono bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 inline-block">
                        QT: {installment.qtNo}
                      </div>
                      {installment.soNo && (
                        <div className="text-[11px] font-mono text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block mt-1 ml-1">
                          SO: {installment.soNo}
                        </div>
                      )}
                    </td>

                    {/* Customer & Project */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-semibold text-slate-800 line-clamp-1">
                        {parentOrder.customerName}
                      </div>
                      {parentOrder.project && (
                        <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          <i className="fa-solid fa-building text-slate-400 mr-1"></i>
                          {parentOrder.project}
                        </div>
                      )}
                    </td>

                    {/* Dates */}
                    <td className="py-3.5 px-4 align-top text-xs">
                      <div className="font-medium text-slate-700">
                        <i className="fa-regular fa-calendar-check mr-1 text-emerald-600"></i>
                        {formatDate(installment.billingDate)}
                      </div>
                      {installment.dueDate && (
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          Due: {formatDate(installment.dueDate)}
                        </div>
                      )}
                    </td>

                    {/* Amount & Pct */}
                    <td className="py-3.5 px-4 align-top text-right">
                      <div className="font-bold text-slate-800 font-mono text-sm">
                        ฿{formatNumber(installment.amount)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        ({installment.percentage}% ของยอดเต็ม)
                      </div>
                    </td>

                    {/* Status & Toggle Dropdown List */}
                    <td className="py-3.5 px-4 align-top text-center">
                      <select
                        value={installment.status || 'BILLED'}
                        onChange={(e) =>
                          onUpdateInstallmentStatus(
                            parentOrder.id,
                            installment.id,
                            e.target.value as any
                          )
                        }
                        className={`text-xs font-bold px-2 py-1.5 rounded-full border cursor-pointer focus:outline-none transition-all w-full text-center appearance-none ${
                          installment.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : installment.status === 'BILLED'
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : installment.status === 'OVERDUE'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        <option value="PENDING" className="bg-white text-slate-800">
                          ⚪ รอเตรียมยื่นวางบิล (Pending)
                        </option>
                        <option value="BILLED" className="bg-white text-slate-800">
                          ⏳ ยื่นวางบิลแล้ว (Billed)
                        </option>
                        <option value="PAID" className="bg-white text-slate-800">
                          ✅ รับชำระแล้ว (Paid)
                        </option>
                        <option value="OVERDUE" className="bg-white text-slate-800">
                          🔴 เกินกำหนดชำระ (Overdue)
                        </option>
                      </select>
                    </td>

                    {/* Manage */}
                    <td className="py-3.5 px-4 align-top text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => onViewDetail(parentOrder)}
                          title="ดูรายละเอียดสัญญาเต็ม"
                          className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                        >
                          <i className="fa-solid fa-eye"></i>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`ลบงวด ${installment.ivNo} ใช่หรือไม่?`)) {
                              onDeleteInstallment(parentOrder.id, installment.id);
                            }
                          }}
                          title="ลบงวดย่อยนี้"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
