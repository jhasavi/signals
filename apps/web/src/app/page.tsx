import Link from 'next/link';
import ScoreBreakdown from '@/components/ScoreBreakdown';
import { sql } from '@/lib/db';
import { HomeFilters } from '@/components/HomeFilters';

export const dynamic = 'force-dynamic';

interface PageProps {
	searchParams: {
		propertyType?: string;
		priceBucket?: string;
		minBeds?: string;
		maxBeds?: string;
		minBaths?: string;
		town?: string;
		signalType?: string;
		sort?: string;
	};
}

interface TopOpportunity {
	mls_id: string;
	address: string;
	town: string;
	property_type: string;
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

interface TownSignalCount {
	town: string;
	signal_count: number;
	total_listings: number;
}

function getSignalInfo(signalType: string) {
	const info: Record<string, { label: string; icon: string; color: string }> = {
		price_reduction: { label: 'Price Reduction', icon: '💰', color: 'bg-green-100 text-green-800' },
		'price-reduction': {
			label: 'Price Reduction',
			icon: '💰',
			color: 'bg-green-100 text-green-800',
		},
		underpriced: { label: 'Below Market', icon: '🎯', color: 'bg-teal-100 text-teal-800' },
		new_listing: { label: 'New Listing', icon: '✨', color: 'bg-blue-100 text-blue-800' },
		'new-listing': { label: 'New Listing', icon: '✨', color: 'bg-blue-100 text-blue-800' },
		back_on_market: { label: 'Back on Market', icon: '🔄', color: 'bg-yellow-100 text-yellow-800' },
		'back-on-market': {
			label: 'Back on Market',
			icon: '🔄',
			color: 'bg-yellow-100 text-yellow-800',
		},
		high_dom: { label: 'Long on Market', icon: '⏰', color: 'bg-orange-100 text-orange-800' },
		'high-dom': { label: 'Long on Market', icon: '⏰', color: 'bg-orange-100 text-orange-800' },
		low_dom: { label: 'Moving Fast', icon: '⚡', color: 'bg-purple-100 text-purple-800' },
		'low-dom': { label: 'Moving Fast', icon: '⚡', color: 'bg-purple-100 text-purple-800' },
		price_increase: { label: 'Price Increase', icon: '📈', color: 'bg-red-100 text-red-800' },
		'price-increase': { label: 'Price Increase', icon: '📈', color: 'bg-red-100 text-red-800' },
		overpriced: { label: 'Above Market', icon: '🏷️', color: 'bg-pink-100 text-pink-800' },
	};
	return info[signalType] || { label: signalType, icon: '📊', color: 'bg-gray-100 text-gray-800' };
}

function formatPrice(price: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(price);
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

interface FilterOptions {
	propertyType?: string;
	priceBucket?: string;
	minBeds?: number;
	maxBeds?: number;
	minBaths?: number;
	town?: string;
	signalType?: string;
	sort?: string;
}

async function getTopOpportunities(filters: FilterOptions = {}): Promise<TopOpportunity[]> {
	try {
		const conditions = [];
		const params: any[] = [];

		// Property type filter
		if (filters.propertyType && filters.propertyType !== 'all') {
			conditions.push(`lr.property_type = $${params.length + 1}`);
			params.push(filters.propertyType);
		}

		// Price bucket filter
		if (filters.priceBucket) {
			const priceRange = parsePriceBucket(filters.priceBucket);
			if (priceRange) {
				conditions.push(`lr.list_price >= $${params.length + 1}`);
				params.push(priceRange.min);
				conditions.push(`lr.list_price <= $${params.length + 1}`);
				params.push(priceRange.max);
			}
		}

		// Beds filter
		if (filters.minBeds) {
			conditions.push(`lr.beds >= $${params.length + 1}`);
			params.push(filters.minBeds);
		}
		if (filters.maxBeds) {
			conditions.push(`lr.beds <= $${params.length + 1}`);
			params.push(filters.maxBeds);
		}

		// Baths filter
		if (filters.minBaths) {
			conditions.push(`lr.baths >= $${params.length + 1}`);
			params.push(filters.minBaths);
		}

		// Town filter
		if (filters.town) {
			conditions.push(`lr.town ILIKE $${params.length + 1}`);
			params.push(`%${filters.town}%`);
		}

		// Signal type filter
		if (filters.signalType && filters.signalType !== 'all') {
			conditions.push(`ls.signal_type = $${params.length + 1}`);
			params.push(filters.signalType);
		}

		const whereClause = conditions.length > 0 
			? `AND ${conditions.join(' AND ')}`
			: '';

		// Sort clause
		let orderClause = `
			CASE 
				WHEN ls.signal_type IN ('price_reduction', 'price-reduction', 'underpriced') THEN 0 
				ELSE 1 
			END,
			ls.signal_score DESC
		`;

		if (filters.sort === 'price-low') {
			orderClause = 'lr.list_price ASC';
		} else if (filters.sort === 'price-high') {
			orderClause = 'lr.list_price DESC';
		} else if (filters.sort === 'newest') {
			orderClause = 'lr.created_at DESC';
		}

		const query = `
			SELECT 
				ls.mls_id,
				lr.address,
				lr.town,
				lr.property_type,
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
			WHERE ls.is_primary = true
				AND lr.list_price IS NOT NULL
				${whereClause}
			ORDER BY ${orderClause}
			LIMIT 20
		`;

		const opportunities = params.length > 0
			? await sql.unsafe(query, params)
			: await sql`
			SELECT 
				ls.mls_id,
				lr.address,
				lr.town,
				lr.property_type,
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
			WHERE ls.is_primary = true
				AND lr.list_price IS NOT NULL
			ORDER BY 
				CASE 
					WHEN ls.signal_type IN ('price_reduction', 'price-reduction', 'underpriced') THEN 0 
					ELSE 1 
				END,
				ls.signal_score DESC
			LIMIT 20
		`;
    
		return opportunities as unknown as TopOpportunity[];
	} catch (error) {
		console.error('Error fetching top opportunities:', error);
		return [];
	}
}

async function getTopTownsByOpportunities(): Promise<TownSignalCount[]> {
	try {
		const towns = await sql`
			SELECT 
				lr.town,
				COUNT(DISTINCT ls.id) as signal_count,
				COUNT(DISTINCT lr.mls_id) as total_listings
			FROM listings_raw lr
			JOIN listing_signals ls ON lr.mls_id = ls.mls_id
			WHERE ls.is_primary = true
				AND lr.town != ''
				AND lr.town !~ '^[0-9]+[A-Z]?$'
			GROUP BY lr.town
			HAVING COUNT(DISTINCT ls.id) > 0
			ORDER BY signal_count DESC
			LIMIT 15
		`;
		return towns as unknown as TownSignalCount[];
	} catch (error) {
		console.error('Error fetching top towns:', error);
		return [];
	}
}

export default async function HomePage({ searchParams }: PageProps) {
	const filters = {
		propertyType: searchParams.propertyType || undefined,
		priceBucket: searchParams.priceBucket || undefined,
		minBeds: searchParams.minBeds ? parseInt(searchParams.minBeds) : undefined,
		maxBeds: searchParams.maxBeds ? parseInt(searchParams.maxBeds) : undefined,
		minBaths: searchParams.minBaths ? parseFloat(searchParams.minBaths) : undefined,
		town: searchParams.town || undefined,
		signalType: searchParams.signalType || undefined,
		sort: searchParams.sort || 'score',
	};

	const topOpportunities = await getTopOpportunities(filters);
	const topTowns = await getTopTownsByOpportunities();

	const currentFilters = {
		propertyType: searchParams.propertyType || null,
		priceBucket: searchParams.priceBucket || null,
		minBeds: searchParams.minBeds ? parseInt(searchParams.minBeds) : null,
		maxBeds: searchParams.maxBeds ? parseInt(searchParams.maxBeds) : null,
		minBaths: searchParams.minBaths ? parseFloat(searchParams.minBaths) : null,
		town: searchParams.town || null,
		signalType: searchParams.signalType || null,
		sort: searchParams.sort || 'score',
	};

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			{/* Header */}
			<div className="mb-8 text-center">
				<h1 className="text-4xl font-bold text-gray-900 mb-2">🎯 Today's Top Opportunities</h1>
				<p className="text-lg text-gray-600">Real-time market signals across Massachusetts</p>
			</div>

			{/* Filters */}
			<HomeFilters currentFilters={currentFilters} />

			{/* Top Opportunities Section */}
			{topOpportunities.length > 0 ? (
				<div className="mb-12">
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-2xl font-bold text-gray-900">Hottest Opportunities Right Now</h2>
						<Link href="/alerts" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
							Create Alert →
						</Link>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{topOpportunities.map((opp) => {
							const info = getSignalInfo(opp.signal_type);
							const changePct = opp.metadata?.change_pct || opp.metadata?.price_change_pct;
							const propertyTypeLabel =
								opp.property_type === 'SF'
									? 'Single Family'
									: opp.property_type === 'CC'
										? 'Condo'
										: 'Multi-Family';

							return (
								<Link
									key={opp.mls_id}
									href={`/listing/${opp.mls_id}`}
									className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-5 border-2 border-transparent hover:border-blue-500"
								>
									<div className="flex items-center gap-3 mb-3">
										<span className={`px-3 py-1 rounded-full text-xs font-semibold ${info.color}`}>
											{info.icon} {info.label}
										</span>
										{changePct && (
											<span className="text-sm font-medium text-gray-700">
												{Number(changePct) > 0 ? '+' : ''}
												{Number(changePct).toFixed(1)}%
											</span>
										)}
									</div>

									<h3 className="font-semibold text-gray-900 text-lg mb-1">{opp.address}</h3>
									<p className="text-sm text-gray-600 mb-3">
										{opp.town} • {propertyTypeLabel}
									</p>

									<div className="flex items-baseline justify-between mb-3">
										<span className="text-2xl font-bold text-blue-600">
											{formatPrice(opp.list_price)}
										</span>
										<div className="flex items-center">
											<span className="text-xs text-gray-500">
												Score: {opp.computed_score ?? opp.signal_score}
											</span>
											<ScoreBreakdown
												score={opp.computed_score ?? opp.signal_score}
												components={opp.computed_components}
											/>
										</div>
									</div>

									<div className="flex gap-4 text-sm text-gray-600">
										{opp.beds && <span>{opp.beds} beds</span>}
										{opp.baths && <span>{opp.baths} baths</span>}
										{opp.sqft && <span>{opp.sqft.toLocaleString()} sqft</span>}
									</div>
								</Link>
							);
						})}
					</div>
				</div>
			) : (
				<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-12">
						<p className="text-yellow-800">
							We don't have any opportunities right now — data may be syncing.
							If you're running the app locally, you can generate signals with{' '}
							<code className="bg-yellow-100 px-2 py-1 rounded">pnpm compute-signals</code>.
							Otherwise please check back shortly.
						</p>
				</div>
			)}

			{/* Top Towns by Opportunities */}
			{topTowns.length > 0 && (
				<div className="mb-12">
					<h2 className="text-2xl font-bold text-gray-900 mb-6">Most Active Towns</h2>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{topTowns.map((town) => (
							<Link
								key={town.town}
								href={`/town/${encodeURIComponent(town.town)}`}
								className="bg-white rounded-lg shadow p-5 hover:shadow-lg transition-shadow border border-gray-200 hover:border-blue-500"
							>
								<div className="flex items-center justify-between mb-2">
									<h3 className="text-lg font-semibold text-gray-900">{town.town}</h3>
									<span className="text-2xl font-bold text-blue-600">{town.signal_count}</span>
								</div>
								<div className="flex items-center justify-between text-sm">
									<span className="text-gray-600">Opportunities</span>
									<span className="text-gray-500">{town.total_listings} listings</span>
								</div>
							</Link>
						))}
					</div>
				</div>
			)}

			{/* CTA Section */}
			<div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-8 text-center text-white">
				<h2 className="text-3xl font-bold mb-4">Never Miss an Opportunity</h2>
				<p className="text-lg mb-6 text-blue-100">
					Get instant alerts when new opportunities match your criteria
				</p>
				<Link
					href="/alerts"
					className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors font-semibold text-lg"
				>
					Create Your First Alert
				</Link>
			</div>
		</div>
	);
}

