import { sql } from '@/lib/db';
import Link from 'next/link';
import ScoreBreakdown from '@/components/ScoreBreakdown';
import Image from 'next/image';
import { formatPrice, getMLSPhotoUrl, getSignalLabel, getSignalColor } from '@/lib/utils';
import { Filters } from '@/components/Filters';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { town: string };
  searchParams: {
    type?: string;
    signal?: string;
    priceBucket?: string;
    minPrice?: string;
    maxPrice?: string;
    minBeds?: string;
    maxBeds?: string;
    minBaths?: string;
    maxBaths?: string;
    minDom?: string;
    maxDom?: string;
    inventory?: string;
    status?: string;
    sort?: string;
  };
}

interface ListingWithSignal {
  mls_id: string;
  address: string;
  list_price: number;
  beds: number;
  baths: number;
  sqft: number;
  dom: number;
  status: string;
  signal_type: string;
  signal_score: number;
  computed_score?: number | null;
  computed_components?: any | null;
  metadata: any;
}

function parsePriceBucket(bucket: string): { min: number; max: number } | null {
  const buckets: Record<string, { min: number; max: number }> = {
    '0-150k': { min: 0, max: 150000 },
    '150k-500k': { min: 150000, max: 500000 },
    '500k-1m': { min: 500000, max: 1000000 },
    '1m-2m': { min: 1000000, max: 2000000 },
    '2m-4m': { min: 2000000, max: 4000000 },
    '4m+': { min: 4000000, max: 999999999 },
  };
  return buckets[bucket] || null;
}

async function getTownInventoryCount(town: string, propertyType: string): Promise<number> {
  const result = await sql`
    SELECT COUNT(*)::int as count
    FROM listings_raw
    WHERE LOWER(town) = LOWER(${town})
      AND property_type = ${propertyType}
      AND list_price IS NOT NULL
  `;
  return result[0]?.count || 0;
}

async function getListingsWithSignals(
  town: string,
  propertyType: string,
  signalType: string,
  filters: any
): Promise<ListingWithSignal[]> {
  // Normalize signal type (handle both underscores and hyphens)
  const normalizedSignalType = signalType.replace(/-/g, '_');

  // Build WHERE conditions with parameterized queries for safety
  const conditions = [
    sql`LOWER(lr.town) = LOWER(${town})`,
    sql`lr.property_type = ${propertyType}`,
    sql`(ls.signal_type = ${signalType} OR ls.signal_type = ${normalizedSignalType})`,
    sql`ls.is_primary = true`,
  ];

  // Price filters (bucket takes precedence)
  if (filters.priceBucket) {
    const bucket = parsePriceBucket(filters.priceBucket);
    if (bucket) {
      conditions.push(sql`lr.list_price >= ${bucket.min}`);
      conditions.push(sql`lr.list_price <= ${bucket.max}`);
    }
  } else {
    if (filters.minPrice) {
      conditions.push(sql`lr.list_price >= ${filters.minPrice}`);
    }
    if (filters.maxPrice) {
      conditions.push(sql`lr.list_price <= ${filters.maxPrice}`);
    }
  }

  // Beds filters
  if (filters.minBeds) {
    conditions.push(sql`lr.beds >= ${filters.minBeds}`);
  }
  if (filters.maxBeds) {
    conditions.push(sql`lr.beds <= ${filters.maxBeds}`);
  }

  // Baths filters
  if (filters.minBaths) {
    conditions.push(sql`lr.baths >= ${filters.minBaths}`);
  }
  if (filters.maxBaths) {
    conditions.push(sql`lr.baths <= ${filters.maxBaths}`);
  }

  // DOM filters
  if (filters.minDom) {
    conditions.push(sql`lr.dom >= ${filters.minDom}`);
  }
  if (filters.maxDom) {
    conditions.push(sql`lr.dom <= ${filters.maxDom}`);
  }

  // Status filter
  if (filters.status && filters.status !== 'any') {
    conditions.push(sql`lr.status = ${filters.status}`);
  }

  // Determine sort order
  let orderBy = sql`ls.signal_score DESC`;
  if (filters.sort === 'price') {
    orderBy = sql`lr.list_price ASC`;
  } else if (filters.sort === 'dom') {
    orderBy = sql`lr.dom DESC`;
  } else if (filters.sort === 'newest') {
    orderBy = sql`lr.list_date DESC`;
  }

  const query = sql`
    SELECT 
      lr.mls_id,
      lr.address,
      lr.list_price,
      lr.beds,
      lr.baths,
      lr.sqft,
      lr.dom,
      lr.status,
      ls.signal_type,
      ls.signal_score,
      lsc.score AS computed_score,
      lsc.components AS computed_components,
      ls.metadata
    FROM listings_raw lr
    JOIN listing_signals ls ON lr.mls_id = ls.mls_id
    LEFT JOIN listing_scores lsc ON lsc.mls_id = lr.mls_id
    WHERE ${sql.join(conditions, sql` AND `)}
    ORDER BY ${orderBy}
    LIMIT 200
  `;

  const listings = await query;
  return listings as unknown as ListingWithSignal[];
}

