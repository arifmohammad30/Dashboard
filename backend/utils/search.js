export function isTokenMatchedServer(text, token) {
  if (!text || !token) return false;
  const lowerText = text.toLowerCase();
  const lowerToken = token.toLowerCase();

  if (lowerText === lowerToken) return true;

  const escaped = lowerToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const wordBoundaryRegex = new RegExp(`(?:^|\\b|\\s|_|-)${escaped}(?:$|\\b|\\s|_|-)`, 'i');

  if (wordBoundaryRegex.test(lowerText)) {
    return true;
  }

  if (lowerToken.length >= 4 && !/^\d+$/.test(lowerToken)) {
    return lowerText.includes(lowerToken);
  }

  return false;
}
