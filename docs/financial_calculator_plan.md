# 💰 Compound Interest & Asset Accumulation Calculator Plan
> "The Eighth Wonder of the World" - A web-based financial calculator focused on beauty, simplicity, and visual motivation.

## 1. 🎯 Project Overview
사용자가 매월 일정 금액을 적립하고 연 복리 수익률을 적용했을 때, 시간이 지남에 따라 자산이 어떻게 불어나는지를 **직관적이고 아름다운 시각화**를 통해 보여주는 웹 애플리케이션입니다. 

복잡한 금융 용어를 배제하고, 사용자가 미래의 부(Wealth)를 시뮬레이션하며 동기 부여를 받을 수 있도록 설계합니다.

### 📋 Core Goal
- **Input**: 초기 투자금, 월 적립금, 투자 기간(년), 목표 수익률(연).
- **Output**: 최종 자산 금액, 총 납입 원금, 총 이자 수익, 향후 50년동안 연도별 성장 그래프.
- **Vibe**: Clean, Modern, Trustworthy. (Toss, Robinhood, Wealthsimple 스타일)

---

## 2. ✨ Feature Selection (Good vs. Bad)

### ✅ Good Features (Included)
성공적인 장기 투자를 시뮬레이션하기 위해 꼭 필요한 기능만 선별했습니다.

1.  **Dynamic Compound Logic**:
    - 월복리(Monthly Compounding)를 기본으로 하여 실제 적립식 펀드/저축과 가장 유사한 계산 방식을 적용.
2.  **Real-time Interaction**:
    - 슬라이더(Slider)와 인풋 필드를 조작할 때마다 그래프와 숫자가 즉시 반응하여 '조작하는 재미'를 제공.
3.  **Inflation Adjuster (물가상승률 반영)**:
    - "20년 뒤의 1억이 지금의 1억과 같을까?"라는 의문에 답하기 위해, 명목 금액(Nominal)과 실질 금액(Real) 전환 토글 제공.
4.  **Annual Contribution Increase (매년 적립금 증액)**:
    - "연봉이 오르면 저축도 늘린다"는 현실적인 시나리오 반영. (예: 매년 적립금을 5%씩 증액)
5.  **Visual Milestones**:
    - 특정 금액 도달 시점 표시 (예: "7년 3개월 뒤에 1억 원 달성! 🎉").

### ❌ Unnecessary Features (Excluded)
사용자 경험을 해치고 복잡도만 높이는 기능은 과감히 제거합니다.

1.  **복잡한 세금 설정**:
    - 과세이연, 비과세, 일반과세 등 국가별/상품별 복잡한 세금 로직은 제외. (단순하게 '단일 세율' 옵션 하나만 제공하거나 MVP에서는 세전 수익 우선).
2.  **일일/주간 적립 옵션**:
    - 장기 시뮬레이션에는 '월간' 적립이 표준이므로, 너무 세세한 주기는 제외.
3.  **채권/주식 포트폴리오 배분 로직**:
    - 자산 배분 툴이 아닌 '계산기' 본질에 집중.
4.  **회원가입 및 저장**:
    - MVP 단계에서는 로그인 없이 즉시 계산하고 결과를 PDF나 이미지로 공유하는 기능에 집중.

---

## 3. 🛠 Tech Stack Strategy (Web)

Investie 모바일 앱의 기술 스택과 철학을 계승하되, 웹 환경에 최적화합니다.

- **Framework**: Next.js 14 (React) - SEO 및 빠른 초기 로딩.
- **Language**: TypeScript - 금융 계산의 정확성을 위한 엄격한 타입 관리.
- **Styling**: Tailwind CSS - 모바일 앱(NativeWind)과 디자인 언어 통일.
- **State**: Zustand - 슬라이더 값 변경에 따른 전역 상태 관리.
- **Charts**: Recharts - React 친화적이고 커스터마이징이 쉬운 차트 라이브러리.
- **Validation**: Zod - 입력값 유효성 검사 (음수 방지 등).

