import React from 'react';
import { 
  ReceiptText, 
  Package, 
  FileSpreadsheet, 
  History, 
  Settings as SettingsIcon,
  Eye,
  EyeOff,
  Languages,
  LayoutDashboard
} from 'lucide-react';
import { Language, ShopSettings } from '../types';
import { getTranslation } from '../utils/translations';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: 'dashboard' | 'pos' | 'inventory' | 'quotations' | 'history') => void;
  lang: Language;
  setLang: (lang: Language) => void;
  hideProfit: boolean;
  setHideProfit: (hide: boolean) => void;
  onOpenSettings: () => void;
  settings: ShopSettings;
  lowStockCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  lang,
  setLang,
  hideProfit,
  setHideProfit,
  onOpenSettings,
  settings,
  lowStockCount,
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key);

  return (
    <header className="border-b border-neutral-800 bg-neutral-900/95 sticky top-0 z-30 backdrop-blur-md no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-md"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg shadow-sm">
              ⚡
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white block leading-tight">
                {lang === 'ta' && settings.shopTamilName ? settings.shopTamilName : settings.shopName}
              </span>
              <span className="text-xs text-neutral-400 font-medium hidden sm:block">
                {t('appSubtitle')}
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              currentTab === 'dashboard'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-neutral-400" />
            <span>{t('dashboard')}</span>
          </button>

          <button
            onClick={() => setCurrentTab('pos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              currentTab === 'pos'
                ? 'bg-amber-500 text-neutral-950 font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <ReceiptText className="w-4 h-4" />
            <span>{t('posBilling')}</span>
          </button>

          <button
            onClick={() => setCurrentTab('inventory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap relative ${
              currentTab === 'inventory'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <Package className="w-4 h-4 text-neutral-400" />
            <span>{t('inventory')}</span>
            {lowStockCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 ml-0.5 animate-pulse" title={`${lowStockCount} low stock items`} />
            )}
          </button>

          <button
            onClick={() => setCurrentTab('quotations')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              currentTab === 'quotations'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-neutral-400" />
            <span>{t('quotations')}</span>
          </button>

          <button
            onClick={() => setCurrentTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              currentTab === 'history'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <History className="w-4 h-4 text-neutral-400" />
            <span>{t('billsHistory')}</span>
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2">
          {/* Shopkeeper profit privacy toggle */}
          <button
            onClick={() => setHideProfit(!hideProfit)}
            title={hideProfit ? t('showProfit') : t('hideProfit')}
            className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              hideProfit
                ? 'border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
            }`}
          >
            {hideProfit ? (
              <>
                <EyeOff className="w-4 h-4" />
                <span className="hidden xl:inline">{t('showProfit')}</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                <span className="hidden xl:inline">{t('netProfit')}</span>
              </>
            )}
          </button>

          {/* Bilingual English / Tamil toggle */}
          <button
            onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-800 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors"
            title={lang === 'ta' ? 'Switch to English / ஆங்கிலத்திற்கு மாற்றவும்' : 'தமிழுக்கு மாற்றவும் / Switch to Tamil'}
          >
            <Languages className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === 'en' ? 'தமிழ்' : 'English'}</span>
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title={t('settings')}
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile navigation row */}
      <div className="md:hidden flex items-center justify-around border-t border-neutral-800/80 px-2 py-2 bg-neutral-900 overflow-x-auto text-xs">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-md ${currentTab === 'dashboard' ? 'text-amber-400 font-semibold' : 'text-neutral-400'}`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>{t('dashboard')}</span>
        </button>
        <button
          onClick={() => setCurrentTab('pos')}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-md ${currentTab === 'pos' ? 'text-amber-400 font-semibold' : 'text-neutral-400'}`}
        >
          <ReceiptText className="w-4 h-4" />
          <span>{t('posBilling')}</span>
        </button>
        <button
          onClick={() => setCurrentTab('inventory')}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-md ${currentTab === 'inventory' ? 'text-amber-400 font-semibold' : 'text-neutral-400'}`}
        >
          <Package className="w-4 h-4" />
          <span>{t('inventory')}</span>
        </button>
        <button
          onClick={() => setCurrentTab('quotations')}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-md ${currentTab === 'quotations' ? 'text-amber-400 font-semibold' : 'text-neutral-400'}`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>{t('quotations')}</span>
        </button>
        <button
          onClick={() => setCurrentTab('history')}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-md ${currentTab === 'history' ? 'text-amber-400 font-semibold' : 'text-neutral-400'}`}
        >
          <History className="w-4 h-4" />
          <span>{t('billsHistory')}</span>
        </button>
      </div>
    </header>
  );
};
