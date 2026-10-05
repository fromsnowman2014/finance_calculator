'use client';

import { useEffect, useSyncExternalStore } from 'react';
import type { MarketData } from '@/lib/market/fred';

type State = { status: 'idle' | 'loading' } | { status: 'error' } | { status: 'ready'; data: MarketData };

// One shared request per page view, used by every component that needs market data.
let state: State = { status: 'idle' };
const listeners = new Set<() => void>();
const emit = (next: State) => {
  state = next;
  listeners.forEach((l) => l());
};

const load = () => {
  if (state.status === 'loading' || state.status === 'ready') return;
  emit({ status: 'loading' });
  fetch('/api/market')
    .then((r) => (r.ok ? (r.json() as Promise<MarketData>) : Promise.reject(new Error(String(r.status)))))
    .then((data) => emit({ status: 'ready', data }))
    .catch(() => emit({ status: 'error' }));
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const SERVER_STATE: State = { status: 'idle' };

export const useMarketData = () => {
  const current = useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
  useEffect(load, []);
  return { state: current, retry: load };
};
