'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { createFormatters, type Lang } from '@/lib/format';
import { en } from './en';
import { ko } from './ko';

export type { Dictionary } from './en';

const DICTIONARIES = { en, ko } as const;

/** Server render and first paint always use English so hydration matches. */
export const useLang = (): Lang => {
  const lang = useAppStore((s) => s.lang);
  const hydrated = useAppStore((s) => s.hydrated);
  return hydrated ? lang : 'en';
};

export const useT = () => DICTIONARIES[useLang()];

export const useFormatters = () => {
  const lang = useLang();
  const currency = useAppStore((s) => s.currency);
  return useMemo(() => createFormatters(currency, lang), [currency, lang]);
};
