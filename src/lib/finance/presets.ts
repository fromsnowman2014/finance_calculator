/**
 * Rough long-run assumptions for common portfolios. They are starting points for
 * the simulation, not forecasts.
 */
export const MARKET_PRESETS = [
  { id: 'sp500', priceReturn: 8.5, dividendYield: 1.5, volatility: 16 },
  { id: 'nasdaq100', priceReturn: 11, dividendYield: 0.7, volatility: 22 },
  { id: 'dividend', priceReturn: 6.5, dividendYield: 3.5, volatility: 14 },
  { id: 'world', priceReturn: 6, dividendYield: 2, volatility: 15 },
  { id: 'balanced', priceReturn: 4.5, dividendYield: 2.5, volatility: 10 },
] as const;

export type MarketPresetId = (typeof MARKET_PRESETS)[number]['id'] | 'custom';

export const TAX_PRESETS = [
  { id: 'none', dividendTax: 0, capitalGainsTax: 0 },
  { id: 'us', dividendTax: 15, capitalGainsTax: 15 },
  { id: 'kr', dividendTax: 15, capitalGainsTax: 22 },
] as const;

export type TaxPresetId = (typeof TAX_PRESETS)[number]['id'];

export const matchTaxPreset = (dividendTax: number, capitalGainsTax: number): TaxPresetId | null =>
  TAX_PRESETS.find((p) => p.dividendTax === dividendTax && p.capitalGainsTax === capitalGainsTax)?.id ?? null;