export default async function SignalsPage({ params, searchParams }: PageProps) {
  const town = decodeURIComponent(params.town);
  const propertyType = searchParams.type || 'SF';
  const signalType = searchParams.signal || 'likely_cut';

  // Check inventory filter
  const inventoryFilter = searchParams.inventory || 'any';
  if (inventoryFilter !== 'any') {
    const townCount = await getTownInventoryCount(town, propertyType);
    const isLowInventory = townCount < 50;
    const isHighInventory = townCount >= 50;

    // If filter doesn't match, return empty results
    if ((inventoryFilter === 'low' && !isLowInventory) || (inventoryFilter === 'high' && !isHighInventory)) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Link
              href={`/town/${encodeURIComponent(town)}?type=${propertyType}`}
              className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block"
            >
              ← Back to {town}
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{getSignalLabel(signalType)}</h1>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-800">
              This town has {townCount} listings, which doesn't match the &quot;{inventoryFilter}&quot; inventory filter.
            </p>
          </div>
        </div>
      );
    }
  }

  const filters = {
    priceBucket: searchParams.priceBucket || null,
    minPrice: searchParams.minPrice ? parseFloat(searchParams.minPrice) : null,
    maxPrice: searchParams.maxPrice ? parseFloat(searchParams.maxPrice) : null,
    minBeds: searchParams.minBeds ? parseInt(searchParams.minBeds) : null,
    maxBeds: searchParams.maxBeds ? parseInt(searchParams.maxBeds) : null,
    minBaths: searchParams.minBaths ? parseFloat(searchParams.minBaths) : null,
    maxBaths: searchParams.maxBaths ? parseFloat(searchParams.maxBaths) : null,
    minDom: searchParams.minDom ? parseInt(searchParams.minDom) : null,
    maxDom: searchParams.maxDom ? parseInt(searchParams.maxDom) : null,
    inventory: searchParams.inventory || null,
    status: searchParams.status || null,
    sort: searchParams.sort || 'score',
  };

  const listings = await getListingsWithSignals(town, propertyType, signalType, filters);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/town/${encodeURIComponent(town)}?type=${propertyType}`}
          className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block"
        >
          ← Back to {town}
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{getSignalLabel(signalType)}</h1>
        <p className="mt-2 text-gray-600">
          {town} •{' '}
          {propertyType === 'SF'
            ? 'Single Family'
            : propertyType === 'CC'
              ? 'Condo'
              : 'Multi-Family'}
        </p>
      </div>

      {/* Filters */}
      <Filters
        town={town}
        propertyType={propertyType}
        signalType={signalType}
        currentFilters={filters}
      />

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          {listings.length} {listings.length === 1 ? 'listing' : 'listings'} found
        </p>
      </div>

      {/* Listings Grid */}
      {listings.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">No listings found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => {
            const priceChange =
              listing.metadata?.drop_percentage || listing.metadata?.price_vs_median;

            return (
              <Link
                key={listing.mls_id}
                href={`/listing/${listing.mls_id}`}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow block"
              >
                {/* Photo */}
                <div className="relative h-48 bg-gray-200">
                  <Image
                    src={getMLSPhotoUrl(listing.mls_id, 0, 400, 300)}
                    alt={listing.address}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Signal Badge */}
                  <div className="mb-2">
                    <div className="inline-flex items-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSignalColor(listing.signal_type)}`}
                      >
                        Score: {listing.computed_score ?? listing.signal_score}
                      </span>
                      <ScoreBreakdown
                        score={listing.computed_score ?? listing.signal_score}
                        components={listing.computed_components}
                      />
                    </div>
                    {/* Server-side fallback for crawlers */}
                    <div className="sr-only">
                      {(() => {
                        const c = listing.computed_components;
                        if (!c) return `Score: ${listing.computed_score ?? listing.signal_score}`;
                        const pps = c.ppsComponent ? `${Math.round(c.ppsComponent)} pts` : '—';
                        const price = c.priceComponent
                          ? `${Math.round(c.priceComponent)} pts`
                          : '—';
                        const dom =
                          c.domComponent !== undefined ? `${Math.round(c.domComponent)} pts` : '—';
                        const signal =
                          c.signalComponent !== undefined
                            ? `${Math.round(c.signalComponent)} pts`
                            : '—';
                        const total =
                          c.finalScore !== undefined
                            ? `${Math.round(c.finalScore)} / 100`
                            : (listing.computed_score ?? listing.signal_score);
                        return `Breakdown — PPS: ${pps}; Price: ${price}; DOM: ${dom}; Signal: ${signal}; Total: ${total}`;
                      })()}
                    </div>
                  </div>

                  {/* Address */}
                  <h3 className="text-sm font-medium text-gray-900 mb-2">{listing.address}</h3>

                  {/* Price */}
                  <div className="text-xl font-bold text-gray-900 mb-3">
                    {formatPrice(listing.list_price)}
                    {priceChange && (
                      <span className="text-sm font-normal text-red-600 ml-2">
                        {priceChange > 0
                          ? `+${priceChange.toFixed(1)}%`
                          : `${priceChange.toFixed(1)}%`}
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-sm text-gray-600 mb-3">
                    <div>
                      <span className="font-medium">{listing.beds || 'N/A'}</span> beds
                    </div>
                    <div>
                      <span className="font-medium">{listing.baths || 'N/A'}</span> baths
                    </div>
                    <div>
                      <span className="font-medium">
                        {listing.sqft ? listing.sqft.toLocaleString() : 'N/A'}
                      </span>{' '}
                      sqft
                    </div>
                  </div>

                  {/* DOM & Status */}
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{listing.dom} days on market</span>
                    <span className="font-medium">{listing.status}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
