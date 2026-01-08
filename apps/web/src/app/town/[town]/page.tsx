import { sql } from '@/lib/db';
import { PropertyTypeToggle, TimeframeToggle } from '@/components/Toggles';
import Link from 'next/link';
import ScoreBreakdown from '@/components/ScoreBreakdown';
import { formatPrice, getSignalLabel } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { town: string };
  searchParams: { type?: string; timeframe?: string };
}

interface TownStats {
  total_active: number;
  avg_price: number;
  avg_dom: number;
  median_price: number;
}

interface SignalCount {
  signal_type: string;
  count: number;
}

interface TopOpportunity {
  mls_id: string;
  address: string;
  town: string;
  list_price: number;
  beds: number;
  baths: number;
  sqft: number;
  signal_type: string;
  signal_score: number;
  metadata: any;
  computed_score?: number | null;
  computed_components?: any | null;
}

interface SignalInfo {
  label: string;
  description: string;
  icon: string;
  color: string;
}

function getSignalInfo(signalType: string): SignalInfo {
  const info: Record<string, SignalInfo> = {
    'price-reduction': {
      label: 'Price Reductions',
      description: 'Properties with recent price drops - potential deals or motivated sellers',
      icon: '💰',
      color: 'bg-green-100',
    },
    'new-listing': {
      label: 'New Listings',
      description: 'Fresh properties just hit the market - be the first to see them',
      icon: '✨',
      color: 'bg-blue-100',
    },
    'price-increase': {
      label: 'Price Increases',
      description: 'Properties with recent price hikes - hot market indicators',
      icon: '📈',
      color: 'bg-red-100',
    },
    'back-on-market': {
      label: 'Back on Market',
      description: 'Deals that fell through - second chance opportunities',
      icon: '🔄',
      color: 'bg-yellow-100',
    },
    'high-dom': {
      label: 'Long on Market',
      description: 'Properties sitting longer than average - room for negotiation',
      icon: '⏰',
      color: 'bg-orange-100',
    },
    'low-dom': {
      label: 'Moving Fast',
      description: 'Hot properties selling quickly - act now or miss out',
      icon: '⚡',
      color: 'bg-purple-100',
    },
    underpriced: {
      label: 'Below Market',
      description: 'Priced below similar properties - potential bargains',
      icon: '🎯',
      color: 'bg-teal-100',
    },
    overpriced: {
      label: 'Above Market',
      description: 'Priced above comparable homes - negotiate or wait',
      icon: '🏷️',
      color: 'bg-pink-100',
    },
  };

  return (
    info[signalType] || {
      label: getSignalLabel(signalType),
      description: 'Market signal detected for this property type',
      icon: '📊',
      color: 'bg-gray-100',
    }
  );
}

async function getTownStats(
  town: string,
  propertyType: string,
  timeframe: number
): Promise<TownStats> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeframe);

  const stats = await sql`
    SELECT 
      COUNT(*) as total_active,
      AVG(list_price)::numeric(12,2) as avg_price,
      AVG(dom)::integer as avg_dom,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price) as median_price
    FROM listings_raw
    WHERE town = ${town}
      AND property_type = ${propertyType}
      AND list_price IS NOT NULL
  `;

  return stats[0] as unknown as TownStats;
}

async function getSignalCounts(town: string, propertyType: string): Promise<SignalCount[]> {
  const counts = await sql`
    SELECT 
      ls.signal_type,
      COUNT(*) as count
    FROM listing_signals ls
    JOIN listings_raw lr ON ls.mls_id = lr.mls_id
    WHERE lr.town = ${town}
      AND lr.property_type = ${propertyType}
      AND ls.is_primary = true
    GROUP BY ls.signal_type
    ORDER BY count DESC
  `;

  return counts as unknown as SignalCount[];
}

async function getTopOpportunities(town: string, propertyType: string): Promise<TopOpportunity[]> {
  const opportunities = await sql`
    SELECT 
      ls.mls_id,
      lr.address,
      lr.town,
      lr.list_price,
      lr.beds,
      lr.baths,
      lr.sqft,
      ls.signal_type,
      ls.signal_score,
      lsc.score AS computed_score,
      lsc.components AS computed_components,
      ls.metadata
    FROM listing_signals ls
    JOIN listings_raw lr ON ls.mls_id = lr.mls_id
    LEFT JOIN listing_scores lsc ON lsc.mls_id = lr.mls_id
    WHERE lr.town = ${town}
      AND lr.property_type = ${propertyType}
      AND ls.is_primary = true
      AND lr.list_price IS NOT NULL
    ORDER BY 
      CASE 
        WHEN ls.signal_type IN ('price-reduction', 'underpriced') THEN 0 
        ELSE 1 
      END,
      ls.signal_score DESC
    LIMIT 5
  `;

  return opportunities as unknown as TopOpportunity[];
}

async function getAvailableTypes(town: string): Promise<string[]> {
  const types = await sql`
    SELECT DISTINCT property_type
    FROM listings_raw
    WHERE town = ${town}
      AND list_price IS NOT NULL
    ORDER BY property_type
  `;

  return types.map((t: any) => t.property_type);
}

