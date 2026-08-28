/**
 * Time Helpers & Dynamic 24-Hour Timeline Calculation
 */

export function to12Hour(time24) {
  if (!time24 || typeof time24 !== 'string') return '12:00 AM';
  const parts = time24.trim().split(':');
  let h = parseInt(parts[0], 10);
  const m = parts[1] ? parts[1].padStart(2, '0') : '00';
  if (isNaN(h)) return '12:00 AM';

  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  const hDisplay = String(h).padStart(2, '0');
  return `${hDisplay}:${m} ${period}`;
}

export function to24Hour(time12) {
  if (!time12 || typeof time12 !== 'string') return '00:00';
  const match = time12.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return '00:00';
  let h = parseInt(match[1], 10);
  const m = match[2];
  const period = match[3].toUpperCase();

  if (period === 'PM' && h < 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;

  return `${String(h).padStart(2, '0')}:${m}`;
}

export function generateTimelineSegments(peakPeriods = [], offPeakPeriods = [], day = 'Mon') {
  const MINUTES_IN_DAY = 1440;
  const dayMinutes = new Array(MINUTES_IN_DAY).fill('Normal');

  const timeToMin = (tStr) => {
    if (!tStr) return 0;
    const [h, m] = tStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const daysList = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayMap = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  const targetDayIdx = dayMap[day] ?? 0;
  const prevDayIdx = (targetDayIdx + 6) % 7;
  const prevDayStr = daysList[prevDayIdx];

  const applyPeriod = (p, label) => {
    const start = timeToMin(p.startTime);
    const end = timeToMin(p.endTime);
    const is24Hr = start === end && p.startTime === '00:00';

    if (p.days?.includes(day)) {
      if (is24Hr) {
        for (let m = 0; m < 1440; m++) dayMinutes[m] = label;
      } else if (start < end) {
        for (let m = start; m < end; m++) dayMinutes[m] = label;
      } else if (start > end) {
        for (let m = start; m < 1440; m++) dayMinutes[m] = label;
      }
    }

    if (p.days?.includes(prevDayStr) && start > end) {
      for (let m = 0; m < end; m++) dayMinutes[m] = label;
    }
  };

  (offPeakPeriods || []).forEach(p => applyPeriod(p, 'Off-Peak'));
  (peakPeriods || []).forEach(p => applyPeriod(p, 'Peak'));

  const segments = [];
  let currentType = dayMinutes[0];
  let startMin = 0;

  for (let m = 1; m <= MINUTES_IN_DAY; m++) {
    if (m === MINUTES_IN_DAY || dayMinutes[m] !== currentType) {
      const duration = m - startMin;
      const pct = (duration / MINUTES_IN_DAY) * 100;
      segments.push({
        type: currentType,
        startMin,
        endMin: m,
        widthPct: `${pct.toFixed(2)}%`,
        label: currentType
      });
      if (m < MINUTES_IN_DAY) {
        currentType = dayMinutes[m];
        startMin = m;
      }
    }
  }

  const formatMinStr = (min) => {
    const h = String(Math.floor(min / 60)).padStart(2, '0');
    const m = String(min % 60).padStart(2, '0');
    return `${h}:${m}`;
  };

  const ticks = Array.from(new Set(segments.map(s => s.startMin).concat(1440))).sort((a, b) => a - b);
  const tickMarkers = ticks.map(t => ({
    min: t,
    label: formatMinStr(t),
    pct: (t / MINUTES_IN_DAY) * 100
  }));

  return { segments, tickMarkers };
}
