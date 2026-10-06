import React, { useState, useEffect, useMemo } from 'react';
import { 
  Product, 
  Invoice, 
  ShopSettings, 
  Language 
} from './types';
import { 
  loadProducts, 
  saveProducts, 
  loadInvoices, 
  saveInvoices, 
  loadSettings, 
  saveSettings 
} from './utils/storage';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { PosBilling } from './components/PosBilling';
import { InventoryManager } from './components/InventoryManager';
import { QuotationsManager } from './components/QuotationsManager';
import { BillsHistory } from './components/BillsHistory';
import { InvoicePrintModal } from './components/InvoicePrintModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [products, setProducts] = useState<Product[]>(() => loadProducts());
  const [invoices, setInvoices] = useState<Invoice[]>(() => loadInvoices());
  const [settings, setSettings] = useState<ShopSettings>(() => loadSettings());
  
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'pos' | 'inventory' | 'quotations' | 'history'>('pos');
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('vetri_pos_language_v1') as Language) || 'ta';
  });
  const [hideProfit, setHideProfit] = useState<boolean>(() => {
    return localStorage.getItem('vetri_pos_hide_profit_v1') === 'true';
  });

  const [activePrintInvoice, setActivePrintInvoice] = useState<Invoice | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Sync products to localStorage
  const handleUpdateProducts = (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
    saveProducts(updatedProducts);
  };

  // Sync invoices to localStorage
  const handleSaveInvoice = (newInvoice: Invoice) => {
    const updated = [newInvoice, ...invoices];
    setInvoices(updated);
    saveInvoices(updated);
  };

  const handleUpdateInvoice = (updatedInvoice: Invoice) => {
    const updated = invoices.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv);
    setInvoices(updated);
    saveInvoices(updated);
  };

  // Sync settings
  const handleSaveSettings = (newSettings: ShopSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Language toggle
  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('vetri_pos_language_v1', newLang);
  };

  // Hide profit toggle
  const handleSetHideProfit = (hide: boolean) => {
    setHideProfit(hide);
    localStorage.setItem('vetri_pos_hide_profit_v1', hide ? 'true' : 'false');
  };

  // Reset to initial demo data
  const handleResetData = () => {
    setProducts(loadProducts());
    setInvoices(loadInvoices());
    setSettings(loadSettings());
  };

  // Convert to Cash Bill from Print modal
  const handleConvertToBillFromPrint = (quote: Invoice) => {
    // Deduct stock in inventory
    const updatedProducts = products.map(prod => {
      const billed = quote.items.find(it => it.productId === prod.id);
      if (billed) {
        return {
          ...prod,
          currentStock: Math.max(0, prod.currentStock - billed.quantity),
          updatedAt: new Date().toISOString(),
        };
      }
      return prod;
    });

    const newCashBill: Invoice = {
      id: `inv-${Date.now()}`,
      billNumber: `CB-${new Date().getFullYear()}-${String(invoices.filter(i => i.type === 'cash_bill').length + 1).padStart(4, '0')}`,
      type: 'cash_bill',
      status: 'paid',
      convertedFromQuotationId: quote.id,
      createdAt: new Date().toISOString(),
      customer: { ...quote.customer },
      items: [...quote.items],
      subtotal: quote.subtotal,
      totalDiscount: quote.totalDiscount,
      taxTotal: quote.taxTotal,
      roundOff: quote.roundOff,
      grandTotal: quote.grandTotal,
      totalPurchaseCost: quote.totalPurchaseCost,
      netProfit: quote.netProfit,
      paymentMode: 'cash',
      notes: `Converted from Quotation ${quote.billNumber}`,
    };

    const updatedQuotation: Invoice = {
      ...quote,
      status: 'converted',
      convertedToBillId: newCashBill.id,
    };

    handleUpdateProducts(updatedProducts);
    handleUpdateInvoice(updatedQuotation);
    handleSaveInvoice(newCashBill);
    setActivePrintInvoice(newCashBill);
  };

  // Count low stock items for header badge
  const lowStockCount = useMemo(() => {
    return products.filter(p => p.currentStock <= p.minStockAlert).length;
  }, [products]);

  // Global Keyboard shortcuts for fast counter POS navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setCurrentTab('dashboard');
      } else if (e.key === 'F2') {
        e.preventDefault();
        setCurrentTab('pos');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setCurrentTab('inventory');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setCurrentTab('quotations');
      } else if (e.key === 'F8') {
        e.preventDefault();
        setCurrentTab('history');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Top Bar Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        lang={lang}
        setLang={handleSetLang}
        hideProfit={hideProfit}
        setHideProfit={handleSetHideProfit}
        onOpenSettings={() => setShowSettingsModal(true)}
        settings={settings}
        lowStockCount={lowStockCount}
      />

      {/* Main Tab Content */}
      <main className="flex-1 pb-12">
        {currentTab === 'dashboard' && (
          <Dashboard
            products={products}
            invoices={invoices}
            settings={settings}
            lang={lang}
            hideProfit={hideProfit}
            onNavigate={setCurrentTab}
            onOpenPrintModal={setActivePrintInvoice}
          />
        )}

        {currentTab === 'pos' && (
          <PosBilling
            products={products}
            invoices={invoices}
            settings={settings}
            lang={lang}
            hideProfit={hideProfit}
            onSaveInvoice={handleSaveInvoice}
            onUpdateProducts={handleUpdateProducts}
            onOpenPrintModal={setActivePrintInvoice}
          />
        )}

        {currentTab === 'inventory' && (
          <InventoryManager
            products={products}
            settings={settings}
            lang={lang}
            hideProfit={hideProfit}
            onUpdateProducts={handleUpdateProducts}
          />
        )}

        {currentTab === 'quotations' && (
          <QuotationsManager
            invoices={invoices}
            products={products}
            settings={settings}
            lang={lang}
            onSaveInvoice={handleSaveInvoice}
            onUpdateInvoice={handleUpdateInvoice}
            onUpdateProducts={handleUpdateProducts}
            onOpenPrintModal={setActivePrintInvoice}
            onNavigateToPOS={() => setCurrentTab('pos')}
          />
        )}

        {currentTab === 'history' && (
          <BillsHistory
            invoices={invoices}
            settings={settings}
            lang={lang}
            hideProfit={hideProfit}
            onOpenPrintModal={setActivePrintInvoice}
          />
        )}
      </main>

      {/* Printable Invoice Modal (A4 or Thermal Receipt) */}
      {activePrintInvoice && (
        <InvoicePrintModal
          invoice={activePrintInvoice}
          settings={settings}
          lang={lang}
          onClose={() => setActivePrintInvoice(null)}
          onConvertToBill={handleConvertToBillFromPrint}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          settings={settings}
          lang={lang}
          products={products}
          invoices={invoices}
          onSaveSettings={handleSaveSettings}
          onResetData={handleResetData}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* Counter Quick Shortcut Bar at Bottom */}
      <footer className="border-t border-neutral-900 bg-neutral-950/80 px-4 py-2 text-[11px] text-neutral-400 flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <span>{settings.shopName}</span>
          <span>·</span>
          <span>Ph: {settings.phone}</span>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <span><kbd className="px-1 py-0.5 bg-neutral-900 border border-neutral-800 rounded font-mono">F2</kbd> {lang === 'ta' ? 'புதிய பில்' : 'POS Bill'}</span>
          <span><kbd className="px-1 py-0.5 bg-neutral-900 border border-neutral-800 rounded font-mono">F3</kbd> {lang === 'ta' ? 'சரக்கு' : 'Stock'}</span>
          <span><kbd className="px-1 py-0.5 bg-neutral-900 border border-neutral-800 rounded font-mono">F4</kbd> {lang === 'ta' ? 'விலைப்புள்ளிகள்' : 'Quotations'}</span>
          <span><kbd className="px-1 py-0.5 bg-neutral-900 border border-neutral-800 rounded font-mono">/</kbd> {lang === 'ta' ? 'விரைவு தேடல்' : 'Quick Search'}</span>
        </div>
      </footer>
    </div>
  );
}