export default async function TownPage({ params, searchParams }: PageProps) {
  const town = decodeURIComponent(params.town);
  const propertyType = searchParams.type || 'SF';
  const timeframe = parseInt(searchParams.timeframe || '180');

  const availableTypes = await getAvailableTypes(town);
  const stats = await getTownStats(town, propertyType, timeframe);
  const signalCounts = await getSignalCounts(town, propertyType);
  const topOpportunities = await getTopOpportunities(town, propertyType);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
          ← Back to Towns
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{town}</h1>
        <p className="mt-2 text-gray-600">Real-time market intelligence for smarter decisions</p>
      </div>

      {/* Quick Insights Banner */}
      {signalCounts.length > 0 && (
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 text-3xl">🎯</div>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900 text-lg mb-2">Market Opportunities</h2>
              <p className="text-gray-700 mb-3">
                We found{' '}
                <strong>
                  {signalCounts.reduce((sum, s) => sum + parseInt(String(s.count)), 0)} properties
                </strong>{' '}
                with actionable signals in {town}. These insights help buyers find deals and sellers
                time their listings perfectly.
              </p>
              <Link
                href="/alerts"
                className="text-blue-700 hover:text-blue-800 font-medium text-sm flex items-center gap-1 inline-flex"
              >
                Get alerts when new opportunities appear
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Top Opportunities Today */}
      {topOpportunities.length > 0 && (
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span>⭐</span>
              Top Opportunities Today
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Highest-value signals requiring immediate attention
            </p>
          </div>

          <div className="space-y-4">
            {topOpportunities.map((opp) => {
              const info = getSignalInfo(opp.signal_type);
              const changePct = opp.metadata?.change_pct || opp.metadata?.price_change_pct;
              return (
                <div
                  key={opp.mls_id}
                  className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-gradient-to-br from-white to-gray-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${info.color}`}
                        >
                          {info.icon} {info.label}
                        </span>
                        {changePct && (
                          <span className="text-sm font-medium text-gray-700">
                            {changePct > 0 ? '+' : ''}
                            {Number(changePct).toFixed(1)}%
                          </span>
                        )}
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500">
                            Score: {opp.computed_score ?? opp.signal_score}
                          </span>
                          <ScoreBreakdown
                            score={opp.computed_score ?? opp.signal_score}
                            components={(opp as any).computed_components}
                          />
                        </div>
                        {/* Server-side fallback for crawlers */}
                        <div className="sr-only">
                          {(() => {
                            const c = (opp as any).computed_components;
                            if (!c) return `Score: ${opp.computed_score ?? opp.signal_score}`;
                            const pps = c.ppsComponent ? `${Math.round(c.ppsComponent)} pts` : '—';
                            const price = c.priceComponent
                              ? `${Math.round(c.priceComponent)} pts`
                              : '—';
                            const dom =
                              c.domComponent !== undefined
                                ? `${Math.round(c.domComponent)} pts`
                                : '—';
                            const signal =
                              c.signalComponent !== undefined
                                ? `${Math.round(c.signalComponent)} pts`
                                : '—';
                            const total =
                              c.finalScore !== undefined
                                ? `${Math.round(c.finalScore)} / 100`
                                : (opp.computed_score ?? opp.signal_score);
                            return `Breakdown — PPS: ${pps}; Price: ${price}; DOM: ${dom}; Signal: ${signal}; Total: ${total}`;
                          })()}
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900 text-lg mb-2">{opp.address}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="font-semibold text-blue-600 text-lg">
                          {formatPrice(Number(opp.list_price))}
                        </span>
                        {opp.beds && <span>{opp.beds} beds</span>}
                        {opp.baths && <span>{opp.baths} baths</span>}
                        {opp.sqft && <span>{opp.sqft.toLocaleString()} sqft</span>}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Link
                        href={`/listing/${opp.mls_id}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="mb-8 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
          <PropertyTypeToggle
            town={town}
            currentType={propertyType}
            availableTypes={availableTypes}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Timeframe</label>
          <TimeframeToggle town={town} propertyType={propertyType} currentTimeframe={timeframe} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Active Listings</div>
          <div className="text-3xl font-bold text-gray-900">{stats.total_active}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Avg Price</div>
          <div className="text-3xl font-bold text-gray-900">
            {formatPrice(Number(stats.avg_price))}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Median Price</div>
          <div className="text-3xl font-bold text-gray-900">
            {formatPrice(Number(stats.median_price))}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
            Avg Days on Market
            {!stats.avg_dom && (
              <span className="group relative inline-block">
                <span className="text-gray-400 cursor-help text-xs">ⓘ</span>
                <span className="invisible group-hover:visible absolute left-0 top-6 w-56 bg-gray-900 text-white text-xs rounded py-2 px-3 z-10 shadow-lg whitespace-normal">
                  DOM will populate after 2+ daily snapshots
                </span>
              </span>
            )}
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.avg_dom || '—'}</div>
        </div>
      </div>

      {/* Market Signals */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Market Signals</h2>
            <p className="text-sm text-gray-600 mt-1">Actionable insights for buyers and sellers</p>
          </div>
          <Link
            href="/alerts"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Create Alert
          </Link>
        </div>

        {signalCounts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {signalCounts.map((signal) => {
              const info = getSignalInfo(signal.signal_type);
              return (
                <div
                  key={signal.signal_type}
                  className="border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-gray-50"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-full ${info.color} flex items-center justify-center`}
                    >
                      <span className="text-2xl">{info.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg mb-1">{info.label}</h3>
                      <p className="text-sm text-gray-600 mb-3">{info.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-gray-900">
                          {signal.count} properties
                        </span>
                        <Link
                          href={`/town/${encodeURIComponent(town)}/signals?type=${propertyType}&signal=${signal.signal_type}`}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
                        >
                          View Details
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Signals Available Yet</h3>
            <p className="text-gray-600 mb-4">Market signals are computed daily from MLS data.</p>
            <p className="text-sm text-gray-500">
              Check back soon or{' '}
              <Link href="/alerts" className="text-blue-600 hover:underline">
                create an alert
              </Link>{' '}
              to be notified.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
