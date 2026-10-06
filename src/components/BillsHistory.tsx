import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Printer, 
  Share2, 
  Calendar, 
  Filter, 
  CheckCircle2, 
  AlertCircle,
  CreditCard,
  Smartphone,
  Banknote,
  DollarSign
} from 'lucide-react';
import { Invoice, PaymentMode, Language, ShopSettings } from '../types';
import { formatCurrency } from '../utils/storage';
import { getTranslation } from '../utils/translations';

interface BillsHistoryProps {
  invoices: Invoice[];
  settings: ShopSettings;
  lang: Language;
  hideProfit: boolean;
  onOpenPrintModal: (invoice: Invoice) => void;
}

export const BillsHistory: React.FC<BillsHistoryProps> = ({
  invoices,
  settings,
  lang,
  hideProfit,
  onOpenPrintModal,
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'week' | 'all'>('all');

  // Filter only cash sales bills
  const salesBills = useMemo(() => {
    return invoices.filter(inv => inv.type === 'cash_bill');
  }, [invoices]);

  // Apply filters
  const filteredBills = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = startOfToday - 7 * 86400000;

    return salesBills.filter(bill => {
      const billTime = new Date(bill.createdAt).getTime();

      // Period filter
      if (filterPeriod === 'today' && billTime < startOfToday) return false;
      if (filterPeriod === 'week' && billTime < startOfWeek) return false;

      // Payment filter
      if (filterPayment !== 'all' && bill.paymentMode !== filterPayment) return false;

      // Search query
      if (!q) return true;
      return (
        bill.billNumber.toLowerCase().includes(q) ||
        bill.customer.name.toLowerCase().includes(q) ||
        (bill.customer.phone && bill.customer.phone.includes(q))
      );
    });
  }, [salesBills, searchQuery, filterPayment, filterPeriod]);

  // Aggregate stats
  const stats = useMemo(() => {
    let totalSales = 0;
    let cashSales = 0;
    let upiSales = 0;
    let creditSales = 0;
    let totalProfit = 0;

    filteredBills.forEach(b => {
      totalSales += b.grandTotal;
      if (b.paymentMode === 'cash') cashSales += b.grandTotal;
      else if (b.paymentMode === 'upi') upiSales += b.grandTotal;
      else if (b.paymentMode === 'credit') creditSales += b.grandTotal;
      totalProfit += b.netProfit || 0;
    });

    return {
      totalSales,
      cashSales,
      upiSales,
      creditSales,
      totalProfit,
      count: filteredBills.length,
    };
  }, [filteredBills]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4">
      {/* Top Banner & Financial Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Sales */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 sm:p-4 shadow-sm">
          <span className="text-xs font-semibold text-neutral-400 block">{t('totalSales')}</span>
          <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono-numbers mt-2">
            {formatCurrency(stats.totalSales)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1 font-mono-numbers">
            {stats.count} {t('billsRecorded')}
          </div>
        </div>

        {/* UPI Sales */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">UPI / GPay</span>
            <Smartphone className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-400 font-mono-numbers mt-2">
            {formatCurrency(stats.upiSales)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            {t('bankTransfersQr')}
          </div>
        </div>

        {/* Cash Sales */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">{lang === 'ta' ? 'ரொக்க விற்பனை' : 'Cash Sales'}</span>
            <Banknote className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono-numbers mt-2">
            {formatCurrency(stats.cashSales)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            {t('counterCash')}
          </div>
        </div>

        {/* Net Profit (Shopkeeper Only) */}
        {!hideProfit ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-400">{t('netProfit')}</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-300 font-mono-numbers mt-2">
              {formatCurrency(stats.totalProfit)}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              {t('salesLessCost')}
            </div>
          </div>
        ) : (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-400">{t('credit')}</span>
              <AlertCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono-numbers mt-2">
              {formatCurrency(stats.creditSales)}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              {t('pendingCredit')}
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('searchBillsPlaceholder')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Period filter */}
        <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs">
          <button
            onClick={() => setFilterPeriod('today')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              filterPeriod === 'today' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            {t('today')}
          </button>
          <button
            onClick={() => setFilterPeriod('week')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              filterPeriod === 'week' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            {t('sevenDays')}
          </button>
          <button
            onClick={() => setFilterPeriod('all')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              filterPeriod === 'all' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            {t('all')}
          </button>
        </div>

        {/* Payment mode filter */}
        <select
          value={filterPayment}
          onChange={e => setFilterPayment(e.target.value)}
          className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
        >
          <option value="all">{t('allPayments')}</option>
          <option value="cash">{t('cashOnly')}</option>
          <option value="upi">{t('upiOnly')}</option>
          <option value="card">{t('cardOnly')}</option>
          <option value="credit">{t('creditOnly')}</option>
        </select>
      </div>

      {/* Bills Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800">
              <tr>
                <th className="py-3 px-3 font-semibold w-28">{t('billNo')}</th>
                <th className="py-3 px-3 font-semibold">{t('dateTime')}</th>
                <th className="py-3 px-3 font-semibold">{t('customer')}</th>
                <th className="py-3 px-2 font-semibold">{t('tier')}</th>
                <th className="py-3 px-2 font-semibold">{t('items')}</th>
                <th className="py-3 px-3 font-semibold text-center w-24">{t('payment')}</th>
                <th className="py-3 px-3 font-semibold text-right w-28">{t('grandTotal')}</th>
                {!hideProfit && (
                  <th className="py-3 px-3 font-semibold text-right w-24 text-emerald-400">
                    {t('netProfit')}
                  </th>
                )}
                <th className="py-3 px-3 font-semibold text-center w-24">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-neutral-500">
                    {t('noSalesBills')}
                  </td>
                </tr>
              ) : (
                filteredBills.map(bill => (
                  <tr key={bill.id} className="hover:bg-neutral-800/40 transition-colors">
                    {/* Bill No */}
                    <td className="py-3 px-3 font-mono font-bold text-amber-400">
                      {bill.billNumber}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-3 text-neutral-400 font-mono-numbers">
                      {new Date(bill.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white">{bill.customer.name}</div>
                      {bill.customer.phone && (
                        <div className="text-[10px] text-neutral-400 font-mono">{bill.customer.phone}</div>
                      )}
                    </td>

                    {/* Tier */}
                    <td className="py-3 px-2">
                      <span className="capitalize text-[11px] text-neutral-300 font-medium">
                        {t(bill.customer.type)}
                      </span>
                    </td>

                    {/* Items count */}
                    <td className="py-3 px-2 text-neutral-400 font-mono-numbers">
                      {bill.items.length} {t('items')}
                    </td>

                    {/* Payment mode */}
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        bill.paymentMode === 'cash'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : bill.paymentMode === 'upi'
                          ? 'bg-blue-950 text-blue-400 border border-blue-800'
                          : bill.paymentMode === 'card'
                          ? 'bg-purple-950 text-purple-400 border border-purple-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {t(bill.paymentMode)}
                      </span>
                    </td>

                    {/* Grand Total */}
                    <td className="py-3 px-3 text-right font-mono-numbers font-black text-amber-400 text-sm">
                      ₹{bill.grandTotal.toFixed(2)}
                    </td>

                    {/* Net Profit */}
                    {!hideProfit && (
                      <td className="py-3 px-3 text-right font-mono-numbers font-semibold text-emerald-400">
                        ₹{(bill.netProfit || 0).toFixed(2)}
                      </td>
                    )}

                    {/* Actions */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onOpenPrintModal(bill)}
                          className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                          title={t('viewPrintBill')}
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
