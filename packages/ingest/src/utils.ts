import { MLSListing, NormalizedListing } from './types.js';
import { lookupTown } from './town-mapping-complete';

function extractTownName(listing: Record<string, any>): string {
  // Try direct TOWN field first (already has name)
  const directTown = (listing.TOWN || '').replace(/"/g, '').trim();
  if (directTown && directTown !== '' && !/^[0-9]+[A-Z]?$/.test(directTown)) {
    return directTown;
  }

  // Fall back to TOWN_NUM mapping
  const townNum = (listing.TOWN_NUM || '').replace(/"/g, '').trim();
  if (townNum) {
    const mapped = lookupTown(townNum);
    if (mapped) return mapped;
  }

  // Return original if no mapping found (will be filtered out later)
  return directTown || townNum || '';
}

function extractDOM(listing: Record<string, any>): number | null {
  // Try direct DOM field
  const domValue = listing.DOM || listing.DAYS_ON_MARKET || listing.DaysOnMarket;
  if (domValue) {
    const parsed = parseInt(String(domValue));
    if (!isNaN(parsed)) return parsed;
  }

  // Try computing from list_date
  const listDate = listing.ListingContractDate || listing.LIST_DATE || listing.LISTING_DATE;
  if (listDate) {
    try {
      const date = new Date(listDate);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return null;
    }
  }

  return null;
}

export function normalizeMLSListing(
  listing: MLSListing,
  propertyType: 'SF' | 'CC' | 'MF'
): NormalizedListing {
  // Construct address from available fields
  let address = listing.UnparsedAddress || listing.ADDRESS || '';
  if (!address && listing.StreetNumber && listing.StreetName) {
    address = `${listing.StreetNumber} ${listing.StreetName}`;
  }
  if (!address && listing.STREET_NUMBER && listing.STREET_NAME) {
    address = `${listing.STREET_NUMBER} ${listing.STREET_NAME}`;
  }

  // Get town/city - use improved extraction with mapping
  const town = extractTownName(listing);

  // Get MLS ID - try various field names
  const mlsId = (
    listing.ListingId ||
    listing.LIST_NO ||
    listing.MLS_NUMBER ||
    listing.LISTING_ID ||
    listing.MLS_NUM ||
    ''
  ).trim();

  // Parse numeric fields
  const listPrice = parseFloat(listing.ListPrice || listing.LIST_PRICE || '0') || null;
  const beds =
    parseInt(
      listing.BedroomsTotal || listing.NO_BEDROOMS || listing.BEDS || listing.BEDROOMS || '0'
    ) || null;
  const baths =
    parseFloat(
      listing.BathroomsTotalInteger || listing.NO_BATHS || listing.BATHS || listing.BATHROOMS || '0'
    ) || null;
  const sqft = parseInt(listing.LivingArea || listing.SQFT || listing.SQUARE_FEET || '0') || null;
  const dom = extractDOM(listing);

  return {
    mls_id: mlsId,
    property_type: propertyType,
    status: listing.StandardStatus || listing.STATUS || 'Unknown',
    list_price: listPrice,
    town,
    address: address.trim(),
    beds,
    baths,
    sqft,
    dom,
    list_date: listing.ListingContractDate || listing.LIST_DATE || listing.LISTING_DATE || null,
    pending_date: listing.PendingTimestamp || listing.PENDING_DATE || null,
    sold_date: listing.CloseDate || listing.CLOSE_DATE || listing.SOLD_DATE || null,
    sold_price:
      parseFloat(listing.ClosePrice || listing.CLOSE_PRICE || listing.SOLD_PRICE || '0') || null,
    raw_data: listing,
  };
}

export function getPriceBand(price: number | null): string {
  if (!price) return 'unknown';
  if (price < 500000) return '0-500k';
  if (price < 1000000) return '500k-1m';
  if (price < 2000000) return '1m-2m';
  return '2m+';
}
