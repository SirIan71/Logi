/**
 * React hook for Kenya fuel prices.
 * Auto-refreshes daily at midnight and provides current EPRA rates.
 */
import { useState, useEffect, useCallback } from 'react';
import { getFuelPrices, getFuelPricesSync, updateEPRARates, scheduleMidnightRefresh } from './fuelPriceService';

export function useFuelPrices() {
  const [prices, setPrices] = useState(() => getFuelPricesSync());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getFuelPrices();
        if (!cancelled) {
          setPrices(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    load();

    // Schedule midnight refresh
    const cleanup = scheduleMidnightRefresh((newPrices) => {
      if (!cancelled) setPrices(newPrices);
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  const updateRates = useCallback((rates) => {
    const updated = updateEPRARates(rates);
    setPrices(updated);
    return updated;
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // Force a fresh fetch by clearing cache timestamp
      const data = await getFuelPrices();
      setPrices(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { prices, loading, error, updateRates, refresh };
}
