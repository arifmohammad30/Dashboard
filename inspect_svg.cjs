const fs = require('fs');
const content = fs.readFileSync('Frontend/src/assets/final-logo.svg', 'utf8');

// Find all numbers in d attributes
const dMatches = [...content.matchAll(/d="([^"]+)"/g)];
let minX = 99999, minY = 99999, maxX = -99999, maxY = -99999;

for (const d of dMatches) {
  const parts = d[1].split(/[^0-9.-]+/).filter(Boolean).map(Number);
  for (let i = 0; i < parts.length - 1; i += 2) {
    const x = parts[i];
    const y = parts[i+1];
    if (!isNaN(x) && !isNaN(y)) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
}

console.log('Exact bounds:', { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY });
