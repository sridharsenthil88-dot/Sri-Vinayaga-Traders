import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Printer, 
  Share2, 
  CheckCircle2, 
  Calendar, 
  User, 
  ArrowRight, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { Invoice, Product, PaymentMode, Language, ShopSettings } from '../types';
import { getNextBillNumber, formatCurrency } from '../utils/storage';
import { getTranslation } from '../utils/translations';

interface QuotationsManagerProps {
  invoices: Invoice[];
  products: Product[];
  settings: ShopSettings;
  lang: Language;
  onSaveInvoice: (invoice: Invoice) => void;
  onUpdateInvoice: (invoice: Invoice) => void;
  onUpdateProducts: (products: Product[]) => void;
  onOpenPrintModal: (invoice: Invoice) => void;
  onNavigateToPOS: () => void;
}

export const QuotationsManager: React.FC<QuotationsManagerProps> = ({
  invoices,
  products,
  settings,
  lang,
  onSaveInvoice,
  onUpdateInvoice,
  onUpdateProducts,
  onOpenPrintModal,
  onNavigateToPOS,
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'converted'>('all');
  
  // Convert to Bill dialog state
  const [targetQuoteToConvert, setTargetQuoteToConvert] = useState<Invoice | null>(null);
  const [convertPaymentMode, setConvertPaymentMode] = useState<PaymentMode>('cash');
  const [stockCheckWarnings, setStockCheckWarnings] = useState<string[]>([]);

  // Filter quotations
  const quotations = useMemo(() => {
    return invoices.filter(inv => inv.type === 'quotation');
  }, [invoices]);

  const filteredQuotations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return quotations.filter(inv => {
      if (filterStatus === 'pending' && inv.status !== 'pending') return false;
      if (filterStatus === 'converted' && inv.status !== 'converted') return false;

      if (!q) return true;
      return (
        inv.billNumber.toLowerCase().includes(q) ||
        inv.customer.name.toLowerCase().includes(q) ||
        (inv.customer.phone && inv.customer.phone.includes(q))
      );
    });
  }, [quotations, searchQuery, filterStatus]);

  // Initiate Convert to Cash Bill
  const handleInitiateConvert = (quote: Invoice) => {
    // Check if sufficient stock exists for all items
    const warnings: string[] = [];
    quote.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (!prod) {
        warnings.push(lang === 'ta' ? `"${item.name}" என்ற பொருள் சரக்கு பட்டியலில் இல்லை.` : `Item "${item.name}" no longer exists in inventory.`);
      } else if (prod.currentStock < item.quantity) {
        warnings.push(
          lang === 'ta'
            ? `"${item.name}" பொருளுக்கு போதிய இருப்பு இல்லை: ${item.quantity} ${item.unit} தேவை, ${prod.currentStock} மட்டுமே உள்ளது.`
            : `Insufficient stock for "${item.name}": Required ${item.quantity} ${item.unit}, but only ${prod.currentStock} in stock.`
        );
      }
    });

    setStockCheckWarnings(warnings);
    setTargetQuoteToConvert(quote);
    setConvertPaymentMode('cash');
  };

  // Execute conversion from Quotation to Cash Bill
  const handleConfirmConvert = () => {
    if (!targetQuoteToConvert) return;

    const newBillNumber = getNextBillNumber('cash_bill', invoices);

    // Create new confirmed Cash Bill
    const newCashBill: Invoice = {
      id: `inv-${Date.now()}`,
      billNumber: newBillNumber,
      type: 'cash_bill',
      status: 'paid',
      convertedFromQuotationId: targetQuoteToConvert.id,
      createdAt: new Date().toISOString(),
      customer: { ...targetQuoteToConvert.customer },
      items: [...targetQuoteToConvert.items],
      subtotal: targetQuoteToConvert.subtotal,
      totalDiscount: targetQuoteToConvert.totalDiscount,
      taxTotal: targetQuoteToConvert.taxTotal,
      roundOff: targetQuoteToConvert.roundOff,
      grandTotal: targetQuoteToConvert.grandTotal,
      totalPurchaseCost: targetQuoteToConvert.totalPurchaseCost,
      netProfit: targetQuoteToConvert.netProfit,
      paymentMode: convertPaymentMode,
      notes: `Converted from Quotation ${targetQuoteToConvert.billNumber}. ${targetQuoteToConvert.notes || ''}`,
    };

    // Deduct stock in inventory
    const updatedProducts = products.map(prod => {
      const billed = targetQuoteToConvert.items.find(it => it.productId === prod.id);
      if (billed) {
        return {
          ...prod,
          currentStock: Math.max(0, prod.currentStock - billed.quantity),
          updatedAt: new Date().toISOString(),
        };
      }
      return prod;
    });

    // Update target quotation status
    const updatedQuotation: Invoice = {
      ...targetQuoteToConvert,
      status: 'converted',
      convertedToBillId: newCashBill.id,
    };

    onUpdateProducts(updatedProducts);
    onUpdateInvoice(updatedQuotation);
    onSaveInvoice(newCashBill);
    setTargetQuoteToConvert(null);

    // Open print modal for the newly converted cash bill!
    onOpenPrintModal(newCashBill);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4">
      {/* Top Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-500" />
            <span>{t('quotationList')}</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            {t('quotationDescription')}
          </p>
        </div>

        <button
          onClick={onNavigateToPOS}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-lg transition-colors shadow-sm shrink-0"
        >
          <span>+ {t('createQuotation')}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('searchQuotesPlaceholder')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              filterStatus === 'all' ? 'bg-neutral-800 text-white font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            {t('allQuotes')} ({quotations.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              filterStatus === 'pending' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            {t('activeEstimate')}
          </button>
          <button
            onClick={() => setFilterStatus('converted')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              filterStatus === 'converted' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            {t('converted')}
          </button>
        </div>
      </div>

      {/* Quotations List */}
      <div className="space-y-3">
        {filteredQuotations.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2">
            <FileSpreadsheet className="w-8 h-8 mx-auto text-neutral-600" />
            <p className="text-xs">{t('noQuotes')}</p>
          </div>
        ) : (
          filteredQuotations.map(quote => (
            <div
              key={quote.id}
              className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-sm hover:border-neutral-700 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    {quote.billNumber}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    quote.status === 'converted'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}>
                    {quote.status === 'converted' ? '✓ ' + t('converted') : '⏳ ' + t('activeEstimate')}
                  </span>
                  <span className="text-xs text-neutral-400 flex items-center gap-1 font-mono-numbers">
                    <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                    {new Date(quote.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Convert to Cash Bill button (if not already converted) */}
                  {quote.status !== 'converted' ? (
                    <button
                      onClick={() => handleInitiateConvert(quote)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{t('convertToCashBill')}</span>
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 font-medium">
                      {t('billedToCustomer')} ✓
                    </span>
                  )}

                  {/* Print Quote */}
                  <button
                    onClick={() => onOpenPrintModal(quote)}
                    className="p-1.5 text-neutral-300 hover:text-white rounded-lg hover:bg-neutral-800 border border-neutral-800 transition-colors"
                    title={t('printQuotation')}
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Customer & Amount details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-neutral-400 block text-[11px]">{t('clientParty')}:</span>
                  <span className="font-bold text-white text-sm block mt-0.5">
                    {quote.customer.name}
                  </span>
                  <span className="text-neutral-400 font-mono-numbers">
                    {quote.customer.phone || (lang === 'ta' ? 'தொலைபேசி இல்லை' : 'No phone')} · {t(quote.customer.type)} ({quote.customer.discountPercent}% {lang === 'ta' ? 'தள்ளுபடி' : 'Off'})
                  </span>
                </div>

                <div>
                  <span className="text-neutral-400 block text-[11px]">{t('itemsQuoted')} ({quote.items.length}):</span>
                  <div className="text-neutral-300 text-[11px] truncate mt-0.5">
                    {quote.items.map(it => `${it.quantity} ${it.unit} ${it.name}`).join(', ')}
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className="text-neutral-400 block text-[11px]">{t('quotedTotal')}:</span>
                  <span className="text-lg font-black text-amber-400 font-mono-numbers block mt-0.5">
                    ₹{quote.grandTotal.toFixed(2)}
                  </span>
                  {quote.totalDiscount > 0 && (
                    <span className="text-[11px] text-emerald-400 font-mono-numbers">
                      ₹{quote.totalDiscount.toFixed(2)} {t('specialDiscount')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ===================== CONVERT TO CASH BILL MODAL ===================== */}
      {targetQuoteToConvert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>{t('convertQuoteTitle')}</span>
                </h3>
                <p className="text-xs text-neutral-400">
                  Quote: {targetQuoteToConvert.billNumber} · Customer: {targetQuoteToConvert.customer.name}
                </p>
              </div>
              <button
                onClick={() => setTargetQuoteToConvert(null)}
                className="text-neutral-400 hover:text-white p-1 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Warnings if low stock */}
              {stockCheckWarnings.length > 0 && (
                <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <AlertCircle className="w-4 h-4" />
                    <span>{t('inventoryWarning')}:</span>
                  </div>
                  {stockCheckWarnings.map((w, idx) => (
                    <p key={idx} className="text-amber-200 text-[11px] leading-tight pl-5">
                      • {w}
                    </p>
                  ))}
                  <p className="text-[10px] text-amber-400 pt-1">
                    {t('proceedUpdateStock')}
                  </p>
                </div>
              )}

              {/* Amount summary */}
              <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-neutral-400 block">{t('totalBillAmount')}</span>
                  <span className="text-2xl font-black text-amber-400 font-mono-numbers">
                    ₹{targetQuoteToConvert.grandTotal.toFixed(2)}
                  </span>
                </div>
                <div className="text-right text-xs text-neutral-400">
                  <div>{t('items')}: {targetQuoteToConvert.items.length}</div>
                  <div>{t('tier')}: {t(targetQuoteToConvert.customer.type)}</div>
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                  {t('selectPaymentMode')} *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setConvertPaymentMode('cash')}
                    className={`p-2.5 rounded-lg border text-xs font-bold text-center transition-all ${
                      convertPaymentMode === 'cash'
                        ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-sm'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                    }`}
                  >
                    💵 {t('cash')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConvertPaymentMode('upi')}
                    className={`p-2.5 rounded-lg border text-xs font-bold text-center transition-all ${
                      convertPaymentMode === 'upi'
                        ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-sm'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                    }`}
                  >
                    📱 {t('upi')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConvertPaymentMode('card')}
                    className={`p-2.5 rounded-lg border text-xs font-bold text-center transition-all ${
                      convertPaymentMode === 'card'
                        ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-sm'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                    }`}
                  >
                    💳 {t('card')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConvertPaymentMode('credit')}
                    className={`p-2.5 rounded-lg border text-xs font-bold text-center transition-all ${
                      convertPaymentMode === 'credit'
                        ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                    }`}
                  >
                    📝 {t('credit')}
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-neutral-400 p-2.5 bg-neutral-950 rounded-lg border border-neutral-800 leading-relaxed">
                ℹ {t('conversionNotice')}
              </div>

              {/* Action buttons */}
              <div className="pt-2 border-t border-neutral-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTargetQuoteToConvert(null)}
                  className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
                >
                  {t('cancel')}
                </button>

                <button
                  type="button"
                  onClick={handleConfirmConvert}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs rounded-xl transition-colors shadow-sm"
                >
                  {t('confirmGenerateBill')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
