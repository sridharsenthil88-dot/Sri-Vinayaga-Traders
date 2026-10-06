import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  Download, 
  Upload, 
  RotateCcw, 
  X,
  Store,
  Percent,
  QrCode,
  Printer
} from 'lucide-react';
import { ShopSettings, Product, Invoice, Language } from '../types';
import { resetToInitialDemoData } from '../utils/storage';
import { getTranslation } from '../utils/translations';

interface SettingsModalProps {
  settings: ShopSettings;
  lang: Language;
  products: Product[];
  invoices: Invoice[];
  onSaveSettings: (settings: ShopSettings) => void;
  onResetData: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  lang,
  products,
  invoices,
  onSaveSettings,
  onResetData,
  onClose,
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key);
  const [formData, setFormData] = useState<ShopSettings>({ ...settings });
  const [activeTab, setActiveTab] = useState<'profile' | 'discounts' | 'print' | 'backup'>('profile');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    onClose();
  };

  // Export JSON backup
  const handleExportBackup = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: formData,
      products,
      invoices,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vetri_pos_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.settings) onSaveSettings(data.settings);
        if (data.products && Array.isArray(data.products)) {
          localStorage.setItem('vetri_pos_products_v1', JSON.stringify(data.products));
        }
        if (data.invoices && Array.isArray(data.invoices)) {
          localStorage.setItem('vetri_pos_invoices_v1', JSON.stringify(data.invoices));
        }
        alert(t('backupRestored'));
        window.location.reload();
      } catch (err) {
        alert(t('invalidBackup'));
      }
    };
    reader.readAsText(file);
  };

  // Reset to initial sample data
  const handleResetSampleData = () => {
    if (confirm(t('resetDataConfirm'))) {
      resetToInitialDemoData();
      onResetData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-6">
        {/* Modal Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-white">
              {t('settingsTitle')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 text-sm rounded hover:bg-neutral-800"
          >
            ✕
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center border-b border-neutral-800 bg-neutral-950 px-4 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>{t('shopProfileUpi')}</span>
          </button>

          <button
            onClick={() => setActiveTab('discounts')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'discounts'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Percent className="w-4 h-4" />
            <span>{t('tierDiscounts')} %</span>
          </button>

          <button
            onClick={() => setActiveTab('print')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'print'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>{t('printTerms')}</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'backup'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>{t('backupData')}</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* TAB 1: SHOP PROFILE & UPI */}
          {activeTab === 'profile' && (
            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-300 block mb-1">
                    {t('shopNameEnglish')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.shopName}
                    onChange={e => setFormData({ ...formData, shopName: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-300 block mb-1">
                    {t('shopNameTamil')}
                  </label>
                  <input
                    type="text"
                    value={formData.shopTamilName}
                    onChange={e => setFormData({ ...formData, shopTamilName: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-300 block mb-1">
                    {t('businessNature')}
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-300 block mb-1">
                    {t('shopAddress')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-neutral-300 block mb-1">
                    {t('phoneNumber')}
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-300 block mb-1">
                    {t('whatsappNumber')}
                  </label>
                  <input
                    type="text"
                    value={formData.whatsapp}
                    onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-300 block mb-1">
                    GSTIN (விருப்பம்)
                  </label>
                  <input
                    type="text"
                    placeholder="33AAAAA0000A1Z5"
                    value={formData.gstin}
                    onChange={e => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* UPI Configuration */}
              <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <QrCode className="w-4 h-4" />
                  <span>{t('upiQrSetup')}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1">
                      {t('upiIdLabel')} *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. yourshop@okaxis"
                      value={formData.upiId}
                      onChange={e => setFormData({ ...formData, upiId: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1">
                      {t('upiPayeeLabel')}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sri Vinayaga Traders"
                      value={formData.upiPayeeName}
                      onChange={e => setFormData({ ...formData, upiPayeeName: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-neutral-400">
                  {t('upiSetupHelp')}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: TIER DISCOUNTS */}
          {activeTab === 'discounts' && (
            <div className="space-y-4 text-xs">
              <p className="text-neutral-400 leading-relaxed">
                {t('discountSettingsHelp')}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Engineer / Contractor (35%) */}
                <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-2">
                  <span className="font-bold text-amber-400 block text-sm">
                    📐 {t('engineer')}
                  </span>
                  <label className="text-[11px] text-neutral-400 block">
                    {t('defaultDiscount')} % (e.g. 35%)
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      min="0"
                      max="90"
                      value={formData.defaultEngineerDiscount}
                      onChange={e => setFormData({ ...formData, defaultEngineerDiscount: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm font-bold font-mono-numbers text-amber-300 focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-sm text-neutral-400 ml-2">%</span>
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    {lang === 'ta' ? 'MRP / சில்லறை விலையில் இன்ஜினியர்களுக்கு தள்ளுபடி வழங்கப்படும்.' : 'This discount is applied to the MRP or retail price for engineers.'}
                  </p>
                </div>

                {/* Electrician (20%) */}
                <div className="p-4 bg-blue-950/20 border border-blue-500/30 rounded-xl space-y-2">
                  <span className="font-bold text-blue-400 block text-sm">
                    ⚡ {t('electrician')}
                  </span>
                  <label className="text-[11px] text-neutral-400 block">
                    {t('defaultDiscount')} % (e.g. 20%)
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      min="0"
                      max="90"
                      value={formData.defaultElectricianDiscount}
                      onChange={e => setFormData({ ...formData, defaultElectricianDiscount: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm font-bold font-mono-numbers text-blue-300 focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-sm text-neutral-400 ml-2">%</span>
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    {lang === 'ta' ? 'எலக்ட்ரீசியன்கள் மற்றும் மின்சாரப் பணியாளர்களுக்கான தள்ளுபடி.' : 'Trade discount for electricians and electrical mechanics.'}
                  </p>
                </div>

                {/* Wholesale (25%) */}
                <div className="p-4 bg-purple-950/20 border border-purple-500/30 rounded-xl space-y-2">
                  <span className="font-bold text-purple-400 block text-sm">
                    📦 {t('wholesale')}
                  </span>
                  <label className="text-[11px] text-neutral-400 block">
                    {t('defaultDiscount')} % (e.g. 25%)
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      min="0"
                      max="90"
                      value={formData.defaultWholesaleDiscount}
                      onChange={e => setFormData({ ...formData, defaultWholesaleDiscount: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm font-bold font-mono-numbers text-purple-300 focus:outline-none focus:border-purple-500"
                    />
                    <span className="text-sm text-neutral-400 ml-2">%</span>
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    {lang === 'ta' ? 'மொத்த விநியோகம் மற்றும் ஒப்பந்ததாரர்களுக்கான விலை.' : 'Bulk supply and contractor trade rate.'}
                  </p>
                </div>
              </div>

              {/* Tax configuration */}
              <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-xs">{t('taxSettings')}</div>
                    <div className="text-[11px] text-neutral-400">
                      {t('taxSettingsHelp')}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.taxEnabled}
                    onChange={e => setFormData({ ...formData, taxEnabled: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRINT & TERMS */}
          {activeTab === 'print' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-neutral-300 block mb-1">
                  {t('defaultPrintFormat')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, printFormat: 'a4' })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      formData.printFormat === 'a4'
                        ? 'bg-neutral-800 border-amber-500 text-white'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <span className="font-bold block text-sm">{t('standardA4')}</span>
                    <span className="text-[11px] text-neutral-400">{t('detailedInvoice')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, printFormat: 'thermal' })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      formData.printFormat === 'thermal'
                        ? 'bg-neutral-800 border-amber-500 text-white'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <span className="font-bold block text-sm">{t('thermalReceipt')}</span>
                    <span className="text-[11px] text-neutral-400">{t('thermalReceiptDescription')}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-300 block mb-1">
                  {t('termsEnglish')}
                </label>
                <textarea
                  rows={2}
                  value={formData.termsEnglish}
                  onChange={e => setFormData({ ...formData, termsEnglish: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-300 block mb-1">
                  {t('termsTamil')}
                </label>
                <textarea
                  rows={2}
                  value={formData.termsTamil}
                  onChange={e => setFormData({ ...formData, termsTamil: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {/* TAB 4: BACKUP & DATA */}
          {activeTab === 'backup' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                <span className="font-bold text-white block text-sm">
                  {lang === 'ta' ? 'தரவு காப்புப்பிரதியை ஏற்றுமதி செய் (JSON)' : 'Export Data Backup (JSON)'}
                </span>
                <p className="text-neutral-400">
                  {lang === 'ta' ? 'சரக்கு, விலை, அமைப்புகள் மற்றும் விற்பனை பில்களை காப்புப்பிரதி கோப்பாகப் பதிவிறக்கவும்.' : 'Download inventory, pricing, settings, and sales bills into an offline backup file.'}
                </p>
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-lg border border-neutral-700 transition-colors"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>{lang === 'ta' ? 'காப்புப்பிரதியைப் பதிவிறக்கு' : 'Download Backup JSON'}</span>
                </button>
              </div>

              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                <span className="font-bold text-white block text-sm">
                  {lang === 'ta' ? 'JSON காப்புப்பிரதியிலிருந்து மீட்டமை' : 'Restore from JSON Backup'}
                </span>
                <p className="text-neutral-400">
                  {lang === 'ta' ? 'முன்பு ஏற்றுமதி செய்த கோப்பிலிருந்து பொருட்கள் மற்றும் பில்களை மீட்டமைக்கவும்.' : 'Import a previously exported backup file to restore products and bills.'}
                </p>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-lg border border-neutral-700 transition-colors cursor-pointer">
                  <Upload className="w-4 h-4 text-blue-400" />
                  <span>{lang === 'ta' ? 'மீட்டமைக்க JSON கோப்பைத் தேர்ந்தெடு' : 'Select JSON File to Restore'}</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="p-4 bg-rose-950/20 border border-rose-500/30 rounded-xl space-y-2">
                <span className="font-bold text-rose-300 block text-sm">
                  {lang === 'ta' ? 'மாதிரி தரவுக்கு மீட்டமை' : 'Reset to Original Sample Data'}
                </span>
                <p className="text-neutral-400">
                  {lang === 'ta' ? 'பொருட்கள், சரக்கு அளவுகள் மற்றும் மாதிரி விலைப்புள்ளிகளை ஆரம்ப நிலைக்கு மீட்டமைக்கவும்.' : 'Reset products, stock counts, and sample quotations to the original shop defaults.'}
                </p>
                <button
                  type="button"
                  onClick={handleResetSampleData}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-900/60 hover:bg-rose-900 text-rose-200 font-semibold rounded-lg border border-rose-700 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{lang === 'ta' ? 'மாதிரி சரக்கு & தரவை மீட்டமை' : 'Reset All Sample Stock & Data'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-lg transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{lang === 'ta' ? 'அமைப்புகளைச் சேமி' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
