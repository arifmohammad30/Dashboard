/**
 * ToD & SOC Validation Engine
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

function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const parts = timeStr.trim().split(':');
  if (parts.length !== 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

export function validatePricingConfig(config) {
  if (!config) return { valid: true };

  const { normalPricing, peakPeriods = [], offPeakPeriods = [] } = config;

  // 1. Validate SOC ranges for Normal Pricing
  if (normalPricing && normalPricing.socRanges && normalPricing.socRanges.length > 0) {
    const socErr = validateSocRanges(normalPricing.socRanges, 'Normal Pricing');
    if (socErr) return { valid: false, error: socErr };
  }

  // 2. Validate Special Periods (Peak & Off-Peak)
  const allSpecialPeriods = [
    ...peakPeriods.map(p => ({ ...p, periodType: 'Peak' })),
    ...offPeakPeriods.map(p => ({ ...p, periodType: 'Off-Peak' }))
  ];

  const emittedIntervals = [];

  for (const period of allSpecialPeriods) {
    const periodName = `${period.periodType} Period "${period.title || period.id}"`;

    // Validate SOC ranges if present
    if (period.socRanges && period.socRanges.length > 0) {
      const socErr = validateSocRanges(period.socRanges, periodName);
      if (socErr) return { valid: false, error: socErr };
    }

    const startMin = timeToMinutes(period.startTime);
    const endMin = timeToMinutes(period.endTime);

    if (startMin === null || endMin === null) {
      return { valid: false, error: `${periodName} has invalid time format (${period.startTime} - ${period.endTime}). Use HH:mm format.` };
    }

    // 00:00 -> 00:00 is explicit 24-hour period. Equal start & end (e.g. 08:00 -> 08:00) is rejected.
    if (startMin === endMin) {
      if (period.startTime !== '00:00') {
        return { valid: false, error: `${periodName} has equal start and end time (${period.startTime} -> ${period.endTime}), which represents zero duration.` };
      }
    }

    if (!period.days || !Array.isArray(period.days) || period.days.length === 0) {
      return { valid: false, error: `${periodName} must have at least one applicable day.` };
    }

    for (const dayName of period.days) {
      const dayIdx = DAYS_MAP[dayName];
      if (dayIdx === undefined) continue;

      if (startMin === endMin && period.startTime === '00:00') {
        // Full 24 hours
        emittedIntervals.push({
          day: dayIdx,
          start: 0,
          end: 1440,
          periodName
        });
      } else if (startMin < endMin) {
        // Standard period e.g. 08:00 -> 11:00
        emittedIntervals.push({
          day: dayIdx,
          start: startMin,
          end: endMin,
          periodName
        });
      } else {
        // Overnight period e.g. 22:00 -> 06:00
        // Segment 1: Day D, [startMin, 1440)
        emittedIntervals.push({
          day: dayIdx,
          start: startMin,
          end: 1440,
          periodName: `${periodName} (evening segment)`
        });

        // Segment 2: Day (D + 1) % 7, [0, endMin)
        const nextDayIdx = (dayIdx + 1) % 7;
        emittedIntervals.push({
          day: nextDayIdx,
          start: 0,
          end: endMin,
          periodName: `${periodName} (morning segment from ${dayName} night)`
        });
      }
    }
  }

  // 3. Overlap Check across emitted intervals
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
          return {
            valid: false,
            error: `ToD Overlap Error on ${DAY_NAMES[day]}: ${intA.periodName} and ${intB.periodName} overlap between ${formatMin(overlapStart)} and ${formatMin(overlapEnd)}.`
          };
        }
      }
    }
  }

  return { valid: true };
}

function validateSocRanges(ranges, sectionName) {
  if (!Array.isArray(ranges) || ranges.length === 0) return null;

  // Sort ranges by 'from'
  const sorted = [...ranges].map(r => ({
    from: parseInt(r.from, 10),
    to: parseInt(r.to, 10),
    price: parseFloat(r.price)
  })).sort((a, b) => a.from - b.from);

  if (sorted.length > 0 && !isNaN(sorted[0].from) && sorted[0].from !== 0) {
    return `SOC Error in ${sectionName}: First SOC range must start from 0%. Found ${sorted[0].from}%.`;
  }

  for (const r of sorted) {
    if (isNaN(r.from) || isNaN(r.to)) {
      return `SOC Error in ${sectionName}: Boundaries must be numeric values.`;
    }
    if (r.from < 0 || r.to > 100) {
      return `SOC Error in ${sectionName}: Boundaries must be between 0% and 100%. Found range ${r.from}% - ${r.to}%.`;
    }
    if (r.from > r.to) {
      return `SOC Error in ${sectionName}: Range lower bound (${r.from}%) cannot be greater than upper bound (${r.to}%).`;
    }
  }

  // Check continuity and overlaps between ranges
  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = sorted[i];
    const next = sorted[i + 1];

    if (next.from <= curr.to) {
      return `SOC Overlap Error in ${sectionName}: Range ${curr.from}-${curr.to}% overlaps with Range ${next.from}-${next.to}%.`;
    }

    if (next.from > curr.to + 1) {
      return `SOC Gap Error in ${sectionName}: Missing SOC coverage between ${curr.to + 1}% and ${next.from - 1}%.`;
    }
  }

  return null;
}
