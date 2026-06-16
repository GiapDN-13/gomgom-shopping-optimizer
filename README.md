# Gomgom — Shopping Optimizer

> Smart Vietnamese grocery planning with fine-tuned NER & route optimization.

Người dùng mô tả món muốn nấu/mua bằng ngôn ngữ tự nhiên; Gomgom trích xuất danh
sách mua có cấu trúc bằng mô hình NER fine-tuned (Gemma-2-2B-IT), rồi tối ưu
**tổng chi phí thực tế** (giá sản phẩm + phí giao/di chuyển + chi phí đổi cửa
hàng) bằng Ant Colony Optimization — không chỉ sắp xếp theo giá rẻ nhất.

Hỗ trợ 5 nhà bán lẻ: **BHX, MM Mega Market, Lotte Mart, GO! BigC, WinMart**.

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| State | Zustand |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Backend / DB | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| NER | Fine-tuned Gemma-2-2B-IT (REST) |
| Distance | OSRM hoặc Google Maps Distance Matrix |
| Maps | Leaflet.js hoặc Google Maps JS SDK |
| Hosting | Vercel |
| Testing | Jest + React Testing Library |

## Getting started

```bash
# 1. Cài dependencies
npm install

# 2. Cấu hình môi trường
cp .env.example .env.local   # rồi điền giá trị Supabase

# 3. Chạy dev server
npm run dev                  # http://localhost:3000
```

Để Sprint 1 hoạt động mà không cần model NER thật, để trống `GEMMA_NER_URL` —
endpoint `/api/v1/ner` sẽ trả về dữ liệu mock.

## Scripts

| Lệnh | Mục đích |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript `--noEmit` |
| `npm test` | Jest |

## Project structure

```
app/
  page.tsx                      # Home / Input (FR-01..05)
  results/[planId]/page.tsx     # Results (FR-16..22)
  history/                      # Saved plans (FR-23..25)
  settings/page.tsx             # Settings (FR-28..32)
  auth/login/page.tsx           # Auth (FR-26..27)
  api/v1/ner/route.ts           # NER proxy + mock (FR-03, NFR-35)
  api/v1/optimize/route.ts      # Store filtering + ACO (Sprint 4)
lib/
  shared/types.ts               # API contracts
  shared/sanitize.ts            # Input sanitisation (NFR-18)
  supabase/client.ts            # Supabase client factory
.github/workflows/ci.yml        # build + lint + test (NFR-33)
```

## API (versioned — NFR-35)

- `POST /api/v1/ner` → `{ ingredients, exclusions, serving_size, city }`
- `POST /api/v1/optimize` → ordered stores, per-store products, totals, route reason

## Roadmap (spec §6)

Sprint 1 **Project Setup** (this scaffold) → 2 NER → 3 Product Matching →
4 Route Optimizer → 5 Results → 6 Auth & History → 7 Polish & NFRs → 8 QA & Release.

---

*CONFIDENTIAL — Internal Use Only.* Giá hiển thị mang tính tham khảo.