---

## 4. 🎨 UI/UX Design Plan

### 4.1. Layout Structure
화면을 크게 좌/우(데스크탑) 또는 상/하(모바일)로 나누어 **입력(Input)**과 **결과(Result)**를 동시에 보여줍니다.

#### Left Panel: Controller (Input)
카드 형태의 깔끔한 입력 폼입니다.
- **초기 자산 (Starting Balance)**: `$0` ~ `$1,000,000`
- **월 적립금 (Monthly Contribution)**: `$10` ~ `$50,000`
- **투자 기간 (Duration)**: `1` ~ `50` 년
- **연 이자율 (Annual Interest Rate)**: `1%` ~ `30%` (슬라이더 + 직접 입력)
- **고급 옵션 (토글)**: 물가상승률, 매년 적립금 증액률.

#### Right Panel: Dashboard (Output)
- **Summary Cards**:
    - 최종 자산 (Final Balance) - *가장 크게 강조*
    - 원금 (Total Principal)
    - 이자 수익 (Total Interest) - *초록색으로 강조 (+ 수익률 %)*
- **Main Chart (Area Chart)**:
    - X축: 연도 (Year)
    - Y축: 금액 (Currency)
    - 데이터 1 (하단): 누적 원금 (진한 색상)
    - 데이터 2 (상단): 누적 이자 (밝은/투명도 있는 색상)
- **Yearly Table (Accordion)**:
    - 연도별 상세 데이터를 표 형태로 제공 (초기엔 접혀있음).

---

## 5. 🧮 Mathematical Logic (Core Formulas)

### 변수 정의
- $P$: 초기 원금 (Principal)
- $M$: 월 적립금 (Monthly Contribution)
- $r$: 연 이자율 (decimal, 10% = 0.1)
- $n$: 연간 복리 횟수 (월복리 가정 시 12)
- $t$: 기간 (년)

### 핵심 계산 (Future Value)
매년 말의 잔액을 계산하여 배열로 저장합니다.

1.  **거치식(초기 원금)의 미래 가치**:
    $$FV_{lump} = P \times (1 + \frac{r}{n})^{n \times t}$$

2.  **적립식(월 적립금)의 미래 가치 (기말불)**:
    $$FV_{series} = M \times \frac{(1 + \frac{r}{n})^{n \times t} - 1}{\frac{r}{n}}$$

3.  **총 합계**:
    $$Total = FV_{lump} + FV_{series}$$

*(고급 옵션인 '매년 적립금 증액' 선택 시, 매년 $M$을 갱신하며 Loop 계산 수행)*

---

## 6. 📅 Development Roadmap

### Phase 1: Core MVP
- 기본 계산 로직 구현 (초기금, 월적립, 이자율, 기간).
- Recharts를 이용한 Area Chart 연동.
- Tailwind CSS 기반의 반응형 레이아웃.
- 숫자 포맷팅 (Currency Formatting, 콤마 찍기).

### Phase 2: Advanced Options
- 물가상승률 반영 로직 추가.
- "매년 적립금 증액" 로직 추가.
- 결과 공유하기 (이미지 캡처 또는 링크 복사).

### Phase 3: Polish & Details
- 다크 모드 지원.
- 통화 선택 (USD, KRW, JPY).
- 인터랙션 애니메이션 (숫자 카운트업 효과).

---

## 7. 📝 Documentation & Structure
```
src/
├── components/
│   ├── calculator/
│   │   ├── InputControl.tsx   # 슬라이더/인풋 컴포넌트
│   │   ├── ResultCard.tsx     # 요약 정보 카드
│   │   └── GrowthChart.tsx    # Recharts 그래프
│   └── layout/
│       └── Container.tsx
├── hooks/
│   └── useCalculator.ts       # 핵심 계산 로직 (Custom Hook)
├── utils/
│   ├── finance.ts             # 재무 공식 함수 모음
│   └── format.ts              # 화폐/단위 포맷팅
└── types/
    └── calculator.ts          # 타입 정의
```

