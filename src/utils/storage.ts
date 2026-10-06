import { Product, Invoice, ShopSettings, CustomerType } from '../types';

const STORAGE_KEYS = {
  PRODUCTS: 'vetri_pos_products_v1',
  INVOICES: 'vetri_pos_invoices_v1',
  SETTINGS: 'vetri_pos_settings_v1',
  LANGUAGE: 'vetri_pos_language_v1',
  HIDE_PROFIT: 'vetri_pos_hide_profit_v1',
};

export const INITIAL_SETTINGS: ShopSettings = {
  shopName: 'Sri Vinayaga Traders',
  shopTamilName: 'ஸ்ரீ விநாயகா டிரேடர்ஸ்',
  tagline: 'Electrical Products Wholesaler',
  address: 'Kondappanaickenpatti, Tamil Nadu',
  phone: '',
  whatsapp: '99446 86696',
  gstin: '',
  upiId: '',
  upiPayeeName: 'Sri Vinayaga Traders',
  defaultEngineerDiscount: 35, // 35% as requested by user
  defaultElectricianDiscount: 20, // 20% standard electrician commission
  defaultWholesaleDiscount: 25,
  taxEnabled: false, // Default simple cash bill (can be enabled in settings)
  defaultTaxPercent: 18,
  termsEnglish: '1. Goods once sold will not be taken back without cash bill. 2. Guarantee & warranty as per manufacturer policy. 3. Disputes subject to local jurisdiction.',
  termsTamil: '1. ரசீது இன்றி விற்கப்பட்ட பொருட்கள் திரும்ப பெறப்பட மாட்டாது. 2. கம்பெனி உத்தரவாதம் மட்டுமே பொருந்தும். 3. அனைத்து தகராறுகளும் உள்ளூர் எல்லைக்கு உட்பட்டவை.',
  printFormat: 'a4',
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    code: 'FIN-1.5-RED',
    name: 'Finolex 1.5 sq mm FR PVC Insulated Wire (Red - 90m)',
    tamilName: 'பினோலெக்ஸ் 1.5 ஒயர் (சிவப்பு - 90மீ)',
    category: 'Wires & Cables',
    unit: 'Roll',
    hsn: '8544',
    purchaseRate: 1180,
    mrp: 1950,
    retailPrice: 1650,
    electricianDiscountPercent: 20,
    engineerDiscountPercent: 35,
    wholesaleDiscountPercent: 25,
    currentStock: 28,
    minStockAlert: 10,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-2',
    code: 'FIN-2.5-BLU',
    name: 'Finolex 2.5 sq mm FR Wire (Blue - 90m)',
    tamilName: 'பினோலெக்ஸ் 2.5 ஒயர் (நீலம் - 90மீ)',
    category: 'Wires & Cables',
    unit: 'Roll',
    hsn: '8544',
    purchaseRate: 1850,
    mrp: 3100,
    retailPrice: 2600,
    electricianDiscountPercent: 20,
    engineerDiscountPercent: 35,
    wholesaleDiscountPercent: 25,
    currentStock: 18,
    minStockAlert: 8,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-3',
    code: 'RR-1.0-GRN',
    name: 'RR Kabel 1.0 sq mm Flamex Wire (Green - 90m)',
    tamilName: 'ஆர்.ஆர் கேபிள் 1.0 ஒயர் (பச்சை - 90மீ)',
    category: 'Wires & Cables',
    unit: 'Roll',
    hsn: '8544',
    purchaseRate: 820,
    mrp: 1400,
    retailPrice: 1180,
    electricianDiscountPercent: 20,
    engineerDiscountPercent: 35,
    wholesaleDiscountPercent: 25,
    currentStock: 24,
    minStockAlert: 10,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-4',
    code: 'ANC-ROM-SW1',
    name: 'Anchor Roma 6A 1-Way Modular Switch (White)',
    tamilName: 'ஆங்கர் ரோமா 6A சுவிட்ச் (வெள்ளை)',
    category: 'Switches & Sockets',
    unit: 'Nos',
    hsn: '8536',
    purchaseRate: 21,
    mrp: 42,
    retailPrice: 35,
    electricianDiscountPercent: 20,
    engineerDiscountPercent: 35,
    wholesaleDiscountPercent: 25,
    currentStock: 240,
    minStockAlert: 50,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-5',
    code: 'ANC-ROM-SK16',
    name: 'Anchor Roma 16A 3-Pin Combined Power Socket',
    tamilName: 'ஆங்கர் ரோமா 16A பவர் சாக்கெட்',
    category: 'Switches & Sockets',
    unit: 'Nos',
    hsn: '8536',
    purchaseRate: 65,
    mrp: 125,
    retailPrice: 105,
    electricianDiscountPercent: 20,
    engineerDiscountPercent: 35,
    wholesaleDiscountPercent: 25,
    currentStock: 85,
    minStockAlert: 20,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-6',
    code: 'LEG-ART-SW1',
    name: 'Legrand Arteor 6A 1-Way Modular Switch (Pearl White)',
    tamilName: 'லெக்ராண்ட் ஆர்டியோர் 6A சுவிட்ச்',
    category: 'Switches & Sockets',
    unit: 'Nos',
    hsn: '8536',
    purchaseRate: 48,
    mrp: 96,
    retailPrice: 82,
    electricianDiscountPercent: 20,
    engineerDiscountPercent: 35,
    wholesaleDiscountPercent: 25,
    currentStock: 110,
    minStockAlert: 30,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-7',
    code: 'PHI-LED-9W',
    name: 'Philips Stellar 9W Cool Day LED Bulb (B22)',
    tamilName: 'பிலிப்ஸ் 9W எல்இடி பல்ப்',
    category: 'LED & Lighting',
    unit: 'Nos',
    hsn: '8539',
    purchaseRate: 52,
    mrp: 120,
    retailPrice: 95,
    electricianDiscountPercent: 20,
    engineerDiscountPercent: 35,
    wholesaleDiscountPercent: 25,
    currentStock: 140,
    minStockAlert: 40,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-8',
    code: 'HAV-BAT-20W',
    name: 'Havells 20W LED Slim Batten Tube Light (4ft)',
    tamilName: 'ஹேவல்ஸ் 20W ட்யூப் லைட் (4 அடி)',
    category: 'LED & Lighting',
    unit: 'Nos',
    hsn: '8539',
    purchaseRate: 165,
    mrp: 395,
    retailPrice: 290,
    electricianDiscountPercent: 20,
    engineerDiscountPercent: 35,
    wholesaleDiscountPercent: 25,
    currentStock: 45,
    minStockAlert: 15,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-9',
    code: 'GM-PAN-12W',
    name: 'GM Modular 12W Concealed Ceiling Panel Light (Round)',
    tamilName: 'ஜிஎம் 12W சீலிங் பேனல் லைட்',
    category: 'LED & Lighting',
    unit: 'Nos',
    hsn: '8539',
    purchaseRate: 130,
    mrp: 310,
    retailPrice: 240,
    electricianDiscountPercent: 20,
    engineerDiscountPercent: 35,
    wholesaleDiscountPercent: 25,
    currentStock: 60,
    minStockAlert: 20,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-10',
    code: 'SCH-MCB-32A',
    name: 'Schneider Acti9 32A Double Pole MCB (C-Curve)',
    tamilName: 'ஷ்னைடர் 32A டபுள் போல் MCB',
    category: 'MCB & Distribution',
    unit: 'Nos',
    hsn: '8536',
    purchaseRate: 280,
    mrp: 540,
    retailPrice: 440,
    electricianDiscountPercent: 20,
    engineerDiscountPercent: 35,
    wholesaleDiscountPercent: 25,
    currentStock: 32,
    minStockAlert: 10,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-11',
    code: 'HAV-CO-63A',
    name: 'Havells 63A 4-Pole Manual Changeover Switch Enclosure',
    tamilName: 'ஹேவல்ஸ் 63A சேஞ்ச் ஓவர் சுவிட்ச்',
    category: 'MCB & Distribution',
    unit: 'Nos',
    hsn: '8536',
    purchaseRate: 920,
    mrp: 1650,
    retailPrice: 1380,
    electricianDiscountPercent: 20,
    engineerDiscountPercent: 35,
    wholesaleDiscountPercent: 25,
    currentStock: 7,
    minStockAlert: 5,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-12',
    code: 'FIN-PIP-20MM',
    name: 'Finolex 20mm Medium PVC Electrical Conduit Pipe (3m)',
    tamilName: 'பினோலெக்ஸ் 20மிமீ பிவிசி கன்டூயிட் பைப் (3மீ)',
    category: 'Pipes & Fittings',
    unit: 'Nos',
    hsn: '3917',
    purchaseRate: 48,
    mrp: 85,
    retailPrice: 70,
    electricianDiscountPercent: 20,
    engineerDiscountPercent: 35,
    wholesaleDiscountPercent: 25,
    currentStock: 180,
    minStockAlert: 50,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-13',
    code: 'PRC-BND-25MM',
    name: 'Precision 25mm PVC Pipe Bend (Heavy Gauge)',
    tamilName: 'பிரிசிஷன் 25மிமீ பைப் பெண்ட்',
    category: 'Pipes & Fittings',
    unit: 'Nos',
    hsn: '3917',
    purchaseRate: 9,
    mrp: 20,
    retailPrice: 16,
    electricianDiscountPercent: 20,
    engineerDiscountPercent: 35,
    wholesaleDiscountPercent: 25,
    currentStock: 350,
    minStockAlert: 80,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-14',
    code: 'CRO-FAN-1200',
    name: 'Crompton Hill Briz 1200mm High Speed Ceiling Fan (Brown)',
    tamilName: 'கிராம்ப்டன் 1200மிமீ சீலிங் ஃபேன் (பிரவுன்)',
    category: 'Fans & Appliances',
    unit: 'Nos',
    hsn: '8414',
    purchaseRate: 1420,
    mrp: 2450,
    retailPrice: 1980,
    electricianDiscountPercent: 15,
    engineerDiscountPercent: 25,
    wholesaleDiscountPercent: 20,
    currentStock: 14,
    minStockAlert: 6,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-15',
    code: 'ATM-BLDC-1200',
    name: 'Atomberg Renesa 1200mm BLDC Smart Remote Ceiling Fan',
    tamilName: 'ஆட்டம்பர்க் 1200மிமீ BLDC ரிமோட் ஃபேன்',
    category: 'Fans & Appliances',
    unit: 'Nos',
    hsn: '8414',
    purchaseRate: 2480,
    mrp: 3990,
    retailPrice: 3350,
    electricianDiscountPercent: 12,
    engineerDiscountPercent: 22,
    wholesaleDiscountPercent: 18,
    currentStock: 9,
    minStockAlert: 4,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-16',
    code: 'STL-TAP-BLK',
    name: 'Steelgrip PVC Electrical Insulation Tape (Black - 10m)',
    tamilName: 'ஸ்டீல்கிரிப் இன்சுலேஷன் டேப் (கருப்பு)',
    category: 'Hardware & Accessories',
    unit: 'Nos',
    hsn: '8546',
    purchaseRate: 9.5,
    mrp: 20,
    retailPrice: 15,
    electricianDiscountPercent: 20,
    engineerDiscountPercent: 35,
    wholesaleDiscountPercent: 25,
    currentStock: 450,
    minStockAlert: 100,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-17',
    code: 'GM-BOX-8M',
    name: 'Goldmedal 8-Module Galvanized Iron (GI) Concealed Metal Box',
    tamilName: 'கோல்டுமெடல் 8 மாடுலர் ஜி.ஐ மெட்டல் பாக்ஸ்',
    category: 'Hardware & Accessories',
    unit: 'Nos',
    hsn: '8538',
    purchaseRate: 75,
    mrp: 150,
    retailPrice: 120,
    electricianDiscountPercent: 20,
    engineerDiscountPercent: 35,
    wholesaleDiscountPercent: 25,
    currentStock: 65,
    minStockAlert: 20,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-18',
    code: 'TAP-SCR-SET',
    name: 'Taparia 8-Piece Insulated Electrician Screwdriver Set',
    tamilName: 'தபாரியா 8 பீஸ் திருப்புளி செட்',
    category: 'Hardware & Accessories',
    unit: 'Set',
    hsn: '8205',
    purchaseRate: 210,
    mrp: 390,
    retailPrice: 320,
    electricianDiscountPercent: 20,
    engineerDiscountPercent: 35,
    wholesaleDiscountPercent: 25,
    currentStock: 16,
    minStockAlert: 5,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-19',
    code: 'FLD-LED-50W',
    name: 'Syska 50W IP66 Waterproof Outdoor LED Floodlight',
    tamilName: 'சிஸ்கா 50W அவுட்டோர் வாட்டர்ப்ரூப் ஃப்ளட்லைட்',
    category: 'LED & Lighting',
    unit: 'Nos',
    hsn: '8539',
    purchaseRate: 450,
    mrp: 1100,
    retailPrice: 850,
    electricianDiscountPercent: 20,
    engineerDiscountPercent: 35,
    wholesaleDiscountPercent: 25,
    currentStock: 12,
    minStockAlert: 5,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-20',
    code: 'POL-FLT-4SQ',
    name: 'Polycab 4.0 sq mm 3-Core Copper Submersible Flat Cable (Mtr)',
    tamilName: 'பாலிகேப் 4.0 தட்டை மோட்டார் கேபிள் (மீட்டர்)',
    category: 'Wires & Cables',
    unit: 'Mtr',
    hsn: '8544',
    purchaseRate: 98,
    mrp: 165,
    retailPrice: 138,
    electricianDiscountPercent: 18,
    engineerDiscountPercent: 30,
    wholesaleDiscountPercent: 22,
    currentStock: 320,
    minStockAlert: 80,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-21',
    code: 'AST-UPVC-1IN',
    name: 'Astral 1-Inch UPVC Brass Threaded Elbow 90 Degree',
    tamilName: 'அஸ்ட்ரல் 1 அங்குல பிராஸ் எல்போ',
    category: 'Pipes & Fittings',
    unit: 'Nos',
    hsn: '3917',
    purchaseRate: 32,
    mrp: 65,
    retailPrice: 52,
    electricianDiscountPercent: 20,
    engineerDiscountPercent: 35,
    wholesaleDiscountPercent: 25,
    currentStock: 4, // Intentionally low stock to showcase low stock alert
    minStockAlert: 15,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-22',
    code: 'BOS-DRL-550',
    name: 'Bosch GSB 550W 13mm Professional Impact Drill Machine',
    tamilName: 'பாஷ் 550W டிரில்லிங் மெஷின்',
    category: 'Hardware & Accessories',
    unit: 'Set',
    hsn: '8467',
    purchaseRate: 1950,
    mrp: 3200,
    retailPrice: 2690,
    electricianDiscountPercent: 15,
    engineerDiscountPercent: 25,
    wholesaleDiscountPercent: 20,
    currentStock: 3, // Low stock demo
    minStockAlert: 5,
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-1',
    billNumber: 'CB-2026-0001',
    type: 'cash_bill',
    status: 'paid',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    customer: {
      name: 'R. Senthil Kumar (Electrician)',
      phone: '9843210987',
      address: 'Gandhi Nagar, Site 14',
      type: 'electrician',
      discountPercent: 20,
    },
    items: [
      {
        productId: 'prod-1',
        code: 'FIN-1.5-RED',
        name: 'Finolex 1.5 sq mm FR PVC Insulated Wire (Red - 90m)',
        tamilName: 'பினோலெக்ஸ் 1.5 ஒயர் (சிவப்பு - 90மீ)',
        unit: 'Roll',
        quantity: 2,
        purchaseRate: 1180,
        mrp: 1950,
        baseRate: 1950,
        discountPercent: 20,
        unitPrice: 1560,
        taxPercent: 0,
        taxAmount: 0,
        total: 3120,
        profit: (1560 - 1180) * 2,
      },
      {
        productId: 'prod-4',
        code: 'ANC-ROM-SW1',
        name: 'Anchor Roma 6A 1-Way Modular Switch (White)',
        tamilName: 'ஆங்கர் ரோமா 6A சுவிட்ச் (வெள்ளை)',
        unit: 'Nos',
        quantity: 20,
        purchaseRate: 21,
        mrp: 42,
        baseRate: 42,
        discountPercent: 20,
        unitPrice: 33.6,
        taxPercent: 0,
        taxAmount: 0,
        total: 672,
        profit: (33.6 - 21) * 20,
      },
      {
        productId: 'prod-16',
        code: 'STL-TAP-BLK',
        name: 'Steelgrip PVC Electrical Insulation Tape (Black - 10m)',
        tamilName: 'ஸ்டீல்கிரிப் இன்சுலேஷன் டேப் (கருப்பு)',
        unit: 'Nos',
        quantity: 5,
        purchaseRate: 9.5,
        mrp: 20,
        baseRate: 20,
        discountPercent: 20,
        unitPrice: 16,
        taxPercent: 0,
        taxAmount: 0,
        total: 80,
        profit: (16 - 9.5) * 5,
      }
    ],
    subtotal: 4840,
    totalDiscount: 968,
    taxTotal: 0,
    roundOff: 0,
    grandTotal: 3872,
    totalPurchaseCost: 2827.5,
    netProfit: 1044.5,
    paymentMode: 'upi',
    amountReceived: 3872,
    changeDue: 0,
    notes: 'Paid via PhonePe QR',
  },
  {
    id: 'inv-2',
    billNumber: 'QT-2026-0001',
    type: 'quotation',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    customer: {
      name: 'Er. Murugesan (Civil Contractor & Engineer)',
      phone: '9443322110',
      address: 'Sri Krishna Nagar Project, Phase-2',
      type: 'engineer',
      discountPercent: 35, // 35% engineer quote
    },
    items: [
      {
        productId: 'prod-1',
        code: 'FIN-1.5-RED',
        name: 'Finolex 1.5 sq mm FR PVC Insulated Wire (Red - 90m)',
        tamilName: 'பினோலெக்ஸ் 1.5 ஒயர் (சிவப்பு - 90மீ)',
        unit: 'Roll',
        quantity: 10,
        purchaseRate: 1180,
        mrp: 1950,
        baseRate: 1950,
        discountPercent: 35,
        unitPrice: 1267.5,
        taxPercent: 0,
        taxAmount: 0,
        total: 12675,
        profit: (1267.5 - 1180) * 10,
      },
      {
        productId: 'prod-2',
        code: 'FIN-2.5-BLU',
        name: 'Finolex 2.5 sq mm FR Wire (Blue - 90m)',
        tamilName: 'பினோலெக்ஸ் 2.5 ஒயர் (நீலம் - 90மீ)',
        unit: 'Roll',
        quantity: 8,
        purchaseRate: 1850,
        mrp: 3100,
        baseRate: 3100,
        discountPercent: 35,
        unitPrice: 2015,
        taxPercent: 0,
        taxAmount: 0,
        total: 16120,
        profit: (2015 - 1850) * 8,
      },
      {
        productId: 'prod-12',
        code: 'FIN-PIP-20MM',
        name: 'Finolex 20mm Medium PVC Electrical Conduit Pipe (3m)',
        tamilName: 'பினோலெக்ஸ் 20மிமீ பிவிசி கன்டூயிட் பைப் (3மீ)',
        unit: 'Nos',
        quantity: 50,
        purchaseRate: 48,
        mrp: 85,
        baseRate: 85,
        discountPercent: 35,
        unitPrice: 55.25,
        taxPercent: 0,
        taxAmount: 0,
        total: 2762.5,
        profit: (55.25 - 48) * 50,
      },
    ],
    subtotal: 48550,
    totalDiscount: 16992.5,
    taxTotal: 0,
    roundOff: 0.5,
    grandTotal: 31558,
    totalPurchaseCost: 29000,
    netProfit: 2558,
    paymentMode: 'cash',
    notes: 'Quotation valid for 7 days. 35% Engineer discount applied.',
  }
];

