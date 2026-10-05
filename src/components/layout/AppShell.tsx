'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useTheme } from 'next-themes';
import { Calculator, Check, Gauge, Layers, Moon, Share2, Sun, Target, TrendingUp, Wallet } from 'lucide-react';
import { useAppStore, TABS, type TabId } from '@/store/useAppStore';
import { useLang, useT } from '@/i18n';
import { CURRENCIES, isCurrencyCode } from '@/lib/format';
import { buildShareQuery, parseShareQuery } from '@/lib/share';
import { cn } from '@/lib/cn';
import { GrowthTab } from '@/components/growth/GrowthTab';
import { TradeTab } from '@/components/trade/TradeTab';
import { AverageTab } from '@/components/average/AverageTab';
import { GoalTab } from '@/components/goal/GoalTab';
import { MarketTab } from '@/components/market/MarketTab';

const TAB_ICONS: Record<TabId, ReactNode> = {
  growth: <TrendingUp size={16} aria-hidden />,
  trade: <Wallet size={16} aria-hidden />,
  average: <Layers size={16} aria-hidden />,
  goal: <Target size={16} aria-hidden />,
  market: <Gauge size={16} aria-hidden />,
};

/** Restores saved inputs, then applies any shared-link parameters on top. */
function useHydration() {
  useEffect(() => {
    const finish = () => {
      const shared = parseShareQuery(window.location.search);
      const state = useAppStore.getState();
      const patch: Partial<typeof state> = { hydrated: true };
      if (!state.langChosen && navigator.language?.toLowerCase().startsWith('ko')) patch.lang = 'ko';
      if (shared) {
        if (shared.tab) patch.tab = shared.tab;
        if (shared.currency) patch.currency = shared.currency;
        if (shared.growth) patch.growth = { ...state.growth, ...shared.growth };
        if (shared.trade) patch.trade = { ...state.trade, ...shared.trade };
        if (shared.average) patch.average = { ...state.average, ...shared.average };
        if (shared.goal) patch.goal = { ...state.goal, ...shared.goal };
      }
      useAppStore.setState(patch);
      // The shared values are now saved; drop them from the URL so later edits survive a reload.
      if (shared) window.history.replaceState(null, '', window.location.pathname);
    };
    const result = useAppStore.persist.rehydrate();
    if (result instanceof Promise) result.then(finish, finish);
    else finish();
  }, []);
}

function Header() {
  const t = useT();
  const lang = useLang();
  const setLang = useAppStore((s) => s.setLang);
  const currency = useAppStore((s) => s.currency);
  const setCurrency = useAppStore((s) => s.setCurrency);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- theme is only known on the client
  useEffect(() => setMounted(true), []);

  const share = async () => {
    const s = useAppStore.getState();
    const url = `${window.location.origin}${window.location.pathname}?${buildShareQuery(s.tab, s.currency, s)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(t.app.share, url);
    }
  };

  return (
    <header className="flex items-center justify-between gap-3 py-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white">
          <Calculator size={18} aria-hidden />
        </span>
        <span className="hidden truncate text-base font-semibold text-ink sm:inline">{t.app.name}</span>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <label className="sr-only" htmlFor="currency-select">
          {t.app.currency}
        </label>
        <select
          id="currency-select"
          value={currency}
          onChange={(e) => isCurrencyCode(e.target.value) && setCurrency(e.target.value)}
          className="h-9 cursor-pointer rounded-lg border border-line bg-surface px-2 text-sm font-medium text-ink-2 hover:border-line-strong focus-visible:outline-2 focus-visible:outline-accent"
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.symbol} {c.code}
            </option>
          ))}
        </select>
        <div role="radiogroup" aria-label={t.app.language} className="flex h-9 rounded-lg border border-line bg-surface p-0.5">
          {(['en', 'ko'] as const).map((l) => (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={lang === l}
              onClick={() => setLang(l)}
              className={cn(
                'rounded-md px-2 text-xs font-semibold whitespace-nowrap transition-colors',
                lang === l ? 'bg-accent-soft text-accent-ink' : 'text-ink-3 hover:text-ink',
              )}
            >
              {l === 'en' ? 'EN' : '한국어'}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label={t.app.darkMode}
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-ink-2 hover:text-ink"
        >
          {mounted && resolvedTheme === 'dark' ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
        </button>
        <button
          type="button"
          onClick={share}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-ink px-3 text-sm font-medium text-page hover:opacity-90"
        >
          {copied ? <Check size={15} aria-hidden /> : <Share2 size={15} aria-hidden />}
          <span className="hidden sm:inline">{copied ? t.app.copied : t.app.share}</span>
        </button>
      </div>
    </header>
  );
}

function TabNav() {
  const t = useT();
  const tab = useAppStore((s) => s.tab);
  const setTab = useAppStore((s) => s.setTab);
  return (
    <nav aria-label="Calculators">
      <div role="tablist" className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-surface p-1 sm:inline-flex">
        {TABS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors sm:px-4',
              id === 'market' && 'col-span-2 sm:col-span-1',
              tab === id ? 'bg-accent text-white shadow-sm' : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
            )}
          >
            {TAB_ICONS[id]}
            {t.tabs[id]}
          </button>
        ))}
      </div>
    </nav>
  );
}

export function AppShell() {
  useHydration();
  const t = useT();
  const lang = useLang();
  const tab = useAppStore((s) => s.tab);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <Header />
      <div className="pt-4 pb-8 sm:pt-8">
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{t.app.title}</h1>
        <p className="mt-3 max-w-2xl text-base text-ink-2">{t.app.subtitle}</p>
      </div>
      <TabNav />
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="mt-6">
        {tab === 'growth' && <GrowthTab />}
        {tab === 'trade' && <TradeTab />}
        {tab === 'average' && <AverageTab />}
        {tab === 'goal' && <GoalTab />}
        {tab === 'market' && <MarketTab />}
      </div>
      <footer className="mt-12 border-t border-line pt-6 text-xs leading-relaxed text-ink-3">{t.app.disclaimer}</footer>
    </div>
  );
}
