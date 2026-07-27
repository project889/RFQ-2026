import React, { useState, useEffect } from 'react';
import { QuotationOrder, PreQuotation, QtStatus, PreQtStatus } from '../types';
import { calcFinancialProgress, formatNumber, formatDate } from '../utils/formatters';

// MODAL 1: Create / Edit Quotation
interface QtModalProps {
  isOpen: boolean;
  isEditing: boolean;
  order: QuotationOrder | null;
  issuedByList: string[];
  salesList: string[];
  onClose: () => void;
  onSave: (formData: Partial<QuotationOrder>) => void;
  onAddName: (type: 'issuedBy' | 'sales') => void;
}

export const QtModal: React.FC<QtModalProps> = ({
  isOpen,
  isEditing,
  order,
  issuedByList,
  salesList,
  onClose,
  onSave,
  onAddName,
}) => {
  if (!isOpen) return null;

  const dateToday = new Date().toISOString().split('T')[0];
  const [qtNo, setQtNo] = useState(order?.qtNo || 'QT2607-001');
  const [qtDate, setQtDate] = useState(order?.qtDate || dateToday);
  const [receivedInfoDate, setReceivedInfoDate] = useState(order?.receivedInfoDate || dateToday);
  const [submissionDueDate, setSubmissionDueDate] = useState(order?.submissionDueDate || '');
  const [priceSentDate, setPriceSentDate] = useState(order?.priceSentDate || dateToday);
  const [customerName, setCustomerName] = useState(order?.customerName || '');
  const [project, setProject] = useState(order?.project || '');
  const [issuedBy, setIssuedBy] = useState(order?.issuedBy || issuedByList[0] || '');
  const [salesPerson, setSalesPerson] = useState(order?.salesPerson || salesList[0] || '');
  const [description, setDescription] = useState(order?.description || '');
  const [amount, setAmount] = useState<number>(order?.amount || 0);
  const [status, setStatus] = useState<QtStatus>(order?.status || 'IN_PROGRESS');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      qtNo,
      qtDate,
      receivedInfoDate,
      submissionDueDate,
      priceSentDate,
      customerName,
      project,
      issuedBy,
      salesPerson,
      description,
      amount,
      status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-100 animate-fadeIn my-8">
        <div className="bg-slate-900 px-6 py-4 text-white flex justify-between items-center">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <i className="fa-solid fa-file-pen text-brand-500"></i>
            <span>{isEditing ? 'แก้ไขใบเสนอราคา' : 'สร้างใบเสนอราคาใหม่ (New QT)'}</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เลขที่ใบเสนอราคา (QT No.) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={qtNo}
                onChange={(e) => setQtNo(e.target.value)}
                required
                placeholder="เช่น QT2607-001"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                วันที่ออกเอกสาร <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={qtDate}
                onChange={(e) => setQtDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                <i className="fa-regular fa-calendar-check text-blue-600 mr-1"></i>วันที่ได้รับข้อมูล
              </label>
              <input
                type="date"
                value={receivedInfoDate}
                onChange={(e) => setReceivedInfoDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                <i className="fa-regular fa-clock text-amber-600 mr-1"></i>วันที่กำหนดส่ง
              </label>
              <input
                type="date"
                value={submissionDueDate}
                onChange={(e) => setSubmissionDueDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                <i className="fa-regular fa-paper-plane text-emerald-600 mr-1"></i>วันที่ส่งราคา
              </label>
              <input
                type="date"
                value={priceSentDate}
                onChange={(e) => setPriceSentDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อลูกค้า / บริษัท <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                placeholder="เช่น บริษัท เอ บี ซี จำกัด"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อโครงการ</label>
              <input
                type="text"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                placeholder="เช่น ปรับปรุงอาคารสำนักงาน"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  <i className="fa-solid fa-file-pen text-indigo-600 mr-1"></i>ผู้ออกเอกสาร (Issued By)
                </label>
                <button
                  type="button"
                  onClick={() => onAddName('issuedBy')}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer hover:underline"
                >
                  <i className="fa-solid fa-plus-circle"></i> + เพิ่มชื่อ
                </button>
              </div>
              <select
                value={issuedBy}
                onChange={(e) => setIssuedBy(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                {issuedByList.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  <i className="fa-solid fa-user-tie text-emerald-600 mr-1"></i>พนักงานขาย (Sales)
                </label>
                <button
                  type="button"
                  onClick={() => onAddName('sales')}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer hover:underline"
                >
                  <i className="fa-solid fa-plus-circle"></i> + เพิ่มชื่อ
                </button>
              </div>
              <select
                value={salesPerson}
                onChange={(e) => setSalesPerson(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                {salesList.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">รายละเอียดงาน</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="ระบุรายละเอียดงานพอสังเขป..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                มูลค่ารวมเต็มสัญญา (บาท) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">สถานะใบเสนอราคา</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as QtStatus)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="IN_PROGRESS">In process</option>
                <option value="REVISING">Revising</option>
                <option value="FINAL">Final</option>
                <option value="AWARDED">Awarded</option>
                <option value="LOST">Lost</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md transition-colors cursor-pointer"
            >
              บันทึกใบเสนอราคา
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// MODAL 2: Record Sales Order (SO)
interface SoModalProps {
  isOpen: boolean;
  order: QuotationOrder | null;
  onClose: () => void;
  onSave: (orderId: string, soNo: string, soDate: string) => void;
}

export const SoModal: React.FC<SoModalProps> = ({ isOpen, order, onClose, onSave }) => {
  if (!isOpen || !order) return null;

  const dateToday = new Date().toISOString().split('T')[0];
  const [soNo, setSoNo] = useState(
    order.soNo || `SO-2026-${Math.floor(Math.random() * 800 + 100)}`
  );
  const [soDate, setSoDate] = useState(order.soDate || dateToday);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(order.id, soNo.trim(), soDate);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 animate-fadeIn my-8">
        <div className="bg-amber-600 px-6 py-4 text-white flex justify-between items-center">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <i className="fa-solid fa-file-contract"></i>
            <span>แปลงเป็น Sales Order (Convert to Sales Order)</span>
          </h3>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors cursor-pointer">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-900 space-y-1">
            <div>
              <strong className="font-semibold">อ้างอิงใบเสนอราคา:</strong> {order.qtNo}
            </div>
            <div>
              <strong className="font-semibold">ผู้ออกเอกสาร:</strong> {order.issuedBy || '-'}
            </div>
            <div>
              <strong className="font-semibold">ลูกค้า:</strong> {order.customerName}
            </div>
            <div>
              <strong className="font-semibold">มูลค่ารวม:</strong> ฿{formatNumber(order.amount)}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              เลขที่ SO (Sales Order No.) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={soNo}
              onChange={(e) => setSoNo(e.target.value)}
              required
              placeholder="เช่น SO-2026-089"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              วันที่ออก SO / วันที่รับอนุมัติสั่งซื้อ
            </label>
            <input
              type="date"
              value={soDate}
              onChange={(e) => setSoDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-md transition-colors cursor-pointer"
            >
              บันทึก Convert SO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// MODAL 3: Record Work Order / Purchase Order (WO/PO)
interface WoModalProps {
  isOpen: boolean;
  order: QuotationOrder | null;
  onClose: () => void;
  onSave: (orderId: string, woNo: string, woDate: string) => void;
}

export const WoModal: React.FC<WoModalProps> = ({ isOpen, order, onClose, onSave }) => {
  if (!isOpen || !order) return null;

  const dateToday = new Date().toISOString().split('T')[0];
  const [woNo, setWoNo] = useState(
    order.woNo || `PO-${Math.floor(Math.random() * 8000 + 1000)}`
  );
  const [woDate, setWoDate] = useState(order.woDate || dateToday);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(order.id, woNo.trim(), woDate);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 animate-fadeIn my-8">
        <div className="bg-purple-700 px-6 py-4 text-white flex justify-between items-center">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <i className="fa-solid fa-screwdriver-wrench"></i>
            <span>บันทึกเลขที่ WO / PO (Work Order / Purchase Order)</span>
          </h3>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors cursor-pointer">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 text-xs text-purple-900 space-y-1">
            <div>
              <strong className="font-semibold">ใบเสนอราคา / SO:</strong> {order.qtNo}{' '}
              {order.soNo ? `/ SO: ${order.soNo}` : ''}
            </div>
            <div>
              <strong className="font-semibold">ลูกค้า:</strong> {order.customerName}
            </div>
            <div>
              <strong className="font-semibold">โครงการ:</strong> {order.project || '-'}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              เลขที่ WO / PO (Purchase Order / Work Order) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={woNo}
              onChange={(e) => setWoNo(e.target.value)}
              required
              placeholder="เช่น PO-9982 หรือ WO-69012"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              วันที่เริ่มสั่งงาน (WO / PO Date)
            </label>
            <input
              type="date"
              value={woDate}
              onChange={(e) => setWoDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-purple-700 hover:bg-purple-600 rounded-lg shadow-md transition-colors cursor-pointer"
            >
              บันทึก WO / PO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// MODAL 4: Pre-Quotation Modal
interface PreQtModalProps {
  isOpen: boolean;
  isEditing: boolean;
  preQt: PreQuotation | null;
  issuedByList: string[];
  salesList: string[];
  onClose: () => void;
  onSave: (formData: Partial<PreQuotation>) => void;
}

export const PreQtModal: React.FC<PreQtModalProps> = ({
  isOpen,
  isEditing,
  preQt,
  issuedByList,
  salesList,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const dateToday = new Date().toISOString().split('T')[0];
  const [preNo, setPreNo] = useState(preQt?.preNo || 'PQT2607-001');
  const [receivedDate, setReceivedDate] = useState(preQt?.receivedDate || dateToday);
  const [customerName, setCustomerName] = useState(preQt?.customerName || '');
  const [project, setProject] = useState(preQt?.project || '');
  const [description, setDescription] = useState(preQt?.description || '');
  const [estimatedAmount, setEstimatedAmount] = useState<number>(preQt?.estimatedAmount || 0);
  const [submissionDueDate, setSubmissionDueDate] = useState(preQt?.submissionDueDate || '');
  const [salesPerson, setSalesPerson] = useState(preQt?.salesPerson || salesList[0] || '');
  const [issuedBy, setIssuedBy] = useState(preQt?.issuedBy || issuedByList[0] || '');
  const [status, setStatus] = useState<PreQtStatus>(preQt?.status || 'NEW_REQUEST');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      preNo,
      receivedDate,
      customerName,
      project,
      description,
      estimatedAmount,
      submissionDueDate,
      salesPerson,
      issuedBy,
      status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-100 animate-fadeIn my-8">
        <div className="bg-amber-800 px-6 py-4 text-white flex justify-between items-center">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <i className="fa-solid fa-clipboard-list text-amber-300"></i>
            <span>{isEditing ? 'แก้ไข Pre-Quotation' : 'บันทึก Pre-Quotation ใหม่'}</span>
          </h3>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors cursor-pointer">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pre-QT Ref No. <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={preNo}
                onChange={(e) => setPreNo(e.target.value)}
                required
                placeholder="เช่น PQT2607-001"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                วันที่รับเรื่อง <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อลูกค้า / บริษัท <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                placeholder="เช่น บริษัท สยาม พาร์ท จำกัด"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อโครงการ</label>
              <input
                type="text"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                placeholder="เช่น ก่อสร้างโกดังใหม่"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              รายละเอียดความต้องการลูกค้า
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="ระบุสิ่งที่ลูกค้าต้องการเสนอราคา..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ประมาณการมูลค่า (บาท)</label>
              <input
                type="number"
                step="0.01"
                value={estimatedAmount}
                onChange={(e) => setEstimatedAmount(Number(e.target.value))}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                กำหนดส่งใบเสนอราคา (Due Date)
              </label>
              <input
                type="date"
                value={submissionDueDate}
                onChange={(e) => setSubmissionDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">พนักงานขายรับเรื่อง (Sales)</label>
              <select
                value={salesPerson}
                onChange={(e) => setSalesPerson(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
              >
                {salesList.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ผู้บันทึกข้อมูล (Issued By)</label>
              <select
                value={issuedBy}
                onChange={(e) => setIssuedBy(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
              >
                {issuedByList.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">สถานะ Pre-QT</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PreQtStatus)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="NEW_REQUEST">New Request</option>
              <option value="PENDING_INFO">Pending info</option>
              <option value="WAITING_SUPPLIER">Waiting Supplier</option>
              <option value="REVIEW">Review</option>
              <option value="DONE_QT">Done QT.</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-md transition-colors cursor-pointer"
            >
              บันทึก Pre-QT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// MODAL 5: Convert Pre-QT to QT Modal
interface ConvertPreQtModalProps {
  isOpen: boolean;
  preQt: PreQuotation | null;
  onClose: () => void;
  onConvert: (preQt: PreQuotation, qtNo: string, qtDate: string, amount: number) => void;
}

export const ConvertPreQtModal: React.FC<ConvertPreQtModalProps> = ({
  isOpen,
  preQt,
  onClose,
  onConvert,
}) => {
  if (!isOpen || !preQt) return null;

  const dateToday = new Date().toISOString().split('T')[0];
  const [qtNo, setQtNo] = useState(`QT2607-${Math.floor(Math.random() * 800 + 100)}`);
  const [qtDate, setQtDate] = useState(dateToday);
  const [amount, setAmount] = useState<number>(preQt.estimatedAmount || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConvert(preQt, qtNo.trim(), qtDate, amount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 animate-fadeIn my-8">
        <div className="bg-gradient-to-r from-amber-600 to-blue-600 px-6 py-4 text-white flex justify-between items-center">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <i className="fa-solid fa-arrow-right-to-bracket"></i>
            <span>แปลง Pre-QT เป็น Quotation (Convert to Quotation)</span>
          </h3>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors cursor-pointer">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-900 space-y-1">
            <div>
              <strong className="font-semibold">อ้างอิง Pre-QT:</strong> {preQt.preNo}
            </div>
            <div>
              <strong className="font-semibold">ลูกค้า:</strong> {preQt.customerName}
            </div>
            <div>
              <strong className="font-semibold">โครงการ:</strong> {preQt.project || '-'}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              เลขที่ใบเสนอราคาใหม่ (QT No.) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={qtNo}
              onChange={(e) => setQtNo(e.target.value)}
              required
              placeholder="เช่น QT2607-088"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono font-bold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                วันที่ออกใบเสนอราคา <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={qtDate}
                onChange={(e) => setQtDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                มูลค่าเต็มสัญญา (บาท) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold text-slate-800"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md transition-colors cursor-pointer"
            >
              ยืนยันสร้าง Quotation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// MODAL 6: Add Name Modal
interface AddNameModalProps {
  isOpen: boolean;
  type: 'issuedBy' | 'sales';
  onClose: () => void;
  onAdd: (name: string, type: 'issuedBy' | 'sales') => void;
}

export const AddNameModal: React.FC<AddNameModalProps> = ({ isOpen, type, onClose, onAdd }) => {
  if (!isOpen) return null;
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), type);
    setName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-100 animate-fadeIn">
        <div className="bg-slate-800 px-4 py-3 text-white flex justify-between items-center">
          <h4 className="font-bold text-sm">
            เพิ่มรายชื่อ{type === 'issuedBy' ? 'ผู้ออกเอกสาร' : 'พนักงานขาย'}
          </h4>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อ-นามสกุล</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="ระบุชื่อ..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 rounded-lg cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs text-white bg-blue-600 rounded-lg cursor-pointer font-semibold"
            >
              บันทึกเพิ่มชื่อ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// MODAL 7: Lifecycle / Document Viewer Modal
interface LifecycleModalProps {
  isOpen: boolean;
  order: QuotationOrder | null;
  onClose: () => void;
  onCreateChildBilling: (order: QuotationOrder) => void;
}

export const LifecycleModal: React.FC<LifecycleModalProps> = ({
  isOpen,
  order,
  onClose,
  onCreateChildBilling,
}) => {
  if (!isOpen || !order) return null;

  const progress = calcFinancialProgress(order);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-100 animate-fadeIn my-8">
        <div className="bg-slate-900 px-6 py-4 text-white flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <i className="fa-solid fa-timeline text-amber-400"></i>
              <span>รายละเอียดวงจรเอกสารและการเงิน (Lifecycle Tracking)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">QT No: {order.qtNo}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Timeline Steps */}
          <div className="space-y-4">
            {/* Step 1: QT */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                1
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex-1">
                <div className="font-bold text-xs text-slate-800">Quotation (ใบเสนอราคา)</div>
                <div className="text-xs text-slate-600 mt-1">
                  เลขที่: <span className="font-mono font-bold text-brand-700">{order.qtNo}</span> |
                  ยอดเต็มสัญญา: <span className="font-mono font-bold">฿{formatNumber(order.amount)}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">ลูกค้า: {order.customerName}</div>
                <div className="text-[11px] text-slate-500">
                  ผู้ออก: {order.issuedBy || '-'} | Sales: {order.salesPerson || '-'}
                </div>
              </div>
            </div>

            {/* Step 2: SO */}
            <div className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                  order.soNo ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'
                }`}
              >
                2
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex-1">
                <div className="font-bold text-xs text-slate-800">Sales Order (SO)</div>
                {order.soNo ? (
                  <div className="text-xs text-amber-800 font-mono font-bold mt-1">
                    SO No: {order.soNo} (วันที่: {formatDate(order.soDate)})
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic mt-1">ยังไม่มีการออก Sales Order</div>
                )}
              </div>
            </div>

            {/* Step 3: WO / PO */}
            <div className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                  order.woNo ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-400'
                }`}
              >
                3
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex-1">
                <div className="font-bold text-xs text-slate-800">
                  Purchase Order / Work Order (PO/WO)
                </div>
                {order.woNo ? (
                  <div className="text-xs text-purple-800 font-mono font-bold mt-1">
                    PO/WO No: {order.woNo} (วันที่: {formatDate(order.woDate)})
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic mt-1">
                    ยังไม่มีการระบุ Purchase Order / Work Order
                  </div>
                )}
              </div>
            </div>

            {/* Step 4: Child Billings / Split Invoices */}
            <div className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                  order.installments.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                }`}
              >
                4
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex-1">
                <div className="flex justify-between items-center">
                  <div className="font-bold text-xs text-slate-800">
                    Child Billings & Invoices (ใบบิลงวดย่อย)
                  </div>
                  {progress.remainingBalance > 0 && (
                    <button
                      onClick={() => {
                        onClose();
                        onCreateChildBilling(order);
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer"
                    >
                      + ออกงวดย่อย
                    </button>
                  )}
                </div>

                <div className="mt-2 space-y-1.5">
                  <div className="text-xs text-slate-600 font-medium flex justify-between">
                    <span>
                      ออกบิลแล้ว {order.installments.length} งวด ({progress.billedPercentage}%)
                    </span>
                    <span className="font-mono font-bold text-emerald-700">
                      ฿{formatNumber(progress.billedAmount)} / ฿{formatNumber(progress.totalAmount)}
                    </span>
                  </div>

                  {order.installments.length === 0 ? (
                    <div className="text-xs text-slate-400 italic">ยังไม่มีการออกใบบิลงวดย่อย</div>
                  ) : (
                    <div className="divide-y divide-slate-200 text-xs bg-white rounded-lg border border-slate-200 overflow-hidden">
                      {order.installments.map((inst) => (
                        <div key={inst.id} className="p-2 flex justify-between items-center">
                          <div>
                            <span className="font-bold text-slate-800">{inst.installmentTitle}</span>
                            <span className="text-[11px] font-mono text-emerald-700 block">
                              IV: {inst.ivNo} • {formatDate(inst.billingDate)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold font-mono block">
                              ฿{formatNumber(inst.amount)} ({inst.percentage}%)
                            </span>
                            <span
                              className={`text-[10px] font-bold ${
                                inst.status === 'PAID' ? 'text-teal-600' : 'text-amber-600'
                              }`}
                            >
                              {inst.status === 'PAID' ? '✅ ชำระแล้ว' : '⏳ รอชำระ'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold bg-slate-800 text-white rounded-lg cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
