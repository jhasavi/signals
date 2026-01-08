export function validatePrice(price: number | null | undefined): number | null {
  if (price == null) return null;
  const p = Number(price);
  if (!isFinite(p)) return null;
  if (p < 20000 || p > 50000000) return null;
  return Math.round(p);
}

export function validateSqft(sqft: number | null | undefined): number | null {
  if (sqft == null) return null;
  const s = Number(sqft);
  if (!isFinite(s)) return null;
  if (s < 100 || s > 20000) return null;
  return Math.round(s);
}

export function validatePps(pps: number | null | undefined): number | null {
  if (pps == null) return null;
  const v = Number(pps);
  if (!isFinite(v)) return null;
  if (v < 5 || v > 5000) return null;
  return v;
}

export function sanitizeListing(listing: { list_price?: any; sqft?: any }) {
  return {
    list_price: validatePrice(listing.list_price),
    sqft: validateSqft(listing.sqft),
  };
}
