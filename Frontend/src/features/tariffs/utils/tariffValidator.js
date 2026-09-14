/**
 * Tariff Validation Utility for Complex EV Charging Structures
 * Performs real-time validation for:
 * 1. GST percentage bounds (0 - 100%)
 * 2. Energy and time price non-negativity
 * 3. Parking and idle fee boundaries
 * 4. SOC (State of Charge) range overlaps and 0-100% boundary checks
 * 5. Time interval format, day selection, and inter-period time overlaps (including midnight-crossing intervals)
 */

const DAYS_MAP = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6
};

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Converts HH:mm time string into total minutes from midnight (0 - 1439).
 */
function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const parts = timeStr.trim().split(':');
  if (parts.length !== 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

/**
 * Validates the complete nested pricing configuration object.
 * Returns { valid: boolean, error: string|null, periodErrors: object, socErrors: object }.
 */
export function validatePricingConfig(config) {
  if (!config) return { valid: true, periodErrors: {}, socErrors: {} };

  const periodErrors = {};
  const socErrors = {};

  const { gstPercentage, normalPricing, peakPeriods = [], offPeakPeriods = [], parkingConfig } = config;

  // 0. Validate GST Percentage
  if (gstPercentage !== undefined && !isNaN(gstPercentage)) {
    if (gstPercentage < 0 || gstPercentage > 100) {
      return { valid: false, error: 'GST Percentage must be between 0% and 100%.', periodErrors, socErrors };
    }
  }

  // 1. Validate Normal Pricing non-negative values
  if (normalPricing) {
    if (normalPricing.energyPrice !== undefined && !isNaN(normalPricing.energyPrice) && normalPricing.energyPrice < 0) {
      return { valid: false, error: 'Normal energy price rate cannot be negative.', periodErrors, socErrors };
    }
    if (normalPricing.timePrice !== undefined && !isNaN(normalPricing.timePrice) && normalPricing.timePrice < 0) {
      return { valid: false, error: 'Normal time price rate cannot be negative.', periodErrors, socErrors };
    }
    if (normalPricing.socRanges && normalPricing.socRanges.length > 0) {
      validateSocRangesWithMap(normalPricing.socRanges, socErrors, 'normal');
    }
  }

  // 2. Validate Special Periods (Peak & Off-Peak)
  const allSpecialPeriods = [
    ...peakPeriods.map((p, idx) => ({ ...p, periodType: 'Peak', _pIdx: idx })),
    ...offPeakPeriods.map((p, idx) => ({ ...p, periodType: 'Off-Peak', _pIdx: idx }))
  ];

  for (const period of allSpecialPeriods) {
    if (period.energyPrice !== undefined && !isNaN(period.energyPrice) && period.energyPrice < 0) {
      return { valid: false, error: `${period.periodType} period "${period.title || (period._pIdx + 1)}" energy price cannot be negative.`, periodErrors, socErrors };
    }
    if (period.timePrice !== undefined && !isNaN(period.timePrice) && period.timePrice < 0) {
      return { valid: false, error: `${period.periodType} period "${period.title || (period._pIdx + 1)}" time price cannot be negative.`, periodErrors, socErrors };
    }
  }

  // 3. Validate Parking Config
  if (parkingConfig && parkingConfig.enabled) {
    if (parkingConfig.feePerMin !== undefined && !isNaN(parkingConfig.feePerMin) && parkingConfig.feePerMin < 0) {
      return { valid: false, error: 'Parking fee per minute cannot be negative.', periodErrors, socErrors };
    }
    if (parkingConfig.gracePeriodMins !== undefined && !isNaN(parkingConfig.gracePeriodMins) && parkingConfig.gracePeriodMins < 0) {
      return { valid: false, error: 'Parking grace period cannot be negative.', periodErrors, socErrors };
    }
  }

  const emittedIntervals = [];

  for (const period of allSpecialPeriods) {
    const periodKey = period.id || `${period.periodType}_${period._pIdx}`;
    if (period.socRanges && period.socRanges.length > 0) {
      validateSocRangesWithMap(period.socRanges, socErrors, periodKey);
    }

    const startMin = timeToMinutes(period.startTime);
    const endMin = timeToMinutes(period.endTime);

    const setPeriodError = (msg) => {
      periodErrors[periodKey] = msg;
      if (period.id) periodErrors[period.id] = msg;
    };

    if (startMin === null || endMin === null) {
      setPeriodError(`Invalid time format (${period.startTime || 'empty'} - ${period.endTime || 'empty'}). Use HH:mm format.`);
    } else if (startMin === endMin && period.startTime !== '00:00') {
      setPeriodError(`Start and end time cannot be equal (${period.startTime}).`);
    } else if (!period.days || !Array.isArray(period.days) || period.days.length === 0) {
      setPeriodError(`Must select at least one applicable day.`);
    } else {
      for (const dayName of period.days) {
        const dayIdx = DAYS_MAP[dayName];
        if (dayIdx === undefined) continue;

        if (startMin === endMin && period.startTime === '00:00') {
          emittedIntervals.push({ day: dayIdx, start: 0, end: 1440, periodKey, periodId: period.id, periodTitle: period.title || periodKey, periodType: period.periodType });
        } else if (startMin < endMin) {
          emittedIntervals.push({ day: dayIdx, start: startMin, end: endMin, periodKey, periodId: period.id, periodTitle: period.title || periodKey, periodType: period.periodType });
        } else {
          emittedIntervals.push({ day: dayIdx, start: startMin, end: 1440, periodKey, periodId: period.id, periodTitle: period.title || periodKey, periodType: period.periodType });
          const nextDayIdx = (dayIdx + 1) % 7;
          emittedIntervals.push({ day: nextDayIdx, start: 0, end: endMin, periodKey, periodId: period.id, periodTitle: period.title || periodKey, periodType: period.periodType });
        }
      }
    }
  }

  // Overlap Check across emitted intervals
  for (let day = 0; day < 7; day++) {
    const dayIntervals = emittedIntervals.filter(i => i.day === day);
    for (let i = 0; i < dayIntervals.length; i++) {
      for (let j = i + 1; j < dayIntervals.length; j++) {
        const intA = dayIntervals[i];
        const intB = dayIntervals[j];

        const overlapStart = Math.max(intA.start, intB.start);
        const overlapEnd = Math.min(intA.end, intB.end);

        if (overlapStart < overlapEnd) {
          const formatMin = (m) => {
            const h = String(Math.floor(m / 60)).padStart(2, '0');
            const min = String(m % 60).padStart(2, '0');
            return `${h}:${min}`;
          };
          const msgA = `Overlaps with ${intB.periodType} "${intB.periodTitle}" on ${DAY_NAMES[day]} (${formatMin(overlapStart)} - ${formatMin(overlapEnd)})`;
          const msgB = `Overlaps with ${intA.periodType} "${intA.periodTitle}" on ${DAY_NAMES[day]} (${formatMin(overlapStart)} - ${formatMin(overlapEnd)})`;

          periodErrors[intA.periodKey] = periodErrors[intA.periodKey] ? `${periodErrors[intA.periodKey]}; ${msgA}` : msgA;
          periodErrors[intB.periodKey] = periodErrors[intB.periodKey] ? `${periodErrors[intB.periodKey]}; ${msgB}` : msgB;

          if (intA.periodId) periodErrors[intA.periodId] = periodErrors[intA.periodKey];
          if (intB.periodId) periodErrors[intB.periodId] = periodErrors[intB.periodKey];
        }
      }
    }
  }

  const firstPeriodErrKey = Object.keys(periodErrors)[0];
  const firstSocErrKey = Object.keys(socErrors)[0];
  const mainError = firstPeriodErrKey ? periodErrors[firstPeriodErrKey] : firstSocErrKey ? socErrors[firstSocErrKey] : null;

  return {
    valid: !mainError,
    error: mainError,
    periodErrors,
    socErrors
  };
}

function validateSocRangesWithMap(ranges, socErrors, parentKey = '') {
  if (!Array.isArray(ranges) || ranges.length === 0) return;

  const sorted = ranges
    .map((r, originalIdx) => ({
      key: r.id || `${parentKey}_soc_${originalIdx}`,
      id: r.id,
      originalIdx,
      from: r.from === '' ? '' : parseInt(r.from, 10),
      to: r.to === '' ? '' : parseInt(r.to, 10),
      price: r.price === '' ? '' : parseFloat(r.price)
    }))
    .sort((a, b) => {
      if (a.from === '') return 1;
      if (b.from === '') return -1;
      return a.from - b.from;
    });

  const setErr = (item, msg) => {
    socErrors[item.key] = socErrors[item.key]
      ? `${socErrors[item.key]}; ${msg}`
      : msg;

    if (item.id) {
      socErrors[item.id] = socErrors[item.key];
    }
  };

  for (const r of sorted) {
    if (isNaN(r.from) || isNaN(r.to)) {
      setErr(r, `Boundaries must be numeric values.`);
    } else if (r.from < 0 || r.to > 100) {
      setErr(r, `Boundaries must be between 0% and 100%.`);
    } else if (r.from > r.to) {
      setErr(r, `Lower bound (${r.from}%) cannot be greater than upper bound (${r.to}%).`);
    } else if (!isNaN(r.price) && r.price < 0) {
      setErr(r, `SOC price rate cannot be a negative number.`);
    }
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = sorted[i];
    const next = sorted[i + 1];

    if (next.from <= curr.to) {
      const msg = `Range ${curr.from}-${curr.to}% overlaps with ${next.from}-${next.to}%.`;
      setErr(curr, msg);
      setErr(next, msg);
    }
  }
}
