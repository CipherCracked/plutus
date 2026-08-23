# Plutus — Client-Side Frontend

## Problem Statement

The client-side of Plutus must deliver a credit-card bill payment and rewards application as a Next.js 13+ (App Router) web application using React, TypeScript, and Tailwind CSS. The frontend must display ~10,000 transactions in a smooth, responsive table with filtering, search, and sorting; provide spend analytics through distinctive charts with cross-filtering; implement a rewards redemption flow; and achieve a distinctive, non-conventional UI/UX that stands out — not a generic template. The frontend engineering, CSS/UI craft, and 10k-row handling are the highest-weighted evaluation criteria.

Unlike the seed script (which handles data loading), the client-side problem is about **presentation layer architecture**: how to fetch data, how to render 10k rows efficiently, how to share state across views, and how to create a distinctive visual language that serves a financial application.

## Background and Context

- The application is a **frontend-focused** take-home assignment for Digital Alpha Technologies
- Tech stack is fixed: Next.js 13+ App Router + TypeScript + React 19 + Tailwind CSS v4
- **No component libraries allowed**: no MUI, Ant Design, Chakra, shadcn — all components must be hand-built
- Evaluation weight order: **frontend engineering → CSS/UI craft → 10k-row dataset handling → assumption judgment → backend/DB fundamentals → process**
- 24-hour total time budget; **70–75% of time budget** is expected to go to the frontend
- The seed script has been completed and data (9,960 transactions, 256,415 coins) is available in Supabase
- Backend will be FastAPI (4 endpoints: GET /transactions, GET /balance, GET /rewards, POST /redeem) or Next.js API routes as fallback
- Responsive down to 360px is mandatory
- UI/UX should be **distinctive and non-conventional** — not the typical "safe" financial app look
- 2026 UI/UX trends favor raw aesthetics, anti-liquid glass, purposeful motion, and data storytelling over pure visualization

## Goals

- Display 10,000 transactions in a smooth, responsive table with filtering, search, and sorting
- Render analytics charts (category breakdown + monthly trend) with distinctive styling and cross-filtering to the table
- Implement a rewards redemption flow (balance display → catalogue → select → confirm → done)
- Achieve a cohesive, distinctive visual identity — not a generic financial dashboard template
- Hand-build all UI components (table, charts, cards, modals) with zero component-library dependencies
- Ensure responsiveness down to 360px viewport
- Use purposeful micro-interactions and motion that enhance understanding, not decoration

## Non-Goals

- Production-grade security, authentication, or multi-user support — single-user demo
- Comprehensive test suites — tests are a bonus, not required
- Mobile app — web-only, but responsive
- Real payment processing — simulated using the seeded dataset
- Deployment (optional — demo video accepted as fallback)

## Constraints

- **Frontend**: Next.js 13+ App Router, React 19, TypeScript, Tailwind CSS v4
- **No component libraries**: no MUI, Ant, Chakra, shadcn, or similar
- **Hand-built table**: the 10k-row table component must be built from scratch
- **Responsive**: must work down to 360px viewport width
- **Time box**: 24 hours total; ~70–75% on frontend
- **Distinctive UI**: must not look like a conventional/template financial app
- **API**: backend provides FastAPI endpoints (or Next.js API routes as fallback); no direct Supabase connection from the frontend

## Assumptions

- The default user is the sole user for this demo (no authentication flow needed)
- The backend API will expose the 4 required endpoints with proper query parameters for filtering/sorting
- The dataset is static (won't change during the demo session)
- Chart.js or Recharts is acceptable for chart rendering (not a "component library" in the prohibited sense)
- Virtualization library (@tanstack/react-virtual) is acceptable as a utility, not a UI component library

## Problem Tree

```text
What should the client-side architecture and data-fetching strategy look like?
├── How to fetch 10k transactions — single full-load API call vs server-side pagination?
├── How to structure the API layer — a dedicated client module vs inline fetch calls?
└── How to manage shared state (filters, balance, rewards) across views — React Context vs Zustand?

How should the transaction table handle 10k rows with distinctive UI?
├── How to handle rendering — virtualization (react-virtual) vs pagination vs hybrid?
├── What filter dimensions to expose (category, date, amount, status, merchant search)?
├── How to implement live search-as-you-type without performance issues?
└── How to surface row detail — modal, drawer, or inline expansion?

How should spend analytics charts be distinctive and interactive?
├── What distinctive chart styles to use (data storytelling vs pure visualization)?
├── How to implement cross-filtering (chart → table and table → chart)?
├── What chart types for category breakdown and monthly trend?
└── How to handle chart loading, empty states, and edge cases?

How should the rewards redemption flow feel distinctive?
├── What visual treatment for the balance display and rewards catalogue?
├── How to handle selection, confirmation, and success states with micro-interactions?
├── How to surface redemption errors (insufficient balance, invalid reward) gracefully?
└── How to show redemption confirmation or feedback?

How should the overall UI/UX be distinctive (not orthodox/conventional)?
├── What visual language — raw aesthetics, anti-liquid glass, bold typography?
├── How to use dark mode, depth, and micro-interactions purposefully?
├── What layout/navigation approach for a financial dashboard without conventional patterns?
└── How to ensure responsiveness down to 360px without conventional mobile patterns?
```

## Open Questions

- Should the table load all 10k rows at once (client-side virtualization) or fetch pages from the API?
- How much custom CSS/animation is worth the time budget vs. focusing on structure?
- Should charts use Chart.js (familiar API) or Recharts (React-native, declarative)?
- What distinctive visual approach best suits a financial rewards app — raw/control-panel aesthetic or something more expressive?
- Does the backend API support server-side filtering/sorting, or is the frontend expected to do all processing?
