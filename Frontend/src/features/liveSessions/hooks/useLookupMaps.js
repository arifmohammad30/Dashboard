/**
 * @deprecated Removed in accordance with Strict Backend Contract rules.
 * Relationships are directly provided by authoritative backend payloads.
 */
export function useLookupMaps() {
  return {
    resolveStation: (s) => s,
    resolveChargePoint: (cp) => cp
  };
}
