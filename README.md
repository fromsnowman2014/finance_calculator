# Stock Investment Return Calculator

A USD-first stock investing calculator with interactive charts. It grew out of the
original compound interest calculator (old share links still open in the growth
simulator).

## Features

**Growth simulator** — monthly investing (DCA) over up to 60 years
- Market presets (S&P 500, Nasdaq-100, dividend stocks, global stocks, 60/40) or custom assumptions
- Price growth and dividend yield modelled separately, with dividend reinvestment (DRIP) on/off
- Fees / expense ratio, dividend tax, capital gains tax on sale (US and Korea presets), inflation
- Yearly contribution increases and an optional goal amount
- Results: final value, today's-money value, after-tax value, total profit, annualized return (IRR),
  dividend income, and what the final value is made of
- Charts: stacked growth (contributions / dividends / price growth), **Monte Carlo market-risk
  bands** (10th–90th percentile, chance of profit and of reaching the goal), dividend income per year,
  each in nominal or today's money
- Insights (doubling time, fee drag, cost of waiting, value of DRIP, inflation) and a yearly table
  with CSV export

**Trade return** — profit on a single buy and sell
- Commission, dividends received, taxes, holding period → net profit, return and annualized return
- Break-even price, a waterfall of where the result comes from, target / stop-loss price table
- Optional home-currency view (e.g. KRW) splitting stock return and exchange-rate effect

**Average cost** — average-down / average-up calculator
- Any number of purchases → average price, P/L, rise needed to break even, chart vs. current price
- Planner: shares needed at a given price to reach a target average (one click to add the purchase)

**Goal planner** — reverse calculation
- Monthly investment needed for a target amount or a FIRE number (spending ÷ withdrawal rate)
- Optional inflation-linked target, time to goal at your current pace, and the cost of starting later

**Market check** — should you be optimistic or careful with your assumptions?
- Seven official indicators from FRED, grouped the way professionals read them: valuation
  (stock market value ÷ GDP), recession signals (10Y–3M yield curve, Sahm rule), credit & money
  (Moody's Baa spread, Chicago Fed NFCI) and fear (VIX, VIX ÷ VIX3M)
- An overall verdict and an "how optimistic should your assumptions be?" guide, with a one-click
  cautious scenario applied to the growth simulator (a compact version also sits next to the
  simulator's market assumptions)
- Every chart shows watch/warning zones, US recession bands, the latest value's historical
  percentile and a plain-language explanation; one period filter (1Y–Max) drives all charts
- Data is fetched server-side (`/api/market`) and cached by the CDN for 12 hours. Series that FRED
  marks "pre-approval required" (ICE high-yield spreads, S&P 500) are deliberately not used.
  Optional: set `FRED_API_KEY` (free) to use the official FRED API instead of the CSV download.

**Everywhere** — English / 한국어 (Korean uses red-up / blue-down colors), USD · KRW · EUR · JPY · GBP,
dark mode, shareable links per tab, inputs remembered in the browser, responsive layout.

## Tech Stack

- **Framework**: Next.js 16 (React 19, App Router, statically prerendered)
- **Styling**: Tailwind CSS 4 with CSS-variable design tokens (light/dark)
- **Charts**: Recharts
- **State**: Zustand (persisted to localStorage)
- **Tests**: Vitest (finance engine, formatting, share links) and Playwright (end-to-end)
- **Language**: TypeScript

## Getting Started

```bash
npm install
npm run dev        # http://localhost:3000

npm run build && npm start
```

## Checks

```bash
npm run typecheck
npm run lint
npm test                                   # unit tests
BASE_URL=http://localhost:3000 npx playwright test   # e2e (defaults to the production URL)
```

## Project Structure

```
src/
├── app/                 # Next.js App Router (layout, page, /api/market, global styles/tokens)
├── components/
│   ├── growth/          # Growth simulator (inputs, summary, charts, insights, table)
│   ├── trade/           # Trade return calculator
│   ├── average/         # Average cost calculator and planner
│   ├── goal/            # Goal planner
│   ├── market/          # Market check dashboard, indicator cards, compact strip
│   ├── charts/          # Shared chart pieces (legend, tooltip, ticks)
│   ├── layout/          # App shell, theme provider
│   └── ui/              # Inputs, toggles, cards, stat tiles
├── i18n/                # English and Korean dictionaries
├── lib/
│   ├── finance/         # Pure calculation engine (+ unit tests)
│   ├── market/          # FRED fetching, indicator thresholds and verdict (+ unit tests)
│   └── ...              # Formatting, share links, CSV
└── store/               # Zustand store and defaults
```

Projections use simplified assumptions and are for education only — not investment advice.
