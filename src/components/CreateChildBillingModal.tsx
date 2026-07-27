import React, { useState, useEffect } from 'react';
import { QuotationOrder, ChildBilling } from '../types';
import { calcFinancialProgress, formatNumber } from '../utils/formatters';

interface CreateChildBillingModalProps {
  order: QuotationOrder;
  onClose: () => void;
  onSaveInstallment: (orderId: string, newInstallment: Omit<ChildBilling, 'id' | 'createdAt'>) => void;
}

export const CreateChildBillingModal: React.FC<CreateChildBillingModalProps> = ({
  order,
  onClose,
  onSaveInstallment,
}) => {
  const progress = calcFinancialProgress(order);
  const nextInstallmentNo = (order.installments?.length || 0) + 1;

  const todayStr = new Date().toISOString().split('T')[0];
  const in30DaysStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  // Auto-generate default IV number like "IV2607-001-2" or based on QT/SO
  const cleanQtNo = order.qtNo.replace(/[^a-zA-Z0-9]/g, '');
  const defaultIvNo = `IV${cleanQtNo.replace('QT', '')}-${nextInstallmentNo}`;

  // State
  const [installmentNo, setInstallmentNo] = useState<number>(nextInstallmentNo);
  const [installmentTitle, setInstallmentTitle] = useState<string>(
    nextInstallmentNo === 1
      ? 'งวดที่ 1: เงินมัดจำลงนามสัญญา (30%)'
      : nextInstallmentNo === 2
      ? 'งวดที่ 2: เมื่องานติดตั้งแล้วเสร็จ 50%'
      : `งวดที่ ${nextInstallmentNo}: ยอดส่วนที่เหลือ`
  );
  const [ivNo, setIvNo] = useState<string>(defaultIvNo);
  const [billingDate, setBillingDate] = useState<string>(todayStr);
  const [dueDate, setDueDate] = useState<string>(in30DaysStr);
  
  // Default amount is remaining balance
  const defaultAmount = Math.max(0, progress.remainingBalance);
  const defaultPct = order.amount > 0 ? Math.round((defaultAmount / order.amount) * 100) : 0;

  const [amount, setAmount] = useState<number>(defaultAmount);
  const [percentage, setPercentage] = useState<number>(defaultPct);
  const [notes, setNotes] = useState<string>('');
  const [status, setStatus] = useState<ChildBilling['status']>('BILLED');

  // Handle Preset Percentage Click
  const handlePresetPct = (pct: number) => {
    let targetPct = pct;
    if (pct === 100) {
      // 100% of REMAINING
      const calculatedAmt = Math.round(progress.remainingBalance * 100) / 100;
      setAmount(calculatedAmt);
      const mainPct = order.amount > 0 ? Math.round((calculatedAmt / order.amount) * 100) : 100;
      setPercentage(mainPct);
    } else {
      const calculatedAmt = Math.round(((order.amount * pct) / 100) * 100) / 100;
      setAmount(calculatedAmt);
      setPercentage(pct);
    }
  };

  // Handle Amount Change
  const handleAmountChange = (val: number) => {
    setAmount(val);
    if (order.amount > 0) {
      const pct = Math.round((val / order.amount) * 100);
      setPercentage(pct);
    }
  };

  // Handle Percentage Change
  const handlePctChange = (val: number) => {
    setPercentage(val);
    if (order.amount > 0) {
      const amt = Math.round(((order.amount * val) / 100) * 100) / 100;
      setAmount(amt);
    }
  };

  const isExceedingBalance = amount > progress.remainingBalance + 0.01;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ivNo.trim()) return;

    onSaveInstallment(order.id, {
      orderId: order.id,
      qtNo: order.qtNo,
      soNo: order.soNo,
      installmentNo,
      installmentTitle: installmentTitle.trim() || `งวดที่ ${installmentNo}`,
      ivNo: ivNo.trim(),
      billingDate,
      dueDate,
      amount,
      percentage,
      status,
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 animate-fadeIn my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-700 to-slate-900 px-6 py-4 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/30 rounded-xl border border-emerald-400/30 text-emerald-300">
              <i className="fa-solid fa-file-invoice-dollar text-xl"></i>
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">ออกใบวางบิล/ใบแจ้งหนี้งวดย่อย (Child IV)</h3>
              <p className="text-xs text-emerald-200 mt-0.5">ระบบจัดการงวดเงินและติดตามการชำระเงิน</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors cursor-pointer p-1"
          >
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Parent Order Info Summary Box */}
          <div className="bg-gradient-to-br from-slate-50 to-emerald-50/40 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex flex-wrap justify-between items-center gap-2 pb-2 border-b border-slate-200">
              <div>
                <span className="font-bold text-slate-800 text-sm">{order.customerName}</span>
                {order.project && (
                  <span className="text-slate-500 block">
                    <i className="fa-solid fa-building text-slate-400 mr-1"></i>
                    {order.project}
                  </span>
                )}
              </div>
              <div className="text-right font-mono">
                <span className="text-[11px] text-slate-500 block">อ้างอิงใบเสนอราคา / SO</span>
                <span className="font-bold text-brand-700 text-sm">{order.qtNo}</span>
                {order.soNo && <span className="text-amber-800 ml-1.5">({order.soNo})</span>}
              </div>
            </div>

            {/* Financial Metrics Row */}
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">ยอดสัญญาเต็ม</span>
                <span className="font-bold font-mono text-slate-800">฿{formatNumber(order.amount)}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">วางบิลแล้ว ({progress.billedPercentage}%)</span>
                <span className="font-bold font-mono text-blue-700">฿{formatNumber(progress.billedAmount)}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-200 bg-emerald-50/50">
                <span className="text-[10px] text-emerald-800 font-semibold block">คงเหลือออกบิลได้</span>
                <span className="font-bold font-mono text-emerald-700">฿{formatNumber(progress.remainingBalance)}</span>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                งวดที่ (Installment No.) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={installmentNo}
                onChange={(e) => setInstallmentNo(Number(e.target.value))}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เลขที่ใบวางบิล / IV No. <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={ivNo}
                onChange={(e) => setIvNo(e.target.value)}
                required
                placeholder="เช่น IV2607-001-2"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono font-bold text-emerald-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              หัวข้อ / รายละเอียดงวด <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={installmentTitle}
              onChange={(e) => setInstallmentTitle(e.target.value)}
              required
              placeholder="เช่น งวดที่ 1: มัดจำสัญญา 30%"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Percentage Presets & Amount Inputs */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-slate-700">
                <i className="fa-solid fa-calculator text-emerald-600 mr-1.5"></i>
                คำนวณยอดเงินงวดนี้
              </label>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-500 mr-1">เลือก % รวดเร็ว:</span>
                <button
                  type="button"
                  onClick={() => handlePresetPct(20)}
                  className="px-2 py-0.5 text-[11px] font-semibold bg-white border border-slate-300 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 rounded cursor-pointer"
                >
                  20%
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetPct(30)}
                  className="px-2 py-0.5 text-[11px] font-semibold bg-white border border-slate-300 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 rounded cursor-pointer"
                >
                  30%
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetPct(50)}
                  className="px-2 py-0.5 text-[11px] font-semibold bg-white border border-slate-300 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 rounded cursor-pointer"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetPct(100)}
                  className="px-2 py-0.5 text-[11px] font-bold bg-emerald-600 text-white rounded cursor-pointer hover:bg-emerald-500"
                  title="เต็มจำนวนที่คงเหลือ"
                >
                  ครบ 100% คงเหลือ
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  จำนวนเงินงวดนี้ (บาท) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => handleAmountChange(Number(e.target.value))}
                    required
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:outline-none font-bold text-slate-900 ${
                      isExceedingBalance
                        ? 'border-rose-400 bg-rose-50/50 focus:ring-rose-400'
                        : 'border-slate-300 focus:ring-emerald-500 bg-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  คิดเป็นสัดส่วนสัญญา (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="100"
                    value={percentage}
                    onChange={(e) => handlePctChange(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-bold"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">%</span>
                </div>
              </div>
            </div>

            {isExceedingBalance && (
              <div className="text-[11px] text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded-lg flex items-center gap-1.5">
                <i className="fa-solid fa-triangle-exclamation text-rose-500"></i>
                <span>คำเตือน: ยอดเงินงวดนี้ (฿{formatNumber(amount)}) เกินกว่ายอดคงเหลือที่ออกบิลได้ (฿{formatNumber(progress.remainingBalance)})</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                วันที่ยื่นวางบิลจริง <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={billingDate}
                onChange={(e) => setBillingDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                วันครบกำหนดชำระ (Due Date)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              สถานะวางบิลเริ่มต้น
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ChildBilling['status'])}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="BILLED">⏳ ยื่นวางบิลแล้ว (รอชำระเงิน)</option>
              <option value="PAID">✅ รับชำระเงินเรียบร้อยแล้ว (Paid)</option>
              <option value="PENDING">⚪ รอเตรียมยื่นวางบิล</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              หมายเหตุ / เงื่อนไขชำระเงิน
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            ></textarea>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <i className="fa-solid fa-check"></i>
              <span>บันทึกออกงวดย่อย</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
