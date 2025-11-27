# Product Requirements Document (PRD): Wealth Compounder Calculator

| Version | Date | Author | Status | Description |
|:---:|:---:|:---:|:---:|:---|
| 1.0.0 | 2025-11-27 | Seinoh's Assistant | Draft | Initial PRD creation based on project plan. |

## 1. Introduction

### 1.1 Purpose
To create a visually engaging, web-based financial calculator that helps users simulate wealth accumulation through compound interest. The tool aims to motivate long-term investing by visualizing the power of compounding over time (up to 50 years).

### 1.2 Scope
- **In Scope**: 
  - Web application accessible via desktop and mobile browsers.
  - Real-time calculation of compound interest.
  - Visualization via interactive charts (Area Chart).
  - Adjustable inputs (Principal, Monthly Contribution, Rate, Time).
  - Advanced toggles (Inflation, Annual Contribution Increase).
- **Out of Scope**: 
  - User accounts/authentication.
  - Backend database storage.
  - Complex tax scenarios or multi-asset portfolio rebalancing.
  - Native mobile app (this is a web project).

### 1.3 Definitions
- **Principal**: The initial lump sum amount.
- **Contribution**: Monthly addition to the investment.
- **Compound Interest**: Interest calculated on the initial principal and also on the accumulated interest of previous periods.

---

## 2. User Personas & Stories

### 2.1 Personas
- **The Dreamer**: A young professional (20s-30s) wanting to know "What if I save $500/month for 30 years?". Motivated by big numbers.
- **The Planner**: A mid-career individual (40s) checking if their current savings rate is enough for retirement in 15 years. Needs accuracy.

### 2.2 User Stories
- **US-1**: As a user, I want to input my current savings and monthly contribution so that I can see my future wealth.
- **US-2**: As a user, I want to adjust the interest rate via a slider and see the graph update instantly to understand the impact of market returns.
- **US-3**: As a user, I want to see a graph spanning up to 50 years to visualize the exponential growth of long-term holding.
- **US-4**: As a user, I want to toggle "Inflation Adjustment" to see the *real* purchasing power of my future money.
- **US-5**: As a user, I want to see a clear breakdown of "Total Contributed" vs. "Total Interest Earned" to appreciate the passive income effect.

---

## 3. Functional Requirements

### 3.1 Input Module
The application must provide the following input fields with specific constraints:

| ID | Field Name | Type | Min | Max | Default | Step | Notes |
|:---|:---|:---|:---|:---|:---|:---|:---|
| **IN-01** | Initial Balance | Number/Currency | 0 | 10,000,000 | 10,000 | 100 | Allow manual typing |
| **IN-02** | Monthly Contribution | Number/Currency | 0 | 500,000 | 500 | 50 | - |
| **IN-03** | Investment Duration | Slider/Number | 1 | 50 (Years) | 20 | 1 | Max 50 years per user request |
| **IN-04** | Annual Interest Rate | Slider/Number | 0 | 30 (%) | 8 | 0.1 | Max 30% to prevent unrealistic expectations |
| **IN-05** | Variance (Range) | Toggle | On/Off | - | Off | - | Optional: Show +/- 2% range |
| **IN-06** | Annual Increase | Toggle/Number | 0 | 20 (%) | 0 | 0.5 | "Increase contribution by X% yearly" |

### 3.2 Calculation Engine
- **CALC-01**: Use **Monthly Compounding** ($n=12$) as the standard frequency.
- **CALC-02**: Formula for Monthly Contribution (Future Value of Annuity):
  $$FV_{PMT} = PMT \times \frac{(1 + r/n)^{nt} - 1}{r/n}$$
- **CALC-03**: Formula for Initial Principal (Compound Interest):
  $$FV_{PV} = PV \times (1 + r/n)^{nt}$$
- **CALC-04**: **Annual Contribution Increase Logic** (if enabled):
  - At the start of each new year (every 12th month), the monthly contribution amount ($PMT$) increases by the specified percentage.
  - Calculation must be done iteratively (month-by-month loop recommended for flexibility).
