import React, { useState } from 'react';
import { QuotationOrder, QtStatus, ChildBilling } from '../types';
import { formatNumber, formatDate } from '../utils/formatters';

interface QuotationsTabProps {
  orders: QuotationOrder[];
  onOpenNewQtModal: () => void;
  onOpenEditQtModal: (order: QuotationOrder) => void;
  onOpenSoModal: (order: QuotationOrder) => void;
  onOpenCreateChildBillingModal: (order: QuotationOrder) => void;
  onUpdateRecordStatus: (order: QuotationOrder, newStatus: QtStatus) => void;
  onDeleteRecord: (order: QuotationOrder) => void;
  onViewDetail: (order: QuotationOrder) => void;
  onUpdateInstallmentStatus: (orderId: string, installmentId: string, newStatus: ChildBilling['status']) => void;
  onDeleteInstallment: (orderId: string, installmentId: string) => void;
}

export const QuotationsTab: React.FC<QuotationsTabProps> = ({
  orders,
  onOpenNewQtModal,
  onOpenEditQtModal,
  onOpenSoModal,
  onOpenCreateChildBillingModal,
  onUpdateRecordStatus,
  onDeleteRecord,
  onViewDetail,
  onUpdateInstallmentStatus,
  onDeleteInstallment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Stats calculation
  const totalCount = orders.length;
  const totalValue = orders.reduce((sum, r) => sum + (r.amount || 0), 0);

  const finalItems = orders.filter((r) => r.status === 'FINAL');
  const soItems = orders.filter((r) => r.soNo);
  const inProgressItems = orders.filter((r) => r.status === 'IN_PROGRESS');

  // Filtered list
  const filteredOrders = orders.filter((item) => {
    const matchSearch =
      !searchTerm ||
      (item.qtNo && item.qtNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.customerName && item.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.project && item.project.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.issuedBy && item.issuedBy.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.salesPerson && item.salesPerson.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getStatusBadgeStyle = (status: QtStatus) => {
    const styles: Record<string, string> = {
      IN_PROGRESS: 'background-color: #FEF3C7; color: #92400E; border-color: #FCD34D;',
      REVISING: 'background-color: #FFEDD5; color: #9A3412; border-color: #FDBA74;',
      FINAL: 'background-color: #E0F2FE; color: #075985; border-color: #7DD3FC;',
      AWARDED: 'background-color: #DCFCE7; color: #14532D; border-color: #4ADE80;',
      LOST: 'background-color: #FEE2E2; color: #991B1B; border-color: #FCA5A5;',
      CANCELLED: 'background-color: #F1F5F9; color: #475569; border-color: #CBD5E1;',
      // Legacy support
      PENDING_INFO: 'background-color: #E0F2FE; color: #075985; border-color: #7DD3FC;',
      COMPLETED: 'background-color: #DCFCE7; color: #14532D; border-color: #4ADE80;',
      DONE_NO_QT: 'background-color: #F3E8FF; color: #6B21A8; border-color: #D8B4FE;',
      FAILED: 'background-color: #FEE2E2; color: #991B1B; border-color: #FCA5A5;',
    };
    return styles[status] || styles.IN_PROGRESS;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 p-5 rounded-2xl text-white shadow-md flex flex-wrap justify-between items-center gap-4">
        <div>
          <span className="bg-blue-500/30 text-blue-200 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border border-blue-400/30">
            Quotation Management
          </span>
          <h2 className="text-xl font-bold mt-1">จัดการใบเสนอราคา (Quotation Tracker)</h2>
          <p className="text-xs text-blue-100 mt-1">
            บันทึกเสนอราคา ติดตามสถานะอนุมัติ แปลงเป็น Sales Order และบริหารงบประมาณ
          </p>
        </div>
        <div>
          <button
            onClick={onOpenNewQtModal}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <i className="fa-solid fa-circle-plus"></i>
            <span>+ ออกใบเสนอราคาใหม่</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ใบเสนอราคาทั้งหมด
            </p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">
              {totalCount} <span className="text-xs font-normal text-slate-500">รายการ</span>
            </h3>
            <p className="text-sm font-semibold text-blue-600 mt-1 font-mono">
              ฿{formatNumber(totalValue)}
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl">
            <i className="fa-solid fa-file-signature"></i>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              สถานะ Final / อนุมัติ
            </p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">
              {finalItems.length} <span className="text-xs font-normal text-slate-500">รายการ</span>
            </h3>
            <p className="text-sm font-semibold text-emerald-600 mt-1 font-mono">
              ฿{formatNumber(finalItems.reduce((s, i) => s + i.amount, 0))}
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl">
            <i className="fa-solid fa-circle-check"></i>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              แปลงเป็น Sales Order แล้ว
            </p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">
              {soItems.length} <span className="text-xs font-normal text-slate-500">รายการ</span>
            </h3>
            <p className="text-sm font-semibold text-amber-600 mt-1 font-mono">
              ฿{formatNumber(soItems.reduce((s, i) => s + i.amount, 0))}
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xl">
            <i className="fa-solid fa-file-contract"></i>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              อยู่ระหว่างพิจารณา (In Progress)
            </p>
            <h3 className="text-2xl font-bold text-slate-600 mt-1">
              {inProgressItems.length} <span className="text-xs font-normal text-slate-500">รายการ</span>
            </h3>
            <p className="text-sm font-semibold text-slate-600 mt-1 font-mono">
              ฿{formatNumber(inProgressItems.reduce((s, i) => s + i.amount, 0))}
            </p>
          </div>
          <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center text-xl">
            <i className="fa-solid fa-hourglass-half"></i>
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
              placeholder="ค้นหา เลข QT, ชื่อลูกค้า, ผู้จัดทำ, โครงการ, รายละเอียด..."
              className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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
              className="w-full py-2 px-3 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">-- แสดงสถานะ QT ทั้งหมด --</option>
              <option value="IN_PROGRESS">In process</option>
              <option value="REVISING">Revising</option>
              <option value="FINAL">Final</option>
              <option value="AWARDED">Awarded</option>
              <option value="LOST">Lost</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="md:col-span-2 text-right text-xs text-slate-500 font-medium">
            แสดง {filteredOrders.length} รายการ
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1250px]">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 text-xs font-semibold border-b border-slate-200 uppercase tracking-wider">
                <th className="py-3 px-3 w-32 whitespace-nowrap">Quotation No.</th>
                <th className="py-3 px-3 w-32 whitespace-nowrap">Date Received</th>
                <th className="py-3 px-3 w-44 whitespace-nowrap">Customer</th>
                <th className="py-3 px-3 w-40 whitespace-nowrap">Project</th>
                <th className="py-3 px-3 min-w-[180px] whitespace-nowrap">Description</th>
                <th className="py-3 px-3 text-right w-32 whitespace-nowrap">Amount</th>
                <th className="py-3 px-3 w-36 text-center whitespace-nowrap">Status</th>
                <th className="py-3 px-3 w-36 whitespace-nowrap">Issued By / Sales</th>
                <th className="py-3 px-3 w-44 text-center whitespace-nowrap">Actions / Convert</th>
                <th className="py-3 px-3 w-28 text-center whitespace-nowrap">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <i className="fa-solid fa-folder-open text-4xl mb-2 block opacity-50"></i>
                    <span>ไม่พบข้อมูลใบเสนอราคาตรงตามเงื่อนไข</span>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((item) => {
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      {/* QT No */}
                      <td className="py-3.5 px-3 align-top">
                        <div
                          className="font-bold text-brand-700 hover:underline cursor-pointer flex items-center gap-1"
                          onClick={() => onViewDetail(item)}
                        >
                          <span>{item.qtNo}</span>
                        </div>
                      </td>

                      {/* Date Received */}
                      <td className="py-3.5 px-3 align-top">
                        <div className="text-xs font-medium text-slate-700 whitespace-nowrap">
                          <i className="fa-regular fa-calendar-check text-blue-500 mr-1"></i>
                          {formatDate(item.receivedInfoDate || item.qtDate)}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-3 align-top">
                        <div className="font-semibold text-slate-800 line-clamp-1" title={item.customerName}>
                          {item.customerName}
                        </div>
                      </td>

                      {/* Project */}
                      <td className="py-3.5 px-3 align-top">
                        <div className="text-xs font-medium text-slate-700 line-clamp-1" title={item.project}>
                          <i className="fa-solid fa-building text-slate-400 mr-1"></i>
                          {item.project || '-'}
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-3 align-top">
                        <div className="text-slate-700 text-xs line-clamp-2" title={item.description}>
                          {item.description || '-'}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-3 align-top text-right font-bold text-slate-800 font-mono">
                        ฿{formatNumber(item.amount)}
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3.5 px-3 align-top text-center">
                        <select
                          value={item.status}
                          onChange={(e) => onUpdateRecordStatus(item, e.target.value as QtStatus)}
                          style={{ cssText: getStatusBadgeStyle(item.status) }}
                          className="text-xs font-semibold px-2 py-1 rounded-full cursor-pointer focus:outline-none border shadow-2xs transition-all w-full text-center appearance-none"
                        >
                          <option value="IN_PROGRESS" className="bg-white text-slate-800">In process</option>
                          <option value="REVISING" className="bg-white text-slate-800">Revising</option>
                          <option value="FINAL" className="bg-white text-slate-800">Final</option>
                          <option value="AWARDED" className="bg-white text-slate-800">Awarded</option>
                          <option value="LOST" className="bg-white text-slate-800">Lost</option>
                          <option value="CANCELLED" className="bg-white text-slate-800">Cancelled</option>
                        </select>
                      </td>

                      {/* Issued By / Sales */}
                      <td className="py-3.5 px-3 align-top">
                        <div className="text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg inline-flex items-center gap-1 max-w-full truncate mb-1">
                          <i className="fa-solid fa-file-pen text-[10px] text-indigo-500 shrink-0"></i>
                          <span className="truncate">{item.issuedBy || '-'}</span>
                        </div>
                        <div className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg inline-flex items-center gap-1 max-w-full truncate">
                          <i className="fa-solid fa-user-tie text-[10px] text-emerald-600 shrink-0"></i>
                          <span className="truncate">{item.salesPerson || item.createdBy || '-'}</span>
                        </div>
                      </td>

                      {/* Action / Convert SO */}
                      <td className="py-3.5 px-3 align-top text-center space-y-1">
                        {item.soNo ? (
                          <div className="text-xs font-bold font-mono text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                            <i className="fa-solid fa-circle-check text-amber-600"></i>
                            <span>SO: {item.soNo}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => onOpenSoModal(item)}
                            className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-lg shadow-xs flex items-center justify-center gap-1 cursor-pointer w-full"
                          >
                            <i className="fa-solid fa-file-signature"></i>
                            <span>Convert to SO</span>
                          </button>
                        )}
                      </td>

                      {/* Manage */}
                      <td className="py-3.5 px-3 align-top text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => onViewDetail(item)}
                            title="ดูรายละเอียด Lifecycle"
                            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                          >
                            <i className="fa-solid fa-eye"></i>
                          </button>
                          <button
                            onClick={() => onOpenEditQtModal(item)}
                            title="แก้ไขใบเสนอราคา"
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            onClick={() => onDeleteRecord(item)}
                            title="ลบรายการ"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
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
  );
};
