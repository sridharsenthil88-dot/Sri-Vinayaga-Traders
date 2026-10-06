export type CustomerType = 'retail' | 'electrician' | 'engineer' | 'wholesale';

export type BillType = 'cash_bill' | 'quotation';

export type PaymentMode = 'cash' | 'upi' | 'card' | 'credit';

export type UnitType = 'Nos' | 'Mtr' | 'Box' | 'Kg' | 'Set' | 'Bundle' | 'Roll' | 'Pkt';

export interface Product {
  id: string;
  code: string;
  name: string;
  tamilName?: string;
  category: string;
  unit: UnitType;
  hsn?: string;
  purchaseRate: number; // Cost Price / வாங்கும் விலை
  mrp: number;
  retailPrice: number; // Base selling price for standard retail customer
  electricianDiscountPercent: number; // e.g. 20%
  engineerDiscountPercent: number; // e.g. 35%
  wholesaleDiscountPercent: number; // e.g. 25%
  currentStock: number;
  minStockAlert: number;
  updatedAt: string;
}

export interface BillItem {
  productId: string;
  code: string;
  name: string;
  tamilName?: string;
  unit: UnitType;
  hsn?: string;
  quantity: number;
  purchaseRate: number; // Snapshot of cost price for profit calculation
  mrp: number;
  baseRate: number; // MRP or retail base
  discountPercent: number; // Trade discount % (e.g. 35% for engineer, 20% for electrician)
  unitPrice: number; // Final selling rate after discount
  taxPercent: number;
  taxAmount: number;
  total: number;
  profit: number; // (unitPrice - purchaseRate) * quantity
}

export interface CustomerInfo {
  name: string;
  phone: string;
  address?: string;
  type: CustomerType;
  discountPercent: number;
}

export interface Invoice {
  id: string;
  billNumber: string; // e.g. "CB-2026-0001" or "QT-2026-0001"
  type: BillType; // cash_bill or quotation
  status: 'paid' | 'pending' | 'converted' | 'cancelled';
  convertedFromQuotationId?: string;
  convertedToBillId?: string;
  createdAt: string;
  customer: CustomerInfo;
  items: BillItem[];
  subtotal: number;
  totalDiscount: number;
  taxTotal: number;
  roundOff: number;
  grandTotal: number;
  totalPurchaseCost: number;
  netProfit: number;
  paymentMode: PaymentMode;
  amountReceived?: number;
  changeDue?: number;
  notes?: string;
}

export interface ShopSettings {
  shopName: string;
  shopTamilName: string;
  tagline: string;
  address: string;
  phone: string;
  whatsapp: string;
  gstin: string;
  upiId: string;
  upiPayeeName: string;
  defaultEngineerDiscount: number;
  defaultElectricianDiscount: number;
  defaultWholesaleDiscount: number;
  taxEnabled: boolean;
  defaultTaxPercent: number;
  termsEnglish: string;
  termsTamil: string;
  printFormat: 'a4' | 'thermal';
}

export type Language = 'en' | 'ta';
