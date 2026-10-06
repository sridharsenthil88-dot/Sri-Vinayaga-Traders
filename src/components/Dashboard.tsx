import React, { useMemo } from 'react';
import { 
  ReceiptText, 
  FileSpreadsheet, 
  Package, 
  AlertTriangle, 
  ArrowUpRight, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  Plus,
  Clock,
  Printer
} from 'lucide-react';
import { Product, Invoice, ShopSettings, Language } from '../types';
import { formatCurrency } from '../utils/storage';
import { getTranslation } from '../utils/translations';

interface DashboardProps {
  products: Product[];
  invoices: Invoice[];
  settings: ShopSettings;
  lang: Language;
  hideProfit: boolean;
  onNavigate: (tab: 'pos' | 'inventory' | 'quotations' | 'history') => void;
  onOpenPrintModal: (invoice: Invoice) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  products,
  invoices,
  settings,
  lang,
  hideProfit,
  onNavigate,
  onOpenPrintModal,
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key);

  // Compute key stats
  const stats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const cashBills = invoices.filter(inv => inv.type === 'cash_bill');
    const quotations = invoices.filter(inv => inv.type === 'quotation');
    const pendingQuotes = quotations.filter(inv => inv.status === 'pending');

    const todayBills = cashBills.filter(inv => new Date(inv.createdAt).getTime() >= startOfToday);
    const todaySales = todayBills.reduce((acc, inv) => acc + inv.grandTotal, 0);
    const todayProfit = todayBills.reduce((acc, inv) => acc + (inv.netProfit || 0), 0);

    const totalStockUnits = products.reduce((acc, p) => acc + p.currentStock, 0);
    const lowStockItems = products.filter(p => p.currentStock <= p.minStockAlert);
    const stockValuationCost = products.reduce((acc, p) => acc + p.currentStock * p.purchaseRate, 0);
    const stockValuationRetail = products.reduce((acc, p) => acc + p.currentStock * (p.retailPrice || p.mrp), 0);

    return {
      todaySales,
      todayProfit,
      todayBillsCount: todayBills.length,
      totalBillsCount: cashBills.length,
      totalQuotationsCount: quotations.length,
      pendingQuotesCount: pendingQuotes.length,
      pendingQuotesTotal: pendingQuotes.reduce((acc, q) => acc + q.grandTotal, 0),
      totalStockUnits,
      lowStockItems,
      stockValuationCost,
      stockValuationRetail,
      recentBills: cashBills.slice(0, 5),
      recentQuotes: quotations.slice(0, 5),
    };
  }, [products, invoices]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-6">
      {/* Welcome & Quick Action Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider block">
            {new Date().toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
            {lang === 'ta' ? 'வணக்கம், கடை விற்பனை சுருக்கம்' : 'Counter Dashboard & Daily Sales'}
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            {settings.shopName} · {settings.tagline}
          </p>
        </div>

        {/* Quick launch buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigate('pos')}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl transition-all shadow-md"
          >
            <ReceiptText className="w-4 h-4" />
            <span>{lang === 'ta' ? '+ புதிய ரொக்க பில்' : '+ New Cash Bill'}</span>
          </button>

          <button
            onClick={() => onNavigate('pos')}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs rounded-xl transition-all border border-neutral-700"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            <span>{lang === 'ta' ? '+ புதிய விலைப்புள்ளி' : '+ New Quotation'}</span>
          </button>

          <button
            onClick={() => onNavigate('inventory')}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs rounded-xl transition-all border border-neutral-700"
          >
            <Package className="w-4 h-4 text-emerald-400" />
            <span>{lang === 'ta' ? 'சரக்குகளை நிர்வகி' : 'Manage Stock'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>{lang === 'ta' ? 'இன்றைய விற்பனை' : "Today's Sales"}</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono-numbers mt-2">
            {formatCurrency(stats.todaySales)}
          </div>
          <div className="text-xs text-neutral-400 mt-1 flex items-center justify-between">
            <span className="font-mono-numbers">{stats.todayBillsCount} {lang === 'ta' ? 'இன்றைய பில்கள்' : 'bills today'}</span>
            {!hideProfit && stats.todayProfit > 0 && (
              <span className="text-emerald-400 font-bold font-mono-numbers">
                +₹{stats.todayProfit.toFixed(0)} {lang === 'ta' ? 'லாபம்' : 'profit'}
              </span>
            )}
          </div>
        </div>

        {/* Total Stock in Hand */}
        <div 
          onClick={() => onNavigate('inventory')}
          className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-sm hover:border-neutral-700 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>{lang === 'ta' ? 'மொத்த சரக்கு இருப்பு' : 'Total Stock'}</span>
            <Package className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono-numbers mt-2">
            {stats.totalStockUnits} <span className="text-sm font-normal text-neutral-400">{lang === 'ta' ? 'அலகுகள்' : 'units'}</span>
          </div>
          <div className="text-xs text-neutral-400 mt-1 font-mono-numbers">
            {products.length} {lang === 'ta' ? 'பொருட்கள்' : 'catalog items'}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div 
          onClick={() => onNavigate('inventory')}
          className={`border rounded-xl p-4 shadow-sm cursor-pointer transition-all ${
            stats.lowStockItems.length > 0
              ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500'
              : 'bg-neutral-900 border-neutral-800'
          }`}
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>{lang === 'ta' ? 'குறைந்த இருப்பு எச்சரிக்கை' : 'Low Stock Warning'}</span>
            <AlertTriangle className={`w-4 h-4 ${stats.lowStockItems.length > 0 ? 'text-rose-400 animate-pulse' : 'text-neutral-500'}`} />
          </div>
          <div className={`text-2xl font-black font-mono-numbers mt-2 ${
            stats.lowStockItems.length > 0 ? 'text-rose-400' : 'text-white'
          }`}>
            {stats.lowStockItems.length} <span className="text-sm font-normal text-neutral-400">{lang === 'ta' ? 'பொருட்கள்' : 'items'}</span>
          </div>
          <div className="text-xs text-neutral-400 mt-1">
            {stats.lowStockItems.length > 0 ? (lang === 'ta' ? 'உடனடி மறுஆர்டர் தேவை' : 'Reorder needed immediately') : (lang === 'ta' ? 'சரக்கு நிலை சீராக உள்ளது' : 'Inventory healthy')}
          </div>
        </div>

        {/* Active Quotations Pending Conversion */}
        <div 
          onClick={() => onNavigate('quotations')}
          className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-sm hover:border-neutral-700 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>{lang === 'ta' ? 'நிலுவை விலைப்புள்ளிகள்' : 'Active Quotations'}</span>
            <FileSpreadsheet className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 font-mono-numbers mt-2">
            {stats.pendingQuotesCount}
          </div>
          <div className="text-xs text-neutral-400 mt-1 font-mono-numbers">
            {lang === 'ta' ? 'மதிப்பு' : 'Worth'} {formatCurrency(stats.pendingQuotesTotal)}
          </div>
        </div>
      </div>

      {/* Tier Pricing Reference Banner (Built for user requirement: engineer 35%, electrician 20%) */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {lang === 'ta' ? 'வாடிக்கையாளர் வகை விலை & தள்ளுபடிகள்' : 'Trade Pricing & Customer Discounts'}
            </span>
          </div>
          <span className="text-[11px] text-neutral-400 hidden sm:inline">
            {lang === 'ta' ? 'வாடிக்கையாளர் வகையைத் தேர்ந்தெடுத்ததும் விலை தானாக மாறும்' : 'Rates update automatically when a customer type is selected'}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Retail */}
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
            <div className="text-[11px] font-semibold text-neutral-400">{lang === 'ta' ? 'நேரடி வாடிக்கையாளர்' : 'Walk-in Customer'}</div>
            <div className="text-base font-bold text-white mt-0.5">{lang === 'ta' ? 'சில்லறை விலை' : 'Retail Rate'}</div>
            <div className="text-[10px] text-neutral-500 mt-0.5">{lang === 'ta' ? 'சாதாரண வாடிக்கையாளர் விலை (0% தள்ளுபடி)' : 'Standard customer price (0% discount)'}</div>
          </div>

          {/* Electrician */}
          <div className="p-3 bg-blue-950/20 border border-blue-500/30 rounded-lg">
            <div className="text-[11px] font-semibold text-blue-400">{lang === 'ta' ? '⚡ எலக்ட்ரீசியன்கள் & தொழில்நுட்பர்கள்' : '⚡ Electricians & Technicians'}</div>
            <div className="text-base font-bold text-blue-300 mt-0.5">
              {settings.defaultElectricianDiscount}% {lang === 'ta' ? 'தள்ளுபடி' : 'Discount'}
            </div>
            <div className="text-[10px] text-blue-400/80 mt-0.5">{lang === 'ta' ? 'எலக்ட்ரீசியன் மற்றும் தொழில்நுட்பர்களுக்கு தானாகப் பொருந்தும்' : 'Automatically applied for electricians and technicians'}</div>
          </div>

          {/* Engineer (35%) */}
          <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-lg">
            <div className="text-[11px] font-semibold text-amber-400">{lang === 'ta' ? '📐 இன்ஜினியர்கள் & கட்டுமானர்கள்' : '📐 Engineers & Builders'}</div>
            <div className="text-base font-bold text-amber-300 mt-0.5">
              {settings.defaultEngineerDiscount}% {lang === 'ta' ? 'தள்ளுபடி' : 'Discount'}
            </div>
            <div className="text-[10px] text-amber-400/80 mt-0.5">{lang === 'ta' ? 'ஒப்பந்ததாரர் மற்றும் சிவில் இன்ஜினியருக்கான சிறப்பு விலை' : 'Special contractor and civil engineer rate'}</div>
          </div>

          {/* Wholesale */}
          <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded-lg">
            <div className="text-[11px] font-semibold text-purple-400">{lang === 'ta' ? '📦 மொத்த விற்பனை' : '📦 Wholesale Bulk'}</div>
            <div className="text-base font-bold text-purple-300 mt-0.5">
              {settings.defaultWholesaleDiscount}% {lang === 'ta' ? 'தள்ளுபடி' : 'Discount'}
            </div>
            <div className="text-[10px] text-purple-400/80 mt-0.5">{lang === 'ta' ? 'மொத்த அளவு கொள்முதல்களுக்கு' : 'For bulk quantity purchases'}</div>
          </div>
        </div>
      </div>

      {/* 2-Column: Low Stock Urgency Table & Recent Bills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Low Stock Items */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {lang === 'ta' ? 'குறைந்த இருப்பு பொருட்கள் / கொள்முதல் செய்ய வேண்டியவை' : 'Low Stock Items / Purchase Required'}
              </span>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
            >
              {lang === 'ta' ? 'அனைத்து சரக்குகளையும் காண்க →' : 'View All Stock →'}
            </button>
          </div>

          <div className="p-4 flex-1">
            {stats.lowStockItems.length === 0 ? (
              <div className="py-8 text-center text-neutral-500 text-xs">
                ✓ {lang === 'ta' ? 'அனைத்து பொருட்களும் குறைந்தபட்ச இருப்பை விட அதிகமாக உள்ளன.' : 'All items are above the minimum reorder level.'}
              </div>
            ) : (
              <div className="space-y-2.5">
                {stats.lowStockItems.slice(0, 5).map(prod => (
                  <div
                    key={prod.id}
                    className="p-2.5 bg-neutral-950 border border-neutral-800/80 rounded-lg flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-white truncate">{prod.name}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">
                        {prod.code} · {lang === 'ta' ? 'கொள்முதல்:' : 'Purchase:'} ₹{prod.purchaseRate}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono-numbers bg-rose-950 text-rose-300 border border-rose-800">
                        {prod.currentStock} {prod.unit} {lang === 'ta' ? 'மீதம்' : 'left'}
                      </span>
                      <div className="text-[9px] text-neutral-400 mt-0.5">
                        {lang === 'ta' ? 'குறைந்தபட்ச எச்சரிக்கை:' : 'Min alert:'} {prod.minStockAlert}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Sales Bills */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {lang === 'ta' ? 'சமீபத்திய விற்பனை பில்கள்' : 'Recent Sales Bills'}
              </span>
            </div>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
            >
              {lang === 'ta' ? 'அனைத்து பில்களையும் காண்க →' : 'View All Bills →'}
            </button>
          </div>

          <div className="p-4 flex-1">
            {stats.recentBills.length === 0 ? (
              <div className="py-8 text-center text-neutral-500 text-xs">
                {lang === 'ta' ? 'இதுவரை பில்கள் இல்லை. புதிய பில் திரையைத் திறந்து முதல் பில்லை உருவாக்கவும்.' : 'No bills recorded yet. Create your first bill in POS!'}
              </div>
            ) : (
              <div className="space-y-2.5">
                {stats.recentBills.map(bill => (
                  <div
                    key={bill.id}
                    className="p-2.5 bg-neutral-950 border border-neutral-800/80 rounded-lg flex items-center justify-between gap-3 text-xs hover:border-neutral-700 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400 text-[11px]">
                          {bill.billNumber}
                        </span>
                        <span className="capitalize text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300">
                          {bill.paymentMode}
                        </span>
                      </div>
                      <div className="text-white font-medium truncate mt-0.5">
                        {bill.customer.name}
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-3">
                      <div>
                        <div className="font-bold text-white font-mono-numbers">
                          ₹{bill.grandTotal.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-neutral-400 font-mono-numbers">
                          {new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <button
                        onClick={() => onOpenPrintModal(bill)}
                        className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                        title={lang === 'ta' ? 'அச்சிடு / பார்' : 'Print / View'}
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
