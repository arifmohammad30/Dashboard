import { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/apiClient';

export function useLookupMaps() {
  const [stationMap, setStationMap] = useState({});
  const [cpMap, setCpMap] = useState({});
  const [rawStations, setRawStations] = useState([]);
  const [rawChargePoints, setRawChargePoints] = useState([]);

  useEffect(() => {
    apiClient('/api/charging-stations')
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : []);
        setRawStations(list);
        const map = {};
        list.forEach(s => {
          if (s.name) map[s.name.trim().toLowerCase()] = s.id;
          if (s.code) map[s.code.trim().toLowerCase()] = s.id;
        });
        setStationMap(map);
      })
      .catch(() => {});

    apiClient('/api/charge-points')
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : []);
        setRawChargePoints(list);
        const map = {};
        list.forEach(cp => {
          if (cp.name) map[cp.name.trim().toLowerCase()] = cp.id;
          if (cp.code) map[cp.code.trim().toLowerCase()] = cp.id;
        });
        setCpMap(map);
      })
      .catch(() => {});
  }, []);

  const resolveStation = (nameOrId) => {
    if (!nameOrId) return null;
    let target = nameOrId;
    if (typeof nameOrId === 'object' && nameOrId !== null) {
      target = nameOrId.id || nameOrId.name || nameOrId.code || '';
    }
    const clean = String(target).trim().toLowerCase();
    let found = rawStations.find(s => String(s.id) === String(target));
    if (found) return found;
    found = rawStations.find(s => s.name?.trim().toLowerCase() === clean || s.code?.trim().toLowerCase() === clean);
    if (found) return found;
    found = rawStations.find(s => s.name?.trim().toLowerCase().includes(clean) || clean.includes(s.name?.trim().toLowerCase()));
    if (found) return found;
    return typeof nameOrId === 'object' ? nameOrId : null;
  };

  const resolveChargePoint = (nameOrId) => {
    if (!nameOrId) return null;
    let target = nameOrId;
    if (typeof nameOrId === 'object' && nameOrId !== null) {
      target = nameOrId.id || nameOrId.code || nameOrId.name || '';
    }
    const clean = String(target).trim().toLowerCase();
    let found = rawChargePoints.find(cp => String(cp.id) === String(target));
    if (found) return found;
    found = rawChargePoints.find(cp => cp.code?.trim().toLowerCase() === clean || cp.name?.trim().toLowerCase() === clean);
    if (found) return found;
    found = rawChargePoints.find(cp => cp.name?.trim().toLowerCase().includes(clean) || clean.includes(cp.name?.trim().toLowerCase()));
    if (found) return found;
    return typeof nameOrId === 'object' ? nameOrId : null;
  };

  return { stationMap, cpMap, resolveStation, resolveChargePoint };
}
