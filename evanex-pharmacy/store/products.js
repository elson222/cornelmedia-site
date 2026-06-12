/**
 * Evanex Online Store Product Catalog
 * 
 * Categories:
 * - 'rx': Prescription Drugs (requires upload of doctor's prescription)
 * - 'otc': Over-The-Counter Medicines
 * - 'devices': Diagnostic & First Aid Equipment
 * - 'maternal': Maternal & Baby Care
 * - 'wellness': Wellness & Personal Care
 */

window.STORE_PRODUCTS = [
  // 1. Prescription (Rx)
  {
    id: "rx-coartem",
    name: "Coartem (Artemether/Lumefantrine)",
    description: "Highly effective antimalarial treatment for uncomplicated malaria. Complete 24-tablet dosage course.",
    category: "rx",
    price: 45.00,
    rx: true,
    stock: "in-stock",
    imageType: "pill",
    dosage: "24 Tablets - Full Course"
  },
  {
    id: "rx-amoxicillin",
    name: "Amoxicillin 500mg",
    description: "Broad-spectrum penicillin antibiotic used to treat bacterial infections of the respiratory tract, skin, and urinary tract.",
    category: "rx",
    price: 30.00,
    rx: true,
    stock: "in-stock",
    imageType: "capsule",
    dosage: "21 Capsules - Take 3x Daily"
  },
  {
    id: "rx-atorvastatin",
    name: "Atorvastatin 20mg",
    description: "Lipid-lowering medication used to reduce cardiovascular risk and manage elevated cholesterol levels.",
    category: "rx",
    price: 90.00,
    rx: true,
    stock: "in-stock",
    imageType: "pill",
    dosage: "30 Tablets - Take 1x Daily"
  },
  {
    id: "rx-metformin",
    name: "Metformin 500mg",
    description: "First-line oral blood sugar lowering medication for patients with type-2 diabetes mellitus.",
    category: "rx",
    price: 60.00,
    rx: true,
    stock: "in-stock",
    imageType: "pill",
    dosage: "100 Tablets - Take with Meals"
  },

  // 2. OTC Medicines
  {
    id: "otc-panadol-extra",
    name: "Panadol Extra (Paracetamol + Caffeine)",
    description: "Provides fast, effective temporary relief of headaches, migraine, backache, toothache, and joint pain.",
    category: "otc",
    price: 20.00,
    rx: false,
    stock: "in-stock",
    imageType: "pill",
    dosage: "24 Tablets - Take 2 every 4-6 hours"
  },
  {
    id: "otc-benylin-4flu",
    name: "Benylin 4-Flu Syrup",
    description: "Relieves flu symptoms including chesty coughs, congestion, runny noses, headaches, and fevers.",
    category: "otc",
    price: 35.00,
    rx: false,
    stock: "in-stock",
    imageType: "syrup",
    dosage: "100ml Syrup - Take 10ml 3x Daily"
  },
  {
    id: "otc-strepsils",
    name: "Strepsils Lozenges (Honey & Lemon)",
    description: "Soothing throat lozenges with double antibacterial action to relieve sore throat discomfort.",
    category: "otc",
    price: 25.00,
    rx: false,
    stock: "in-stock",
    imageType: "capsule",
    dosage: "16 Pack - Dissolve in mouth"
  },
  {
    id: "otc-cetirizine",
    name: "Cetirizine 10mg (Allergy Relief)",
    description: "Provides 24-hour relief from allergies such as hay fever, sneezing, runny noses, and hives.",
    category: "otc",
    price: 12.00,
    rx: false,
    stock: "in-stock",
    imageType: "pill",
    dosage: "10 Tablets - Take 1x Daily"
  },

  // 3. Maternal & Baby
  {
    id: "mat-pregnacare",
    name: "Pregnacare Original Prenatal Vitamins",
    description: "Formulated with 19 essential vitamins and minerals, including folic acid, for maternal health during pregnancy.",
    category: "maternal",
    price: 95.00,
    rx: false,
    stock: "in-stock",
    imageType: "wellness",
    dosage: "30 Capsules - Take 1x Daily"
  },
  {
    id: "mat-pampers",
    name: "Pampers Baby-Dry Size 3",
    description: "Premium baby diapers with leak guards and air-dry channels. Keeps baby dry and comfortable for up to 12 hours.",
    category: "maternal",
    price: 120.00,
    rx: false,
    stock: "in-stock",
    imageType: "baby",
    dosage: "44 Pack - Junior Size 3"
  },
  {
    id: "mat-cussons-powder",
    name: "Cussons Baby Powder",
    description: "Mild and gentle formulation to absorb excess moisture, keeping baby's skin soft and fragrant.",
    category: "maternal",
    price: 30.00,
    rx: false,
    stock: "in-stock",
    imageType: "baby",
    dosage: "200g Bottle"
  },

  // 4. Devices & First Aid
  {
    id: "dev-omron-bp",
    name: "Omron M2 Digital Blood Pressure Monitor",
    description: "Fully automatic upper-arm blood pressure monitor. Offers precise readings, irregular heartbeat detection, and memory tracking.",
    category: "devices",
    price: 380.00,
    rx: false,
    stock: "in-stock",
    imageType: "device",
    dosage: "1 Unit - 3 Years Warranty"
  },
  {
    id: "dev-accuchek-meter",
    name: "Accu-Chek Active Blood Glucose Meter",
    description: "Accurate blood sugar monitoring kit. Includes test strips, lancets, and a lancing device for quick, painless readings.",
    category: "devices",
    price: 220.00,
    rx: false,
    stock: "low-stock",
    imageType: "device",
    dosage: "Starter Kit - Meter + 10 Strips"
  },
  {
    id: "dev-firstaid-kit",
    name: "Compact First Aid Kit",
    description: "Fully stocked first aid kit containing bandages, antiseptics, scissors, tape, and gauze for emergency wound care.",
    category: "devices",
    price: 110.00,
    rx: false,
    stock: "in-stock",
    imageType: "device",
    dosage: "50-Piece Wall/Vehicle Kit"
  },

  // 5. Wellness & Personal Care
  {
    id: "wel-dettol-liquid",
    name: "Dettol Antiseptic Disinfectant Liquid",
    description: "Concentrated antiseptic solution for first aid, medical hygiene, laundry sanitization, and surface disinfection.",
    category: "wellness",
    price: 40.00,
    rx: false,
    stock: "in-stock",
    imageType: "wellness",
    dosage: "500ml Bottle"
  },
  {
    id: "wel-vitc",
    name: "Vitamin C 1000mg Effervescent",
    description: "Fast-absorbing vitamin C drink tablets to boost immune defense, reduce tiredness, and support antioxidant health.",
    category: "wellness",
    price: 35.00,
    rx: false,
    stock: "in-stock",
    imageType: "syrup",
    dosage: "20 Effervescent Orange Tablets"
  },
  {
    id: "wel-codliver",
    name: "Seven Seas Cod Liver Oil Capsules",
    description: "Natural source of Omega-3 and Vitamin D to support joint flexibility, bones, brain health, and immune system.",
    category: "wellness",
    price: 50.00,
    rx: false,
    stock: "in-stock",
    imageType: "capsule",
    dosage: "100 Pack - Take 1-2 Daily"
  }
];
