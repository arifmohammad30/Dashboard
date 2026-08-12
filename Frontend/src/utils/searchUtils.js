/**
 * Advanced Multi-Field Tokenized Table Search Engine
 * 
 * Supports phrase-first priority and word-boundary token matching across nested object properties,
 * computed getter functions, and exact string fields to prevent false positives.
 * 
 * @param {Array} items - Array of items to filter
 * @param {string} searchTerm - User input search string
 * @param {Array<string|Function>} searchableFields - Array of keys (e.g. 'name', 'connector.type') or getter functions
 * @returns {Array} Filtered list matching search query
 */
export function filterTableData(items = [], searchTerm = '', searchableFields = []) {
  if (!Array.isArray(items) || items.length === 0) return [];
  if (!searchTerm || typeof searchTerm !== 'string' || !searchTerm.trim()) return items;

  const normalizedQuery = searchTerm.trim().toLowerCase();
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return items;

  return items.filter((item) => {
    if (!item) return false;

    // Extract field values into individual strings
    const fieldTexts = searchableFields.map((field) => {
      let val;
      if (typeof field === 'function') {
        try {
          val = field(item);
        } catch {
          val = '';
        }
      } else if (typeof field === 'string') {
        val = field.split('.').reduce((acc, curr) => (acc && acc[curr] !== undefined ? acc[curr] : undefined), item);
      }

      if (val === null || val === undefined) return '';
      if (typeof val === 'object') {
        return Object.values(val).filter(v => typeof v !== 'object' && v !== null).join(' ');
      }
      return String(val);
    }).filter(Boolean);

    // 1. Phrase-First Priority: Check if the exact full query phrase matches any single field value
    const phraseMatch = fieldTexts.some((txt) => isTokenMatched(txt, normalizedQuery));
    if (phraseMatch) return true;

    // 2. Tokenized Multi-Field Match: Every token in search query must match word-bounded text
    const combinedText = fieldTexts.join(' ').toLowerCase();
    return tokens.every((token) => isTokenMatched(combinedText, token));
  });
}

function isTokenMatched(text, token) {
  if (!text || !token) return false;
  const lowerText = String(text).toLowerCase();
  const lowerToken = String(token).toLowerCase();

  // 1. Exact string match
  if (lowerText === lowerToken) return true;

  // 2. Word boundary regex check: prevents "1" matching "10", "11", "12" or "HUB-010"
  const escaped = lowerToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const wordBoundaryRegex = new RegExp(`(?:^|\\b|\\s|_|-)${escaped}(?:$|\\b|\\s|_|-)`, 'i');

  if (wordBoundaryRegex.test(lowerText)) {
    return true;
  }

  // 3. Fallback substring match for longer non-numeric words (>= 4 chars)
  if (lowerToken.length >= 4 && !/^\d+$/.test(lowerToken)) {
    return lowerText.includes(lowerToken);
  }

  return false;
}
