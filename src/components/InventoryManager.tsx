import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  TrendingUp, 
  DollarSign, 
  Layers, 
  Filter,
  Check,
  X,
  ArrowUpRight
} from 'lucide-react';
import { Product, UnitType, Language, ShopSettings } from '../types';
import { formatCurrency } from '../utils/storage';
import { getTranslation } from '../utils/translations';

interface InventoryManagerProps {
  products: Product[];
  settings: ShopSettings;
  lang: Language;
  hideProfit: boolean;
  onUpdateProducts: (products: Product[]) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  products,
  settings,
  lang,
  hideProfit,
  onUpdateProducts,
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

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterStockStatus, setFilterStockStatus] = useState<'all' | 'low' | 'out'>('all');
  
  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showStockInwardModal, setShowStockInwardModal] = useState(false);
  const [stockInwardTarget, setStockInwardTarget] = useState<Product | null>(null);
  const [inwardQuantity, setInwardQuantity] = useState<number>(10);
  const [inwardPurchaseRate, setInwardPurchaseRate] = useState<number>(0);

  // Form State for New/Edit Product
  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    tamilName: string;
    category: string;
    unit: UnitType;
    hsn: string;
    purchaseRate: number;
    mrp: number;
    retailPrice: number;
    electricianDiscountPercent: number;
    engineerDiscountPercent: number;
    wholesaleDiscountPercent: number;
    currentStock: number;
    minStockAlert: number;
  }>({
    code: '',
    name: '',
    tamilName: '',
    category: 'Wires & Cables',
    unit: 'Nos',
    hsn: '',
    purchaseRate: 0,
    mrp: 0,
    retailPrice: 0,
    electricianDiscountPercent: settings.defaultElectricianDiscount || 20,
    engineerDiscountPercent: settings.defaultEngineerDiscount || 35,
    wholesaleDiscountPercent: settings.defaultWholesaleDiscount || 25,
    currentStock: 0,
    minStockAlert: 10,
  });

  // Calculate Overview Stats
  const stats = useMemo(() => {
    let totalItems = products.length;
    let totalStockQty = 0;
    let totalCostValue = 0;
    let totalRetailValue = 0;
    let lowStockCount = 0;

    products.forEach(p => {
      totalStockQty += p.currentStock;
      totalCostValue += p.currentStock * p.purchaseRate;
      totalRetailValue += p.currentStock * (p.retailPrice || p.mrp);
      if (p.currentStock <= p.minStockAlert) {
        lowStockCount++;
      }
    });

    const potentialMargin = totalRetailValue - totalCostValue;

    return {
      totalItems,
      totalStockQty,
      totalCostValue,
      totalRetailValue,
      potentialMargin,
      lowStockCount,
    };
  }, [products]);

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => set.add(p.category));
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter(p => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      if (!matchCat) return false;

      if (filterStockStatus === 'low' && p.currentStock > p.minStockAlert) return false;
      if (filterStockStatus === 'out' && p.currentStock > 0) return false;

      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.tamilName && p.tamilName.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [products, searchQuery, selectedCategory, filterStockStatus]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      code: `PROD-${products.length + 101}`,
      name: '',
      tamilName: '',
      category: 'Wires & Cables',
      unit: 'Nos',
      hsn: '',
      purchaseRate: 0,
      mrp: 0,
      retailPrice: 0,
      electricianDiscountPercent: settings.defaultElectricianDiscount || 20,
      engineerDiscountPercent: settings.defaultEngineerDiscount || 35,
      wholesaleDiscountPercent: settings.defaultWholesaleDiscount || 25,
      currentStock: 10,
      minStockAlert: 5,
    });
    setShowProductModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      code: product.code,
      name: product.name,
      tamilName: product.tamilName || '',
      category: product.category,
      unit: product.unit,
      hsn: product.hsn || '',
      purchaseRate: product.purchaseRate,
      mrp: product.mrp,
      retailPrice: product.retailPrice,
      electricianDiscountPercent: product.electricianDiscountPercent,
      engineerDiscountPercent: product.engineerDiscountPercent,
      wholesaleDiscountPercent: product.wholesaleDiscountPercent,
      currentStock: product.currentStock,
      minStockAlert: product.minStockAlert,
    });
    setShowProductModal(true);
  };

  // Save product (Add or Update)
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      alert(t('fillProductRequired'));
      return;
    }

    if (editingProduct) {
      // Update
      const updated = products.map(p => {
        if (p.id === editingProduct.id) {
          return {
            ...p,
            ...formData,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      });
      onUpdateProducts(updated);
    } else {
      // Create new
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        ...formData,
        updatedAt: new Date().toISOString(),
      };
      onUpdateProducts([newProduct, ...products]);
    }

    setShowProductModal(false);
  };

  // Delete product
  const handleDeleteProduct = (productId: string, name: string) => {
    if (confirm(`${t('deleteProductConfirm')} "${name}"?`)) {
      onUpdateProducts(products.filter(p => p.id !== productId));
    }
  };

  // Quick stock addition
  const handleQuickAddStock = (product: Product, delta: number) => {
    const updated = products.map(p => {
      if (p.id === product.id) {
        return {
          ...p,
          currentStock: Math.max(0, p.currentStock + delta),
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });
    onUpdateProducts(updated);
  };

  // Open Purchase Entry / Stock Inward modal
  const handleOpenInwardModal = (product: Product) => {
    setStockInwardTarget(product);
    setInwardQuantity(10);
    setInwardPurchaseRate(product.purchaseRate);
    setShowStockInwardModal(true);
  };

  // Execute Stock Inward
  const handleExecuteInward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockInwardTarget || inwardQuantity <= 0) return;

    const updated = products.map(p => {
      if (p.id === stockInwardTarget.id) {
        return {
          ...p,
          currentStock: p.currentStock + inwardQuantity,
          purchaseRate: inwardPurchaseRate > 0 ? inwardPurchaseRate : p.purchaseRate,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    onUpdateProducts(updated);
    setShowStockInwardModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-5">
      {/* Top Section: Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Products */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">{t('totalProducts')}</span>
            <Package className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono-numbers mt-2">
            {stats.totalItems}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1 font-mono-numbers">
            {stats.totalStockQty} {t('totalUnitsInShop')}
          </div>
        </div>

        {/* Total Stock Cost (Our Investment) */}
        {!hideProfit ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-400">{t('stockValueCost')}</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono-numbers mt-2">
              {formatCurrency(stats.totalCostValue)}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              {t('originalPurchaseValue')}
            </div>
          </div>
        ) : (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-400">{t('totalStockQty')}</span>
              <Package className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono-numbers mt-2">
              {stats.totalStockQty}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              {t('unitsAcrossCategories')}
            </div>
          </div>
        )}

        {/* Stock Retail Value */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">{t('stockValueRetail')}</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono-numbers mt-2">
            {formatCurrency(stats.totalRetailValue)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            {t('expectedSalesRecovery')}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className={`border rounded-xl p-3.5 sm:p-4 shadow-sm transition-all ${
          stats.lowStockCount > 0
            ? 'bg-rose-950/20 border-rose-500/40'
            : 'bg-neutral-900 border-neutral-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">{t('lowStockItems')}</span>
            <AlertTriangle className={`w-4 h-4 ${stats.lowStockCount > 0 ? 'text-rose-400 animate-pulse' : 'text-neutral-500'}`} />
          </div>
          <div className={`text-xl sm:text-2xl font-black font-mono-numbers mt-2 ${
            stats.lowStockCount > 0 ? 'text-rose-400' : 'text-white'
          }`}>
            {stats.lowStockCount}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            {stats.lowStockCount > 0 ? t('needImmediatePurchase') : t('allStocksAdequate')}
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Category Filters, and Add Product */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('searchProductsPlaceholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
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

          {/* Stock filter pills */}
          <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
            <button
              onClick={() => setFilterStockStatus('all')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                filterStockStatus === 'all' ? 'bg-neutral-800 text-white font-semibold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              {t('all')}
            </button>
            <button
              onClick={() => setFilterStockStatus('low')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                filterStockStatus === 'low' ? 'bg-rose-500/20 text-rose-300 font-semibold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              {t('lowStock')} ({stats.lowStockCount})
            </button>
          </div>

          {/* Add Product Button */}
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-lg transition-colors shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t('newProduct')}</span>
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-neutral-200 text-neutral-950 font-bold'
                  : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              {categoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800">
              <tr>
                <th className="py-3 px-3 font-semibold w-16">{t('code')}</th>
                <th className="py-3 px-3 font-semibold">{t('productName')}</th>
                <th className="py-3 px-2 font-semibold">{t('category')}</th>
                <th className="py-3 px-3 font-semibold text-center w-28">{t('stockInHand')}</th>
                {!hideProfit && (
                  <th className="py-3 px-3 font-semibold text-right w-24 text-emerald-400">
                    {t('purchaseRate')}
                  </th>
                )}
                <th className="py-3 px-3 font-semibold text-right w-20">{t('mrp')}</th>
                <th className="py-3 px-3 font-semibold text-right w-24">{t('retailPrice')}</th>
                <th className="py-3 px-3 font-semibold text-right w-28 text-blue-400">
                  {t('electrician')}
                </th>
                <th className="py-3 px-3 font-semibold text-right w-28 text-amber-400">
                  {t('engineer')}
                </th>
                <th className="py-3 px-3 font-semibold text-center w-36">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-neutral-500">
                    {t('noProductsFound')}
                  </td>
                </tr>
              ) : (
                filteredProducts.map(prod => {
                  const isLow = prod.currentStock <= prod.minStockAlert;
                  const isOut = prod.currentStock <= 0;
                  const electricianRate = (prod.mrp || prod.retailPrice) * (1 - (prod.electricianDiscountPercent || 20) / 100);
                  const engineerRate = (prod.mrp || prod.retailPrice) * (1 - (prod.engineerDiscountPercent || 35) / 100);

                  return (
                    <tr key={prod.id} className="hover:bg-neutral-800/40 transition-colors">
                      {/* Code */}
                      <td className="py-3 px-3 font-mono text-[11px] text-neutral-400">
                        {prod.code}
                      </td>

                      {/* Product Name */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white leading-snug">{prod.name}</div>
                        {prod.tamilName && (
                          <div className="text-[11px] text-neutral-400">{prod.tamilName}</div>
                        )}
                        {prod.hsn && (
                          <div className="text-[10px] text-neutral-400 font-mono">HSN: {prod.hsn}</div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-2 text-neutral-400">
                        {categoryLabel(prod.category)}
                      </td>

                      {/* Stock in Hand */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`px-2 py-0.5 rounded font-bold font-mono-numbers text-xs ${
                            isOut
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : isLow
                              ? 'bg-amber-950/80 text-amber-400 border border-amber-800'
                              : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                          }`}>
                            {prod.currentStock} {prod.unit}
                          </span>
                          {isLow && (
                            <span className="text-[9px] text-amber-400 mt-0.5 font-medium">
                              {lang === 'ta' ? 'எச்சரிக்கை ≤' : 'Alert ≤'} {prod.minStockAlert}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Purchase Rate (CP) */}
                      {!hideProfit && (
                        <td className="py-3 px-3 text-right font-mono-numbers text-emerald-400 font-semibold">
                          ₹{prod.purchaseRate.toFixed(2)}
                        </td>
                      )}

                      {/* MRP */}
                      <td className="py-3 px-3 text-right font-mono-numbers text-neutral-400">
                        ₹{prod.mrp.toFixed(1)}
                      </td>

                      {/* Retail Price */}
                      <td className="py-3 px-3 text-right font-mono-numbers font-bold text-white">
                        ₹{prod.retailPrice.toFixed(1)}
                      </td>

                      {/* Electrician Rate */}
                      <td className="py-3 px-3 text-right font-mono-numbers text-blue-400">
                        <div>₹{electricianRate.toFixed(1)}</div>
                        <div className="text-[9px] text-neutral-400">-{prod.electricianDiscountPercent}%</div>
                      </td>

                      {/* Engineer Rate (35%) */}
                      <td className="py-3 px-3 text-right font-mono-numbers text-amber-400 font-semibold">
                        <div>₹{engineerRate.toFixed(1)}</div>
                        <div className="text-[9px] text-neutral-400">-{prod.engineerDiscountPercent}%</div>
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Quick Inward / Add Stock */}
                          <button
                            onClick={() => handleOpenInwardModal(prod)}
                            className="p-1 px-2 text-[10px] font-bold rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                            title={lang === 'ta' ? 'சரக்கு வரவு / கொள்முதல் பதிவு' : 'Add stock / Purchase entry'}
                          >
                            + {t('addStockPurchase')}
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => handleOpenEditModal(prod)}
                            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                            title={t('editProduct')}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => handleDeleteProduct(prod.id, prod.name)}
                            className="p-1 text-neutral-500 hover:text-rose-400 rounded hover:bg-neutral-800 transition-colors"
                            title={t('deleteProduct')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* ===================== ADD / EDIT PRODUCT MODAL ===================== */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl my-8">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingProduct ? t('editProductTitle') : t('addProductTitle')}
                </h3>
                <p className="text-xs text-neutral-400">
                  {t('productSetupDescription')}
                </p>
              </div>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-neutral-400 hover:text-white p-1 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Product Name English */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    {t('productNameEnglish')} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Finolex 1.5 sq mm Wire (Red - 90m)"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Product Name Tamil */}
                <div>
                  <label className="text-xs font-medium text-neutral-400 block mb-1">
                    {t('tamilNameOptional')}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. பினோலெக்ஸ் 1.5 ஒயர்"
                    value={formData.tamilName}
                    onChange={e => setFormData({ ...formData, tamilName: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Product Code / SKU */}
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    {t('productCodeBarcode')} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FIN-1.5-RED"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    {t('category')}
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Wires & Cables">{categoryLabel('Wires & Cables')}</option>
                    <option value="Switches & Sockets">{categoryLabel('Switches & Sockets')}</option>
                    <option value="LED & Lighting">{categoryLabel('LED & Lighting')}</option>
                    <option value="MCB & Distribution">{categoryLabel('MCB & Distribution')}</option>
                    <option value="Pipes & Fittings">{categoryLabel('Pipes & Fittings')}</option>
                    <option value="Fans & Appliances">{categoryLabel('Fans & Appliances')}</option>
                    <option value="Hardware & Accessories">{categoryLabel('Hardware & Accessories')}</option>
                    <option value="Plumbing & Sanitary">{lang === 'ta' ? 'குழாய்கள் & சுகாதாரப் பொருட்கள்' : 'Plumbing & Sanitary'}</option>
                  </select>
                </div>

                {/* Unit */}
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    {t('measurementUnit')}
                  </label>
                  <select
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value as UnitType })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Nos">Nos (எண்ணிக்கை)</option>
                    <option value="Mtr">Mtr (மீட்டர்)</option>
                    <option value="Roll">Roll (ரோல்)</option>
                    <option value="Box">Box (பெட்டி)</option>
                    <option value="Set">Set (செட்)</option>
                    <option value="Kg">Kg (கிலோ)</option>
                    <option value="Bundle">Bundle (கட்டு)</option>
                    <option value="Pkt">Pkt (பாக்கெட்)</option>
                  </select>
                </div>
              </div>

              {/* Pricing Section */}
              <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Pricing & Tier Discounts (விலை & தள்ளுபடிகள்)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Purchase Rate */}
                  <div>
                    <label className="text-[11px] font-semibold text-emerald-400 block mb-1">
                      Purchase Rate / Cost (CP) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500 text-xs">₹</span>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={formData.purchaseRate || ''}
                        onChange={e => setFormData({ ...formData, purchaseRate: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-6 pr-3 py-1.5 text-xs text-emerald-300 font-bold font-mono-numbers focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <span className="text-[10px] text-neutral-500">நம்ம வாங்கும் அசல் விலை</span>
                  </div>

                  {/* MRP */}
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
                      {lang === 'ta' ? 'அதிகபட்ச சில்லறை விலை (MRP)' : 'MRP'} *
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500 text-xs">₹</span>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={formData.mrp || ''}
                        onChange={e => setFormData({ ...formData, mrp: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-6 pr-3 py-1.5 text-xs text-white font-mono-numbers focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Retail Selling Price */}
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
                      Retail Customer Price *
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500 text-xs">₹</span>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={formData.retailPrice || ''}
                        onChange={e => setFormData({ ...formData, retailPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-6 pr-3 py-1.5 text-xs text-white font-mono-numbers focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Tier Discounts */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-neutral-800">
                  {/* Electrician Discount */}
                  <div>
                    <label className="text-[11px] font-semibold text-blue-400 block mb-1">
                      Electrician Disc %
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.electricianDiscountPercent}
                        onChange={e => setFormData({ ...formData, electricianDiscountPercent: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-blue-300 font-mono-numbers focus:outline-none focus:border-blue-500"
                      />
                      <span className="text-xs text-neutral-500 ml-1.5">%</span>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-mono-numbers mt-0.5 block">
                      = ₹{((formData.mrp || formData.retailPrice) * (1 - formData.electricianDiscountPercent / 100)).toFixed(1)}
                    </span>
                  </div>

                  {/* Engineer Discount (35%) */}
                  <div>
                    <label className="text-[11px] font-semibold text-amber-400 block mb-1">
                      Engineer Disc % (e.g. 35%)
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.engineerDiscountPercent}
                        onChange={e => setFormData({ ...formData, engineerDiscountPercent: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono-numbers focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-xs text-neutral-500 ml-1.5">%</span>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-mono-numbers mt-0.5 block">
                      = ₹{((formData.mrp || formData.retailPrice) * (1 - formData.engineerDiscountPercent / 100)).toFixed(1)}
                    </span>
                  </div>

                  {/* Wholesale Discount */}
                  <div>
                    <label className="text-[11px] font-semibold text-purple-400 block mb-1">
                      Wholesale Disc %
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.wholesaleDiscountPercent}
                        onChange={e => setFormData({ ...formData, wholesaleDiscountPercent: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-purple-300 font-mono-numbers focus:outline-none focus:border-purple-500"
                      />
                      <span className="text-xs text-neutral-500 ml-1.5">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stock Quantity & Alert Level */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                      {lang === 'ta' ? 'தற்போதைய சரக்கு அளவு' : 'Current Stock Quantity'} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.currentStock}
                    onChange={e => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white font-mono-numbers focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    {lang === 'ta' ? 'குறைந்த இருப்பு எச்சரிக்கை அளவு' : 'Low Stock Alert Level'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minStockAlert}
                    onChange={e => setFormData({ ...formData, minStockAlert: parseInt(e.target.value) || 5 })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white font-mono-numbers focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 text-xs text-neutral-400 hover:text-white rounded-lg transition-colors"
                >
                  {t('cancel')}
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-lg transition-colors shadow-sm"
                >
                  {editingProduct ? (lang === 'ta' ? 'பொருளைப் புதுப்பி' : 'Update Product') : t('addStockPurchase')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== QUICK INWARD / ADD STOCK MODAL ===================== */}
      {showStockInwardModal && stockInwardTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">
                  {lang === 'ta' ? 'சரக்கு வரவு வை' : 'Add Stock'}
                </h3>
                <p className="text-xs text-neutral-400 truncate max-w-xs">
                  {stockInwardTarget.name}
                </p>
              </div>
              <button
                onClick={() => setShowStockInwardModal(false)}
                className="text-neutral-400 hover:text-white p-1 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteInward} className="p-5 space-y-4">
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between text-neutral-400">
                  <span>{lang === 'ta' ? 'தற்போதைய இருப்பு:' : 'Current Stock:'}</span>
                  <span className="font-bold text-white font-mono-numbers">
                    {stockInwardTarget.currentStock} {stockInwardTarget.unit}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>{lang === 'ta' ? 'தற்போதைய கொள்முதல் விலை (CP):' : 'Current Purchase Rate (CP):'}</span>
                  <span className="font-bold text-emerald-400 font-mono-numbers">
                    ₹{stockInwardTarget.purchaseRate.toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  {lang === 'ta' ? 'சேர்க்க வேண்டிய அளவு' : 'Quantity to Add'} (+ {stockInwardTarget.unit}) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    required
                    value={inwardQuantity}
                    onChange={e => setInwardQuantity(parseInt(e.target.value) || 0)}
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white font-mono-numbers font-bold focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex gap-1">
                    {[10, 25, 50, 100].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setInwardQuantity(amt)}
                        className="px-2 py-1 text-xs rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-mono-numbers"
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  {lang === 'ta' ? 'புதிய கொள்முதல் விலை (மாற்றம் இருந்தால்)' : 'New Purchase Rate (if changed)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-xs">₹</span>
                  <input
                    type="number"
                    step="0.1"
                    value={inwardPurchaseRate}
                    onChange={e => setInwardPurchaseRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-7 pr-3 py-2 text-xs text-emerald-400 font-bold font-mono-numbers focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowStockInwardModal(false)}
                  className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs rounded-lg transition-colors shadow-sm"
                >
                  {lang === 'ta' ? 'உறுதிசெய்து சரக்கைப் புதுப்பி' : 'Confirm & Update Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
