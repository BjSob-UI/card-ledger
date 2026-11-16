/* ===== DATA: edit here when a purchase is added =====
   Each item bills `count` months in a row starting at `first` (YYYY-MM).
   seq: where that run sits in its real plan (e.g. payment 7 of 12 in Oct 2026).
   once: true = single charge. added: true = came in after the workbook was first set up. */
const DATA = {
  asOf: "2026-11-16",
  source: "CREDIT_CARD_MONITORING_AI_Assisted_v6.xlsx",
  start: "2026-10", months: 27,
  cards: [
    { id: "platinum", name: "Platinum Visa",   short: "Platinum", dueDay: 24, pool: "shared" },
    { id: "gold",     name: "Gold Mastercard", short: "Gold",     dueDay: 24, pool: "shared" },
    { id: "bpi",      name: "BPI",             short: "BPI",      dueDay: 14, pool: "bpi" }
  ],
  pools: [
    { id: "shared", name: "Platinum + Gold shared limit", limit: 400000, cards: ["platinum", "gold"] },
    { id: "bpi",    name: "BPI limit",                    limit: 120000, cards: ["bpi"] }
  ],
  /* optional real balances; leave null to use remaining installments as the estimate */
  actualBalance: { platinum: null, gold: null, bpi: null },
  /* payments you made that differ from "paid on the due date": { card: { "YYYY-MM": amount } } */
  paymentOverrides: { bpi: { "2026-10": 4440 } },
  /* a whole month's bill turned into instalments */
  conversions: [
    { card: "platinum", month: "2026-10", ratePct: 0.48, months: 6, from: "2026-11", name: "Balance Convert (October bill)" }
  ],
  items: [
    /* Platinum Visa */
    { id: "p-tv",    card: "platinum", name: "SM Appliance (Guimaras TV)", amount: 1249.17,  first: "2026-10", count: 6,  seq: { start: 7,  total: 12 } },
    { id: "p-zuri2", card: "platinum", name: "ZURI 2 (LP) - Lharie and Precious", amount: 4778.92,  first: "2026-10", count: 1, seq: { start: 3, total: 3 } },
    { id: "p-zuri3", card: "platinum", name: "ZURI 3 (LP) - Lharie and Precious", amount: 5816.27,  first: "2026-10", count: 1, seq: { start: 3, total: 3 } },
    { id: "p-zuri1", card: "platinum", name: "ZURI 1 (LP) - Lharie and Precious", amount: 14883.01, first: "2026-10", count: 1, seq: { start: 3, total: 3 } },
    { id: "p-oona",  card: "platinum", name: "Oona Insurance", amount: 3233.63, first: "2026-10", count: 3, seq: { start: 4, total: 6 }, overrides: { "2026-10": 1447.63 } },
    { id: "p-cash1", card: "platinum", name: "Cash Installment (12 months)", amount: 15617.97, first: "2026-10", count: 11, seq: { start: 2,  total: 12 } },
    { id: "p-cash2", card: "platinum", name: "Cash Installment (24 months)", amount: 2308.40,  first: "2026-10", count: 10, seq: { start: 15, total: 24 } },
    /* Gold Mastercard */
    { id: "g-sm1",   card: "gold", name: "SM Store Installment", amount: 2179,    first: "2026-10", count: 1, seq: { start: 3, total: 3 } },
    { id: "g-adv",   card: "gold", name: "Cash Advance",          amount: 554.02,  first: "2026-10", count: 10, seq: { start: 15, total: 24 } },
    { id: "g-pc1",   card: "gold", name: "Purchase Convert",      amount: 3858.60, first: "2026-10", count: 1, seq: { start: 6, total: 6 } },
    { id: "g-pc2",   card: "gold", name: "Purchase Convert",      amount: 5876.51, first: "2026-10", count: 1, seq: { start: 6, total: 6 } },
    { id: "g-geely", card: "gold", name: "Purchase Convert (PMS Geely)", amount: 1653.28, first: "2026-10", count: 3, seq: { start: 4, total: 6 } },
    { id: "g-mand",  card: "gold", name: "Mandaue", amount: 2637, first: "2026-10", count: 1, seq: { start: 3, total: 3 } },
    { id: "g-sm2",   card: "gold", name: "SM Store Installment", amount: 1793, first: "2026-10", count: 1, seq: { start: 3, total: 3 } },
    { id: "g-pizza", card: "gold", name: "Pizza Hut", amount: 1430, first: "2026-10", count: 1, once: true },
    { id: "g-purcon",card: "gold", name: "Purcon fee", amount: 100,  first: "2026-10", count: 1, once: true },
    { id: "g-bed0",  card: "gold", name: "Our home - bedsheet (purchase)", amount: 757, first: "2026-10", count: 1, once: true },
    { id: "g-bed",   card: "gold", name: "Our home - bedsheet (Purchase Convert)", amount: 758, first: "2026-11", count: 6 },
    { id: "g-bnpl1", card: "gold", name: "Buy Now Pay Later", amount: 4700, first: "2027-01", count: 3, added: true },
    { id: "g-bnpl2", card: "gold", name: "Buy Now Pay Later", amount: 2103, first: "2027-01", count: 3, added: true },
    { id: "g-mirror",card: "gold", name: "Mirror",    amount: 4000, first: "2026-11", count: 1, once: true, added: true },
    { id: "g-super", card: "gold", name: "Supermart", amount: 4300, first: "2026-11", count: 1, once: true, added: true },
    { id: "g-solar", card: "gold", name: "QSolar Powerstation", amount: 2336.47, first: "2026-11", count: 24, added: true },
    /* BPI */
    { id: "b-iphone",card: "bpi", name: "iPhone 17 Pro Max", amount: 4440, first: "2026-10", count: 24 },
    { id: "b-sam",   card: "bpi", name: "Samsung - Precious", amount: 2464, first: "2026-11", count: 3, added: true },
    { id: "b-sm",    card: "bpi", name: "Buy Now Pay Later SM - Precious", amount: 1866, first: "2027-01", count: 6, added: true }
  ]
};
