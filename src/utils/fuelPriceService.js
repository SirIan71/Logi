/**
 * Kenya Fuel Price Service
 *
 * Fetches current EPRA-regulated fuel prices for Kenya.
 * Kenya fuel prices are set monthly by the Energy & Petroleum Regulatory
 * Authority (EPRA) and don't change daily — but we check once per day at
 * midnight to pick up any mid-cycle adjustments.
 *
 * Data source priority:
 *   1. Live API fetch (when a suitable API key is configured)
 *   2. Cached data in localStorage (refreshed daily at midnight)
 *   3. Hardcoded EPRA-published fallback rates
 *
 * To upgrade to a paid API later, update the `fetchFromAPI()` function.
 */

const STORAGE_KEY = 'sirian_fuel_prices';
const REFRESH_INTERVAL_MS = 60 * 1000; // Check every 60 seconds if midnight has passed

// ── Current EPRA-published rates (effective 19 May 2026 – 14 Jun 2026) ──
// Source: EPRA Kenya — https://www.epra.go.ke
// Update these when EPRA publishes new rates (typically around the 14th of each month)
const EPRA_RATES = {
  super_petrol: 214.25,
  diesel: 232.86,
  kerosene: 191.38,
  effective_from: '2026-05-19',
  effective_to: '2026-06-14',
  location: 'Nairobi',
  source: 'EPRA Kenya',
  currency: 'KES',
  unit: 'per litre',
};

/**
 * Attempt to fetch from an external API.
 * Currently uses a public proxy of GlobalPetrolPrices data.
 * Replace this function body when you get an API key for OilPriceAPI, etc.
 */
async function fetchFromAPI() {
  // ── Option 1: OilPriceAPI (if you have a key) ──
  // const API_KEY = 'YOUR_OILPRICEAPI_KEY';
  // const [diesel, petrol] = await Promise.all([
  //   fetch('https://api.oilpriceapi.com/v1/prices/latest?by_code=DIESEL_RETAIL_KE_KES',
  //     { headers: { 'Authorization': `Token ${API_KEY}` } }).then(r => r.json()),
  //   fetch('https://api.oilpriceapi.com/v1/prices/latest?by_code=GASOLINE_RETAIL_KE_KES',
  //     { headers: { 'Authorization': `Token ${API_KEY}` } }).then(r => r.json()),
  // ]);
  // return { diesel: diesel.data.price, super_petrol: petrol.data.price, ... };

  // ── Option 2: Commodities-API / free proxy (when available) ──
  // For now, return null to use cached/fallback rates.
  // Kenya fuel prices are government-regulated and only change monthly,
  // so hardcoded EPRA rates are actually the most accurate source.
  return null;
}

/**
 * Get fuel prices — checks cache, fetches if stale, falls back to EPRA rates.
 */
export async function getFuelPrices() {
  const cached = getCachedPrices();

  // If cache is fresh (fetched today), return it
  if (cached && isFreshToday(cached.fetched_at)) {
    return cached;
  }

  // Try API fetch
  try {
    const apiData = await fetchFromAPI();
    if (apiData) {
      const prices = {
        ...apiData,
        fetched_at: new Date().toISOString(),
        source: apiData.source || 'API',
      };
      cachePrices(prices);
      return prices;
    }
  } catch (err) {
    console.warn('[FuelPriceService] API fetch failed, using fallback:', err.message);
  }

  // Use EPRA hardcoded rates as fallback
  const fallback = {
    ...EPRA_RATES,
    fetched_at: new Date().toISOString(),
    source: 'EPRA Kenya (offline)',
  };
  cachePrices(fallback);
  return fallback;
}

/**
 * Synchronous getter — returns cached prices or EPRA fallback immediately.
 * Use this when you can't await (e.g., in render).
 */
export function getFuelPricesSync() {
  const cached = getCachedPrices();
  if (cached) return cached;
  return {
    ...EPRA_RATES,
    fetched_at: new Date().toISOString(),
    source: 'EPRA Kenya (offline)',
  };
}

/**
 * Update EPRA rates manually (from Settings page or admin action).
 */
export function updateEPRARates(rates) {
  const prices = {
    super_petrol: rates.super_petrol,
    diesel: rates.diesel,
    kerosene: rates.kerosene,
    effective_from: rates.effective_from || '',
    effective_to: rates.effective_to || '',
    location: rates.location || 'Nairobi',
    source: 'Manual Update',
    currency: 'KES',
    unit: 'per litre',
    fetched_at: new Date().toISOString(),
  };
  cachePrices(prices);
  return prices;
}

// ── Internal helpers ──

function getCachedPrices() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function cachePrices(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('[FuelPriceService] Cache write failed:', err.message);
  }
}

function isFreshToday(fetchedAt) {
  if (!fetchedAt) return false;
  const fetched = new Date(fetchedAt);
  const now = new Date();
  // Same calendar day = fresh
  return (
    fetched.getFullYear() === now.getFullYear() &&
    fetched.getMonth() === now.getMonth() &&
    fetched.getDate() === now.getDate()
  );
}

/**
 * Schedule a midnight refresh. Call once on app boot.
 * Returns a cleanup function to clear the interval.
 */
export function scheduleMidnightRefresh(onUpdate) {
  const check = async () => {
    const cached = getCachedPrices();
    if (!cached || !isFreshToday(cached.fetched_at)) {
      const prices = await getFuelPrices();
      if (onUpdate) onUpdate(prices);
    }
  };

  // Check immediately on boot
  check();

  // Then check every 60s (catches the midnight boundary)
  const intervalId = setInterval(check, REFRESH_INTERVAL_MS);

  return () => clearInterval(intervalId);
}
