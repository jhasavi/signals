import { sql } from '@/lib/db';
import Link from 'next/link';
import { formatPrice, cleanAddress } from '@/lib/utils';
import { computeAndPersistScore } from '@/lib/scoring';
import { notFound } from 'next/navigation';
import PhotoGallery from '@/components/PhotoGallery';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { mls_id: string };
}

interface ListingDetails {
  mls_id: string;
  address: string;
  town: string;
  property_type: string;
  status: string;
  list_price: number;
  beds: number;
  baths: number;
  sqft: number;
  dom: number;
  list_date: string;
  updated_at: string;
}

interface ListingSignal {
  signal_type: string;
  signal_score: number;
  is_primary: boolean;
  metadata: any;
  computed_at: string;
}

function getSignalInfo(signalType: string) {
  const info: Record<string, { label: string; description: string; icon: string; color: string }> =
    {
      price_reduction: {
        label: 'Price Reduction',
        description: 'Recent price drop - potential deal or motivated seller',
        icon: '💰',
        color: 'bg-green-100 text-green-800',
      },
      'price-reduction': {
        label: 'Price Reduction',
        description: 'Recent price drop - potential deal or motivated seller',
        icon: '💰',
        color: 'bg-green-100 text-green-800',
      },
      new_listing: {
        label: 'New Listing',
        description: 'Fresh on the market',
        icon: '✨',
        color: 'bg-blue-100 text-blue-800',
      },
      'new-listing': {
        label: 'New Listing',
        description: 'Fresh on the market',
        icon: '✨',
        color: 'bg-blue-100 text-blue-800',
      },
      price_increase: {
        label: 'Price Increase',
        description: 'Recent price hike',
        icon: '📈',
        color: 'bg-red-100 text-red-800',
      },
      'price-increase': {
        label: 'Price Increase',
        description: 'Recent price hike',
        icon: '📈',
        color: 'bg-red-100 text-red-800',
      },
      back_on_market: {
        label: 'Back on Market',
        description: 'Deal fell through - second chance',
        icon: '🔄',
        color: 'bg-yellow-100 text-yellow-800',
      },
      'back-on-market': {
        label: 'Back on Market',
        description: 'Deal fell through - second chance',
        icon: '🔄',
        color: 'bg-yellow-100 text-yellow-800',
      },
      high_dom: {
        label: 'Long on Market',
        description: 'Sitting longer than average',
        icon: '⏰',
        color: 'bg-orange-100 text-orange-800',
      },
      'high-dom': {
        label: 'Long on Market',
        description: 'Sitting longer than average',
        icon: '⏰',
        color: 'bg-orange-100 text-orange-800',
      },
      low_dom: {
        label: 'Moving Fast',
        description: 'Selling quickly',
        icon: '⚡',
        color: 'bg-purple-100 text-purple-800',
      },
      'low-dom': {
        label: 'Moving Fast',
        description: 'Selling quickly',
        icon: '⚡',
        color: 'bg-purple-100 text-purple-800',
      },
      underpriced: {
        label: 'Below Market',
        description: 'Priced below similar properties',
        icon: '🎯',
        color: 'bg-teal-100 text-teal-800',
      },
      overpriced: {
        label: 'Above Market',
        description: 'Priced above comparable homes',
        icon: '🏷️',
        color: 'bg-pink-100 text-pink-800',
      },
    };

  return (
    info[signalType] || {
      label: signalType,
      description: 'Market signal detected',
      icon: '📊',
      color: 'bg-gray-100 text-gray-800',
    }
  );
}

function getPropertyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    SF: 'Single Family',
    CC: 'Condo',
    MF: 'Multi-Family',
  };
  return labels[type] || type;
}

async function getListingDetails(
  mlsId: string
): Promise<{ listing: ListingDetails | null; signals: ListingSignal[] }> {
  const listings = await sql`
    SELECT * FROM listings_raw
    WHERE mls_id = ${mlsId}
  `;

  if (listings.length === 0) {
    return { listing: null, signals: [] };
  }

  const signals = await sql`
    SELECT signal_type, signal_score, is_primary, metadata, computed_at
    FROM listing_signals
    WHERE mls_id = ${mlsId}
    ORDER BY is_primary DESC, signal_score DESC
  `;

  return {
    listing: listings[0] as ListingDetails,
    signals: signals as unknown as ListingSignal[],
  };
}

