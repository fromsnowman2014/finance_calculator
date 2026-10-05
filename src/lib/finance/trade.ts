export interface TradeInputs {
  buyPrice: number;
  /** Sell price, or today's price for an open position. */
  sellPrice: number;
  shares: number;
  /** Commission per trade, % of trade value (applied on buy and on sell). */
  commission: number;
  /** Total dividends received per share while holding. */
  dividendsPerShare: number;
  dividendTax: number;
  capitalGainsTax: number;
  /** ISO dates (YYYY-MM-DD). */
  buyDate: string;
  sellDate: string;
  /** Show the result in a home currency as well. */
  fxEnabled: boolean;
  /** Home currency units per 1 unit of the trading currency at purchase. */
  buyFx: number;
  /** Home currency units per 1 unit of the trading currency at sale. */
  sellFx: number;
}

export interface TradeResult {
  /** Money spent including the buy commission. */
  cost: number;
  buyFee: number;
  /** Money received from the sale after the sell commission. */
  proceeds: number;
  sellFee: number;
  /** (sell − buy) × shares, before fees. */
  priceGain: number;
  dividendsGross: number;
  dividendTaxPaid: number;
  dividendsNet: number;
  fees: number;
  /** Proceeds − cost (what capital gains tax is charged on). */
  taxableGain: number;
  capitalGainsTaxPaid: number;
  netProfit: number;
  /** Net profit / cost, %. */
  netReturnPct: number;
  /** Raw price move, %. */
  priceChangePct: number;
  /** Money in your pocket at the end: proceeds − tax + dividends. */
  finalValue: number;
  holdingDays: number;
  /** Annualized (CAGR) net return, %; NaN when the holding period is unknown. */
  annualizedReturnPct: number;
  /** Sell price at which you break even after fees (dividends included). */
  breakEvenPrice: number;
  fx: {
    costHome: number;
    finalValueHome: number;
    profitHome: number;
    returnHomePct: number;
    currencyChangePct: number;
  } | null;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const daysBetween = (from: string, to: string): number => {
  const start = Date.parse(from);
  const end = Date.parse(to);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return NaN;
  return Math.round((end - start) / MS_PER_DAY);
};

export const annualize = (returnPct: number, days: number): number => {
  if (!Number.isFinite(days) || days <= 0) return NaN;
  const growth = 1 + returnPct / 100;
  if (growth <= 0) return -100;
  return (Math.pow(growth, 365 / days) - 1) * 100;
};

export const calculateTrade = (inputs: TradeInputs): TradeResult => {
  const shares = Math.max(0, inputs.shares);
  const commission = Math.max(0, inputs.commission) / 100;
  const cgTax = clamp(inputs.capitalGainsTax, 0, 100) / 100;
  const divTax = clamp(inputs.dividendTax, 0, 100) / 100;

  const buyValue = inputs.buyPrice * shares;
  const buyFee = buyValue * commission;
  const cost = buyValue + buyFee;

  const sellValue = inputs.sellPrice * shares;
  const sellFee = sellValue * commission;
  const proceeds = sellValue - sellFee;

  const dividendsGross = Math.max(0, inputs.dividendsPerShare) * shares;
  const dividendTaxPaid = dividendsGross * divTax;
  const dividendsNet = dividendsGross - dividendTaxPaid;

  const taxableGain = proceeds - cost;
  const capitalGainsTaxPaid = Math.max(0, taxableGain) * cgTax;
  const netProfit = taxableGain - capitalGainsTaxPaid + dividendsNet;
  const netReturnPct = cost > 0 ? (netProfit / cost) * 100 : 0;
  const finalValue = proceeds - capitalGainsTaxPaid + dividendsNet;

  const holdingDays = daysBetween(inputs.buyDate, inputs.sellDate);
  const breakEvenPrice =
    shares > 0 && commission < 1 ? Math.max(0, (cost - dividendsNet) / (shares * (1 - commission))) : 0;

  let fx: TradeResult['fx'] = null;
  if (inputs.fxEnabled && inputs.buyFx > 0 && inputs.sellFx > 0) {
    const costHome = cost * inputs.buyFx;
    const finalValueHome = finalValue * inputs.sellFx;
    fx = {
      costHome,
      finalValueHome,
      profitHome: finalValueHome - costHome,
      returnHomePct: costHome > 0 ? (finalValueHome / costHome - 1) * 100 : 0,
      currencyChangePct: (inputs.sellFx / inputs.buyFx - 1) * 100,
    };
  }

  return {
    cost,
    buyFee,
    proceeds,
    sellFee,
    priceGain: (inputs.sellPrice - inputs.buyPrice) * shares,
    dividendsGross,
    dividendTaxPaid,
    dividendsNet,
    fees: buyFee + sellFee,
    taxableGain,
    capitalGainsTaxPaid,
    netProfit,
    netReturnPct,
    priceChangePct: inputs.buyPrice > 0 ? (inputs.sellPrice / inputs.buyPrice - 1) * 100 : 0,
    finalValue,
    holdingDays,
    annualizedReturnPct: annualize(netReturnPct, holdingDays),
    breakEvenPrice,
    fx,
  };
};

/**
 * Sell price needed for a given net return (after fees and capital gains tax,
 * dividends included). Returns NaN when no price can achieve it.
 */
export const priceForNetReturn = (inputs: TradeInputs, targetReturnPct: number): number => {
  const shares = Math.max(0, inputs.shares);
  const commission = Math.max(0, inputs.commission) / 100;
  const cgTax = clamp(inputs.capitalGainsTax, 0, 100) / 100;
  const divTax = clamp(inputs.dividendTax, 0, 100) / 100;
  if (shares === 0 || commission >= 1) return NaN;

  const cost = inputs.buyPrice * shares * (1 + commission);
  const dividendsNet = Math.max(0, inputs.dividendsPerShare) * shares * (1 - divTax);
  const targetProfit = (targetReturnPct / 100) * cost;
  const neededFromSale = targetProfit - dividendsNet;
  const gain = neededFromSale >= 0 ? (cgTax < 1 ? neededFromSale / (1 - cgTax) : NaN) : neededFromSale;
  const proceeds = cost + gain;
  const price = proceeds / (shares * (1 - commission));
  return Number.isFinite(price) && price >= 0 ? price : NaN;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
