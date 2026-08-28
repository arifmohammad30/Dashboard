import { validatePricingConfig } from './tariffs.validator.js';

const testCases = [
  // --- VALID CASES ---
  {
    name: 'TC-V1: Standard non-overlapping Peak & Off-Peak periods',
    config: {
      normalPricing: { energyPrice: 15, timePrice: 0 },
      peakPeriods: [
        { id: 'p1', title: 'Morning Peak', startTime: '08:00', endTime: '12:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], energyPrice: 25 }
      ],
      offPeakPeriods: [
        { id: 'op1', title: 'Night Off-Peak', startTime: '22:00', endTime: '06:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], energyPrice: 10 }
      ]
    },
    expectedValid: true
  },
  {
    name: 'TC-V2: Contiguous boundary periods (08:00-12:00 and 12:00-18:00)',
    config: {
      normalPricing: { energyPrice: 15, timePrice: 0 },
      peakPeriods: [
        { id: 'p1', title: 'Peak Morning', startTime: '08:00', endTime: '12:00', days: ['Mon'], energyPrice: 25 },
        { id: 'p2', title: 'Peak Afternoon', startTime: '12:00', endTime: '18:00', days: ['Mon'], energyPrice: 30 }
      ]
    },
    expectedValid: true
  },
  {
    name: 'TC-V3: Same time on different days (Mon-Wed vs Thu-Fri)',
    config: {
      normalPricing: { energyPrice: 15 },
      peakPeriods: [
        { id: 'p1', title: 'Early Week Peak', startTime: '08:00', endTime: '12:00', days: ['Mon', 'Tue', 'Wed'], energyPrice: 25 }
      ],
      offPeakPeriods: [
        { id: 'op1', title: 'Late Week Off-Peak', startTime: '08:00', endTime: '12:00', days: ['Thu', 'Fri'], energyPrice: 10 }
      ]
    },
    expectedValid: true
  },
  {
    name: 'TC-V4: Full 24-hour period on Weekend (00:00 -> 00:00)',
    config: {
      normalPricing: { energyPrice: 15 },
      offPeakPeriods: [
        { id: 'op1', title: 'Weekend Special', startTime: '00:00', endTime: '00:00', days: ['Sat', 'Sun'], energyPrice: 10 }
      ],
      peakPeriods: [
        { id: 'p1', title: 'Weekday Peak', startTime: '08:00', endTime: '12:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], energyPrice: 25 }
      ]
    },
    expectedValid: true
  },

  // --- INVALID CASES ---
  {
    name: 'TC-E1: Peak vs Peak partial overlap on same day',
    config: {
      normalPricing: { energyPrice: 15 },
      peakPeriods: [
        { id: 'p1', title: 'Peak 1', startTime: '08:00', endTime: '12:00', days: ['Mon'], energyPrice: 25 },
        { id: 'p2', title: 'Peak 2', startTime: '10:00', endTime: '14:00', days: ['Mon'], energyPrice: 30 }
      ]
    },
    expectedValid: false
  },
  {
    name: 'TC-E2: Off-Peak vs Off-Peak partial overlap on same day',
    config: {
      normalPricing: { energyPrice: 15 },
      offPeakPeriods: [
        { id: 'op1', title: 'Off-Peak 1', startTime: '20:00', endTime: '23:00', days: ['Tue'], energyPrice: 10 },
        { id: 'op2', title: 'Off-Peak 2', startTime: '22:00', endTime: '02:00', days: ['Tue'], energyPrice: 12 }
      ]
    },
    expectedValid: false
  },
  {
    name: 'TC-E3: Peak vs Off-Peak direct overlap on same day',
    config: {
      normalPricing: { energyPrice: 15 },
      peakPeriods: [
        { id: 'p1', title: 'Peak 1', startTime: '17:00', endTime: '21:00', days: ['Wed'], energyPrice: 25 }
      ],
      offPeakPeriods: [
        { id: 'op1', title: 'Off-Peak 1', startTime: '20:00', endTime: '04:00', days: ['Wed'], energyPrice: 10 }
      ]
    },
    expectedValid: false
  },
  {
    name: 'TC-E4: Sunday overnight wrapping into Monday morning vs Monday Peak',
    config: {
      normalPricing: { energyPrice: 15 },
      offPeakPeriods: [
        { id: 'op1', title: 'Sunday Night', startTime: '22:00', endTime: '06:00', days: ['Sun'], energyPrice: 10 }
      ],
      peakPeriods: [
        { id: 'p1', title: 'Monday Morning Peak', startTime: '05:00', endTime: '09:00', days: ['Mon'], energyPrice: 25 }
      ]
    },
    expectedValid: false
  },
  {
    name: 'TC-E5: Friday overnight wrapping into Saturday morning vs Saturday Off-Peak',
    config: {
      normalPricing: { energyPrice: 15 },
      peakPeriods: [
        { id: 'p1', title: 'Friday Late Peak', startTime: '23:00', endTime: '02:00', days: ['Fri'], energyPrice: 30 }
      ],
      offPeakPeriods: [
        { id: 'op1', title: 'Saturday Early Off-Peak', startTime: '01:00', endTime: '05:00', days: ['Sat'], energyPrice: 10 }
      ]
    },
    expectedValid: false
  },
  {
    name: 'TC-E6: Zero duration equal time error (08:00 -> 08:00)',
    config: {
      normalPricing: { energyPrice: 15 },
      peakPeriods: [
        { id: 'p1', title: 'Zero Peak', startTime: '08:00', endTime: '08:00', days: ['Mon'], energyPrice: 25 }
      ]
    },
    expectedValid: false
  }
];

console.log('--- RUNNING TOD & OVERLAP VALIDATION TEST SUITE ---\n');
let passedCount = 0;

for (const tc of testCases) {
  const result = validatePricingConfig(tc.config);
  const isPassed = result.valid === tc.expectedValid;

  if (isPassed) {
    passedCount++;
    console.log(`[PASS] ${tc.name}`);
    if (!result.valid) {
      console.log(`       Rejected as expected: "${result.error}"`);
    }
  } else {
    console.error(`[FAIL] ${tc.name}`);
    console.error(`       Expected valid: ${tc.expectedValid}, Got: ${result.valid}`);
    if (result.error) console.error(`       Error output: "${result.error}"`);
  }
}

console.log(`\nSummary: ${passedCount}/${testCases.length} Test Cases Passed.`);
