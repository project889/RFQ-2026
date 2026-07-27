import React from 'react';
import { QuotationOrder, ChildBilling } from '../types';
import { calcFinancialProgress, formatNumber } from '../utils/formatters';

interface DashboardTabProps {
  orders: QuotationOrder[];
  onOpenSoModal: (order: QuotationOrder) => void;
  onOpenWoModal: (order: QuotationOrder) => void;
  onOpenCreateChildBillingModal: (order: QuotationOrder) => void;
  onGoToTab: (page: number) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  orders,
  onOpenSoModal,
  onOpenWoModal,
  onOpenCreateChildBillingModal,
  onGoToTab,
}) => {
  const totalValue = orders.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalCount = orders.length;

  // Pending Offer (IN_PROGRESS, PENDING_INFO, REVISING)
  const pendingOffer = orders.filter((r) =>
    ['IN_PROGRESS', 'PENDING_INFO', 'REVISING'].includes(r.status)
  );
  const pendingOfferValue = pendingOffer.reduce((sum, r) => sum + (r.amount || 0), 0);

  // SO Issued
  const soWo = orders.filter((r) => r.soNo);
  const soWoValue = soWo.reduce((sum, r) => sum + (r.amount || 0), 0);

  // Billed sum from child installments
  let totalBilledVal = 0;
  let totalPaidVal = 0;
  let billedCount = 0;
  let paidCount = 0;

  orders.forEach((o) => {
    const prog = calcFinancialProgress(o);
    totalBilledVal += prog.billedAmount;
    totalPaidVal += prog.paidAmount;
    if (prog.billedAmount > 0) billedCount++;
    if (prog.isFullyPaid) paidCount++;
  });

  // Status Breakdown Counts
  const inProgressCount = orders.filter((r) => r.status === 'IN_PROGRESS').length;
  const revisingCount = orders.filter((r) => r.status === 'REVISING').length;
  const finalCount = orders.filter((r) => r.status === 'FINAL').length;
  const awardedCount = orders.filter((r) => r.status === 'AWARDED' || r.status === 'COMPLETED').length;
  const lostCount = orders.filter((r) => r.status === 'LOST' || r.status === 'FAILED').length;
  const cancelledCount = orders.filter((r) => r.status === 'CANCELLED').length;

  const closedDeals = awardedCount + paidCount;
  const winRate = totalCount > 0 ? ((closedDeals / totalCount) * 100).toFixed(1) : '0.0';

  // Urgent Action Lists
  const pendingSoList = orders.filter((r) => (r.status === 'FINAL' || r.status === 'AWARDED') && !r.soNo);
  const pendingWoList = orders.filter((r) => r.soNo && !r.woNo);
  const pendingBillingList = orders.filter((r) => {
    const prog = calcFinancialProgress(r);
    return (r.soNo || r.woNo) && prog.remainingBalance > 0;
  });

  const getPercentage = (part: number, total: number) => {
    if (!total || total === 0) return 0;
    return Math.min(100, Math.round((part / total) * 100));
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 rounded-2xl text-white shadow-md flex flex-wrap justify-between items-center gap-4">
        <div>
          <span className="bg-indigo-500/30 text-indigo-200 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border border-indigo-400/30">
            Executive Summary
          </span>
          <h2 className="text-2xl font-bold mt-1.5">
            Dashboard สรุปภาพรวมใบเสนอราคา การเงิน & การดำเนินงาน
          </h2>
          <p className="text-xs text-indigo-200 mt-1">
            วิเคราะห์สถานะใบเสนอราคา อัตราการปิดงาน SO/WO และความคืบหน้าการวางบิลแบ่งงวดแบบ Real-time
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-indigo-950/60 border border-indigo-700/50 p-3 rounded-xl text-right">
            <span className="text-[11px] text-indigo-300 block">มูลค่าเสนอราคารวมทั้งหมด</span>
            <span className="text-xl font-bold text-amber-300 font-mono">
              ฿{formatNumber(totalValue)}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                ใบเสนอราคาออกทั้งหมด (Total QT)
              </p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                {totalCount} <span className="text-xs font-normal text-slate-500">ฉบับ</span>
              </h3>
            </div>
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-lg">
              <i className="fa-solid fa-file-invoice"></i>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs flex justify-between text-slate-600">
            <span>มูลค่าเสนอราคารวม:</span>
            <span className="font-bold text-indigo-700 font-mono">฿{formatNumber(totalValue)}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                อยู่ระหว่างเสนอ / รอพิจารณา (Pending)
              </p>
              <h3 className="text-2xl font-bold text-blue-600 mt-1">
                {pendingOffer.length} <span className="text-xs font-normal text-slate-500">รายการ</span>
              </h3>
            </div>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-lg">
              <i className="fa-solid fa-paper-plane"></i>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs flex justify-between text-slate-600">
            <span>มูลค่ารออนุมัติ:</span>
            <span className="font-bold text-blue-700 font-mono">
              ฿{formatNumber(pendingOfferValue)}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                เปิดใบสั่งขาย (SO) แล้ว
              </p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">
                {soWo.length} <span className="text-xs font-normal text-slate-500">รายการ</span>
              </h3>
            </div>
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center text-lg">
              <i className="fa-solid fa-square-check"></i>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs flex justify-between text-slate-600">
            <span>มูลค่างานที่เปิด SO:</span>
            <span className="font-bold text-amber-700 font-mono">฿{formatNumber(soWoValue)}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                วางบิล & รับชำระแล้ว (Paid)
              </p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                {paidCount} <span className="text-xs font-normal text-slate-500">สัญญา</span>
              </h3>
            </div>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center text-lg">
              <i className="fa-solid fa-sack-dollar"></i>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs flex justify-between text-slate-600">
            <span>รับชำระเงินสะสม:</span>
            <span className="font-bold text-emerald-700 font-mono">฿{formatNumber(totalPaidVal)}</span>
          </div>
        </div>
      </div>

      {/* Urgent Action Tables (Actionable Lists) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table 1: Approved QT Waiting for SO */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 bg-amber-50/70 border-b border-amber-100 flex justify-between items-center">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm">
              <i className="fa-solid fa-clock text-amber-600"></i>
              <span>1. อนุมัติแล้วแต่รอเปิด SO ({pendingSoList.length})</span>
            </div>
            <button
              onClick={() => onGoToTab(1)}
              className="text-xs text-amber-700 hover:underline font-medium cursor-pointer"
            >
              ดูทั้งหมด ➔
            </button>
          </div>
          <div className="p-2 flex-1 overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100">
                  <th className="p-2">เลข QT / ผู้เสนอ</th>
                  <th className="p-2">ลูกค้า</th>
                  <th className="p-2 text-right">มูลค่า</th>
                  <th className="p-2 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {pendingSoList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400">
                      ไม่มีรายการค้างเปิด SO
                    </td>
                  </tr>
                ) : (
                  pendingSoList.map((item) => (
                    <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="p-2 font-bold text-brand-700">
                        <div>{item.qtNo}</div>
                        <div className="text-[10px] text-slate-500 font-normal flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                          {item.issuedBy && <span>{item.issuedBy}</span>}
                        </div>
                      </td>
                      <td className="p-2 text-slate-800 line-clamp-1">{item.customerName}</td>
                      <td className="p-2 text-right font-bold font-mono">฿{formatNumber(item.amount)}</td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => onOpenSoModal(item)}
                          className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] cursor-pointer"
                        >
                          Convert to SO
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: SO Issued Waiting for WO / PO */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 bg-purple-50/70 border-b border-purple-100 flex justify-between items-center">
            <div className="flex items-center gap-2 text-purple-900 font-bold text-xs sm:text-sm">
              <i className="fa-solid fa-file-circle-exclamation text-purple-600"></i>
              <span>2. เอกสารที่ยังไม่มี WO/PO ({pendingWoList.length})</span>
            </div>
            <button
              onClick={() => onGoToTab(4)}
              className="text-xs text-purple-700 hover:underline font-medium cursor-pointer"
            >
              ดู Order tracking ➔
            </button>
          </div>
          <div className="p-2 flex-1 overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100">
                  <th className="p-2">อ้างอิง QT / SO</th>
                  <th className="p-2">ลูกค้า</th>
                  <th className="p-2 text-right">มูลค่า</th>
                  <th className="p-2 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {pendingWoList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400">
                      ไม่มีรายการค้างระบุ WO/PO
                    </td>
                  </tr>
                ) : (
                  pendingWoList.map((item) => (
                    <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="p-2 font-semibold text-slate-800">
                        <div>{item.qtNo}</div>
                        {item.soNo && <div className="text-[10px] text-amber-700 font-mono">SO: {item.soNo}</div>}
                      </td>
                      <td className="p-2 text-slate-800 line-clamp-1">{item.customerName}</td>
                      <td className="p-2 text-right font-bold text-purple-700 font-mono">
                        ฿{formatNumber(item.amount)}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => onOpenWoModal(item)}
                          className="px-2 py-1 bg-purple-700 hover:bg-purple-600 text-white rounded text-[11px] cursor-pointer"
                        >
                          + บันทึก WO/PO
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 3: Ready for Child Billing (ออกงวดย่อย) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 bg-emerald-50/70 border-b border-emerald-100 flex justify-between items-center">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs sm:text-sm">
              <i className="fa-solid fa-receipt text-emerald-600"></i>
              <span>3. มี SO/WO รอยื่นออกงวดย่อย ({pendingBillingList.length})</span>
            </div>
            <button
              onClick={() => onGoToTab(4)}
              className="text-xs text-emerald-700 hover:underline font-medium cursor-pointer"
            >
              ไปหน้า Order Tracking ➔
            </button>
          </div>
          <div className="p-2 flex-1 overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100">
                  <th className="p-2">อ้างอิง QT / SO</th>
                  <th className="p-2">ลูกค้า</th>
                  <th className="p-2 text-right">ยอดคงเหลือบิล</th>
                  <th className="p-2 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {pendingBillingList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400">
                      ไม่มีรายการค้างออกงวดย่อย
                    </td>
                  </tr>
                ) : (
                  pendingBillingList.map((item) => {
                    const prog = calcFinancialProgress(item);
                    return (
                      <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="p-2 font-semibold text-slate-800">
                          <div>{item.qtNo}</div>
                          {item.soNo && <div className="text-[10px] text-amber-700 font-mono">SO: {item.soNo}</div>}
                        </td>
                        <td className="p-2 text-slate-800 line-clamp-1">{item.customerName}</td>
                        <td className="p-2 text-right font-bold text-emerald-700 font-mono">
                          ฿{formatNumber(prog.remainingBalance)}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => onOpenCreateChildBillingModal(item)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] cursor-pointer"
                          >
                            + ออกงวดย่อย
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Conversion Funnel & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                สัดส่วนสถานะการดำเนินงาน (Workflow Conversion Funnel)
              </h3>
              <p className="text-xs text-slate-500">แสดงสัดส่วน 4 ขั้นตอนกระบวนการขายและปิดงาน</p>
            </div>
            <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full">
              Win Rate: {winRate}%
            </span>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-700">
                  <i className="fa-solid fa-file-signature text-blue-500 mr-1.5"></i>
                  1. ใบเสนอราคา (Draft / Sent)
                </span>
                <span className="font-bold text-slate-800">
                  {pendingOffer.length} รายการ (
                  <span className="font-mono text-blue-600">฿{formatNumber(pendingOfferValue)}</span>)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden flex">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${getPercentage(pendingOfferValue, totalValue)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-700">
                  <i className="fa-solid fa-file-contract text-amber-500 mr-1.5"></i>
                  2. เปิดใบสั่งขาย/ใบสั่งซื้อ (SO / PO / WO)
                </span>
                <span className="font-bold text-slate-800">
                  {soWo.length} รายการ (
                  <span className="font-mono text-amber-600">฿{formatNumber(soWoValue)}</span>)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden flex">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${getPercentage(soWoValue, totalValue)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-700">
                  <i className="fa-solid fa-receipt text-emerald-500 mr-1.5"></i>
                  3. ยื่นวางบิลแล้ว (Child Billings - วางบิลสะสม)
                </span>
                <span className="font-bold text-slate-800">
                  {billedCount} สัญญา (
                  <span className="font-mono text-emerald-600">฿{formatNumber(totalBilledVal)}</span>)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${getPercentage(totalBilledVal, totalValue)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-700">
                  <i className="fa-solid fa-circle-check text-teal-600 mr-1.5"></i>
                  4. รับชำระเงินเรียบร้อย (Paid)
                </span>
                <span className="font-bold text-slate-800">
                  {paidCount} สัญญา (
                  <span className="font-mono text-teal-600">฿{formatNumber(totalPaidVal)}</span>)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden flex">
                <div
                  className="bg-teal-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${getPercentage(totalPaidVal, totalValue)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Breakdown Box */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base border-b pb-3">
              สรุปสถิติตามสถานะ QT (6 สถานะ)
            </h3>
            <div className="divide-y divide-slate-100 text-xs mt-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
              <div className="py-2.5 flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FFC107' }}></span>
                  <span className="font-medium text-slate-800">In process</span>
                  <span className="text-[10px] text-slate-400">(อยู่ระหว่างเสนอขาย)</span>
                </span>
                <span className="font-bold font-mono text-slate-800">{inProgressCount} รายการ</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FF9800' }}></span>
                  <span className="font-medium text-slate-800">Revising</span>
                  <span className="text-[10px] text-slate-400">(ปรับปรุงแก้ไขราคา)</span>
                </span>
                <span className="font-bold font-mono text-slate-800">{revisingCount} รายการ</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#03A9F4' }}></span>
                  <span className="font-medium text-slate-800">Final</span>
                  <span className="text-[10px] text-slate-400">(สรุปราคาเรียบร้อย)</span>
                </span>
                <span className="font-bold font-mono text-slate-800">{finalCount} รายการ</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#2E7D32' }}></span>
                  <span className="font-medium text-slate-800">Awarded</span>
                  <span className="text-[10px] text-slate-400">(ชนะการเสนอราคา/ได้งาน)</span>
                </span>
                <span className="font-bold font-mono text-slate-800">{awardedCount} รายการ</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#E53935' }}></span>
                  <span className="font-medium text-slate-800">Lost</span>
                  <span className="text-[10px] text-slate-400">(ไม่ได้งาน/แพ้การเสนอราคา)</span>
                </span>
                <span className="font-bold font-mono text-slate-800">{lostCount} รายการ</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#757575' }}></span>
                  <span className="font-medium text-slate-800">Cancelled</span>
                  <span className="text-[10px] text-slate-400">(ยกเลิก/ชะลอโครงการ)</span>
                </span>
                <span className="font-bold font-mono text-slate-800">{cancelledCount} รายการ</span>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 p-3.5 rounded-xl border border-indigo-100 text-xs text-indigo-900 flex items-center gap-3">
            <i className="fa-solid fa-lightbulb text-indigo-600 text-xl flex-shrink-0"></i>
            <div>
              <span className="font-bold block">คำแนะนำการติดตามงาน:</span>
              <span>
                มี {pendingBillingList.length} รายการที่มี SO/WO แล้ว และมียอดคงเหลือที่สามารถออกบิลงวดย่อยเพิ่มเติมได้
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
