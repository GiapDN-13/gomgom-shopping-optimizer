// Mock catalog + store metadata + recipe book (Sprint 2). Replaced by Supabase later.
import type { StoreCode } from "./types";

export interface StoreMeta {
  code: StoreCode;
  name: string;
  color: string;
  deliveryFee: number;
  // crude Da Nang coordinates for the map placeholder
  lat: number;
  lon: number;
  address: string;
  lastUpdatedHoursAgo: number; // for the freshness badge
}

export const STORES: Record<StoreCode, StoreMeta> = {
  bhx: {
    code: "bhx",
    name: "Bách Hóa Xanh",
    color: "#0072BC",
    deliveryFee: 20000,
    lat: 16.0536,
    lon: 108.1839,
    address: "198 Nguyễn Phước Nguyên, An Khê, Đà Nẵng",
    lastUpdatedHoursAgo: 6,
  },
  mm: {
    code: "mm",
    name: "MM Mega Market",
    color: "#E2231A",
    deliveryFee: 35000,
    lat: 16.0612,
    lon: 108.2095,
    address: "Khu TĐC Hòa Cường, Hải Châu, Đà Nẵng",
    lastUpdatedHoursAgo: 14,
  },
  lotte: {
    code: "lotte",
    name: "Lotte Mart",
    color: "#ED1C24",
    deliveryFee: 30000,
    lat: 16.0438,
    lon: 108.2231,
    address: "6 Nại Nam, Hòa Cường Bắc, Đà Nẵng",
    lastUpdatedHoursAgo: 52, // stale (>48h) to demo the warning
  },
  gobigc: {
    code: "gobigc",
    name: "GO! BigC",
    color: "#E30613",
    deliveryFee: 25000,
    lat: 16.0701,
    lon: 108.1497,
    address: "255-257 Hùng Vương, Thanh Khê, Đà Nẵng",
    lastUpdatedHoursAgo: 9,
  },
  winmart: {
    code: "winmart",
    name: "WinMart",
    color: "#E4002B",
    deliveryFee: 18000,
    lat: 16.0489,
    lon: 108.2089,
    address: "478 Điện Biên Phủ, Thanh Khê, Đà Nẵng",
    lastUpdatedHoursAgo: 3,
  },
};

export interface CatalogProduct {
  id: string;
  // canonical ingredient key this product can satisfy
  ingredientKey: string;
  name: string;
  storeCode: StoreCode;
  price: number;
  unit: string;
  inStock: boolean;
  image: string;
  url: string;
}

const IMG = {
  beef: "https://images.unsplash.com/photo-1603048719539-9ecb4aa395e3?w=400&q=70",
  noodle: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&q=70",
  herb: "https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=400&q=70",
  sauce: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=70",
  lemongrass: "https://images.unsplash.com/photo-1599909533730-f9ba9d2e0a0f?w=400&q=70",
  generic: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=70",
};

let _seq = 0;

