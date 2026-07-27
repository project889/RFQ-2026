import React, { useState } from 'react';
import { PreQuotation, PreQtStatus } from '../types';
import { formatNumber, formatDate } from '../utils/formatters';

interface PreQuotationTabProps {
  preQuotations: PreQuotation[];
  onOpenPreQtModal: (item?: PreQuotation) => void;
  onOpenConvertModal: (item: PreQuotation) => void;
  onUpdatePreQtStatus?: (preQtId: string, newStatus: PreQtStatus) => void;
  onDeletePreQt: (item: PreQuotation) => void;
  onGoToQuotation: (qtNo: string) => void;
}

export const PreQuotationTab: React.FC<PreQuotationTabProps> = ({
  preQuotations,
  onOpenPreQtModal,
  onOpenConvertModal,
  onUpdatePreQtStatus,
  onDeletePreQt,
  onGoToQuotation,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Calculation
  const totalCount = preQuotations.length;
  const totalValue = preQuotations.reduce((s, item) => s + (item.estimatedAmount || 0), 0);

  const pending = preQuotations.filter((i) =>
    ['NEW_REQUEST', 'PENDING_INFO', 'WAITING_SUPPLIER', 'REVIEW', 'IN_REVIEW'].includes(i.status)
  );
  const ready = preQuotations.filter((i) => i.status === 'REVIEW' || i.status === 'READY_FOR_QT');
  const converted = preQuotations.filter((i) => i.status === 'DONE_QT' || i.status === 'CONVERTED');

  const filteredItems = preQuotations.filter((item) => {
    const matchSearch =
      !searchTerm ||
      (item.preNo && item.preNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.customerName && item.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.project && item.project.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.salesPerson && item.salesPerson.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getBadgeClass = (status: PreQtStatus) => {
    const classes: Record<string, string> = {
      NEW_REQUEST: 'bg-sky-100 text-sky-800 border-sky-300',
      PENDING_INFO: 'bg-amber-100 text-amber-800 border-amber-300',
      WAITING_SUPPLIER: 'bg-purple-100 text-purple-800 border-purple-300',
      REVIEW: 'bg-orange-100 text-orange-800 border-orange-300',
      DONE_QT: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      CANCELLED: 'bg-slate-100 text-slate-600 border-slate-300',
      // Legacy support
      IN_REVIEW: 'bg-orange-100 text-orange-800 border-orange-300',
      READY_FOR_QT: 'bg-teal-100 text-teal-800 border-teal-300',
      CONVERTED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    };
    return classes[status] || 'bg-slate-100 text-slate-800';
  };

  const getStatusLabel = (status: PreQtStatus) => {
    const labels: Record<string, string> = {
      NEW_REQUEST: 'New Request',
      PENDING_INFO: 'Pending info',
      WAITING_SUPPLIER: 'Waiting Supplier',
      REVIEW: 'Review',
      DONE_QT: 'Done QT.',
      CANCELLED: 'Cancelled',
      // Legacy support
      IN_REVIEW: 'Review',
      READY_FOR_QT: 'Ready for QT',
      CONVERTED: 'Done QT.',
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-slate-900 p-5 rounded-2xl text-white shadow-md flex flex-wrap justify-between items-center gap-4">
        <div>
          <span className="bg-amber-500/30 text-amber-200 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border border-amber-400/30">
            Pre-Quotation Stage
          </span>
          <h2 className="text-xl font-bold mt-1">
            บันทึกและติดตามงานก่อนออกใบเสนอราคา (Pre-Quotation)
          </h2>
          <p className="text-xs text-amber-100 mt-1">
            รับเรื่อง รวบรวมข้อมูลความต้องการลูกค้า และแปลงเป็นใบเสนอราคา (Convert to Quotation) เมื่อพร้อม
          </p>
        </div>
        <div>
          <button
            onClick={() => onOpenPreQtModal()}
            className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-4 py-2 rounded-xl text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <i className="fa-solid fa-circle-plus"></i>
            <span>+ บันทึก Pre-Quotation ใหม่</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pre-QT ทั้งหมด
            </p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">
              {totalCount} <span className="text-xs font-normal text-slate-500">รายการ</span>
            </h3>
            <p className="text-sm font-semibold text-amber-600 mt-1 font-mono">
              ฿{formatNumber(totalValue)}
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xl">
            <i className="fa-solid fa-clipboard-list"></i>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              อยู่ระหว่างรวบรวมข้อมูล
            </p>
            <h3 className="text-2xl font-bold text-blue-600 mt-1">
              {pending.length} <span className="text-xs font-normal text-slate-500">รายการ</span>
            </h3>
            <p className="text-sm font-semibold text-blue-600 mt-1 font-mono">
              ฿{formatNumber(pending.reduce((s, i) => s + i.estimatedAmount, 0))}
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl">
            <i className="fa-solid fa-hourglass-half"></i>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              พร้อมแปลงเป็น QT
            </p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">
              {ready.length} <span className="text-xs font-normal text-slate-500">รายการ</span>
            </h3>
            <p className="text-sm font-semibold text-emerald-600 mt-1 font-mono">
              ฿{formatNumber(ready.reduce((s, i) => s + i.estimatedAmount, 0))}
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl">
            <i className="fa-solid fa-circle-check"></i>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              แปลงเป็น QT เรียบร้อย
            </p>
            <h3 className="text-2xl font-bold text-indigo-600 mt-1">
              {converted.length} <span className="text-xs font-normal text-slate-500">รายการ</span>
            </h3>
            <p className="text-sm font-semibold text-indigo-600 mt-1 font-mono">
              ฿{formatNumber(converted.reduce((s, i) => s + i.estimatedAmount, 0))}
            </p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl">
            <i className="fa-solid fa-arrow-right-to-bracket"></i>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-6 relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-3 text-slate-400 text-sm"></i>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหา เลข Pre-QT, ชื่อลูกค้า, โครงการ, รายละเอียด, Sales..."
              className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
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
              className="w-full py-2 px-3 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">-- แสดงสถานะ Pre-QT ทั้งหมด --</option>
              <option value="NEW_REQUEST">New Request</option>
              <option value="PENDING_INFO">Pending info</option>
              <option value="WAITING_SUPPLIER">Waiting Supplier</option>
              <option value="REVIEW">Review</option>
              <option value="DONE_QT">Done QT.</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="md:col-span-2 text-right text-xs text-slate-500 font-medium">
            แสดง {filteredItems.length} รายการ
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1500px]">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 text-xs font-semibold border-b border-slate-200 uppercase tracking-wider">
                <th className="py-3 px-3 w-32 whitespace-nowrap">Pre-QT Ref No.</th>
                <th className="py-3 px-3 w-32 whitespace-nowrap">Date Received</th>
                <th className="py-3 px-3 w-40 whitespace-nowrap">Customer</th>
                <th className="py-3 px-3 w-40 whitespace-nowrap">Project</th>
                <th className="py-3 px-3 min-w-[180px] whitespace-nowrap">Description</th>
                <th className="py-3 px-3 text-right w-32 whitespace-nowrap">Estimated Amount</th>
                <th className="py-3 px-3 w-32 whitespace-nowrap">Due Date</th>
                <th className="py-3 px-3 w-32 whitespace-nowrap">Sales</th>
                <th className="py-3 px-3 w-32 whitespace-nowrap">Issued By</th>
                <th className="py-3 px-3 w-36 text-center whitespace-nowrap">Status</th>
                <th className="py-3 px-3 w-48 text-center whitespace-nowrap">Convert Action</th>
                <th className="py-3 px-3 w-28 text-center whitespace-nowrap">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    <i className="fa-solid fa-clipboard-question text-4xl mb-2 block opacity-50"></i>
                    <span>ไม่พบข้อมูล Pre-Quotation ตรงตามเงื่อนไข</span>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-3 align-top font-bold text-amber-800 font-mono">
                      {item.preNo}
                    </td>
                    <td className="py-3.5 px-3 align-top">
                      <div className="text-xs font-medium text-slate-700 whitespace-nowrap">
                        <i className="fa-regular fa-calendar-check text-blue-500 mr-1"></i>
                        {formatDate(item.receivedDate)}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 align-top">
                      <div className="font-semibold text-slate-800 line-clamp-1" title={item.customerName}>
                        {item.customerName}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 align-top">
                      <div className="text-xs font-medium text-slate-700 line-clamp-1" title={item.project}>
                        <i className="fa-solid fa-building text-slate-400 mr-1"></i>
                        {item.project || '-'}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 align-top">
                      <div className="text-slate-700 text-xs line-clamp-2" title={item.description}>
                        {item.description || '-'}
                      </div>
                      {item.remarks && (
                        <div className="text-[11px] text-slate-400 italic mt-0.5">
                          หมายเหตุ: {item.remarks}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3 align-top text-right font-bold text-slate-800 font-mono">
                      ฿{formatNumber(item.estimatedAmount)}
                    </td>
                    <td className="py-3.5 px-3 align-top">
                      {item.submissionDueDate ? (
                        <div className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg inline-block whitespace-nowrap">
                          <i className="fa-regular fa-clock text-amber-600 mr-1"></i>
                          {formatDate(item.submissionDueDate)}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 align-top">
                      <div className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg inline-flex items-center gap-1 max-w-full truncate">
                        <i className="fa-solid fa-user-tie text-[10px] text-emerald-600 shrink-0"></i>
                        <span className="truncate">{item.salesPerson || '-'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 align-top">
                      <div className="text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg inline-flex items-center gap-1 max-w-full truncate">
                        <i className="fa-solid fa-file-pen text-[10px] text-indigo-500 shrink-0"></i>
                        <span className="truncate">{item.issuedBy || '-'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 align-top text-center">
                      <select
                        value={item.status}
                        onChange={(e) =>
                          onUpdatePreQtStatus?.(item.id, e.target.value as PreQtStatus)
                        }
                        className={`text-xs font-semibold px-2 py-1 rounded-full border cursor-pointer focus:outline-none transition-all w-full text-center appearance-none ${getBadgeClass(
                          item.status
                        )}`}
                      >
                        <option value="NEW_REQUEST" className="bg-white text-slate-800">
                          New Request
                        </option>
                        <option value="PENDING_INFO" className="bg-white text-slate-800">
                          Pending info
                        </option>
                        <option value="WAITING_SUPPLIER" className="bg-white text-slate-800">
                          Waiting Supplier
                        </option>
                        <option value="REVIEW" className="bg-white text-slate-800">
                          Review
                        </option>
                        <option value="DONE_QT" className="bg-white text-slate-800">
                          Done QT.
                        </option>
                        <option value="CANCELLED" className="bg-white text-slate-800">
                          Cancelled
                        </option>
                      </select>
                    </td>
                    <td className="py-3.5 px-3 align-top text-center">
                      {(item.status === 'DONE_QT' || item.status === 'CONVERTED') && item.convertedQtNo ? (
                        <div
                          onClick={() => onGoToQuotation(item.convertedQtNo!)}
                          className="text-xs text-indigo-700 font-bold bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg inline-flex items-center gap-1 cursor-pointer hover:underline"
                          title="คลิกเพื่อไปที่ใบเสนอราคานี้"
                        >
                          <i className="fa-solid fa-circle-check text-indigo-600"></i>
                          <span>QT: {item.convertedQtNo}</span>
                        </div>
                      ) : item.status !== 'CANCELLED' ? (
                        <button
                          onClick={() => onOpenConvertModal(item)}
                          className="bg-gradient-to-r from-amber-600 to-blue-600 hover:from-amber-500 hover:to-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer w-full whitespace-nowrap transition-all transform hover:scale-[1.02]"
                        >
                          <i className="fa-solid fa-arrow-right-to-bracket"></i>
                          <span>Convert to QT</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">ยกเลิกแล้ว</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 align-top text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => onOpenPreQtModal(item)}
                          title="แก้ไขข้อมูล Pre-QT"
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button
                          onClick={() => onDeletePreQt(item)}
                          title="ลบข้อมูล Pre-QT"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
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