export default async function ListingPage({ params }: PageProps) {
  const { listing, signals } = await getListingDetails(params.mls_id);

  if (!listing) {
    notFound();
  }

  const primarySignal = signals.find((s) => s.is_primary);
  const _secondarySignals = signals.filter((s) => !s.is_primary);

  // MLS photo URLs - first 3 photos
  const photoUrls = [0, 1, 2].map(
    (n) => `https://media.mlspin.com/photo.aspx?mls=${listing.mls_id}&n=${n}&w=800&h=600`
  );

  // Compute robust score and persist it
  const listingMinimal = {
    mls_id: listing.mls_id,
    list_price: listing.list_price,
    sqft: listing.sqft,
    town: listing.town,
    property_type: listing.property_type,
    dom: listing.dom || null,
  };

  const signalTypes = signals.map((s) => s.signal_type);
  const components = await computeAndPersistScore(
    listingMinimal,
    Boolean(primarySignal),
    signalTypes
  );

  const avgPrice = components.medians.price || 0;
  const avgSqft = components.medians.sqft || 0;
  const avgPps = components.medians.pps || 0;

  const ppsComponent = components.ppsComponent;
  const priceComponent = components.priceComponent;
  const domComponent = components.domComponent;
  const signalComponent = components.signalComponent;
  const finalScore = components.finalScore;

  const listingPps = listing.sqft ? listing.list_price / listing.sqft : null;
  const ppsDiffPct = listingPps && avgPps ? ((avgPps - listingPps) / avgPps) * 100 : 0;
  const _priceDiffPct = avgPrice ? ((avgPrice - listing.list_price) / avgPrice) * 100 : 0;

  const similar = await sql`
    SELECT mls_id, address, list_price, sqft, list_date, status
    FROM listings_raw lr
    WHERE LOWER(lr.town) = LOWER(${listing.town})
      AND lr.property_type = ${listing.property_type}
      AND lr.list_price IS NOT NULL
      AND lr.sqft IS NOT NULL
    ORDER BY lr.list_date DESC
    LIMIT 5
  `;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
          ← Back to Home
        </Link>
        <span className="text-gray-400 mx-2">/</span>
        <Link
          href={`/town/${encodeURIComponent(listing.town)}`}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          {listing.town}
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{cleanAddress(listing.address)}</h1>
            <p className="text-xl text-gray-600 mt-1">{cleanAddress(listing.town)}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              {formatPrice(listing.list_price)}
            </div>
            <div className="text-sm text-gray-500 mt-1">MLS #{listing.mls_id}</div>
          </div>
        </div>

        {/* Primary Signal Badge */}
        {primarySignal && (
          <div className="inline-block">
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${getSignalInfo(primarySignal.signal_type).color}`}
            >
              {getSignalInfo(primarySignal.signal_type).icon}{' '}
              {getSignalInfo(primarySignal.signal_type).label}
              <span className="ml-2 opacity-75">Score: {primarySignal.signal_score}</span>
            </span>
            <div className="mt-2 text-sm text-gray-600">
              Computed score: <span className="font-semibold">{finalScore}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Photos */}
          <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
            <PhotoGallery photoUrls={photoUrls} address={listing.address} />
          </div>

          {/* Property Details */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Property Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-sm text-gray-600 mb-1">Bedrooms</div>
                <div className="text-2xl font-bold text-gray-900">{listing.beds || '—'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Bathrooms</div>
                <div className="text-2xl font-bold text-gray-900">{listing.baths || '—'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Square Feet</div>
                <div className="text-2xl font-bold text-gray-900">
                  {listing.sqft ? listing.sqft.toLocaleString() : '—'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Days on Market</div>
                <div className="text-2xl font-bold text-gray-900">{listing.dom || '—'}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-6 pt-6 border-t">
              <div>
                <div className="text-sm text-gray-600 mb-1">Property Type</div>
                <div className="text-lg font-semibold text-gray-900">
                  {getPropertyTypeLabel(listing.property_type)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Status</div>
                <div className="text-lg font-semibold text-gray-900">{listing.status || '—'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Listed Date</div>
                <div className="text-lg font-semibold text-gray-900">
                  {listing.list_date ? new Date(listing.list_date).toLocaleDateString() : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* All Signals */}
          {signals.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Market Signals</h2>
              <div className="space-y-3">
                {signals.map((signal, idx) => {
                  const info = getSignalInfo(signal.signal_type);
                  const changePct =
                    signal.metadata?.change_pct || signal.metadata?.price_change_pct;
                  return (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-lg p-4 flex items-start justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${info.color}`}
                          >
                            {info.icon} {info.label}
                          </span>
                          {signal.is_primary && (
                            <span className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-semibold">
                              PRIMARY
                            </span>
                          )}
                          {changePct && (
                            <span className="text-sm font-medium text-gray-700">
                              {Number(changePct) > 0 ? '+' : ''}
                              {Number(changePct).toFixed(1)}%
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{info.description}</p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-lg font-bold text-gray-900">{signal.signal_score}</div>
                        <div className="text-xs text-gray-500">Score</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Scoring Breakdown */}
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Why this score?</h2>
            <div className="text-sm text-gray-700 space-y-3">
              <div>
                <strong>Town averages:</strong> Avg price {formatPrice(avgPrice || 0)}, avg sqft{' '}
                {avgSqft ? Math.round(avgSqft) : '—'}, avg $/sqft{' '}
                {avgPps ? `$${Math.round(avgPps)}` : '—'}.
              </div>
              <div>
                <strong>Listing:</strong> {formatPrice(listing.list_price)} ·{' '}
                {listing.sqft ? `${listing.sqft.toLocaleString()} sqft` : '—'} · {listing.dom} DOM
              </div>
              <div>
                <strong>Price per sqft:</strong> {listingPps ? `$${Math.round(listingPps)}` : '—'}{' '}
                (town avg {avgPps ? `$${Math.round(avgPps)}` : '—'}) —{' '}
                {ppsDiffPct ? `${ppsDiffPct.toFixed(1)}%` : '—'} cheaper
              </div>
              <div>
                <strong>Components:</strong>
                <ul className="list-disc list-inside mt-2 text-gray-600">
                  <li>Price / sqft delta: {Math.round(ppsComponent)} pts</li>
                  <li>Price vs town avg: {Math.round(priceComponent)} pts</li>
                  <li>Days on market: {domComponent} pts</li>
                  <li>Signal presence: {signalComponent} pts</li>
                </ul>
              </div>
              <div>
                <strong>Total computed score:</strong>{' '}
                <span className="font-semibold">{finalScore} / 100</span>
              </div>
              {similar.length > 0 && (
                <div>
                  <strong>Recent similar listings in {cleanAddress(listing.town)}:</strong>
                  <ul className="list-disc list-inside mt-2 text-gray-600">
                    {similar.map((s: any) => (
                      <li key={s.mls_id}>
                        {cleanAddress(s.address)} — {formatPrice(Number(s.list_price))} ·{' '}
                        {s.sqft ? `${Number(s.sqft).toLocaleString()} sqft` : '—'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Price per sqft</span>
                <span className="font-semibold text-gray-900">
                  {listing.sqft && listing.list_price
                    ? `$${Math.round(listing.list_price / listing.sqft).toLocaleString()}`
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated</span>
                <span className="font-semibold text-gray-900">
                  {new Date(listing.updated_at).toLocaleDateString()}
                </span>
              </div>
              {signals.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Signals</span>
                  <span className="font-semibold text-gray-900">{signals.length}</span>
                </div>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Interested?</h3>
            <p className="text-sm text-gray-700 mb-4">
              Create an alert to be notified of similar opportunities in {listing.town}.
            </p>
            <Link
              href="/alerts"
              className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              Create Alert
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