- **CALC-05**: **Inflation Adjustment**:
  - Formula: $Real Value = \frac{Nominal Value}{(1 + Inflation Rate)^t}$
  - Default Inflation Rate: 2.5% (configurable in code, maybe exposed to user in V2).

### 3.3 Visualization (Output)
- **VIS-01**: **Primary Chart (Area Chart)**
  - **X-Axis**: Time (Years), dynamic range based on input duration (up to 50 years).
  - **Y-Axis**: Total Value (Currency).
  - **Series A (Bottom, Darker)**: Total Principal (Initial + Cumulative Contributions).
  - **Series B (Top, Lighter)**: Total Interest Earned.
  - **Tooltip**: On hover, show specific Year, Principal, Interest, and Total Balance.
- **VIS-02**: **Summary Cards**
  - Display "End Balance", "Total Principal", "Total Interest".
  - "Total Interest" card should highlight the % of total value that is pure profit.
- **VIS-03**: **Yearly Breakdown Table**
  - Collapsible section showing a row for each year: [Year | Contribution | Interest Earned | End Balance].

---

## 4. Non-Functional Requirements

### 4.1 Usability
- **NFR-01**: **Real-time Feedback**. Chart must update within <100ms of slider movement (no laggy feel).
- **NFR-02**: **Mobile First**. Layout must stack vertically on mobile screens (<768px) and side-by-side on desktop.
- **NFR-03**: **Input Validation**. Prevent negative numbers. Cap realistic maximums to avoid integer overflow or nonsensical UI (e.g., 1000 years).

### 4.2 Performance
- **NFR-04**: **Bundle Size**. Keep initial load under 150KB (gzipped). Use dynamic imports for heavy charting libraries if necessary.
- **NFR-05**: **Calculations**. Perform math on the client-side (browser). No server round-trips for calculation.

### 4.3 Visual Design
- **NFR-06**: **Theme**. "Clean Fintech". Plenty of whitespace, rounded corners (radius-xl), distinct but soft shadows.
- **NFR-07**: **Typography**. Sans-serif (Inter or System UI). Monospace for tabular numbers (financial figures).

---

## 5. Technical Architecture

### 5.1 Stack
- **Frontend Framework**: Next.js 14 (App Router).
- **Language**: TypeScript.
- **Styling**: Tailwind CSS + `clsx`/`tailwind-merge`.
- **State Management**: Zustand (for global slider state).
- **Charts**: Recharts (ResponsiveContainer, AreaChart).
- **Icons**: Lucide React.

### 5.2 Component Hierarchy (Draft)
```text
App
├── Header
├── MainLayout (Grid)
│   ├── CalculatorControls (Left/Top)
│   │   ├── CurrencyInput (Principal, Contribution)
│   │   ├── SliderInput (Years, Rate)
│   │   └── ToggleSection (Advanced Options)
│   └── VisualizationDashboard (Right/Bottom)
│       ├── SummaryMetrics (3 Cards)
│       ├── WealthChart (Recharts Area)
│       └── Milestones / Table
└── Footer
```

### 5.3 Data Model (Types)
```typescript
type CalculationResult = {
  year: number;
  principal: number;  // Accumulated money put in
  interest: number;   // Accumulated interest earned
  total: number;      // principal + interest
};

type CalculatorState = {
  initialBalance: number;
  monthlyContribution: number;
  years: number;
  interestRate: number;
  yearlyIncrease: number; // %
  isInflationAdjusted: boolean;
  // Actions
  setField: (field: keyof CalculatorState, value: number | boolean) => void;
};
```

---

## 6. Future Roadmap (Post-MVP)
- **Shareable Links**: Encode state in URL query params (e.g., `?p=10000&m=500&r=8&t=30`) so users can share their scenario.
- **Currency Selector**: Support USD, KRW, EUR, JPY symbols.
- **PDF Export**: "Download My Wealth Plan".
- **Comparison Mode**: Compare "Scenario A" vs "Scenario B" side-by-side.

