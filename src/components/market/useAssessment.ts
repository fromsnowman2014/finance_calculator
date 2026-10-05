'use client';

import { useMemo } from 'react';
import type { MarketData } from '@/lib/market/fred';
import { assessMarket } from '@/lib/market/indicators';

export const useAssessment = (data: MarketData | undefined) =>
  useMemo(() => (data ? assessMarket(data.indicators) : null), [data]);

/** Latest observation across all indicators: the shared right edge of every chart. */
export const latestDay = (data: MarketData) =>
  Math.max(...Object.values(data.indicators).map((d) => d.points[d.points.length - 1]?.[0] ?? 0));
