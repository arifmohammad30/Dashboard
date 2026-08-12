
export function sanitizeCsvField(field) {
  if (field === null || field === undefined) return '""';
  let str = String(field);


  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  return `"${str.replace(/"/g, '""')}"`;
}

export function formatCsvRow(fields) {
  return fields.map(sanitizeCsvField).join(',') + '\n';
}
