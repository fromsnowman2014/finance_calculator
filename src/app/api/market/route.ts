import { loadMarketData } from '@/lib/market/fred';

// Fetched on demand and cached by the CDN, so builds never depend on FRED being up.
export const dynamic = 'force-dynamic';

const CACHE_OK = 'public, max-age=0, s-maxage=43200, stale-while-revalidate=86400';
const CACHE_PARTIAL = 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600';

export async function GET() {
  const data = await loadMarketData();
  if (Object.keys(data.indicators).length === 0) {
    return Response.json(data, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
  return Response.json(data, { headers: { 'Cache-Control': data.errors.length ? CACHE_PARTIAL : CACHE_OK } });
}
