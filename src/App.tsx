import React, { useState, useEffect } from 'react';
import { QuotationOrder, PreQuotation, ChildBilling, QtStatus, PreQtStatus } from './types';
import {
  INITIAL_QUOTATION_ORDERS,
  INITIAL_PRE_QUOTATIONS,
  INITIAL_ISSUED_BY_LIST,
  INITIAL_SALES_LIST,
} from './data/initialData';

import { SidebarNav } from './components/SidebarNav';
import { DashboardTab } from './components/DashboardTab';
import { PreQuotationTab } from './components/PreQuotationTab';
import { QuotationsTab } from './components/QuotationsTab';
import { OrderTrackingTab } from './components/OrderTrackingTab';
import { BillingInvoicesTab } from './components/BillingInvoicesTab';

import {
  QtModal,
  SoModal,
  WoModal,
  PreQtModal,
  ConvertPreQtModal,
  AddNameModal,
  LifecycleModal,
} from './components/Modals';
import { CreateChildBillingModal } from './components/CreateChildBillingModal';

export default function App() {
  // Navigation: 0=Dashboard, 3=Pre-QT, 1=Quotation, 4=Order Tracking, 2=Billing
  const [activePage, setActivePage] = useState<number>(0);

  // Main Data States
  const [orders, setOrders] = useState<QuotationOrder[]>([]);
  const [preQuotations, setPreQuotations] = useState<PreQuotation[]>([]);
  const [issuedByList, setIssuedByList] = useState<string[]>(INITIAL_ISSUED_BY_LIST);
  const [salesList, setSalesList] = useState<string[]>(INITIAL_SALES_LIST);

  // Active Selected Records for Modals
  const [activeOrder, setActiveOrder] = useState<QuotationOrder | null>(null);
  const [activePreQt, setActivePreQt] = useState<PreQuotation | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Modal Visibility Flags
  const [qtModalOpen, setQtModalOpen] = useState(false);
  const [soModalOpen, setSoModalOpen] = useState(false);
  const [woModalOpen, setWoModalOpen] = useState(false);
  const [preQtModalOpen, setPreQtModalOpen] = useState(false);
  const [convertPreQtModalOpen, setConvertPreQtModalOpen] = useState(false);
  const [addNameModalOpen, setAddNameModalOpen] = useState(false);
  const [addNameType, setAddNameType] = useState<'issuedBy' | 'sales'>('issuedBy');
  const [createChildBillingModalOpen, setCreateChildBillingModalOpen] = useState(false);
  const [lifecycleModalOpen, setLifecycleModalOpen] = useState(false);

  // Initialize Data from LocalStorage
  useEffect(() => {
    const savedOrders = localStorage.getItem('sales_tracking_records');
    const savedPreQt = localStorage.getItem('sales_tracking_preqt');

    if (savedOrders && savedPreQt) {
      try {
        setOrders(JSON.parse(savedOrders));
        setPreQuotations(JSON.parse(savedPreQt));
      } catch (e) {
        initSampleData();
      }
    } else {
      initSampleData();
    }
  }, []);

  // Sync to LocalStorage on changes
  const saveToStorage = (updatedOrders: QuotationOrder[], updatedPreQt: PreQuotation[]) => {
    localStorage.setItem('sales_tracking_records', JSON.stringify(updatedOrders));
    localStorage.setItem('sales_tracking_preqt', JSON.stringify(updatedPreQt));
  };

  const updateOrders = (newOrders: QuotationOrder[]) => {
    setOrders(newOrders);
    saveToStorage(newOrders, preQuotations);
  };

  const updatePreQuotations = (newPreQt: PreQuotation[]) => {
    setPreQuotations(newPreQt);
    saveToStorage(orders, newPreQt);
  };

  const initSampleData = () => {
    setOrders(INITIAL_QUOTATION_ORDERS);
    setPreQuotations(INITIAL_PRE_QUOTATIONS);
    saveToStorage(INITIAL_QUOTATION_ORDERS, INITIAL_PRE_QUOTATIONS);
  };

  // --- Handlers for Child Billing (Installments / Child IVs) ---
  const handleOpenCreateChildBillingModal = (order: QuotationOrder) => {
    setActiveOrder(order);
    setCreateChildBillingModalOpen(true);
  };

  const handleSaveChildBilling = (
    orderId: string,
    newInstData: Omit<ChildBilling, 'id' | 'createdAt'>
  ) => {
    const newInst: ChildBilling = {
      ...newInstData,
      id: `inst-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const nextOrders = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          installments: [...(o.installments || []), newInst],
        };
      }
      return o;
    });

    updateOrders(nextOrders);
    setCreateChildBillingModalOpen(false);
    setActiveOrder(null);
  };

  const handleUpdateInstallmentStatus = (
    orderId: string,
    installmentId: string,
    newStatus: ChildBilling['status']
  ) => {
    const nextOrders = orders.map((o) => {
      if (o.id === orderId) {
        const updatedInstallments = (o.installments || []).map((inst) => {
          if (inst.id === installmentId) {
            return {
              ...inst,
              status: newStatus,
              paidDate: newStatus === 'PAID' ? new Date().toISOString().split('T')[0] : undefined,
            };
          }
          return inst;
        });
        return { ...o, installments: updatedInstallments };
      }
      return o;
    });

    updateOrders(nextOrders);
  };

  const handleDeleteInstallment = (orderId: string, installmentId: string) => {
    const nextOrders = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          installments: (o.installments || []).filter((i) => i.id !== installmentId),
        };
      }
      return o;
    });

    updateOrders(nextOrders);
  };

  // --- Handlers for Quotation Orders ---
  const handleOpenNewQtModal = () => {
    setIsEditing(false);
    setActiveOrder(null);
    setQtModalOpen(true);
  };

  const handleOpenEditQtModal = (order: QuotationOrder) => {
    setIsEditing(true);
    setActiveOrder(order);
    setQtModalOpen(true);
  };

  const handleSaveQt = (formData: Partial<QuotationOrder>) => {
    if (isEditing && activeOrder) {
      const nextOrders = orders.map((o) => (o.id === activeOrder.id ? { ...o, ...formData } : o));
      updateOrders(nextOrders);
    } else {
      const newRecord: QuotationOrder = {
        id: `qt-${Date.now()}`,
        qtNo: formData.qtNo || `QT2607-${orders.length + 1}`,
        qtDate: formData.qtDate || new Date().toISOString().split('T')[0],
        receivedInfoDate: formData.receivedInfoDate,
        submissionDueDate: formData.submissionDueDate,
        priceSentDate: formData.priceSentDate,
        customerName: formData.customerName || '',
        project: formData.project,
        issuedBy: formData.issuedBy || issuedByList[0],
        salesPerson: formData.salesPerson || salesList[0],
        createdBy: formData.salesPerson || salesList[0],
        description: formData.description || '',
        amount: formData.amount || 0,
        status: formData.status || 'IN_PROGRESS',
        installments: [],
      };
      updateOrders([newRecord, ...orders]);
    }
    setQtModalOpen(false);
    setActiveOrder(null);
  };

  const handleUpdateRecordStatus = (order: QuotationOrder, newStatus: QtStatus) => {
    const nextOrders = orders.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o));
    updateOrders(nextOrders);
  };

  const handleDeleteRecord = (order: QuotationOrder) => {
    if (confirm(`คุณต้องการลบใบเสนอราคา ${order.qtNo} ใช่หรือไม่?`)) {
      const nextOrders = orders.filter((o) => o.id !== order.id);
      updateOrders(nextOrders);
    }
  };

  // --- Handlers for SO & WO Modals ---
  const handleOpenSoModal = (order: QuotationOrder) => {
    setActiveOrder(order);
    setSoModalOpen(true);
  };

  const handleSaveSO = (orderId: string, soNo: string, soDate: string) => {
    const nextOrders = orders.map((o) => {
      if (o.id === orderId) {
        let newStatus = o.status;
        if (o.status === 'IN_PROGRESS' || o.status === 'FINAL') {
          newStatus = 'COMPLETED';
        }
        return { ...o, soNo, soDate, status: newStatus };
      }
      return o;
    });
    updateOrders(nextOrders);
    setSoModalOpen(false);
    setActiveOrder(null);
  };

  const handleOpenWoModal = (order: QuotationOrder) => {
    setActiveOrder(order);
    setWoModalOpen(true);
  };

  const handleSaveWO = (orderId: string, woNo: string, woDate: string) => {
    const nextOrders = orders.map((o) => (o.id === orderId ? { ...o, woNo, woDate } : o));
    updateOrders(nextOrders);
    setWoModalOpen(false);
    setActiveOrder(null);
  };

  // --- Handlers for Pre-Quotations ---
  const handleOpenPreQtModal = (preQt?: PreQuotation) => {
    if (preQt) {
      setIsEditing(true);
      setActivePreQt(preQt);
    } else {
      setIsEditing(false);
      setActivePreQt(null);
    }
    setPreQtModalOpen(true);
  };

  const handleSavePreQt = (formData: Partial<PreQuotation>) => {
    if (isEditing && activePreQt) {
      const nextPreQt = preQuotations.map((p) =>
        p.id === activePreQt.id ? { ...p, ...formData } : p
      );
      updatePreQuotations(nextPreQt);
    } else {
      const newPreQt: PreQuotation = {
        id: `pre-${Date.now()}`,
        preNo: formData.preNo || `PQT2607-${preQuotations.length + 1}`,
        receivedDate: formData.receivedDate || new Date().toISOString().split('T')[0],
        customerName: formData.customerName || '',
        project: formData.project,
        description: formData.description || '',
        estimatedAmount: formData.estimatedAmount || 0,
        submissionDueDate: formData.submissionDueDate,
        salesPerson: formData.salesPerson || salesList[0],
        issuedBy: formData.issuedBy || issuedByList[0],
        status: formData.status || 'IN_REVIEW',
      };
      updatePreQuotations([newPreQt, ...preQuotations]);
    }
    setPreQtModalOpen(false);
    setActivePreQt(null);
  };

  const handleOpenConvertPreQtModal = (preQt: PreQuotation) => {
    setActivePreQt(preQt);
    setConvertPreQtModalOpen(true);
  };

  const handleUpdatePreQtStatus = (preQtId: string, newStatus: PreQtStatus) => {
    const nextPreQt = preQuotations.map((p) =>
      p.id === preQtId ? { ...p, status: newStatus } : p
    );
    updatePreQuotations(nextPreQt);
  };

  const handleConvertPreQtToQt = (
    preQt: PreQuotation,
    qtNo: string,
    qtDate: string,
    amount: number
  ) => {
    const newQtRecord: QuotationOrder = {
      id: `qt-${Date.now()}`,
      qtNo,
      qtDate,
      receivedInfoDate: preQt.receivedDate,
      submissionDueDate: preQt.submissionDueDate,
      priceSentDate: qtDate,
      customerName: preQt.customerName,
      project: preQt.project,
      issuedBy: preQt.issuedBy || issuedByList[0],
      salesPerson: preQt.salesPerson || salesList[0],
      createdBy: preQt.salesPerson || salesList[0],
      description: preQt.description,
      amount,
      status: 'IN_PROGRESS',
      installments: [],
    };

    const nextPreQt = preQuotations.map((p) =>
      p.id === preQt.id ? { ...p, status: 'CONVERTED' as const, convertedQtNo: qtNo } : p
    );

    updateOrders([newQtRecord, ...orders]);
    updatePreQuotations(nextPreQt);
    setConvertPreQtModalOpen(false);
    setActivePreQt(null);
    setActivePage(1); // Jump to Quotations tab
  };

  const handleDeletePreQt = (preQt: PreQuotation) => {
    if (confirm(`ลบ Pre-QT ${preQt.preNo} ใช่หรือไม่?`)) {
      const nextPreQt = preQuotations.filter((p) => p.id !== preQt.id);
      updatePreQuotations(nextPreQt);
    }
  };

  // Name addition modal
  const handleOpenAddNameModal = (type: 'issuedBy' | 'sales') => {
    setAddNameType(type);
    setAddNameModalOpen(true);
  };

  const handleAddName = (name: string, type: 'issuedBy' | 'sales') => {
    if (type === 'issuedBy') {
      if (!issuedByList.includes(name)) setIssuedByList([...issuedByList, name]);
    } else {
      if (!salesList.includes(name)) setSalesList([...salesList, name]);
    }
    setAddNameModalOpen(false);
  };

  const handleViewDetail = (order: QuotationOrder) => {
    setActiveOrder(order);
    setLifecycleModalOpen(true);
  };

  // Count total billing installments across all orders
  const totalInstallmentsCount = orders.reduce(
    (sum, o) => sum + (o.installments?.length || 0),
    0
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-800">
      {/* Sidebar Navigation */}
      <SidebarNav
        activePage={activePage}
        setActivePage={setActivePage}
        preQtCount={preQuotations.length}
        qtCount={orders.length}
        orderTrackingCount={orders.filter((o) => o.soNo || o.woNo || o.status === 'COMPLETED').length}
        billingCount={totalInstallmentsCount}
        onOpenPreQtModal={() => handleOpenPreQtModal()}
        onOpenNewQtModal={handleOpenNewQtModal}
        onResetSampleData={initSampleData}
      />

      {/* Main Content View */}
      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 overflow-x-hidden">
          {/* Page 0: Dashboard */}
          {activePage === 0 && (
            <DashboardTab
              orders={orders}
              onOpenSoModal={handleOpenSoModal}
              onOpenWoModal={handleOpenWoModal}
              onOpenCreateChildBillingModal={handleOpenCreateChildBillingModal}
              onGoToTab={setActivePage}
            />
          )}

          {/* Page 3: Pre-Quotation */}
          {activePage === 3 && (
            <PreQuotationTab
              preQuotations={preQuotations}
              onOpenPreQtModal={handleOpenPreQtModal}
              onOpenConvertModal={handleOpenConvertPreQtModal}
              onUpdatePreQtStatus={handleUpdatePreQtStatus}
              onDeletePreQt={handleDeletePreQt}
              onGoToQuotation={() => setActivePage(1)}
            />
          )}

          {/* Page 1: Quotations */}
          {activePage === 1 && (
            <QuotationsTab
              orders={orders}
              onOpenNewQtModal={handleOpenNewQtModal}
              onOpenEditQtModal={handleOpenEditQtModal}
              onOpenSoModal={handleOpenSoModal}
              onOpenCreateChildBillingModal={handleOpenCreateChildBillingModal}
              onUpdateRecordStatus={handleUpdateRecordStatus}
              onDeleteRecord={handleDeleteRecord}
              onViewDetail={handleViewDetail}
              onUpdateInstallmentStatus={handleUpdateInstallmentStatus}
              onDeleteInstallment={handleDeleteInstallment}
            />
          )}

          {/* Page 4: Order Tracking (Financial Control Center for Child Billings) */}
          {activePage === 4 && (
            <OrderTrackingTab
              orders={orders}
              onOpenSoModal={handleOpenSoModal}
              onOpenWoModal={handleOpenWoModal}
              onOpenCreateChildBillingModal={handleOpenCreateChildBillingModal}
              onUpdateInstallmentStatus={handleUpdateInstallmentStatus}
              onDeleteInstallment={handleDeleteInstallment}
              onViewDetail={handleViewDetail}
            />
          )}

          {/* Page 2: Billing & Invoices (Child Invoices Master List) */}
          {activePage === 2 && (
            <BillingInvoicesTab
              orders={orders}
              onOpenCreateChildBillingModal={handleOpenCreateChildBillingModal}
              onUpdateInstallmentStatus={handleUpdateInstallmentStatus}
              onDeleteInstallment={handleDeleteInstallment}
              onViewDetail={handleViewDetail}
            />
          )}
        </main>
      </div>

      {/* --- ALL MODALS --- */}
      {/* 1. QT Modal */}
      <QtModal
        isOpen={qtModalOpen}
        isEditing={isEditing}
        order={activeOrder}
        issuedByList={issuedByList}
        salesList={salesList}
        onClose={() => setQtModalOpen(false)}
        onSave={handleSaveQt}
        onAddName={handleOpenAddNameModal}
      />

      {/* 2. SO Convert Modal */}
      <SoModal
        isOpen={soModalOpen}
        order={activeOrder}
        onClose={() => setSoModalOpen(false)}
        onSave={handleSaveSO}
      />

      {/* 3. WO/PO Record Modal */}
      <WoModal
        isOpen={woModalOpen}
        order={activeOrder}
        onClose={() => setWoModalOpen(false)}
        onSave={handleSaveWO}
      />

      {/* 4. Pre-QT Modal */}
      <PreQtModal
        isOpen={preQtModalOpen}
        isEditing={isEditing}
        preQt={activePreQt}
        issuedByList={issuedByList}
        salesList={salesList}
        onClose={() => setPreQtModalOpen(false)}
        onSave={handleSavePreQt}
      />

      {/* 5. Convert Pre-QT Modal */}
      <ConvertPreQtModal
        isOpen={convertPreQtModalOpen}
        preQt={activePreQt}
        onClose={() => setConvertPreQtModalOpen(false)}
        onConvert={handleConvertPreQtToQt}
      />

      {/* 6. Add Name Modal */}
      <AddNameModal
        isOpen={addNameModalOpen}
        type={addNameType}
        onClose={() => setAddNameModalOpen(false)}
        onAdd={handleAddName}
      />

      {/* 7. Create Child Billing Installment Modal (Core Feature!) */}
      {createChildBillingModalOpen && activeOrder && (
        <CreateChildBillingModal
          order={activeOrder}
          onClose={() => {
            setCreateChildBillingModalOpen(false);
            setActiveOrder(null);
          }}
          onSaveInstallment={handleSaveChildBilling}
        />
      )}

      {/* 8. Lifecycle / Document History Modal */}
      <LifecycleModal
        isOpen={lifecycleModalOpen}
        order={activeOrder}
        onClose={() => setLifecycleModalOpen(false)}
        onCreateChildBilling={handleOpenCreateChildBillingModal}
      />
    </div>
  );
}
