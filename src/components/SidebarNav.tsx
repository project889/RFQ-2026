import React, { useState } from 'react';

interface SidebarNavProps {
  activePage: number; // 0=Dashboard, 3=Pre-QT, 1=Quotation, 4=Order Tracking, 2=Billing
  setActivePage: (page: number) => void;
  preQtCount: number;
  qtCount: number;
  orderTrackingCount: number;
  billingCount: number;
  onOpenPreQtModal: () => void;
  onOpenNewQtModal: () => void;
  onResetSampleData: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activePage,
  setActivePage,
  preQtCount,
  qtCount,
  orderTrackingCount,
  billingCount,
  onOpenPreQtModal,
  onOpenNewQtModal,
  onResetSampleData,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    {
      id: 0,
      label: 'Dashboard',
      icon: 'fa-solid fa-chart-pie',
      count: null,
      activeColor: 'bg-indigo-600 text-white',
      hoverColor: 'hover:bg-slate-800 text-slate-300',
    },
    {
      id: 3,
      label: 'Pre-Quotation',
      icon: 'fa-solid fa-clipboard-list',
      count: preQtCount,
      activeColor: 'bg-amber-600 text-white',
      hoverColor: 'hover:bg-slate-800 text-slate-300',
    },
    {
      id: 1,
      label: 'Quotation',
      icon: 'fa-solid fa-file-signature',
      count: qtCount,
      activeColor: 'bg-blue-600 text-white',
      hoverColor: 'hover:bg-slate-800 text-slate-300',
    },
    {
      id: 4,
      label: 'Order Tracking',
      icon: 'fa-solid fa-boxes-packing',
      count: orderTrackingCount,
      activeColor: 'bg-amber-700 text-white',
      hoverColor: 'hover:bg-slate-800 text-slate-300',
    },
    {
      id: 2,
      label: 'Billing & Invoices',
      icon: 'fa-solid fa-receipt',
      count: billingCount,
      activeColor: 'bg-emerald-600 text-white',
      hoverColor: 'hover:bg-slate-800 text-slate-300',
    },
  ];

  const handleNavClick = (id: number) => {
    setActivePage(id);
    setMobileOpen(false);
  };

  const activeTitle = navItems.find((item) => item.id === activePage)?.label || 'Dashboard';

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden bg-slate-900 text-white px-4 py-3 flex justify-between items-center sticky top-0 z-40 border-b border-slate-800 shadow-md">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
            aria-label="Toggle menu"
          >
            <i className="fa-solid fa-bars text-xl"></i>
          </button>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-amber-600 rounded-lg text-white">
              <i className="fa-solid fa-file-invoice-dollar text-base"></i>
            </div>
            <span className="font-bold text-sm tracking-wide">Sales Tracking</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {activePage === 3 && (
            <button
              onClick={onOpenPreQtModal}
              className="bg-amber-600 hover:bg-amber-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <i className="fa-solid fa-plus"></i>
              <span>Pre-QT</span>
            </button>
          )}
          {activePage === 1 && (
            <button
              onClick={onOpenNewQtModal}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <i className="fa-solid fa-plus"></i>
              <span>QT ใหม่</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container (Desktop Sidebar & Mobile Drawer) */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-slate-900 text-white flex flex-col justify-between border-r border-slate-800 transition-transform duration-300 ease-in-out shrink-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Upper Part: Branding & Navigation */}
        <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar">
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-amber-600 rounded-xl shadow-md text-white flex items-center justify-center shrink-0">
                <i className="fa-solid fa-file-invoice-dollar text-xl"></i>
              </div>
              <div>
                <h1 className="text-sm font-bold leading-tight text-slate-100">
                  ระบบติดตามงานขาย
                </h1>
                <p className="text-[11px] text-slate-400 mt-0.5">Pre-QT / QT / SO / WO / IV</p>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden text-slate-400 hover:text-white cursor-pointer"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          {/* Navigation Section */}
          <div className="p-3 space-y-1">
            <div className="px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              เมนูหลัก (Navigation)
            </div>

            {navItems.map((item) => {
              const isActive = activePage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-between cursor-pointer ${
                    isActive ? `${item.activeColor} shadow-md` : item.hoverColor
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <i className={`${item.icon} text-base w-5 text-center`}></i>
                    <span>{item.label}</span>
                  </div>

                  {item.count !== null && (
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-mono ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lower Part: Actions & Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 space-y-2">
          {activePage === 3 && (
            <button
              onClick={onOpenPreQtModal}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white py-2.5 px-3 rounded-xl font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <i className="fa-solid fa-circle-plus"></i>
              <span>+ บันทึก Pre-Quotation</span>
            </button>
          )}

          {activePage === 1 && (
            <button
              onClick={onOpenNewQtModal}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-3 rounded-xl font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <i className="fa-solid fa-circle-plus"></i>
              <span>+ ออกใบเสนอราคาใหม่</span>
            </button>
          )}

          <button
            onClick={onResetSampleData}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 py-2 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            title="รีเซ็ตเป็นข้อมูลตัวอย่าง"
          >
            <i className="fa-solid fa-rotate-right"></i>
            <span>คืนค่าข้อมูลตัวอย่าง</span>
          </button>
        </div>
      </aside>

    </>
  );
};
