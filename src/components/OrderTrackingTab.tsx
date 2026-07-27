import React, { useState, useEffect } from 'react';
import { QuotationOrder, ChildBilling } from '../types';
import { FinancialProgressBar } from './FinancialProgressBar';
import { calcFinancialProgress, formatNumber, formatDate } from '../utils/formatters';
import {
  initGoogleAuth,
  signInWithGoogle,
  logoutGoogle,
  exportOrderTrackingToSheets,
  ExportResult,
} from '../utils/googleSheets';
import { User } from 'firebase/auth';

interface OrderTrackingTabProps {
  orders: QuotationOrder[];
  onOpenSoModal: (order: QuotationOrder) => void;
  onOpenWoModal: (order: QuotationOrder) => void;
  onOpenCreateChildBillingModal: (order: QuotationOrder) => void;
  onUpdateInstallmentStatus: (orderId: string, installmentId: string, newStatus: ChildBilling['status']) => void;
  onDeleteInstallment: (orderId: string, installmentId: string) => void;
  onViewDetail: (order: QuotationOrder) => void;
}

export const OrderTrackingTab: React.FC<OrderTrackingTabProps> = ({
  orders,
  onOpenSoModal,
  onOpenWoModal,
  onOpenCreateChildBillingModal,
  onUpdateInstallmentStatus,
  onDeleteInstallment,
  onViewDetail,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Google Sheets state
  const [showSheetsModal, setShowSheetsModal] = useState(false);
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMode, setExportMode] = useState<'NEW' | 'EXISTING'>('NEW');
  const [existingSheetInput, setExistingSheetInput] = useState('');
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSheetUrl, setLastSheetUrl] = useState<string | null>(
    localStorage.getItem('order_tracking_sheet_url')
  );

  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user) => setGoogleUser(user),
      () => setGoogleUser(null)
    );
    return () => unsubscribe();
  }, []);

  const handleLoginGoogle = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      const res = await signInWithGoogle();
      if (res) {
        setGoogleUser(res.user);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการลงชื่อเข้าใช้ Google');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogoutGoogle = async () => {
    await logoutGoogle();
    setGoogleUser(null);
  };

  const extractSheetId = (input: string): string => {
    const trimmed = input.trim();
    if (trimmed.includes('/spreadsheets/d/')) {
      const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) return match[1];
    }
    return trimmed;
  };

  const handleConfirmExport = async () => {
    setErrorMessage(null);
    setExportResult(null);

    let targetSheetId: string | undefined = undefined;
    if (exportMode === 'EXISTING') {
      const parsedId = extractSheetId(existingSheetInput);
      if (!parsedId) {
        setErrorMessage('กรุณาระบุ Spreadsheet ID หรือ URL ของ Google Sheet ที่ต้องการอัปเดต');
        return;
      }
      targetSheetId = parsedId;
    }

    setIsExporting(true);
    try {
      const res = await exportOrderTrackingToSheets(orders, targetSheetId);
      setExportResult(res);
      setLastSheetUrl(res.spreadsheetUrl);
      localStorage.setItem('order_tracking_sheet_url', res.spreadsheetUrl);
      localStorage.setItem('order_tracking_sheet_id', res.spreadsheetId);
    } catch (err: any) {
      setErrorMessage(err.message || 'ไม่สามารถส่งออกไปยัง Google Sheet ได้');
    } finally {
      setIsExporting(false);
    }
  };

  // Orders that have SO or WO or are in sales tracking
  const trackingOrders = orders.filter((o) => o.soNo || o.woNo || o.status === 'COMPLETED' || o.status === 'FINAL');

  // Calculate statistics
  const totalCount = trackingOrders.length;
  const totalValue = trackingOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

  const completedBilled = trackingOrders.filter((o) => calcFinancialProgress(o).isFullyBilled);
  const partialBilled = trackingOrders.filter((o) => {
    const prog = calcFinancialProgress(o);
    return prog.installmentCount > 0 && !prog.isFullyBilled;
  });
  const unbilled = trackingOrders.filter((o) => calcFinancialProgress(o).installmentCount === 0);

  const totalRemainingBalance = trackingOrders.reduce(
    (sum, o) => sum + calcFinancialProgress(o).remainingBalance,
    0
  );

  // Search Filter
  const filteredOrders = trackingOrders.filter((item) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      (item.soNo && item.soNo.toLowerCase().includes(s)) ||
      (item.woNo && item.woNo.toLowerCase().includes(s)) ||
      (item.customerName && item.customerName.toLowerCase().includes(s)) ||
      (item.project && item.project.toLowerCase().includes(s)) ||
      (item.description && item.description.toLowerCase().includes(s)) ||
      (item.qtNo && item.qtNo.toLowerCase().includes(s))
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-slate-900 p-5 rounded-2xl text-white shadow-md flex flex-wrap justify-between items-center gap-4">
        <div>
          <span className="bg-amber-500/30 text-amber-200 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border border-amber-400/30">
            Order Execution & Split Billing Management
          </span>
          <h2 className="text-xl font-bold mt-1">
            ติดตามคำสั่งซื้อ และศูนย์จัดการเรื่องการเงิน (Order Tracking & Billing)
          </h2>
          <p className="text-xs text-amber-100 mt-1">
            ช่อง Order Tracking เป็นศูนย์กลางติดตามการเงินและออกบิลงวดย่อย (Child IV) ได้เรื่อยๆ จนกว่ายอดเงินคงเหลือจะเท่ากับ 0
          </p>
        </div>

        {/* Google Sheets Integration Action */}
        <div className="flex items-center gap-2">
          {lastSheetUrl && (
            <a
              href={lastSheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 rounded-xl transition-all flex items-center gap-1.5"
              title="เปิด Google Sheet ล่าสุด"
            >
              <i className="fa-solid fa-file-excel text-emerald-400"></i>
              <span>ดู Sheet ล่าสุด ↗</span>
            </a>
          )}
          <button
            onClick={() => {
              setErrorMessage(null);
              setExportResult(null);
              setShowSheetsModal(true);
            }}
            className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer transform hover:scale-[1.02]"
          >
            <i className="fa-solid fa-table text-sm"></i>
            <span>บันทึกเป็น Google Sheet</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              คำสั่งซื้อในระบบทั้งหมด
            </p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">
              {totalCount} <span className="text-xs font-normal text-slate-500">รายการ</span>
            </h3>
            <p className="text-sm font-semibold text-amber-700 mt-1 font-mono">
              ฿{formatNumber(totalValue)}
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xl">
            <i className="fa-solid fa-boxes-packing"></i>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              วางบิลแล้วบางส่วน (Partial)
            </p>
            <h3 className="text-2xl font-bold text-indigo-600 mt-1">
              {partialBilled.length} <span className="text-xs font-normal text-slate-500">รายการ</span>
            </h3>
            <p className="text-xs text-indigo-600 mt-1">ทยอยออกบิลตามงวดงาน</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl">
            <i className="fa-solid fa-file-invoice-dollar"></i>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              วางบิลครบ 100% แล้ว
            </p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">
              {completedBilled.length} <span className="text-xs font-normal text-slate-500">รายการ</span>
            </h3>
            <p className="text-xs text-emerald-600 mt-1">ยอดคงเหลือ = ฿0.00</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl">
            <i className="fa-solid fa-circle-check"></i>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ยอดคงเหลือรอออกบิลรวม
            </p>
            <h3 className="text-xl font-bold font-mono text-amber-600 mt-1">
              ฿{formatNumber(totalRemainingBalance)}
            </h3>
            <p className="text-xs text-amber-700 mt-1">ยังไม่ออกบิล {unbilled.length} รายการ</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xl">
            <i className="fa-solid fa-calculator"></i>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Search bar */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3">
          <div className="relative w-full sm:w-96">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-3 text-slate-400 text-sm"></i>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหา SO No., PO/WO No., ลูกค้า, โครงการ, QT..."
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

          <div className="text-xs text-slate-500 font-medium">
            แสดง {filteredOrders.length} รายการคำสั่งซื้อ
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1300px]">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 text-xs font-semibold border-b border-slate-200 uppercase tracking-wider">
                <th className="py-3 px-4 w-36 whitespace-nowrap">Sales Order No.</th>
                <th className="py-3 px-4 w-40 whitespace-nowrap">PO / WO No.</th>
                <th className="py-3 px-4 w-48 whitespace-nowrap">Customer / Project</th>
                <th className="py-3 px-4 min-w-[160px] whitespace-nowrap">Description & Ref QT</th>
                <th className="py-3 px-4 text-right w-36 whitespace-nowrap">Total Contract</th>
                <th className="py-3 px-4 w-60 whitespace-nowrap">
                  Financial Progress
                </th>
                <th className="py-3 px-4 w-48 text-center whitespace-nowrap">
                  การเงิน & ออกงวดย่อย (Child IV)
                </th>
                <th className="py-3 px-4 w-28 text-center whitespace-nowrap">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <i className="fa-solid fa-boxes-packing text-4xl mb-2 block opacity-50"></i>
                    <span>ไม่พบข้อมูล Order Tracking</span>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((item) => {
                  const progress = calcFinancialProgress(item);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      {/* 1. Sales Order No */}
                      <td className="py-3.5 px-4 align-top">
                        {item.soNo ? (
                          <div className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200 inline-block">
                            <i className="fa-solid fa-file-contract mr-1 text-amber-600"></i>
                            {item.soNo}
                          </div>
                        ) : (
                          <button
                            onClick={() => onOpenSoModal(item)}
                            className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded hover:bg-amber-100 cursor-pointer font-medium"
                          >
                            + ออก SO
                          </button>
                        )}
                        {item.soDate && (
                          <div className="text-[11px] text-slate-500 mt-1">
                            วันที่: {formatDate(item.soDate)}
                          </div>
                        )}
                      </td>

                      {/* 2. Purchase Order / Work Order No */}
                      <td className="py-3.5 px-4 align-top">
                        {item.woNo ? (
                          <div className="font-mono font-bold text-purple-800 bg-purple-50 px-2 py-1 rounded border border-purple-200 inline-flex items-center justify-between w-full">
                            <span>
                              <i className="fa-solid fa-screwdriver-wrench mr-1 text-purple-600"></i>
                              {item.woNo}
                            </span>
                            <button
                              onClick={() => onOpenWoModal(item)}
                              className="text-purple-600 hover:text-purple-900 ml-1 cursor-pointer shrink-0 p-0.5"
                              title="แก้ไข PO/WO"
                            >
                              <i className="fa-solid fa-pen text-[10px]"></i>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => onOpenWoModal(item)}
                            className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-lg font-medium transition-all w-full text-center cursor-pointer flex items-center justify-center gap-1"
                          >
                            <i className="fa-solid fa-plus-circle"></i>
                            <span>+ ระบุ PO / WO</span>
                          </button>
                        )}
                      </td>

                      {/* 3. Customer & Project */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-semibold text-slate-800 line-clamp-1" title={item.customerName}>
                          {item.customerName}
                        </div>
                        {item.project && (
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-1" title={item.project}>
                            <i className="fa-solid fa-building text-slate-400 mr-1"></i>
                            {item.project}
                          </div>
                        )}
                      </td>

                      {/* 4. Description & Ref QT */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="text-slate-700 text-xs line-clamp-2" title={item.description}>
                          {item.description || '-'}
                        </div>
                        <div className="mt-1">
                          <span className="text-[11px] font-bold text-brand-700 font-mono bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 inline-block">
                            QT: {item.qtNo}
                          </span>
                        </div>
                      </td>

                      {/* 5. Total Contract Amount */}
                      <td className="py-3.5 px-4 align-top text-right font-bold text-slate-800 font-mono">
                        ฿{formatNumber(item.amount)}
                      </td>

                      {/* 6. Order Financial Progress Column (Progress Bar + Hover Popup) */}
                      <td className="py-3 px-3 align-top">
                        <FinancialProgressBar
                          order={item}
                          onCreateChildBilling={onOpenCreateChildBillingModal}
                          onUpdateInstallmentStatus={onUpdateInstallmentStatus}
                          onDeleteInstallment={onDeleteInstallment}
                        />
                      </td>

                      {/* 7. Direct Child Billing Action Button */}
                      <td className="py-3.5 px-4 align-top text-center">
                        {progress.remainingBalance > 0 ? (
                          <button
                            onClick={() => onOpenCreateChildBillingModal(item)}
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer w-full whitespace-nowrap transition-all transform hover:scale-[1.02]"
                          >
                            <i className="fa-solid fa-plus-circle"></i>
                            <span>+ ออกงวดย่อย</span>
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl inline-flex items-center gap-1">
                            <i className="fa-solid fa-circle-check text-emerald-600"></i>
                            <span>วางบิลครบ 100%</span>
                          </span>
                        )}
                        <div className="text-[10px] text-slate-500 mt-1">
                          {progress.remainingBalance > 0 ? (
                            <span className="text-amber-700">
                              เหลือ ฿{formatNumber(progress.remainingBalance)}
                            </span>
                          ) : (
                            <span className="text-emerald-600">ครบสัญญาแล้ว</span>
                          )}
                        </div>
                      </td>

                      {/* 8. Manage */}
                      <td className="py-3.5 px-4 align-top text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => onOpenSoModal(item)}
                            title="แก้ไข SO"
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            onClick={() => onViewDetail(item)}
                            title="ดูรายละเอียด Lifecycle"
                            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                          >
                            <i className="fa-solid fa-eye"></i>
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

      {/* Google Sheets Modal */}
      {showSheetsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-scaleUp">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center text-xl shadow-2xs">
                  <i className="fa-solid fa-file-excel"></i>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    จัดเก็บข้อมูล Order Tracking ลง Google Sheet
                  </h3>
                  <p className="text-xs text-slate-500">
                    ส่งออกและอัปเดตข้อมูลตารางติดตามการเงินไปยัง Google Sheets
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSheetsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            {/* Google Auth Status */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                บัญชี Google สำหรับบันทึกข้อมูล
              </p>
              {googleUser ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {googleUser.photoURL ? (
                      <img
                        src={googleUser.photoURL}
                        alt="Profile"
                        className="w-8 h-8 rounded-full border border-slate-300"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                        {googleUser.email?.charAt(0).toUpperCase() || 'G'}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {googleUser.displayName || 'Google User'}
                      </p>
                      <p className="text-[11px] text-slate-500">{googleUser.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogoutGoogle}
                    className="text-xs text-slate-500 hover:text-red-600 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-red-200 bg-white cursor-pointer transition-all"
                  >
                    เปลี่ยนบัญชี
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-600">
                    กรุณาลงชื่อเข้าใช้ Google เพื่อสิทธิ์ในการสร้างหรือแก้ไขไฟล์ใน Google Drive ของคุณ
                  </p>
                  <button
                    onClick={handleLoginGoogle}
                    disabled={isLoggingIn}
                    className="w-full inline-flex items-center justify-center gap-2.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-xs py-2.5 px-4 rounded-xl shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    </svg>
                    <span>{isLoggingIn ? 'กำลังเชื่อมต่อ Google...' : 'Sign in with Google'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Export Mode Selection */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-700 block">
                เลือกรูปแบบการบันทึกข้อมูล
              </label>

              <div className="grid grid-cols-1 gap-2">
                <label
                  onClick={() => setExportMode('NEW')}
                  className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                    exportMode === 'NEW'
                      ? 'border-emerald-500 bg-emerald-50/50 text-slate-900 ring-1 ring-emerald-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="exportMode"
                    checked={exportMode === 'NEW'}
                    onChange={() => setExportMode('NEW')}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <p className="text-xs font-bold">สร้าง Google Sheet ใหม่ฉบับสมบูรณ์</p>
                    <p className="text-[11px] text-slate-500">
                      ระบบจะสร้างไฟล์ Google Sheet ใหม่ใน Google Drive ของคุณโดยอัตโนมัติ
                    </p>
                  </div>
                </label>

                <label
                  onClick={() => setExportMode('EXISTING')}
                  className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                    exportMode === 'EXISTING'
                      ? 'border-emerald-500 bg-emerald-50/50 text-slate-900 ring-1 ring-emerald-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="exportMode"
                    checked={exportMode === 'EXISTING'}
                    onChange={() => setExportMode('EXISTING')}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <p className="text-xs font-bold">อัปเดตทับลง Google Sheet เดิมที่มีอยู่</p>
                    <p className="text-[11px] text-slate-500">
                      เขียนข้อมูลทับลงใน Google Sheet เดิมที่คุณเปิดสิทธิ์การเข้าถึงไว้แล้ว
                    </p>
                  </div>
                </label>
              </div>

              {exportMode === 'EXISTING' && (
                <div className="pt-2">
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Spreadsheet ID หรือ Link ของ Google Sheet
                  </label>
                  <input
                    type="text"
                    value={existingSheetInput}
                    onChange={(e) => setExistingSheetInput(e.target.value)}
                    placeholder="วาง URL หรือ ID เช่น 1BxiMVs0XRA5nFMdKbB..."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Export Summary */}
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200/70 flex items-center justify-between text-xs text-amber-900">
              <span className="flex items-center gap-1.5 font-medium">
                <i className="fa-solid fa-circle-info text-amber-600"></i>
                <span>พร้อมส่งออกรายการ Order Tracking</span>
              </span>
              <span className="font-bold bg-amber-200/60 px-2 py-0.5 rounded-md font-mono">
                {trackingOrders.length} รายการ
              </span>
            </div>

            {/* Success Alert */}
            {exportResult && (
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 space-y-2 animate-fadeIn">
                <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                  <i className="fa-solid fa-circle-check text-emerald-600 text-sm"></i>
                  <span>บันทึกข้อมูลลง Google Sheet เรียบร้อยแล้ว! ({exportResult.totalExported} รายการ)</span>
                </div>
                <div className="pt-1">
                  <a
                    href={exportResult.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 rounded-lg shadow-2xs transition-all"
                  >
                    <span>เปิดดูตารางใน Google Sheets</span>
                    <i className="fa-solid fa-arrow-up-right-from-square"></i>
                  </a>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {errorMessage && (
              <div className="bg-red-50 p-3 rounded-xl border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation text-red-600"></i>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Dialog Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowSheetsModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                ปิด
              </button>
              <button
                onClick={handleConfirmExport}
                disabled={isExporting}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <i className="fa-solid fa-spinner animate-spin"></i>
                    <span>กำลังบันทึกลง Google Sheet...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-cloud-arrow-up"></i>
                    <span>ยืนยันบันทึกลง Google Sheet</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
