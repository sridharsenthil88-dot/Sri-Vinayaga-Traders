import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { 
  Printer, 
  Share2, 
  X, 
  CheckCircle2, 
  Phone, 
  MapPin, 
  FileText
} from 'lucide-react';
import { Invoice, ShopSettings, Language } from '../types';
import { formatCurrency } from '../utils/storage';
import { getTranslation } from '../utils/translations';

interface InvoicePrintModalProps {
  invoice: Invoice;
  settings: ShopSettings;
  lang: Language;
  onClose: () => void;
  onConvertToBill?: (invoice: Invoice) => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  invoice,
  settings,
  lang,
  onClose,
  onConvertToBill,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [printFormat, setPrintFormat] = useState<'a4' | 'thermal'>(settings.printFormat || 'a4');
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key);

  const isQuotation = invoice.type === 'quotation';

  // Generate UPI QR Code
  useEffect(() => {
    if (settings.upiId && invoice.grandTotal > 0) {
      // standard UPI payment URI format
      const payeeName = encodeURIComponent(settings.upiPayeeName || settings.shopName);
      const note = encodeURIComponent(`${invoice.billNumber} ${settings.shopName}`);
      const upiUrl = `upi://pay?pa=${settings.upiId}&pn=${payeeName}&am=${invoice.grandTotal.toFixed(2)}&cu=INR&tn=${note}`;
      
      QRCode.toDataURL(upiUrl, {
        width: 140,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('QR Gen error:', err));
    }
  }, [settings.upiId, settings.upiPayeeName, settings.shopName, invoice.grandTotal, invoice.billNumber]);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const isQuote = invoice.type === 'quotation';
    let text = `*${settings.shopName}*\n`;
    text += `${settings.address} | Ph: ${settings.phone}\n`;
    text += `--------------------------------\n`;
    text += `*${isQuote ? 'ESTIMATE / QUOTATION' : 'CASH BILL / INVOICE'}*\n`;
    text += `*Doc No:* ${invoice.billNumber}\n`;
    text += `*Date:* ${new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}\n`;
    text += `*Customer:* ${invoice.customer.name} (${invoice.customer.type.toUpperCase()})\n`;
    if (invoice.customer.phone) text += `*Phone:* ${invoice.customer.phone}\n`;
    text += `--------------------------------\n`;
    invoice.items.forEach((item, idx) => {
      text += `${idx + 1}. ${item.name}\n   ${item.quantity} ${item.unit} x ₹${item.unitPrice.toFixed(2)} = *₹${item.total.toFixed(2)}*\n`;
    });
    text += `--------------------------------\n`;
    text += `Subtotal: ₹${invoice.subtotal.toFixed(2)}\n`;
    if (invoice.totalDiscount > 0) text += `Discount: -₹${invoice.totalDiscount.toFixed(2)}\n`;
    text += `*GRAND TOTAL: ₹${invoice.grandTotal.toFixed(2)}*\n`;
    if (!isQuote) {
      text += `Payment Mode: ${invoice.paymentMode.toUpperCase()}\n`;
    }
    if (settings.upiId && !isQuote) {
      text += `\n*Pay via UPI:* ${settings.upiId}\n`;
    }
    text += `\n_Thank you for your business!_`;

    const cleanPhone = invoice.customer.phone?.replace(/[^0-9]/g, '') || '';
    const phoneParam = cleanPhone.length >= 10 ? `phone=91${cleanPhone.slice(-10)}&` : '';
    window.open(`https://api.whatsapp.com/send?${phoneParam}text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      {/* Control bar at top (hidden during print) */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-neutral-900 border border-neutral-700 shadow-2xl rounded-xl px-4 py-2 flex items-center gap-3 z-50 no-print">
        {/* Format toggle */}
        <div className="flex items-center gap-1 bg-neutral-800 p-1 rounded-lg">
          <button
            onClick={() => setPrintFormat('a4')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              printFormat === 'a4'
                ? 'bg-amber-500 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {t('a4Invoice')}
          </button>
          <button
            onClick={() => setPrintFormat('thermal')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              printFormat === 'thermal'
                ? 'bg-amber-500 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {t('thermalReceipt')}
          </button>
        </div>

        <div className="h-5 w-[1px] bg-neutral-700" />

        {/* Print button */}
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-lg transition-colors shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span>{isQuotation ? t('printQuotation') : t('printBill')}</span>
        </button>

        {/* WhatsApp share */}
        <button
          onClick={handleWhatsAppShare}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm"
        >
          <Share2 className="w-4 h-4" />
          <span>{t('checkoutWhatsApp')}</span>
        </button>

        {/* Convert to bill if active quotation */}
        {isQuotation && invoice.status !== 'converted' && onConvertToBill && (
          <button
            onClick={() => onConvertToBill(invoice)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{t('convertToCashBill')}</span>
          </button>
        )}

        <button
          onClick={onClose}
          className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors ml-1"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* The Printable Container */}
      <div 
        id="printable-document" 
        className={`bg-white text-neutral-900 shadow-2xl transition-all my-16 ${
          printFormat === 'thermal' 
            ? 'w-[320px] max-w-full p-4 font-mono text-xs' 
            : 'w-[820px] max-w-full p-8 font-sans text-sm rounded-lg'
        }`}
      >
        {/* ===================== FORMAT 1: STANDARD A4 INVOICE ===================== */}
        {printFormat === 'a4' ? (
          <div>
            {/* Header Header */}
            <div className="flex items-start justify-between border-b-2 border-neutral-900 pb-5">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-neutral-950 uppercase">
                  {settings.shopName}
                </h1>
                {settings.shopTamilName && (
                  <p className="text-xs font-semibold text-neutral-700 mt-0.5">
                    {settings.shopTamilName}
                  </p>
                )}
                <p className="text-xs text-neutral-600 mt-1 max-w-md font-medium">
                  {settings.tagline}
                </p>
                <div className="text-xs text-neutral-600 mt-2 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <span>{settings.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <span>{lang === 'ta' ? 'தொலைபேசி:' : 'Ph:'} {settings.phone} | WhatsApp: {settings.whatsapp}</span>
                  </div>
                  {settings.gstin && (
                    <div className="font-semibold text-neutral-800">
                      GSTIN: {settings.gstin}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className={`inline-block px-3 py-1 font-bold text-xs uppercase tracking-wider rounded ${
                  isQuotation ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-neutral-900 text-white'
                }`}>
                  {isQuotation ? (lang === 'ta' ? 'மதிப்பீடு / விலைப்புள்ளி' : 'ESTIMATE / QUOTATION') : (lang === 'ta' ? 'ரொக்க விற்பனை பில்' : 'RETAIL CASH BILL')}
                </div>
                <div className="mt-3 text-xs space-y-1">
                  <div>
                    <span className="text-neutral-500">{isQuotation ? t('quoteNo') : t('billNo')}: </span>
                    <span className="font-bold text-neutral-950 font-mono-numbers">{invoice.billNumber}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">{t('date')}: </span>
                    <span className="font-medium text-neutral-900 font-mono-numbers">
                      {new Date(invoice.createdAt).toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {!isQuotation && (
                    <div>
                      <span className="text-neutral-500">{t('paymentMode')}: </span>
                      <span className="font-semibold text-neutral-900 uppercase">{t(invoice.paymentMode)}</span>
                    </div>
                  )}
                  {isQuotation && (
                    <div className="text-amber-800 font-medium">
                      {t('status')}: {invoice.status === 'converted' ? t('converted') : (lang === 'ta' ? '7 நாட்களுக்கு செல்லுபடியாகும்' : 'Valid for 7 Days')}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Details Box */}
            <div className="mt-4 p-3.5 bg-neutral-50 border border-neutral-200 rounded-lg flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
                  {lang === 'ta' ? 'பெறுநர் / வாடிக்கையாளர் விவரம்' : 'Billed To / Customer Details'}
                </span>
                <h3 className="text-sm font-bold text-neutral-950 mt-0.5">
                  {invoice.customer.name || (lang === 'ta' ? 'நேரடி வாடிக்கையாளர்' : 'Walk-in Customer')}
                </h3>
                {invoice.customer.phone && (
                  <p className="text-xs text-neutral-600 font-mono-numbers">
                    {t('phone')}: {invoice.customer.phone}
                  </p>
                )}
                {invoice.customer.address && (
                  <p className="text-xs text-neutral-600">
                    {t('shopAddress')}: {invoice.customer.address}
                  </p>
                )}
              </div>

              <div className="text-right">
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
                  {lang === 'ta' ? 'வாடிக்கையாளர் வகை' : 'Customer Tier'}
                </span>
                <span className="inline-block mt-0.5 px-2 py-0.5 text-xs font-bold rounded bg-neutral-200 text-neutral-800 capitalize">
                  {t(invoice.customer.type)} {invoice.customer.discountPercent > 0 && `(${invoice.customer.discountPercent}% ${lang === 'ta' ? 'தள்ளுபடி' : 'Off'})`}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <div className="mt-5">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-neutral-900 bg-neutral-100 text-neutral-900">
                    <th className="py-2.5 px-2 text-center w-10 font-bold">#</th>
                    <th className="py-2.5 px-2 font-bold">{t('item')}</th>
                    <th className="py-2.5 px-2 text-center w-14 font-bold">{lang === 'ta' ? 'அலகு' : 'Unit'}</th>
                    <th className="py-2.5 px-2 text-right w-16 font-bold">{t('qty')}</th>
                    <th className="py-2.5 px-2 text-right w-20 font-bold">{lang === 'ta' ? 'MRP / விலை' : 'MRP / Rate'}</th>
                    <th className="py-2.5 px-2 text-right w-16 font-bold">{t('discount')}</th>
                    <th className="py-2.5 px-2 text-right w-20 font-bold">{lang === 'ta' ? 'நிகர விலை' : 'Net Price'}</th>
                    <th className="py-2.5 px-2 text-right w-24 font-bold">{t('amount')} (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {invoice.items.map((item, index) => (
                    <tr key={index} className="hover:bg-neutral-50">
                      <td className="py-2.5 px-2 text-center text-neutral-500 font-mono-numbers">{index + 1}</td>
                      <td className="py-2.5 px-2">
                        <div className="font-semibold text-neutral-950">{item.name}</div>
                        {item.tamilName && (
                          <div className="text-[11px] text-neutral-600">{item.tamilName}</div>
                        )}
                        <div className="text-[10px] text-neutral-400 font-mono">{t('code')}: {item.code} {item.hsn && `· HSN: ${item.hsn}`}</div>
                      </td>
                      <td className="py-2.5 px-2 text-center text-neutral-600">{item.unit}</td>
                      <td className="py-2.5 px-2 text-right font-bold text-neutral-950 font-mono-numbers">{item.quantity}</td>
                      <td className="py-2.5 px-2 text-right text-neutral-600 font-mono-numbers">₹{item.baseRate.toFixed(2)}</td>
                      <td className="py-2.5 px-2 text-right font-medium text-emerald-700 font-mono-numbers">
                        {item.discountPercent > 0 ? `${item.discountPercent}%` : '-'}
                      </td>
                      <td className="py-2.5 px-2 text-right font-semibold text-neutral-950 font-mono-numbers">₹{item.unitPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-2 text-right font-bold text-neutral-950 font-mono-numbers">₹{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations & QR Section */}
            <div className="mt-5 pt-4 border-t-2 border-neutral-900 grid grid-cols-2 gap-6 items-start">
              {/* Left Column: QR code for instant UPI payment + Bank Info */}
              <div className="space-y-3">
                {qrDataUrl && !isQuotation && (
                  <div className="flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                    <img 
                      src={qrDataUrl} 
                      alt="UPI QR Code" 
                      className="w-24 h-24 shrink-0 border border-neutral-300 rounded" 
                    />
                    <div>
                      <span className="text-[11px] font-bold text-neutral-800 uppercase block tracking-wider">
                        {t('scanToPay')}
                      </span>
                      <p className="text-[11px] text-neutral-600 mt-0.5">
                        GPay / PhonePe / Paytm / BHIM
                      </p>
                      <p className="text-xs font-bold text-neutral-900 mt-1 font-mono">
                        {settings.upiId}
                      </p>
                      <p className="text-[10px] text-neutral-500 mt-0.5">
                        {t('amount')}: <strong className="font-mono-numbers">₹{invoice.grandTotal.toFixed(2)}</strong>
                      </p>
                    </div>
                  </div>
                )}

                {isQuotation && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <FileText className="w-4 h-4 text-amber-700" />
                      <span>Quotation / மதிப்பீடு குறிப்பு</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      {t('quotationNote')}
                    </p>
                  </div>
                )}

                {/* Terms and Conditions */}
                <div className="text-[10px] text-neutral-500 space-y-0.5 pt-1">
                  <div className="font-semibold text-neutral-700">{t('termsTitle')}:</div>
                  <div>{lang === 'ta' ? settings.termsTamil : settings.termsEnglish}</div>
                </div>
              </div>

              {/* Right Column: Financial Totals */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-2 text-xs">
                <div className="flex justify-between text-neutral-600">
                    <span>{t('subtotal')}:</span>
                  <span className="font-mono-numbers font-semibold text-neutral-900">₹{invoice.subtotal.toFixed(2)}</span>
                </div>

                {invoice.totalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>{lang === 'ta' ? 'வாடிக்கையாளர் தள்ளுபடி' : 'Trade Discount'} ({t(invoice.customer.type)}):</span>
                    <span className="font-mono-numbers">-₹{invoice.totalDiscount.toFixed(2)}</span>
                  </div>
                )}

                {invoice.taxTotal > 0 && (
                  <div className="flex justify-between text-neutral-600">
                    <span>{t('tax')}:</span>
                    <span className="font-mono-numbers">₹{invoice.taxTotal.toFixed(2)}</span>
                  </div>
                )}

                {invoice.roundOff !== 0 && (
                  <div className="flex justify-between text-neutral-500">
                    <span>{t('roundOff')}:</span>
                    <span className="font-mono-numbers">{invoice.roundOff > 0 ? `+₹${invoice.roundOff.toFixed(2)}` : `-₹${Math.abs(invoice.roundOff).toFixed(2)}`}</span>
                  </div>
                )}

                <div className="border-t-2 border-neutral-900 pt-2.5 mt-2 flex justify-between items-baseline">
                  <span className="text-sm font-black text-neutral-950 uppercase">{t('grandTotal')}:</span>
                  <span className="text-xl font-black text-neutral-950 font-mono-numbers">
                    ₹{invoice.grandTotal.toFixed(2)}
                  </span>
                </div>

                {!isQuotation && (
                  <div className="pt-2 border-t border-neutral-200 text-[11px] text-neutral-600 flex justify-between">
                    <span>{lang === 'ta' ? 'பெறப்பட்ட கட்டணம்' : 'Payment Received via'} <strong className="uppercase">{t(invoice.paymentMode)}</strong>:</span>
                    <span className="font-bold text-neutral-950 font-mono-numbers">₹{invoice.grandTotal.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Signatures & Footer */}
            <div className="mt-8 pt-6 border-t border-neutral-200 flex justify-between items-end text-xs">
              <div className="text-neutral-500 text-[11px]">
                <p className="font-semibold text-neutral-700">{t('thankYou')}</p>
                <p>{lang === 'ta' ? 'கணினியில் உருவாக்கப்பட்ட பில்; கையொப்பம் தேவையில்லை.' : 'Computer generated invoice, no physical signature required.'}</p>
              </div>

              <div className="text-center">
                <div className="w-44 border-b border-neutral-900 mb-1.5 h-10"></div>
                <span className="text-neutral-700 font-bold text-[11px] block">{t('authorizedSign')}</span>
                <span className="text-neutral-500 text-[10px]">For {settings.shopName}</span>
              </div>
            </div>
          </div>
        ) : (
          /* ===================== FORMAT 2: 80MM THERMAL RECEIPT ===================== */
          <div className="text-neutral-950 leading-tight">
            {/* Header */}
            <div className="text-center border-b border-dashed border-neutral-600 pb-3">
              <h2 className="text-base font-black uppercase tracking-tight">{settings.shopName}</h2>
              {settings.shopTamilName && (
                <div className="text-[10px] font-semibold">{settings.shopTamilName}</div>
              )}
              <div className="text-[10px] mt-1">{settings.address}</div>
              <div className="text-[10px]">{t('phone')}: {settings.phone}</div>
              {settings.gstin && <div className="text-[10px] font-bold">GSTIN: {settings.gstin}</div>}
              <div className="mt-2 text-xs font-black uppercase border border-neutral-950 py-0.5 px-2 inline-block">
                {isQuotation ? (lang === 'ta' ? 'மதிப்பீடு மட்டும்' : 'ESTIMATE ONLY') : t('cashBill')}
              </div>
            </div>

            {/* Doc Info */}
            <div className="py-2 border-b border-dashed border-neutral-600 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span>{isQuotation ? t('quoteNo') : t('billNo')}: {invoice.billNumber}</span>
                <span>{new Date(invoice.createdAt).toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN', { day: '2-digit', month: 'short' })}</span>
              </div>
              <div>{t('customer')}: {invoice.customer.name}</div>
              {invoice.customer.phone && <div>{t('phone')}: {invoice.customer.phone}</div>}
              <div>{t('tier')}: {t(invoice.customer.type)} ({invoice.customer.discountPercent}%)</div>
            </div>

            {/* Items */}
            <div className="py-2 border-b border-dashed border-neutral-600">
              <div className="flex justify-between text-[10px] font-bold border-b border-neutral-400 pb-1 mb-1">
                <span>{t('item')}</span>
                <span>{t('qty')} x {t('rate')}</span>
                <span>{t('total')}</span>
              </div>
              <div className="space-y-1 text-[11px]">
                {invoice.items.map((it, idx) => (
                  <div key={idx}>
                    <div className="font-bold truncate">{it.name}</div>
                    <div className="flex justify-between text-neutral-700">
                      <span>{it.quantity} {it.unit} @ ₹{it.unitPrice.toFixed(2)}</span>
                      <span className="font-bold font-mono-numbers">₹{it.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="py-2 border-b border-dashed border-neutral-600 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span>{t('subtotal')}:</span>
                <span className="font-mono-numbers">₹{invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.totalDiscount > 0 && (
                <div className="flex justify-between font-semibold">
                  <span>{t('discount')} ({t(invoice.customer.type)}):</span>
                  <span className="font-mono-numbers">-₹{invoice.totalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black border-t border-neutral-900 pt-1">
                <span>{t('grandTotal')}:</span>
                <span className="font-mono-numbers">₹{invoice.grandTotal.toFixed(2)}</span>
              </div>
              {!isQuotation && (
                <div className="flex justify-between text-[10px] text-neutral-600">
                  <span>{lang === 'ta' ? 'செலுத்திய முறை:' : 'Paid By:'}</span>
                  <span className="uppercase font-bold">{t(invoice.paymentMode)}</span>
                </div>
              )}
            </div>

            {/* QR on thermal */}
            {qrDataUrl && !isQuotation && (
              <div className="py-3 text-center border-b border-dashed border-neutral-600">
                <img src={qrDataUrl} alt="UPI QR" className="w-28 h-28 mx-auto border border-neutral-300" />
                <div className="text-[10px] font-bold mt-1">UPI: {settings.upiId}</div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-3 text-center text-[10px] text-neutral-600 space-y-0.5">
              <div>{t('thankYou')}</div>
              <div>Goods once sold cannot be returned</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
