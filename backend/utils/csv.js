/**
 * Shared Backend CSV Infrastructure
 * Handles OWASP Formula Injection Defense and CSV Row Formatting
 */

export function sanitizeCsvField(field) {
  if (field === null || field === undefined) return '""';
  let str = String(field);

  // OWASP CSV Injection Defense: prefix dangerous formula triggers with a single quote
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape internal quotes and enclose in double quotes
  return `"${str.replace(/"/g, '""')}"`;
}

export function formatCsvRow(fields) {
  return fields.map(sanitizeCsvField).join(',') + '\n';
}
