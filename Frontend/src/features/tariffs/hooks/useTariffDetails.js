import { useState, useEffect } from 'react';
import { getTariffById } from '../api/tariffService';

export function useTariffDetails(lookupInput) {
  const isObj = lookupInput && typeof lookupInput === 'object';
  const [tariff, setTariff] = useState(isObj ? lookupInput : null);
  const [loading, setLoading] = useState(!isObj && Boolean(lookupInput));

  useEffect(() => {
    if (isObj) {
      setTariff(lookupInput);
      setLoading(false);
      return;
    }

    if (lookupInput) {
      setLoading(true);
      getTariffById(lookupInput)
        .then(data => {
          if (data) setTariff(data);
        })
        .catch(err => {
          console.warn("Failed to load tariff details:", err);
        })
        .finally(() => setLoading(false));
    }
  }, [lookupInput, isObj]);

  return { tariff, loading };
}
