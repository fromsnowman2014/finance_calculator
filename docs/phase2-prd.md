# Phase 2 기능 개선 PRD (Product Requirements Document)

## 프로젝트 개요

**프로젝트명**: Finance Calculator - Phase 2 Enhancement
**작성일**: 2024년 12월 3일
**버전**: 2.0
**담당자**: Development Team

---

## 1. 목표 (Objectives)

Finance Calculator를 글로벌 사용자를 위한 종합 재무 계산 플랫폼으로 확장하여 사용자 경험을 극대화하고 실질적인 재무 계획 도구로 발전시킨다.

### 핵심 목표
- 전 세계 170개 이상의 통화 지원으로 글로벌 시장 진출
- 사용자가 실제 투자 결정을 내릴 수 있는 고급 재무 분석 기능 추가
- 직관적이고 교육적인 사용자 경험 제공

---

## 2. 리서치 결과 요약

### 2.1 업계 선도 기능 분석

다음 플랫폼들의 베스트 프랙티스를 분석했습니다:

**참고 자료**:
- [NerdWallet Compound Interest Calculator](https://www.nerdwallet.com/calculator/compound-interest-calculator)
- [Bankrate Savings Calculator](https://www.bankrate.com/banking/savings/compound-savings-calculator/)
- [MoneyGeek Best Compound Interest Calculator](https://www.moneygeek.com/compound-interest-calculator/)
- [Top Financial Calculator Apps for 2024](https://gomyfinance.com/2025/11/24/top-financial-calculator-apps-for-2024/)

### 2.2 핵심 발견사항

1. **다중 통화 지원 필수**: 프로페셔널 재무 도구는 35개 이상의 통화를 지원
2. **시각화가 중요**: 사용자의 80%가 차트와 그래프를 통해 이해도 향상
3. **비교 분석 기능**: "What-if" 시나리오 비교가 가장 많이 사용되는 기능
4. **목표 기반 계획**: 구체적인 재무 목표(은퇴, 주택 구매 등) 설정 기능 선호

---

## 3. Phase 2 기능 명세

### 3.1 Priority 1 (Must Have) - 핵심 기능

#### 3.1.1 전세계 통화 지원 시스템 (Global Currency Support)

**현재 상태**: USD, KRW, JPY, EUR 4개 통화만 지원

**개선 사항**:

**A. 170+ 통화 지원**
- 주요 통화: USD, EUR, GBP, JPY, CNY, KRW, AUD, CAD, CHF, SGD 등
- 신흥 시장: INR, BRL, MXN, ZAR, TRY 등
- 암호화폐: BTC, ETH (선택적)

**B. 실시간 환율 API 통합**

추천 API 옵션:
1. **ExchangeRate-API** (무료 플랜)
   - 매월 1,500 요청 무료
   - 99.99% 업타임
   - [공식 사이트](https://www.exchangerate-api.com)

2. **Fixer API** (백업)
   - 매월 100 요청 무료
   - 60초마다 업데이트
   - [공식 사이트](https://fixer.io/)

**구현 상세**:
```typescript
// API Response 캐싱
- localStorage에 24시간 캐싱
- 사용자가 수동으로 "환율 업데이트" 버튼 클릭 가능
- 백그라운드에서 자동 업데이트 (24시간마다)

// 환율 표시
- "1 USD = 1,300 KRW (2024-12-03 기준)" 형태로 표시
- 마지막 업데이트 시간 표시
```

**C. 통화 변환 기능**
- 사용자가 선택한 기본 통화로 모든 결과 자동 변환
- "다른 통화로 보기" 버튼으로 즉시 변환 가능
- 과거 환율 적용 옵션 (historical exchange rates)

**예상 작업 시간**: 2-3주

---

#### 3.1.2 복리 빈도 선택 (Compounding Frequency)

**현재**: 월 복리만 가능

**추가 옵션**:
- 일일 복리 (Daily)
- 월 복리 (Monthly) - 현재
- 분기 복리 (Quarterly)
- 연 복리 (Annually)
- 연속 복리 (Continuous)

**수학적 구현**:
```
A = P(1 + r/n)^(nt)
- n = 복리 빈도 (1=연, 4=분기, 12=월, 365=일)
```

**UI 위치**: Advanced Options 섹션에 드롭다운 추가

**예상 작업 시간**: 1주

---

#### 3.1.3 세금 고려 기능 (Tax Consideration)

**필요성**: 실제 수익은 세금 후 금액이 중요

**기능**:
- 자본 이득세율 입력 (0-50%)
- 배당소득세율 입력 (0-50%)
- 세전/세후 수익 비교 표시
- 국가별 기본 세율 프리셋 제공

**프리셋 예시**:
```
- 한국: 배당소득세 15.4%, 양도소득세 22%
- 미국: 장기 자본이득세 0-20%
- 일본: 양도소득세 20.315%
```

**예상 작업 시간**: 2주

---

### 3.2 Priority 2 (Should Have) - 고급 기능

#### 3.2.1 시나리오 비교 (Scenario Comparison)

**기능 설명**: 최대 3개의 시나리오를 동시에 비교

**사용 사례**:
- 시나리오 A: 월 50만원, 연 5% 수익률
- 시나리오 B: 월 100만원, 연 3% 수익률
- 시나리오 C: 월 70만원, 연 7% 수익률

**UI 디자인**:
- 탭 방식으로 시나리오 전환
- 오버레이 차트로 3개 라인 동시 표시
- 최종 금액 비교 테이블

**기술 구현**:
```typescript
// Zustand store에 scenarios 배열 추가
interface ScenarioState {
  scenarios: CalculatorState[];
  activeScenarioId: string;
  compareMode: boolean;
}
```

**예상 작업 시간**: 3주

---

#### 3.2.2 목표 기반 계산 (Goal-Based Planning)

**역방향 계산 기능**:

현재: 입력값 → 최종 금액
추가: 목표 금액 → 필요한 월 납입액

**사용 사례**:
```
"10년 후 1억원을 모으려면 매월 얼마를 저축해야 하나요?"
→ 답: 연 5% 수익률 가정 시 월 648,000원
```

**구현 방식**:
- "목표 금액 설정" 토글 버튼
- 목표 금액 입력 시 월 납입액 자동 계산
- "목표 달성 가능성" 인디케이터 (0-100%)

**예상 작업 시간**: 2주

---

#### 3.2.3 은퇴 계획 모드 (Retirement Planning Mode)

**특화 기능**:
- 은퇴 나이 입력 (현재 나이 → 은퇴 나이)
- 은퇴 후 생활비 입력
- 연금 인출 시뮬레이션
- 자산 고갈 시점 예측

**추가 입력 필드**:
- 현재 나이
- 은퇴 예정 나이
- 은퇴 후 월 생활비
- 예상 수명
- 국민연금/사회보장 수령액

**결과 표시**:
- "자산이 XX세까지 유지됩니다"
- 월별 인출 가능 금액
- 안전 인출 비율 (Safe Withdrawal Rate)

**예상 작업 시간**: 4주

---

#### 3.2.4 인플레이션 상세 설정

**현재**: 고정 2.5% 인플레이션

**개선**:
- 사용자 정의 인플레이션율 (0-20%)
- 국가별 인플레이션 프리셋
  - 미국: 2.5%
  - 한국: 2.3%
  - 일본: 0.5%
  - 아르헨티나: 100%+
- 인플레이션 조정 ON/OFF 토글
- 명목 수익률 vs 실질 수익률 비교

**예상 작업 시간**: 1주

---

### 3.3 Priority 3 (Nice to Have) - 추가 기능

#### 3.3.1 포트폴리오 믹스 (Portfolio Mix)

**기능**: 여러 자산 배분 시뮬레이션

**예시**:
```
- 주식 60%: 연 7% 수익률
- 채권 30%: 연 3% 수익률
- 현금 10%: 연 1% 수익률
→ 가중 평균 수익률: 5.2%
```

**UI**: 슬라이더로 비율 조정, 파이 차트 표시

**예상 작업 시간**: 3주

---

#### 3.3.2 PDF 리포트 생성

**기능**:
- 현재 계산 결과를 PDF로 다운로드
- 차트, 테이블 포함
- 로고와 날짜 포함
- 인쇄 최적화

**라이브러리**: react-pdf, jsPDF

**예상 작업 시간**: 2주

---

#### 3.3.3 사용자 계정 및 저장

**기능**:
- 로그인/회원가입 (OAuth - Google, GitHub)
- 시나리오 저장 (클라우드)
- 저장된 계산 불러오기
- 계산 히스토리

**기술 스택**: NextAuth.js, Vercel Postgres

**예상 작업 시간**: 4주

---

#### 3.3.4 모바일 앱 (PWA)

**기능**:
- Progressive Web App 변환
- 오프라인 모드
- 홈 화면에 추가
- 푸시 알림 (월 납입 리마인더)

**예상 작업 시간**: 2주

---

## 4. 기술 스택 및 아키텍처

### 4.1 새로운 의존성

```json
{
  "dependencies": {
    "axios": "^1.6.0",           // API 호출
    "date-fns": "^3.0.0",        // 날짜 처리
    "recharts": "^2.10.0",       // 이미 설치됨
    "jspdf": "^2.5.0",           // PDF 생성
    "html2canvas": "^1.4.0"      // 차트 캡처
  }
}
```

### 4.2 API 구조

```
/api/
  /currency/
    /rates           GET  - 최신 환율 조회
    /convert         POST - 통화 변환
    /historical      GET  - 과거 환율
```

### 4.3 데이터 흐름

```
1. User Input → Zustand Store → Calculator Logic
2. Calculator Logic → Results → Visualization
3. Currency API → Cache (24h) → Display
```

---

## 5. UI/UX 개선 사항

### 5.1 다국어 지원 (i18n)

**지원 언어**:
- 한국어 (기본)
- 영어
- 일본어
- 중국어 (간체)

**라이브러리**: next-i18next

**예상 작업 시간**: 2주

---

### 5.2 반응형 디자인 최적화

**개선 사항**:
- 태블릿 레이아웃 최적화
- 모바일 차트 터치 제스처
- 접이식 Advanced Options
- Sticky 헤더

**예상 작업 시간**: 1주

---

### 5.3 도움말 및 툴팁

**추가**:
- 모든 입력 필드에 툴팁
- 용어 설명 모달 (복리, 연복리수익률 등)
- 비디오 튜토리얼 링크
- FAQ 섹션

**예상 작업 시간**: 1주

---

## 6. 성능 최적화

### 6.1 목표
- First Contentful Paint: < 1.5초
- Time to Interactive: < 3초
- Lighthouse Score: > 95

### 6.2 최적화 방법
- API 응답 캐싱 (SWR, React Query)
- 이미지 최적화 (next/image)
- Code splitting (dynamic import)
- Web Workers for 복잡한 계산

---

## 7. 테스트 전략

### 7.1 단위 테스트
- 재무 계산 로직 (Jest)
- 통화 변환 로직
- 커버리지 목표: > 80%

### 7.2 E2E 테스트
- Playwright (이미 설정됨)
- 주요 사용자 플로우 테스트
- 다중 통화 시나리오 테스트

### 7.3 성능 테스트
- Lighthouse CI
- 배포 전 자동 성능 체크

---

## 8. 출시 계획

### Phase 2.1 (4주)
- ✅ 전세계 통화 지원 (170+ currencies)
- ✅ 실시간 환율 API 통합
- ✅ 복리 빈도 선택
- ✅ 세금 고려 기능

### Phase 2.2 (4주)
- ✅ 시나리오 비교 (최대 3개)
- ✅ 목표 기반 계산
- ✅ 인플레이션 상세 설정
- ✅ 다국어 지원 (한/영/일/중)

### Phase 2.3 (4주)
- ✅ 은퇴 계획 모드
- ✅ 포트폴리오 믹스
- ✅ PDF 리포트 생성
- ✅ 모바일 PWA

### Phase 2.4 (Optional)
- ✅ 사용자 계정 및 저장
- ✅ 고급 차트 (Monte Carlo 시뮬레이션)

---

## 9. 성공 지표 (KPIs)

### 9.1 사용자 지표
- 월간 활성 사용자 (MAU): 10,000+
- 평균 세션 시간: > 5분
- 재방문율: > 40%

### 9.2 기능 채택률
- 통화 변환 기능 사용률: > 30%
- 시나리오 비교 기능 사용률: > 20%
- PDF 다운로드: > 15%

### 9.3 기술 지표
- 배포 빈도: 주 1회
- 버그 해결 시간: < 48시간
- 99.9% 업타임

---

## 10. 리스크 및 대응 방안

### 10.1 API 의존성 리스크
**리스크**: 환율 API 장애 시 서비스 중단
**대응**:
- 다중 API 백업 (ExchangeRate-API, Fixer)
- 로컬 캐싱 (24시간)
- 최근 환율 fallback

### 10.2 성능 리스크
**리스크**: 복잡한 계산으로 인한 UI 프리징
**대응**:
- Web Workers 활용
- 계산 debouncing (500ms)
- Progressive enhancement

### 10.3 다국어 유지보수
**리스크**: 번역 누락 및 품질 저하
**대응**:
- 번역 키 자동 체크 (CI)
- 네이티브 검수자 협력
- Context 포함 번역 가이드

---

## 11. 참고 자료

### 재무 계산 도구 분석
- [NerdWallet Calculator](https://www.nerdwallet.com/calculator/compound-interest-calculator)
- [Bankrate Savings Calculator](https://www.bankrate.com/banking/savings/compound-savings-calculator/)
- [MoneyGeek Best Calculator](https://www.moneygeek.com/compound-interest-calculator/)
- [Financial Calculator Apps 2024](https://gomyfinance.com/2025/11/24/top-financial-calculator-apps-for-2024/)

### 은퇴 계획 도구
- [Fidelity Retirement Calculator](https://www.fidelity.com/calculators-tools/retirement-calculator/overview)
- [NerdWallet Retirement Calculator](https://www.nerdwallet.com/calculator/retirement-calculator)
- [Vanguard Retirement Calculator](https://investor.vanguard.com/tools-calculators/retirement-income-calculator)

### 환율 API
- [ExchangeRate-API](https://www.exchangerate-api.com)
- [Fixer API](https://fixer.io/)
- [Top 10 Currency APIs 2024](https://currencyfreaks.com/blog/Top-10-Conversion-API-in-2024.html)
- [7 Best Free Currency Converter APIs](https://blog.apilayer.com/7-best-free-currency-converter-apis-in-2025/)

---

## 12. 결론

Phase 2는 Finance Calculator를 단순한 복리 계산기에서 종합 재무 계획 플랫폼으로 발전시키는 중요한 단계입니다.

**핵심 차별화 요소**:
1. 🌍 **진정한 글로벌 도구**: 170+ 통화 지원
2. 🎯 **목표 중심 접근**: 역방향 계산으로 실행 가능한 계획 제공
3. 📊 **비교 및 분석**: 다중 시나리오로 최적의 선택 지원
4. 🎓 **교육적 가치**: 복잡한 재무 개념을 쉽게 이해

**예상 총 개발 기간**: 12-16주
**예상 리소스**: 2-3명 개발자

이 PRD를 기반으로 단계적 개발을 진행하여 사용자에게 실질적인 가치를 제공하는 세계적 수준의 재무 도구를 완성할 수 있습니다.
