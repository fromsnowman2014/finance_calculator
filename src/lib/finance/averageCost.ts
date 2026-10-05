export interface Lot {
  id: string;
  price: number;
  shares: number;
}

export interface AverageCostInputs {
  lots: Lot[];
  currentPrice: number;
  /** Average price you want to get to by buying more. */
  targetAverage: number;
  /** Price you expect to buy the additional shares at. */
  nextBuyPrice: number;
}

export interface AverageCostResult {
  totalShares: number;
  totalCost: number;
  averagePrice: number;
  marketValue: number;
  profit: number;
  returnPct: number;
  /** How much the price must rise (%) to get back to the average price. */
  breakEvenMovePct: number;
}

export const calculateAverageCost = (inputs: AverageCostInputs): AverageCostResult => {
  let totalShares = 0;
  let totalCost = 0;
  for (const lot of inputs.lots) {
    if (lot.shares > 0 && lot.price >= 0) {
      totalShares += lot.shares;
      totalCost += lot.shares * lot.price;
    }
  }
  const averagePrice = totalShares > 0 ? totalCost / totalShares : 0;
  const marketValue = totalShares * inputs.currentPrice;
  const profit = marketValue - totalCost;
  return {
    totalShares,
    totalCost,
    averagePrice,
    marketValue,
    profit,
    returnPct: totalCost > 0 ? (profit / totalCost) * 100 : 0,
    breakEvenMovePct: inputs.currentPrice > 0 ? (averagePrice / inputs.currentPrice - 1) * 100 : 0,
  };
};

export type AveragePlan =
  | { feasible: true; shares: number; wholeShares: number; cost: number; newTotalShares: number; newAverage: number }
  | { feasible: false; reason: 'no-position' | 'already-there' | 'unreachable' };

/**
 * Shares to buy at `nextBuyPrice` so the average becomes `targetAverage`.
 * The target must lie between the current average and the buy price.
 */
export const planAverage = (
  totalShares: number,
  averagePrice: number,
  targetAverage: number,
  nextBuyPrice: number,
): AveragePlan => {
  if (totalShares <= 0 || averagePrice <= 0) return { feasible: false, reason: 'no-position' };
  if (Math.abs(targetAverage - averagePrice) < 1e-9) return { feasible: false, reason: 'already-there' };
  const between =
    (nextBuyPrice < targetAverage && targetAverage < averagePrice) ||
    (averagePrice < targetAverage && targetAverage < nextBuyPrice);
  if (!between) return { feasible: false, reason: 'unreachable' };

  const shares = (totalShares * (averagePrice - targetAverage)) / (targetAverage - nextBuyPrice);
  const wholeShares = Math.ceil(shares - 1e-9);
  const newTotalShares = totalShares + wholeShares;
  return {
    feasible: true,
    shares,
    wholeShares,
    cost: wholeShares * nextBuyPrice,
    newTotalShares,
    newAverage: (totalShares * averagePrice + wholeShares * nextBuyPrice) / newTotalShares,
  };
};
