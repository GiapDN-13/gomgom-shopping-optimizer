// Shared domain types — API contracts from spec §2.3 and the routing architecture doc.

export type TransportMode = "walking" | "motorbike" | "car";

export type StoreCode = "bhx" | "mm" | "lotte" | "gobigc" | "winmart";

/** POST /api/v1/ner request body. */
export interface NerRequest {
  text: string;
}

export interface NerIngredient {
  name: string;
  quantity?: number;
  unit?: string;
  category?: string;
}

/** POST /api/v1/ner response body (spec §2.3). */
export interface NerResponse {
  ingredients: NerIngredient[];
  exclusions: string[];
  serving_size: number;
  city: string;
}

/** POST /api/v1/optimize request body (spec §2.3). */
export interface OptimizeRequest {
  ner: NerResponse;
  location: { lat: number; lon: number };
  transport_mode: TransportMode;
}

/** A single store stop in an optimized route plan. */
export interface RouteStore {
  source: StoreCode;
  store_name: string;
  items: Array<{
    requested_name: string;
    selected_product_name: string;
    price: number;
    quantity: number;
    confidence: "high" | "medium" | "low";
  }>;
  product_subtotal: number;
  delivery_fee: number;
  route_cost: number;
}

/** POST /api/v1/optimize response body. */
export interface OptimizeResponse {
  intent_title: string;
  servings: number;
  stores: RouteStore[];
  missing_items: string[];
  product_total: number;
  route_total: number;
  final_total: number;
  total_distance_km: number;
  estimated_travel_minutes: number;
  explanation: string;
}
