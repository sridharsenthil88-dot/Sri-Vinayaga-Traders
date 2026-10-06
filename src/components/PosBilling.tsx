import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Printer, 
  Share2, 
  Check, 
  RotateCcw, 
  Zap, 
  Tag, 
  Users, 
  Percent, 
  IndianRupee,
  Layers,
  ArrowRightLeft,
  Info
} from 'lucide-react';
import { 
  Product, 
  BillItem, 
  Invoice, 
  CustomerType, 
  BillType, 
  PaymentMode, 
  ShopSettings, 
  Language, 
  CustomerInfo 
} from '../types';
import { 
  getNextBillNumber, 
  getTierDiscount, 
  formatCurrency 
} from '../utils/storage';
import { getTranslation } from '../utils/translations';

interface PosBillingProps {
  products: Product[];
  invoices: Invoice[];
  settings: ShopSettings;
  lang: Language;
  hideProfit: boolean;
  onSaveInvoice: (invoice: Invoice) => void;
  onUpdateProducts: (products: Product[]) => void;
  onOpenPrintModal: (invoice: Invoice) => void;
}

export const PosBilling: React.FC<PosBillingProps> = ({
  products,
  invoices,
  settings,
  lang,
  hideProfit,
  onSaveInvoice,
  onUpdateProducts,
  onOpenPrintModal,
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key);
  const categoryLabel = (category: string) => {
    if (category === 'All') return t('allCategories');
    const categoryKeys: Record<string, Parameters<typeof getTranslation>[1]> = {
      'Wires & Cables': 'wires',
      'Switches & Sockets': 'switches',
      'LED & Lighting': 'lights',
      'MCB & Distribution': 'protection',
      'Pipes & Fittings': 'pipes',
      'Fans & Appliances': 'fans',
      'Hardware & Accessories': 'accessories',
    };
    const key = categoryKeys[category];
    return key ? t(key) : category;
  };

  // POS State
  const [billType, setBillType] = useState<BillType>('cash_bill');
  const [customer, setCustomer] = useState<CustomerInfo>({
    name: '',
    phone: '',
    address: '',
    type: 'retail',
    discountPercent: 0,
  });

  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Unique categories from products
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => set.add(p.category));
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filter products by search & category
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter(p => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.tamilName && p.tamilName.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q) ||
        (p.hsn && p.hsn.includes(q))
      );
    });
  }, [products, searchQuery, selectedCategory]);

  // Handle changing customer type (adjusts discount for all items in bill!)
  const handleCustomerTypeChange = (type: CustomerType) => {
    let defaultDisc = 0;
    if (type === 'engineer') defaultDisc = settings.defaultEngineerDiscount || 35;
    else if (type === 'electrician') defaultDisc = settings.defaultElectricianDiscount || 20;
    else if (type === 'wholesale') defaultDisc = settings.defaultWholesaleDiscount || 25;
    else defaultDisc = 0;

    setCustomer(prev => ({
      ...prev,
      type,
      discountPercent: defaultDisc,
    }));

    // Recalculate bill items discounts with the new customer type
    setBillItems(prevItems =>
      prevItems.map(item => {
        const prod = products.find(p => p.id === item.productId);
        const disc = prod ? getTierDiscount(type, prod, settings) : defaultDisc;
        const unitPrice = item.baseRate * (1 - disc / 100);
        const taxAmount = (unitPrice * item.taxPercent) / 100;
        const total = (unitPrice + taxAmount) * item.quantity;
        const profit = (unitPrice - item.purchaseRate) * item.quantity;
        return {
          ...item,
          discountPercent: disc,
          unitPrice,
          taxAmount,
          total,
          profit,
        };
      })
    );
  };

  // Add product to bill
  const handleAddProduct = (product: Product) => {
    setBillItems(prevItems => {
      const existingIdx = prevItems.findIndex(it => it.productId === product.id);

      if (existingIdx >= 0) {
        // Increment quantity
        const updated = [...prevItems];
        const item = updated[existingIdx];
        const newQty = item.quantity + 1;
        const total = item.unitPrice * newQty;
        const profit = (item.unitPrice - item.purchaseRate) * newQty;
        updated[existingIdx] = {
          ...item,
          quantity: newQty,
          total,
          profit,
        };
        return updated;
      } else {
        // Add new item
        const tierDiscount = getTierDiscount(customer.type, product, settings);
        const baseRate = product.mrp || product.retailPrice;
        const unitPrice = baseRate * (1 - tierDiscount / 100);
        const taxPercent = settings.taxEnabled ? settings.defaultTaxPercent : 0;
        const taxAmount = (unitPrice * taxPercent) / 100;
        const total = (unitPrice + taxAmount) * 1;
        const profit = (unitPrice - product.purchaseRate) * 1;

        const newItem: BillItem = {
          productId: product.id,
          code: product.code,
          name: product.name,
          tamilName: product.tamilName,
          unit: product.unit,
          hsn: product.hsn,
          quantity: 1,
          purchaseRate: product.purchaseRate,
          mrp: product.mrp,
          baseRate,
          discountPercent: tierDiscount,
          unitPrice,
          taxPercent,
          taxAmount,
          total,
          profit,
        };
        return [newItem, ...prevItems];
      }
    });
  };

  // Update item quantity
  const handleUpdateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setBillItems(prev =>
      prev.map(item => {
        if (item.productId === productId) {
          const total = (item.unitPrice + item.taxAmount) * qty;
          const profit = (item.unitPrice - item.purchaseRate) * qty;
          return { ...item, quantity: qty, total, profit };
        }
        return item;
      })
    );
  };

  // Update item discount % override
  const handleUpdateDiscount = (productId: string, discPercent: number) => {
    const validDisc = Math.min(100, Math.max(0, discPercent));
    setBillItems(prev =>
      prev.map(item => {
        if (item.productId === productId) {
          const unitPrice = item.baseRate * (1 - validDisc / 100);
          const taxAmount = (unitPrice * item.taxPercent) / 100;
          const total = (unitPrice + taxAmount) * item.quantity;
          const profit = (unitPrice - item.purchaseRate) * item.quantity;
          return {
            ...item,
            discountPercent: validDisc,
            unitPrice,
            taxAmount,
            total,
            profit,
          };
        }
        return item;
      })
    );
  };

  // Update item direct unit price override
  const handleUpdateUnitPrice = (productId: string, price: number) => {
    const validPrice = Math.max(0, price);
    setBillItems(prev =>
      prev.map(item => {
        if (item.productId === productId) {
          const impliedDisc = item.baseRate > 0 ? ((item.baseRate - validPrice) / item.baseRate) * 100 : 0;
          const taxAmount = (validPrice * item.taxPercent) / 100;
          const total = (validPrice + taxAmount) * item.quantity;
          const profit = (validPrice - item.purchaseRate) * item.quantity;
          return {
            ...item,
            unitPrice: validPrice,
            discountPercent: Number(impliedDisc.toFixed(1)),
            taxAmount,
            total,
            profit,
          };
        }
        return item;
      })
    );
  };

  // Remove item
  const handleRemoveItem = (productId: string) => {
    setBillItems(prev => prev.filter(it => it.productId !== productId));
  };

  // Clear bill
  const handleClearBill = () => {
    if (billItems.length === 0 || confirm(t('clearBillConfirm'))) {
      setBillItems([]);
      setCustomer({
        name: '',
        phone: '',
        address: '',
        type: 'retail',
        discountPercent: 0,
      });
      setNotes('');
      setAmountReceived('');
    }
  };

  // Calculate bill totals
  const subtotal = useMemo(() => {
    return billItems.reduce((acc, it) => acc + it.baseRate * it.quantity, 0);
  }, [billItems]);

  const totalDiscount = useMemo(() => {
    return billItems.reduce((acc, it) => acc + (it.baseRate - it.unitPrice) * it.quantity, 0);
  }, [billItems]);

  const taxTotal = useMemo(() => {
    return billItems.reduce((acc, it) => acc + it.taxAmount * it.quantity, 0);
  }, [billItems]);

  const rawGrandTotal = useMemo(() => {
    return billItems.reduce((acc, it) => acc + it.total, 0);
  }, [billItems]);

  const roundedGrandTotal = Math.round(rawGrandTotal);
  const roundOff = Number((roundedGrandTotal - rawGrandTotal).toFixed(2));

  const totalPurchaseCost = useMemo(() => {
    return billItems.reduce((acc, it) => acc + it.purchaseRate * it.quantity, 0);
  }, [billItems]);

  const netProfit = useMemo(() => {
    return roundedGrandTotal - totalPurchaseCost;
  }, [roundedGrandTotal, totalPurchaseCost]);

  const profitMarginPercent = roundedGrandTotal > 0 ? (netProfit / roundedGrandTotal) * 100 : 0;

  // Tendered cash change
  const receivedNum = parseFloat(amountReceived) || 0;
  const changeDue = Math.max(0, receivedNum - roundedGrandTotal);

  // Save bill handler
  const handleFinalizeBill = (action: 'save' | 'print' | 'whatsapp') => {
    if (billItems.length === 0) {
      alert(t('addItemsBeforeSave'));
      return;
    }

    const billNumber = getNextBillNumber(billType, invoices);

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      billNumber,
      type: billType,
      status: billType === 'cash_bill' ? 'paid' : 'pending',
      createdAt: new Date().toISOString(),
      customer: {
        ...customer,
        name: customer.name.trim() || (billType === 'cash_bill' ? 'Cash Customer' : 'Estimate Client'),
      },
      items: [...billItems],
      subtotal,
      totalDiscount,
      taxTotal,
      roundOff,
      grandTotal: roundedGrandTotal,
      totalPurchaseCost,
      netProfit,
      paymentMode,
      amountReceived: paymentMode === 'cash' ? receivedNum || roundedGrandTotal : roundedGrandTotal,
      changeDue: paymentMode === 'cash' ? changeDue : 0,
      notes,
    };

    // Deduct stock if Cash Bill (not for Quotation!)
    if (billType === 'cash_bill') {
      const updatedProducts = products.map(prod => {
        const billed = billItems.find(it => it.productId === prod.id);
        if (billed) {
          return {
            ...prod,
            currentStock: Math.max(0, prod.currentStock - billed.quantity),
            updatedAt: new Date().toISOString(),
          };
        }
        return prod;
      });
      onUpdateProducts(updatedProducts);
    }

    onSaveInvoice(newInvoice);
    setShowCheckoutModal(false);

    // If print requested
    if (action === 'print') {
      onOpenPrintModal(newInvoice);
    } else if (action === 'whatsapp') {
      // Trigger print modal with WhatsApp option
      onOpenPrintModal(newInvoice);
    }

    // Reset bill state for next counter customer
    setBillItems([]);
    setCustomer({
      name: '',
      phone: '',
      address: '',
      type: 'retail',
      discountPercent: 0,
    });
    setNotes('');
    setAmountReceived('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
      {/* Top Banner: Bill Type Switcher & Customer Tiers */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 mb-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Bill Type Selector: Cash Bill vs Quotation */}
        <div className="flex items-center gap-2">
          <div className="bg-neutral-950 p-1 rounded-lg border border-neutral-800 flex items-center">
            <button
              onClick={() => setBillType('cash_bill')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                billType === 'cash_bill'
                  ? 'bg-emerald-500 text-neutral-950 shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>{t('cashBill')}</span>
              <span className="text-[10px] opacity-75 hidden sm:inline">(விற்பனை)</span>
            </button>

            <button
              onClick={() => setBillType('quotation')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                billType === 'quotation'
                  ? 'bg-amber-500 text-neutral-950 shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>{t('quotation')}</span>
              <span className="text-[10px] opacity-75 hidden sm:inline">(மதிப்பீடு)</span>
            </button>
          </div>

          <div className="text-xs text-neutral-400 pl-1 hidden lg:block">
            {billType === 'cash_bill' ? (
              <span className="text-emerald-400 font-medium">✓ {t('immediateSaleStockReduction')}</span>
            ) : (
              <span className="text-amber-400 font-medium">ℹ {t('estimateStockUntouched')}</span>
            )}
          </div>
        </div>

        {/* Customer Type / Tier Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-neutral-400 mr-1 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-neutral-500" />
            <span className="hidden sm:inline">{t('customerType')}:</span>
          </span>

          {/* Retail */}
          <button
            onClick={() => handleCustomerTypeChange('retail')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
              customer.type === 'retail'
                ? 'bg-neutral-100 text-neutral-950 border-neutral-200'
                : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            {t('retail')}
          </button>

          {/* Electrician */}
          <button
            onClick={() => handleCustomerTypeChange('electrician')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
              customer.type === 'electrician'
                ? 'bg-blue-500 text-white border-blue-400 shadow-sm'
                : 'bg-neutral-950 text-blue-400 border-neutral-800 hover:border-blue-900/60'
            }`}
          >
            ⚡ {t('electrician')}
          </button>

          {/* Engineer (35% commission tier) */}
          <button
            onClick={() => handleCustomerTypeChange('engineer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
              customer.type === 'engineer'
                ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-sm'
                : 'bg-neutral-950 text-amber-400 border-neutral-800 hover:border-amber-900/60'
            }`}
          >
            📐 {t('engineer')}
          </button>

          {/* Wholesale */}
          <button
            onClick={() => handleCustomerTypeChange('wholesale')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
              customer.type === 'wholesale'
                ? 'bg-purple-500 text-white border-purple-400 shadow-sm'
                : 'bg-neutral-950 text-purple-400 border-neutral-800 hover:border-purple-900/60'
            }`}
          >
            📦 {t('wholesale')}
          </button>
        </div>
      </div>

      {/* Main 2-Column POS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7/12): Bill Items & Customer Details */}
        <div className="lg:col-span-7 space-y-4">
          {/* Customer Input Row */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                  {t('customerName')}
                </label>
                <input
                  type="text"
                  placeholder={t('customerExample')}
                  value={customer.name}
                  onChange={e => setCustomer({ ...customer, name: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                  {t('phone')}
                </label>
                <input
                  type="tel"
                  placeholder={lang === 'ta' ? 'உதா: 9842100000' : 'e.g. 9842100000'}
                  value={customer.phone}
                  onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 font-mono-numbers"
                />
              </div>
            </div>
          </div>

          {/* Current Bill Table */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  {t('itemsInBill')}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono-numbers">
                  {billItems.length}
                </span>
              </div>

              {billItems.length > 0 && (
                <button
                  onClick={handleClearBill}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t('clearBill')}</span>
                </button>
              )}
            </div>

            {/* Table Content */}
            {billItems.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 space-y-2">
                <div className="w-12 h-12 rounded-full bg-neutral-800/80 mx-auto flex items-center justify-center text-neutral-400">
                  <Zap className="w-6 h-6 text-amber-500/60" />
                </div>
                <p className="text-xs max-w-sm mx-auto leading-relaxed">
                  {t('noItemsInBill')}
                </p>
                <p className="text-[11px] text-neutral-400">
                  {lang === 'ta' ? 'குறிப்பு: விரைவாகத் தேட' : 'Tip: Press'} <kbd className="px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded border border-neutral-700 font-mono">/</kbd> {lang === 'ta' ? 'அழுத்தவும்' : 'to search quickly'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-neutral-950 text-neutral-400 sticky top-0 z-10 border-b border-neutral-800">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">{t('item')}</th>
                      <th className="py-2.5 px-2 font-semibold text-center w-28">{t('qty')}</th>
                      <th className="py-2.5 px-2 font-semibold text-right w-20">{t('mrp')}</th>
                      <th className="py-2.5 px-2 font-semibold text-right w-20">{t('discount')}</th>
                      <th className="py-2.5 px-2 font-semibold text-right w-20">{t('rate')}</th>
                      <th className="py-2.5 px-3 font-semibold text-right w-24">{t('total')}</th>
                      {!hideProfit && (
                        <th className="py-2.5 px-2 font-semibold text-right w-20 text-emerald-400">{t('costPrice')}</th>
                      )}
                      <th className="py-2.5 px-2 text-center w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {billItems.map(item => (
                      <tr key={item.productId} className="hover:bg-neutral-800/30 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-white leading-tight">{item.name}</div>
                          {item.tamilName && (
                            <div className="text-[11px] text-neutral-400">{item.tamilName}</div>
                          )}
                          <div className="text-[10px] text-neutral-400 font-mono">
                            {item.code} · {item.unit}
                          </div>
                        </td>

                        {/* Quantity Counter */}
                        <td className="py-2.5 px-2">
                          <div className="flex items-center justify-center gap-1 bg-neutral-950 rounded-lg border border-neutral-800 p-0.5">
                            <button
                              onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                              className="w-5 h-5 flex items-center justify-center text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={e => handleUpdateQuantity(item.productId, parseInt(e.target.value) || 1)}
                              className="w-10 text-center bg-transparent text-white font-bold font-mono-numbers focus:outline-none"
                            />
                            <button
                              onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                              className="w-5 h-5 flex items-center justify-center text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* MRP / Base Rate */}
                        <td className="py-2.5 px-2 text-right text-neutral-400 font-mono-numbers">
                          ₹{item.baseRate.toFixed(1)}
                        </td>

                        {/* Discount % (Editable per line) */}
                        <td className="py-2.5 px-2 text-right">
                          <div className="inline-flex items-center gap-0.5 justify-end">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={item.discountPercent}
                              onChange={e => handleUpdateDiscount(item.productId, parseFloat(e.target.value) || 0)}
                              className="w-12 text-right bg-neutral-950 border border-neutral-800 rounded px-1.5 py-0.5 text-xs text-amber-400 font-bold font-mono-numbers focus:outline-none focus:border-amber-500"
                            />
                            <span className="text-[10px] text-neutral-500">%</span>
                          </div>
                        </td>

                        {/* Net Unit Rate (after discount) */}
                        <td className="py-2.5 px-2 text-right font-semibold text-white font-mono-numbers">
                          ₹{item.unitPrice.toFixed(2)}
                        </td>

                        {/* Line Total */}
                        <td className="py-2.5 px-3 text-right font-bold text-amber-400 font-mono-numbers">
                          ₹{item.total.toFixed(2)}
                        </td>

                        {/* Cost Price & Profit (Only visible if not hidden) */}
                        {!hideProfit && (
                          <td className="py-2.5 px-2 text-right text-[11px] font-mono-numbers">
                            <div className="text-neutral-400">₹{item.purchaseRate}</div>
                            <div className="text-[10px] text-emerald-400">+₹{item.profit.toFixed(0)}</div>
                          </td>
                        )}

                        {/* Remove action */}
                        <td className="py-2.5 px-2 text-center">
                          <button
                            onClick={() => handleRemoveItem(item.productId)}
                            className="text-neutral-500 hover:text-rose-400 p-1 rounded transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bill Summary Footer Panel */}
            <div className="bg-neutral-950 border-t border-neutral-800 p-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-neutral-400 block">{t('subtotal')}:</span>
                  <span className="font-bold text-white font-mono-numbers text-sm">
                    ₹{subtotal.toFixed(2)}
                  </span>
                </div>

                <div>
                  <span className="text-neutral-400 block">{t('discountSaved')}:</span>
                  <span className="font-bold text-emerald-400 font-mono-numbers text-sm">
                    -₹{totalDiscount.toFixed(2)}
                  </span>
                </div>

                {settings.taxEnabled && (
                  <div>
                    <span className="text-neutral-400 block">{t('tax')}:</span>
                    <span className="font-bold text-white font-mono-numbers text-sm">
                      ₹{taxTotal.toFixed(2)}
                    </span>
                  </div>
                )}

                <div>
                  <span className="text-neutral-400 block">{t('roundOff')}:</span>
                  <span className="font-medium text-neutral-400 font-mono-numbers text-sm">
                    {roundOff > 0 ? `+₹${roundOff}` : roundOff < 0 ? `-₹${Math.abs(roundOff)}` : '₹0.00'}
                  </span>
                </div>
              </div>

              {/* Shopkeeper Private Net Profit Gauge */}
              {!hideProfit && billItems.length > 0 && (
                <div className="p-2.5 bg-emerald-950/30 border border-emerald-500/20 rounded-lg flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-neutral-300">
                      {lang === 'ta' ? 'எங்கள் செலவு:' : 'Our Cost:'} <strong className="text-white font-mono-numbers">₹{totalPurchaseCost.toFixed(2)}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 font-semibold">
                      {t('netProfit')}: <strong className="text-emerald-300 font-mono-numbers">₹{netProfit.toFixed(2)}</strong>
                    </span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono-numbers">
                      {profitMarginPercent.toFixed(1)}% margin
                    </span>
                  </div>
                </div>
              )}

              {/* Grand Total & Checkout Action Bar */}
              <div className="pt-2 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs uppercase font-bold text-neutral-400 block">
                    {t('grandTotal')}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono-numbers leading-tight">
                    ₹{roundedGrandTotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={billItems.length === 0}
                    onClick={() => setShowCheckoutModal(true)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-lg ${
                      billItems.length === 0
                        ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                        : billType === 'cash_bill'
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-emerald-500/20'
                        : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-amber-500/20'
                    }`}
                  >
                    <span>{billType === 'cash_bill' ? t('checkoutAndPrint') : t('saveQuotation')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5/12): Product Catalog & Live Search */}
        <div className="lg:col-span-5 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={t('searchItemsPlaceholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-neutral-200 text-neutral-950 font-bold'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                {categoryLabel(cat)}
              </button>
            ))}
          </div>

          {/* Product Cards List */}
          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 bg-neutral-900 border border-neutral-800 rounded-xl text-xs">
                {lang === 'ta' ? 'இந்தத் தேடலுக்கு பொருட்கள் இல்லை:' : 'No products found matching'} "{searchQuery}"
              </div>
            ) : (
              filteredProducts.map(prod => {
                // calculate price for currently selected customer tier
                const tierDisc = getTierDiscount(customer.type, prod, settings);
                const effectivePrice = (prod.mrp || prod.retailPrice) * (1 - tierDisc / 100);
                const isLowStock = prod.currentStock <= prod.minStockAlert;
                const isOutOfStock = prod.currentStock <= 0;

                return (
                  <div
                    key={prod.id}
                    onClick={() => handleAddProduct(prod)}
                    className="group bg-neutral-900 hover:bg-neutral-800/80 border border-neutral-800 hover:border-neutral-700 rounded-xl p-3 cursor-pointer transition-all shadow-sm flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                          {prod.name}
                        </span>
                      </div>

                      {prod.tamilName && (
                        <div className="text-[11px] text-neutral-400 truncate">
                          {prod.tamilName}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-1">
                        <span className="font-mono">{prod.code}</span>
                        <span>·</span>
                        <span className="capitalize">{prod.category}</span>
                        <span>·</span>
                        {/* Live Stock Indicator */}
                        <span className={`font-semibold font-mono-numbers ${
                          isOutOfStock ? 'text-rose-400' : isLowStock ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {prod.currentStock <= 0 ? t('outOfStock') : t('inStock')}: {prod.currentStock} {prod.unit}
                        </span>
                      </div>
                    </div>

                    {/* Pricing Info */}
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-amber-400 font-mono-numbers">
                        ₹{effectivePrice.toFixed(1)}
                      </div>
                      <div className="text-[10px] text-neutral-400 line-through font-mono-numbers">
                        MRP: ₹{prod.mrp}
                      </div>
                      {tierDisc > 0 && (
                        <div className="text-[10px] text-emerald-400 font-semibold font-mono-numbers">
                          {tierDisc}% Off
                        </div>
                      )}
                      {!hideProfit && (
                        <div className="text-[9px] text-neutral-400 font-mono-numbers">
                          Cost: ₹{prod.purchaseRate}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ===================== CHECKOUT / PAYMENT MODAL ===================== */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  {billType === 'cash_bill' ? (lang === 'ta' ? 'ரொக்க பில்லை உறுதிசெய்' : 'Finalize Cash Bill') : (lang === 'ta' ? 'விலைப்புள்ளியை உருவாக்கு' : 'Generate Quotation')}
                </h3>
                <p className="text-xs text-neutral-400">
                  {t('items')}: {billItems.length} · {t('customer')}: {customer.name || (lang === 'ta' ? 'நேரடி வாடிக்கையாளர்' : 'Walk-in')} ({t(customer.type)})
                </p>
              </div>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="text-neutral-400 hover:text-white text-sm p-1.5"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Grand Total Display */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-neutral-400 block">{t('grandTotal')}</span>
                  <span className="text-2xl font-black text-amber-400 font-mono-numbers">
                    ₹{roundedGrandTotal.toFixed(2)}
                  </span>
                </div>
                {totalDiscount > 0 && (
                  <div className="text-right">
                    <span className="text-xs text-neutral-400 block">{t('discountSaved')}</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono-numbers">
                      ₹{totalDiscount.toFixed(2)} {lang === 'ta' ? 'சேமிக்கப்பட்டது' : 'saved'}
                    </span>
                  </div>
                )}
              </div>

              {/* Payment Mode Selector (Only relevant for Cash Bill) */}
              {billType === 'cash_bill' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-300 block">
                    {t('paymentMode')}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMode('cash')}
                      className={`p-2.5 rounded-lg border text-xs font-bold text-center transition-all ${
                        paymentMode === 'cash'
                          ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-sm'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      💵 {t('cash')}
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMode('upi')}
                      className={`p-2.5 rounded-lg border text-xs font-bold text-center transition-all ${
                        paymentMode === 'upi'
                          ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-sm'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      📱 {t('upi')}
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMode('card')}
                      className={`p-2.5 rounded-lg border text-xs font-bold text-center transition-all ${
                        paymentMode === 'card'
                          ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-sm'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      💳 {t('card')}
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMode('credit')}
                      className={`p-2.5 rounded-lg border text-xs font-bold text-center transition-all ${
                        paymentMode === 'credit'
                          ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      📝 {t('credit')}
                    </button>
                  </div>

                  {/* Cash Tendered & Change calculator */}
                  {paymentMode === 'cash' && (
                    <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg grid grid-cols-2 gap-3 mt-2">
                      <div>
                        <label className="text-[11px] text-neutral-400 block mb-1">
                          {t('amountReceived')} (₹)
                        </label>
                        <input
                          type="number"
                          placeholder={roundedGrandTotal.toString()}
                          value={amountReceived}
                          onChange={e => setAmountReceived(e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1 text-xs text-white font-mono-numbers focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-neutral-400 block mb-1">
                          {t('changeDue')}
                        </label>
                        <div className="px-2.5 py-1 text-xs font-bold text-emerald-400 font-mono-numbers">
                          ₹{changeDue.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* UPI Information */}
                  {paymentMode === 'upi' && settings.upiId && (
                    <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs space-y-1">
                      <div className="text-neutral-400">UPI ID: <strong className="text-white font-mono">{settings.upiId}</strong></div>
                      <p className="text-[11px] text-neutral-400">
                        A scannable QR code will be generated on the printed invoice and screen for the customer.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Notes / Remarks */}
              <div>
                <label className="text-xs font-medium text-neutral-400 block mb-1">
                  {lang === 'ta' ? 'குறிப்புகள் / இட விவரம் (விருப்பம்)' : 'Notes / Site Reference (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'ta' ? 'உதா: கிருஷ்ணா வில்லா தரைத்தள வயரிங்' : 'e.g. For Krishna Villa Ground Floor wiring'}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-neutral-800 flex flex-col sm:flex-row items-center gap-2">
                <button
                  onClick={() => handleFinalizeBill('print')}
                  className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl transition-colors shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>{billType === 'cash_bill' ? t('checkoutAndPrint') : t('printQuotation')}</span>
                </button>

                <button
                  onClick={() => handleFinalizeBill('whatsapp')}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{t('checkoutWhatsApp')}</span>
                </button>

                <button
                  onClick={() => handleFinalizeBill('save')}
                  className="w-full sm:w-auto py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs rounded-xl transition-colors"
                >
                  {t('saveOnly')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
