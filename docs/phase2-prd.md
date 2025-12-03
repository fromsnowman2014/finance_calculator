# Phase 2 Enhancement PRD (Product Requirements Document)

## Project Overview

**Project Name**: Finance Calculator - Phase 2 Enhancement
**Date**: December 3, 2024
**Version**: 2.0
**Owner**: Development Team

---

## 1. Objectives

Transform Finance Calculator into a comprehensive global financial planning platform that maximizes user experience and serves as a practical financial planning tool.

### Core Goals
- Support 170+ global currencies for international market expansion
- Add advanced financial analysis features for real investment decisions
- Provide intuitive and educational user experience
- Design for multi-language expansion (English first, then others)

---

## 2. Research Summary

### 2.1 Industry Leader Analysis

Analyzed best practices from leading platforms:

**References**:
- [NerdWallet Compound Interest Calculator](https://www.nerdwallet.com/calculator/compound-interest-calculator)
- [Bankrate Savings Calculator](https://www.bankrate.com/banking/savings/compound-savings-calculator/)
- [MoneyGeek Best Compound Interest Calculator](https://www.moneygeek.com/compound-interest-calculator/)
- [Top Financial Calculator Apps for 2024](https://gomyfinance.com/2025/11/24/top-financial-calculator-apps-for-2024/)

### 2.2 Key Findings

1. **Multi-currency Essential**: Professional financial tools support 35+ currencies
2. **Visualization Matters**: 80% of users prefer charts and graphs for understanding
3. **Comparison Features**: "What-if" scenario comparison is the most used feature
4. **Goal-based Planning**: Users prefer setting specific financial goals (retirement, home purchase, etc.)

---

## 3. Phase 2 Feature Specifications

### 3.1 Priority 1 (Must Have) - Core Features

#### 3.1.1 Global Currency Support System

**Current State**: Only 4 currencies (USD, KRW, JPY, EUR)

**Improvements**:

**A. 170+ Currency Support**
- Major currencies: USD, EUR, GBP, JPY, CNY, KRW, AUD, CAD, CHF, SGD, etc.
- Emerging markets: INR, BRL, MXN, ZAR, TRY, etc.
- Cryptocurrencies: BTC, ETH (optional)

**B. Real-time Exchange Rate API Integration**

Recommended API Options:
1. **ExchangeRate-API** (Free Plan)
   - 1,500 requests/month free
   - 99.99% uptime
   - [Official Site](https://www.exchangerate-api.com)

2. **Fixer API** (Backup)
   - 100 requests/month free
   - Updates every 60 seconds
   - [Official Site](https://fixer.io/)

**Implementation Details**:
```typescript
// API Response Caching
- Cache in localStorage for 24 hours
- Manual "Update Exchange Rate" button
- Automatic background update (every 24 hours)

// Exchange Rate Display
- Format: "1 USD = 1,300 KRW (as of 2024-12-03)"
- Show last update timestamp
```

**C. Currency Conversion Feature**
- Auto-convert all results to user's base currency
- "View in different currency" instant conversion
- Historical exchange rate options

**Estimated Timeline**: 2-3 weeks

---

#### 3.1.2 Compounding Frequency Selection

**Current**: Monthly compounding only

**Additional Options**:
- Daily compounding
- Monthly compounding (current)
- Quarterly compounding
- Annual compounding
- Continuous compounding

**Mathematical Implementation**:
```
A = P(1 + r/n)^(nt)
- n = compounding frequency (1=annual, 4=quarterly, 12=monthly, 365=daily)
```

**UI Location**: Dropdown in Advanced Options section

**Estimated Timeline**: 1 week

---

#### 3.1.3 Tax Consideration Feature

**Rationale**: Real returns are post-tax amounts

**Features**:
- Capital gains tax rate input (0-50%)
- Dividend income tax rate input (0-50%)
- Pre-tax vs post-tax return comparison
- Country-specific tax rate presets

**Preset Examples**:
```
- South Korea: Dividend 15.4%, Capital Gains 22%
- United States: Long-term Capital Gains 0-20%
- Japan: Capital Gains 20.315%
- Singapore: 0% (tax-free)
```

**Estimated Timeline**: 2 weeks

---

### 3.2 Priority 2 (Should Have) - Advanced Features

#### 3.2.1 Scenario Comparison

**Description**: Compare up to 3 scenarios simultaneously

**Use Cases**:
- Scenario A: $500/month, 5% annual return
- Scenario B: $1,000/month, 3% annual return
- Scenario C: $700/month, 7% annual return

**UI Design**:
- Tab-based scenario switching
- Overlay chart showing 3 lines simultaneously
- Final amount comparison table

**Technical Implementation**:
```typescript
// Add scenarios array to Zustand store
interface ScenarioState {
  scenarios: CalculatorState[];
  activeScenarioId: string;
  compareMode: boolean;
}
```

**Estimated Timeline**: 3 weeks

---

#### 3.2.2 Goal-Based Planning (Reverse Calculation)

**Reverse Calculation Feature**:

Current: Input values → Final amount
Addition: Target amount → Required monthly contribution

**Use Case**:
```
"How much should I save monthly to reach $100,000 in 10 years?"
→ Answer: $648/month at 5% annual return
```

**Implementation**:
- "Set Target Amount" toggle button
- Auto-calculate monthly contribution when target is set
- "Goal Achievement Probability" indicator (0-100%)

**Estimated Timeline**: 2 weeks

---

#### 3.2.3 Retirement Planning Mode

**Specialized Features**:
- Retirement age input (current age → retirement age)
- Post-retirement living expenses
- Pension withdrawal simulation
- Asset depletion prediction

**Additional Input Fields**:
- Current age
- Target retirement age
- Monthly living expenses after retirement
- Life expectancy
- Social security/pension income

**Result Display**:
- "Your assets will last until age XX"
- Monthly withdrawal amount
- Safe Withdrawal Rate (SWR)

**Estimated Timeline**: 4 weeks

---

#### 3.2.4 Advanced Inflation Settings

**Current**: Fixed 2.5% inflation

**Improvements**:
- User-defined inflation rate (0-20%)
- Country-specific inflation presets:
  - United States: 2.5%
  - South Korea: 2.3%
  - Japan: 0.5%
  - Argentina: 100%+
- Inflation adjustment ON/OFF toggle
- Nominal vs real return comparison

**Estimated Timeline**: 1 week

---

### 3.3 Priority 3 (Nice to Have) - Additional Features

#### 3.3.1 Portfolio Mix

**Feature**: Simulate multiple asset allocations

**Example**:
```
- Stocks 60%: 7% annual return
- Bonds 30%: 3% annual return
- Cash 10%: 1% annual return
→ Weighted average return: 5.2%
```

**UI**: Slider for ratio adjustment, pie chart display

**Estimated Timeline**: 3 weeks

---

#### 3.3.2 PDF Report Generation

**Features**:
- Download current calculation as PDF
- Include charts and tables
- Logo and date included
- Print-optimized layout

**Libraries**: react-pdf, jsPDF

**Estimated Timeline**: 2 weeks

---

#### 3.3.3 User Accounts & Cloud Save

**Features**:
- Login/Signup (OAuth - Google, GitHub)
- Save scenarios (cloud storage)
- Load saved calculations
- Calculation history

**Tech Stack**: NextAuth.js, Vercel Postgres

**Estimated Timeline**: 4 weeks

---

#### 3.3.4 Mobile App (PWA)

**Features**:
- Progressive Web App conversion
- Offline mode
- Add to home screen
- Push notifications (monthly contribution reminders)

**Estimated Timeline**: 2 weeks

---

## 4. Technology Stack & Architecture

### 4.1 New Dependencies

```json
{
  "dependencies": {
    "axios": "^1.6.0",           // API calls
    "date-fns": "^3.0.0",        // Date handling
    "recharts": "^2.10.0",       // Already installed
    "jspdf": "^2.5.0",           // PDF generation
    "html2canvas": "^1.4.0",     // Chart capture
    "next-intl": "^3.0.0"        // i18n (for future expansion)
  }
}
```

### 4.2 API Structure

```
/api/
  /currency/
    /rates           GET  - Fetch latest exchange rates
    /convert         POST - Convert currency
    /historical      GET  - Historical rates
  /i18n/
    /translations    GET  - Fetch translations (future)
```

### 4.3 Data Flow

```
1. User Input → Zustand Store → Calculator Logic
2. Calculator Logic → Results → Visualization
3. Currency API → Cache (24h) → Display
```

---

## 5. Internationalization (i18n) Architecture

### 5.1 Design for Multi-language Support

**Phase 2 Focus**: English only
**Future Expansion**: Korean, Japanese, Chinese (Simplified)

**Directory Structure**:
```
/src/
  /locales/
    /en/
      common.json
      calculator.json
      errors.json
    /ko/          # Future
    /ja/          # Future
    /zh/          # Future
  /i18n/
    config.ts
    index.ts
```

**Translation File Format** (`en/common.json`):
```json
{
  "app": {
    "title": "Compound Interest Calculator",
    "description": "Visualize your financial future"
  },
  "calculator": {
    "initialBalance": "Initial Balance",
    "monthlyContribution": "Monthly Contribution",
    "years": "Duration (Years)",
    "interestRate": "Interest Rate"
  },
  "results": {
    "finalBalance": "Final Balance",
    "totalPrincipal": "Total Principal",
    "totalInterest": "Total Interest"
  }
}
```

**Implementation Approach**:
```typescript
// Future-proof i18n hook
export function useTranslation(namespace: string = 'common') {
  // Currently returns English only
  // Later will detect user locale
  return {
    t: (key: string) => translations[namespace][key],
    locale: 'en',
    setLocale: (locale: string) => { /* future */ }
  };
}
```

### 5.2 Content Strategy

**Phase 2 (Current)**:
- All UI text in English
- Currency symbols localized (¥, $, €, ₩)
- Number formatting based on currency locale

**Future Phases**:
- Add language selector in header
- Automatic locale detection
- RTL support for Arabic/Hebrew (if needed)

---

## 6. UI/UX Improvements

### 6.1 Responsive Design Optimization

**Improvements**:
- Tablet layout optimization
- Mobile chart touch gestures
- Collapsible Advanced Options
- Sticky header

**Estimated Timeline**: 1 week

---

### 6.2 Help & Tooltips

**Additions**:
- Tooltips on all input fields
- Term explanation modals (compound interest, APY, etc.)
- Video tutorial links
- FAQ section

**Estimated Timeline**: 1 week

---

## 7. Performance Optimization

### 7.1 Targets
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Lighthouse Score: > 95

### 7.2 Optimization Methods
- API response caching (SWR, React Query)
- Image optimization (next/image)
- Code splitting (dynamic import)
- Web Workers for complex calculations

---

## 8. Testing Strategy

### 8.1 Unit Tests
- Financial calculation logic (Jest)
- Currency conversion logic
- Coverage target: > 80%

### 8.2 E2E Tests
- Playwright (already configured)
- Test main user flows
- Multi-currency scenarios

### 8.3 Performance Tests
- Lighthouse CI
- Automated performance checks before deployment

---

## 9. Release Plan

### Phase 2.1 (4 weeks)
- ✅ Global currency support (170+ currencies)
- ✅ Real-time exchange rate API integration
- ✅ Compounding frequency selection
- ✅ Tax consideration features

### Phase 2.2 (4 weeks)
- ✅ Scenario comparison (up to 3)
- ✅ Goal-based calculation
- ✅ Advanced inflation settings
- ✅ UI/UX improvements

### Phase 2.3 (4 weeks)
- ✅ Retirement planning mode
- ✅ Portfolio mix
- ✅ PDF report generation
- ✅ Mobile PWA

### Phase 2.4 (Optional)
- ✅ User accounts & cloud save
- ✅ Advanced charts (Monte Carlo simulation)
- ✅ Multi-language UI (Korean, Japanese, Chinese)

---

## 10. Success Metrics (KPIs)

### 10.1 User Metrics
- Monthly Active Users (MAU): 10,000+
- Average session time: > 5 minutes
- Return rate: > 40%

### 10.2 Feature Adoption
- Currency conversion usage: > 30%
- Scenario comparison usage: > 20%
- PDF downloads: > 15%

### 10.3 Technical Metrics
- Deployment frequency: Once per week
- Bug resolution time: < 48 hours
- 99.9% uptime

---

## 11. Risks & Mitigation

### 11.1 API Dependency Risk
**Risk**: Service disruption if exchange rate API fails
**Mitigation**:
- Multiple API backups (ExchangeRate-API, Fixer)
- Local caching (24 hours)
- Recent rate fallback

### 11.2 Performance Risk
**Risk**: UI freezing due to complex calculations
**Mitigation**:
- Web Workers utilization
- Calculation debouncing (500ms)
- Progressive enhancement

### 11.3 i18n Maintenance Risk
**Risk**: Translation gaps and quality degradation
**Mitigation**:
- Automated translation key checks (CI)
- Native reviewer collaboration
- Context-included translation guide

---

## 12. References

### Financial Calculator Analysis
- [NerdWallet Calculator](https://www.nerdwallet.com/calculator/compound-interest-calculator)
- [Bankrate Savings Calculator](https://www.bankrate.com/banking/savings/compound-savings-calculator/)
- [MoneyGeek Best Calculator](https://www.moneygeek.com/compound-interest-calculator/)
- [Financial Calculator Apps 2024](https://gomyfinance.com/2025/11/24/top-financial-calculator-apps-for-2024/)

### Retirement Planning Tools
- [Fidelity Retirement Calculator](https://www.fidelity.com/calculators-tools/retirement-calculator/overview)
- [NerdWallet Retirement Calculator](https://www.nerdwallet.com/calculator/retirement-calculator)
- [Vanguard Retirement Calculator](https://investor.vanguard.com/tools-calculators/retirement-income-calculator)

### Exchange Rate APIs
- [ExchangeRate-API](https://www.exchangerate-api.com)
- [Fixer API](https://fixer.io/)
- [Top 10 Currency APIs 2024](https://currencyfreaks.com/blog/Top-10-Conversion-API-in-2024.html)
- [7 Best Free Currency Converter APIs](https://blog.apilayer.com/7-best-free-currency-converter-apis-in-2025/)

---

## 13. Conclusion

Phase 2 transforms Finance Calculator from a simple compound interest calculator into a comprehensive financial planning platform.

**Key Differentiators**:
1. 🌍 **Truly Global Tool**: 170+ currency support
2. 🎯 **Goal-Centric Approach**: Reverse calculation for actionable plans
3. 📊 **Compare & Analyze**: Multi-scenario support for optimal choices
4. 🎓 **Educational Value**: Simplify complex financial concepts
5. 🌐 **Scalable i18n**: Designed for future multi-language expansion

**Total Estimated Development Time**: 12-16 weeks
**Estimated Resources**: 2-3 developers

This PRD provides the foundation for phased development to deliver world-class financial planning tools with real value to users globally.