// A small multi-store catalog: each ingredient is sold at several stores at different prices.
export const CATALOG: CatalogProduct[] = [
  // beef
  mk("beef", "Thịt bò bắp", "bhx", 142000, "500 g", IMG.beef),
  mk("beef", "Thịt bò bắp loại 1", "mm", 135000, "500 g", IMG.beef),
  mk("beef", "Thịt bò bắp nhập", "lotte", 158000, "500 g", IMG.beef),
  // rice_noodle
  mk("rice_noodle", "Bún tươi", "bhx", 16000, "800 g", IMG.noodle),
  mk("rice_noodle", "Bún sợi to", "winmart", 18000, "800 g", IMG.noodle),
  mk("rice_noodle", "Bún tươi", "mm", 15000, "1 kg", IMG.noodle),
  // lemongrass
  mk("lemongrass", "Sả cây", "bhx", 9000, "3 cây", IMG.lemongrass),
  mk("lemongrass", "Sả tươi", "gobigc", 11000, "5 cây", IMG.lemongrass),
  // fish_sauce / mắm ruốc
  mk("fish_sauce", "Mắm ruốc Huế", "bhx", 28000, "200 g", IMG.sauce),
  mk("fish_sauce", "Mắm ruốc đặc biệt", "lotte", 34000, "230 g", IMG.sauce),
  // fresh_herbs
  mk("fresh_herbs", "Rau sống tổng hợp", "bhx", 12000, "1 bó", IMG.herb),
  mk("fresh_herbs", "Rau thơm các loại", "winmart", 14000, "1 bó", IMG.herb),
  // pork (for other dishes)
  mk("pork", "Thịt heo xay", "bhx", 65000, "500 g", IMG.generic),
  mk("pork", "Thịt heo ba chỉ", "mm", 78000, "500 g", IMG.generic),
  // chicken
  mk("chicken", "Đùi gà", "bhx", 55000, "500 g", IMG.generic),
  mk("chicken", "Ức gà", "gobigc", 48000, "500 g", IMG.generic),
  // vegetables
  mk("vegetables", "Rau cải", "bhx", 10000, "1 bó", IMG.herb),
  mk("vegetables", "Cà chua", "winmart", 13000, "500 g", IMG.generic),
  // tofu
  mk("tofu", "Đậu hũ", "bhx", 8000, "2 miếng", IMG.generic),
];

function mk(
  ingredientKey: string,
  name: string,
  storeCode: StoreCode,
  price: number,
  unit: string,
  image: string,
): CatalogProduct {
  _seq += 1;
  return {
    id: `cat-${_seq}`,
    ingredientKey,
    name,
    storeCode,
    price,
    unit,
    inStock: true,
    image,
    url: `https://www.${storeCode}.example/products/${_seq}`,
  };
}

// Recipe book: dish keyword -> ingredient keys (mirrors NER objective_id flow).
// The self-trained model was taught shopping-intent -> product suggestions,
// NOT dish -> ingredients (it answers "nấu X" with kitchen tools) — so common
// Vietnamese dishes are decomposed deterministically here instead.
export const RECIPES: Record<string, { title: string; ingredients: string[] }> = {
  bun_bo_hue: {
    title: "Bún bò Huế",
    ingredients: ["beef", "rice_noodle", "lemongrass", "fish_sauce", "fresh_herbs"],
  },
  bun_rieu: {
    title: "Bún riêu cua",
    ingredients: ["crab", "rice_noodle", "tomato", "tofu", "shrimp_paste", "fresh_herbs"],
  },
  bun_cha: {
    title: "Bún chả",
    ingredients: ["pork", "rice_noodle", "fresh_herbs", "fish_sauce"],
  },
  bun_thit_nuong: {
    title: "Bún thịt nướng",
    ingredients: ["pork", "rice_noodle", "fresh_herbs", "peanuts"],
  },
  pho_bo: {
    title: "Phở bò",
    ingredients: ["beef", "rice_noodle", "fresh_herbs"],
  },
  pho_ga: {
    title: "Phở gà",
    ingredients: ["chicken", "rice_noodle", "fresh_herbs"],
  },
  com_ga: {
    title: "Cơm gà",
    ingredients: ["chicken", "vegetables"],
  },
  lau_thai: {
    title: "Lẩu Thái",
    ingredients: ["shrimp", "squid", "mushroom", "vegetables", "rice_noodle"],
  },
  lau_bo: {
    title: "Lẩu bò",
    ingredients: ["beef", "mushroom", "vegetables", "tofu", "rice_noodle"],
  },
  canh_chua: {
    title: "Canh chua cá",
    ingredients: ["fish", "tomato", "vegetables", "fresh_herbs"],
  },
  thit_kho: {
    title: "Thịt kho trứng",
    ingredients: ["pork", "egg"],
  },
  mi_quang: {
    title: "Mì Quảng",
    ingredients: ["pork", "shrimp", "rice_noodle", "fresh_herbs", "peanuts"],
  },
};

export function formatVnd(amount: number): string {
  return `${amount.toLocaleString("vi-VN")} đ`;
}
