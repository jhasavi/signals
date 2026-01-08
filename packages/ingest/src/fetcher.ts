import { MLSListing } from './types.js';

interface FetchOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

export class MLSFetcher {
  private maxRetries: number;
  private retryDelay: number;
  private timeout: number;

  constructor(options: FetchOptions = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 2000;
    this.timeout = options.timeout || 30000;
  }

  async fetchFeed(url: string, propertyType: string): Promise<MLSListing[]> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`📥 Fetching ${propertyType} feed (attempt ${attempt}/${this.maxRetries})...`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type') || '';
        const text = await response.text();
        let data: any;

        // Check if it's pipe-delimited format
        if (text.startsWith('PROP_TYPE|') || text.includes('|')) {
          // Parse pipe-delimited format
          data = this.parsePipeDelimited(text);
        } else if (
          contentType.includes('application/json') ||
          text.trim().startsWith('{') ||
          text.trim().startsWith('[')
        ) {
          // Try to parse as JSON
          data = JSON.parse(text);
        } else {
          // Unknown format, try JSON anyway
          data = JSON.parse(text);
        }

        // Handle different response structures
        let listings: MLSListing[] = [];

        if (Array.isArray(data)) {
          listings = data;
        } else if (data.value && Array.isArray(data.value)) {
          listings = data.value;
        } else if (data.listings && Array.isArray(data.listings)) {
          listings = data.listings;
        } else if (data.results && Array.isArray(data.results)) {
          listings = data.results;
        }

        console.log(`✅ Fetched ${listings.length} ${propertyType} listings`);
        return listings;
      } catch (error: any) {
        lastError = error;
        console.error(`❌ Attempt ${attempt} failed:`, error.message);

        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * attempt;
          console.log(`⏳ Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    console.error(`❌ Failed to fetch ${propertyType} feed after ${this.maxRetries} attempts`);
    throw lastError || new Error('Unknown error fetching feed');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private parsePipeDelimited(text: string): MLSListing[] {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    // First line is headers
    const headers = lines[0].split('|').map((h) => h.trim());

    // Remaining lines are data
    const listings: MLSListing[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('|');
      const listing: any = {};

      headers.forEach((header, index) => {
        const value = values[index]?.trim();
        // Convert common field names to standardized format
        const normalizedHeader = this.normalizeFieldName(header);
        listing[normalizedHeader] = value || null;
      });

      listings.push(listing as MLSListing);
    }

    return listings;
  }

  private normalizeFieldName(header: string): string {
    // Map pipe-delimited headers to our expected field names
    const fieldMap: Record<string, string> = {
      PROP_TYPE: 'PropertyType',
      LIST_NO: 'ListingId',
      MLS_NUMBER: 'ListingId',
      STATUS: 'StandardStatus',
      LIST_PRICE: 'ListPrice',
      TOWN: 'Town',
      TOWN_NUM: 'TOWN_NUM', // Keep as-is for town mapping logic
      CITY: 'City',
      ADDRESS: 'UnparsedAddress',
      STREET_NO: 'StreetNumber',
      STREET_NUMBER: 'StreetNumber',
      STREET_NAME: 'StreetName',
      UNIT_NO: 'UnitNumber',
      NEIGHBORHOOD: 'Neighborhood',
      AREA: 'Area',
      NO_BEDROOMS: 'BedroomsTotal',
      BEDS: 'BedroomsTotal',
      BEDROOMS: 'BedroomsTotal',
      NO_BATHS: 'BathroomsTotalInteger',
      BATHS: 'BathroomsTotalInteger',
      BATHROOMS: 'BathroomsTotalInteger',
      SQFT: 'LivingArea',
      SQUARE_FEET: 'LivingArea',
      DOM: 'DaysOnMarket',
      DAYS_ON_MARKET: 'DaysOnMarket',
      LIST_DATE: 'ListingContractDate',
      LISTING_DATE: 'ListingContractDate',
      PENDING_DATE: 'PendingTimestamp',
      CLOSE_DATE: 'CloseDate',
      SOLD_DATE: 'CloseDate',
      CLOSE_PRICE: 'ClosePrice',
      SOLD_PRICE: 'ClosePrice',
    };

    const upperHeader = header.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    return fieldMap[upperHeader] || header;
  }
}