// Helper functions for LocalStorage management
export const loadProducts = (): Product[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_PRODUCTS;
  }
};

export const saveProducts = (products: Product[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  } catch (e) {
    console.error('Error saving products:', e);
  }
};

export const loadInvoices = (): Invoice[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.INVOICES);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(INITIAL_INVOICES));
      return INITIAL_INVOICES;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_INVOICES;
  }
};

export const saveInvoices = (invoices: Invoice[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  } catch (e) {
    console.error('Error saving invoices:', e);
  }
};

export const loadSettings = (): ShopSettings => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
      return INITIAL_SETTINGS;
    }
    const savedSettings = JSON.parse(data) as Partial<ShopSettings>;
    const settings = { ...INITIAL_SETTINGS, ...savedSettings };
    const legacyDefaults: Partial<ShopSettings> = {
      shopName: 'Sri Vetri Electricals & Hardware',
      shopTamilName: 'ஸ்ரீ வெற்றி எலக்ட்ரிகல்ஸ் & ஹார்டுவேர்',
      tagline: 'Wholesale & Retail Electrical Goods, Plumbing & Building Materials',
      address: 'No. 48, Main Bazaar Street, Opp. Bus Stand, Tamil Nadu - 600001',
      phone: '+91 98421 54321',
      whatsapp: '919842154321',
      gstin: '33ABCDE1234F1Z5',
      upiId: 'vetrielectricals@okaxis',
      upiPayeeName: 'Sri Vetri Electricals',
    };
    let migrated = false;
    (Object.keys(legacyDefaults) as (keyof ShopSettings)[]).forEach(key => {
      if (savedSettings[key] === legacyDefaults[key]) {
        Object.assign(settings, { [key]: INITIAL_SETTINGS[key] });
        migrated = true;
      }
    });
    if (migrated) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    }
    return settings;
  } catch {
    return INITIAL_SETTINGS;
  }
};

export const saveSettings = (settings: ShopSettings) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
};

export const getNextBillNumber = (type: 'cash_bill' | 'quotation', invoices: Invoice[]): string => {
  const prefix = type === 'cash_bill' ? 'CB' : 'QT';
  const year = new Date().getFullYear();
  const relevantInvoices = invoices.filter(inv => inv.type === type);
  const nextNum = relevantInvoices.length + 1;
  return `${prefix}-${year}-${String(nextNum).padStart(4, '0')}`;
};

export const getTierDiscount = (
  type: CustomerType,
  product: Product,
  settings: ShopSettings
): number => {
  switch (type) {
    case 'engineer':
      return product.engineerDiscountPercent || settings.defaultEngineerDiscount || 35;
    case 'electrician':
      return product.electricianDiscountPercent || settings.defaultElectricianDiscount || 20;
    case 'wholesale':
      return product.wholesaleDiscountPercent || settings.defaultWholesaleDiscount || 25;
    case 'retail':
    default:
      // For retail, if retailPrice is less than MRP, calculate that implied discount or 0%
      return 0;
  }
};

export const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(val || 0);
};

export const resetToInitialDemoData = () => {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(INITIAL_INVOICES));
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
};
