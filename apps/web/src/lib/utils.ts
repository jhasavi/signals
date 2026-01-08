export function formatPrice(price: number | null): string {
  if (!price) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

export function getMLSPhotoUrl(
  mlsNumber: string,
  photoIndex: number = 0,
  width: number = 400,
  height: number = 300
): string {
  return `https://media.mlspin.com/photo.aspx?mls=${mlsNumber}&n=${photoIndex}&w=${width}&h=${height}`;
}

export function getSignalLabel(signalType: string): string {
  const labels: Record<string, string> = {
    stale: 'Stale Listing',
    recent_drop: 'Recent Price Drop',
    likely_cut: 'Likely Price Cut',
    underpriced: 'Underpriced',
    hot: 'Hot Property',
  };
  return labels[signalType] || signalType;
}

export function getSignalColor(signalType: string): string {
  const colors: Record<string, string> = {
    stale: 'bg-gray-100 text-gray-800',
    recent_drop: 'bg-blue-100 text-blue-800',
    likely_cut: 'bg-yellow-100 text-yellow-800',
    underpriced: 'bg-green-100 text-green-800',
    hot: 'bg-red-100 text-red-800',
  };
  return colors[signalType] || 'bg-gray-100 text-gray-800';
}

export function cleanAddress(addr: string | null | undefined): string {
  if (!addr) return '';
  // Remove wrapping quotes and stray double quotes
  let s = addr.trim();
  // Remove leading/trailing double quotes
  if (s.startsWith('"') && s.endsWith('"')) {
    s = s.slice(1, -1).trim();
  }
  // Replace occurrences like "416" "Conant Rd" -> 416 Conant Rd
  s = s.replace(/"\s*"/g, ' ');
  // Remove any remaining double quotes
  s = s.replace(/"/g, '');
  // Collapse multiple spaces
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

// Enhanced normalization: expand common abbreviations and title-case.
export function normalizeAddress(addr: string | null | undefined): string {
  if (!addr) return '';
  let s = cleanAddress(addr);

  // Remove stray commas and multiple separators
  s = s
    .replace(/[\u2018\u2019\u201c\u201d]/g, '')
    .replace(/,\s*/g, ', ')
    .replace(/\s*,\s*/g, ', ');

  // Common directional abbreviations
  s = s
    .replace(/\bN\.?\b/gi, 'North')
    .replace(/\bS\.?\b/gi, 'South')
    .replace(/\bE\.?\b/gi, 'East')
    .replace(/\bW\.?\b/gi, 'West')
    .replace(/\bNE\.?\b/gi, 'NE')
    .replace(/\bNW\.?\b/gi, 'NW')
    .replace(/\bSE\.?\b/gi, 'SE')
    .replace(/\bSW\.?\b/gi, 'SW');

  // Expand common street type abbreviations when they appear as whole words
  const expansions: Array<[RegExp, string]> = [
    [/\bSt\.?\b/gi, 'Street'],
    [/\bRd\.?\b/gi, 'Road'],
    [/\bAve\.?\b/gi, 'Avenue'],
    [/\bDr\.?\b/gi, 'Drive'],
    [/\bLn\.?\b/gi, 'Lane'],
    [/\bBlvd\.?\b/gi, 'Boulevard'],
    [/\bPl\.?\b/gi, 'Place'],
    [/\bCt\.?\b/gi, 'Court'],
    [/\bCir\.?\b/gi, 'Circle'],
    [/\bPkwy\.?\b/gi, 'Parkway'],
    [/\bHwy\.?\b/gi, 'Highway'],
    [/\bTer\.?\b/gi, 'Terrace'],
  ];

  for (const [regex, replacement] of expansions) {
    s = s.replace(regex, replacement);
  }

  // Title-case each word (keep numbers intact)
  s = s
    .toLowerCase()
    .split(' ')
    .map((w) => {
      if (/^\d+$/.test(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');

  // Remove duplicate commas/spaces
  s = s
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();

  return s;
}
