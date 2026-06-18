// Mock data for the Figma-based UI (Sprint 2). Replaced by real API data later.
import type { StoreCode } from "./types";

export interface MockProduct {
  id: string;
  name: string;
  store: string;
  storeCode: StoreCode;
  price: number;
  unit: string;
  image: string;
  url: string;
  source: string;
}

const BEEF_IMG =
  "https://images.unsplash.com/photo-1603048719539-9ecb4aa395e3?w=400&q=70";

export const MOCK_QUERY = "Tôi muốn nấu bún bò huế";

export const MOCK_PRODUCTS: MockProduct[] = Array.from({ length: 8 }).map(
  (_, i) => ({
    id: `p-${i + 1}`,
    name: "Thịt bò tái",
    store: "Bách Hóa Xanh",
    storeCode: "bhx",
    price: 30000,
    unit: "500 g",
    image: BEEF_IMG,
    url: "https://www.bachhoaxanh.com/",
    source: "Bách Hóa Xanh",
  }),
);

export const MOCK_TOTAL = MOCK_PRODUCTS.reduce((s, p) => s + p.price, 0);

// Inspector debug payload — mirrors the Figma Inspector screen.
export const MOCK_INSPECTOR = {
  userQuery: "Tôi muốn nấu bún bò Huế cho 1 người ở nhà",
  executionTimeMs: 1000,
  entityExtraction: {
    query: "Tôi muốn nấu bún bò Huế cho 1 người ở nhà",
    answer: {
      query_type: "recipe_request",
      objective_id: "bun_bo_hue",
      product_groups: {
        available: [],
        candidate: ["beef", "rice_noodle", "lemongrass", "fish_sauce", "fresh_herbs"],
        excluded: [],
      },
      constraints: [
        { type: "servings", value: 1 },
        { type: "time_limit", value: 15 },
      ],
    },
    meta: { language: "vi", category: "standard" },
  },
  roadMap: [
    {
      brand: "bhx",
      lon: 108.1839,
      lat: 16.05364,
      address: "198 Nguyễn Phước Nguyên, Tổ 34, Phường An Khê, Thành phố Đà Nẵng, Việt Nam",
    },
    {
      brand: "bhx",
      lon: 108.1839,
      lat: 16.05364,
      address: "198 Nguyễn Phước Nguyên, Tổ 34, Phường An Khê, Thành phố Đà Nẵng, Việt Nam",
    },
  ],
} as const;

export function formatVnd(amount: number): string {
  return `${amount.toLocaleString("vi-VN")} đ`;
}
