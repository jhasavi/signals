import postgres from 'postgres';

export interface Baseline {
  town: string;
  property_type: string;
  price_band: string;
  median_dom: number | null;
  median_list_price: number | null;
  price_cut_rate: number | null;
  sample_size: number;
}

export interface Signal {
  mls_id: string;
  signal_type: 'stale' | 'recent_drop' | 'likely_cut' | 'underpriced' | 'hot';
  signal_score: number;
  is_primary: boolean;
  metadata: any;
}

export interface Listing {
  mls_id: string;
  property_type: string;
  status: string;
  list_price: number | null;
  town: string;
  dom: number | null;
}

export class SignalComputer {
  private sql: postgres.Sql;

  constructor(connectionString: string) {
    this.sql = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }

  async computeBaselines(lookbackDays: number = 180) {
    console.log(`\n🔬 Computing baselines (lookback: ${lookbackDays} days)...`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);

    // Get distinct town/type combinations
    const combinations = await this.sql<{ town: string; property_type: string }[]>`
      SELECT DISTINCT town, property_type
      FROM listings_raw
      WHERE town != '' AND town IS NOT NULL
    `;

    console.log(`📍 Found ${combinations.length} town/type combinations`);

    let computedCount = 0;

    for (const combo of combinations) {
      const priceBands = ['0-500k', '500k-1m', '1m-2m', '2m+'];

      for (const priceBand of priceBands) {
        const [minPrice, maxPrice] = this.parsePriceBand(priceBand);

        // Get listings in this band
        const listings = await this.sql`
          SELECT 
            mls_id,
            list_price,
            dom,
            status
          FROM listings_raw
          WHERE town = ${combo.town}
            AND property_type = ${combo.property_type}
            AND list_price >= ${minPrice}
            AND list_price < ${maxPrice}
            AND updated_at >= ${cutoffDate.toISOString()}
        `;

        if (listings.length < 5) continue; // Skip if sample size too small

        // Calculate median DOM
        const doms = listings
          .map((l: any) => l.dom)
          .filter((d: any) => d != null)
          .sort((a: number, b: number) => a - b);
        const medianDom = doms.length > 0 ? doms[Math.floor(doms.length / 2)] : null;

        // Calculate median list price
        const prices = listings
          .map((l: any) => Number(l.list_price))
          .filter((p: number) => p > 0)
          .sort((a: number, b: number) => a - b);
        const medianPrice = prices.length > 0 ? prices[Math.floor(prices.length / 2)] : null;

        // Calculate price cut rate from snapshots
        const priceCuts = await this.sql`
          SELECT COUNT(*) as cut_count
          FROM (
            SELECT 
              s1.mls_id,
              s1.list_price as earlier_price,
              s2.list_price as later_price
            FROM listing_snapshots s1
            JOIN listing_snapshots s2 ON s1.mls_id = s2.mls_id
            WHERE s1.snapshot_date < s2.snapshot_date
              AND s2.list_price < s1.list_price
              AND s1.mls_id IN (
                SELECT mls_id FROM listings_raw
                WHERE town = ${combo.town}
                  AND property_type = ${combo.property_type}
                  AND list_price >= ${minPrice}
                  AND list_price < ${maxPrice}
              )
          ) cuts
        `;

        const cutCount = Number(priceCuts[0]?.cut_count || 0);
        const priceCutRate = listings.length > 0 ? cutCount / listings.length : 0;

        // Upsert baseline
        await this.sql`
          INSERT INTO town_type_band_baselines (
            town, property_type, price_band, lookback_days,
            median_dom, median_list_price, price_cut_rate, sample_size, computed_at
          ) VALUES (
            ${combo.town}, ${combo.property_type}, ${priceBand}, ${lookbackDays},
            ${medianDom}, ${medianPrice}, ${priceCutRate}, ${listings.length}, NOW()
          )
          ON CONFLICT (town, property_type, price_band, lookback_days)
          DO UPDATE SET
            median_dom = EXCLUDED.median_dom,
            median_list_price = EXCLUDED.median_list_price,
            price_cut_rate = EXCLUDED.price_cut_rate,
            sample_size = EXCLUDED.sample_size,
            computed_at = NOW()
        `;

        computedCount++;
      }
    }

    console.log(`✅ Computed ${computedCount} baselines`);
    return computedCount;
  }

  async computeSignals() {
    console.log('\n🎯 Computing signals for active listings...');

    // First, let's check what we have
    const stats = await this.sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN list_price IS NOT NULL THEN 1 END) as with_price,
        COUNT(CASE WHEN dom IS NOT NULL THEN 1 END) as with_dom,
        COUNT(CASE WHEN status ILIKE '%active%' OR status ILIKE '%pending%' THEN 1 END) as active_like
      FROM listings_raw
    `;
    console.log('📊 Database stats:', stats[0]);

    // Get all listings with price and dom
    const activeListings = await this.sql<Listing[]>`
      SELECT 
        mls_id,
        property_type,
        status,
        list_price,
        town,
        dom
      FROM listings_raw
      WHERE list_price IS NOT NULL
        AND list_price > 0
        AND town IS NOT NULL
        AND town != ''
      LIMIT 1000
    `;

    console.log(`📋 Processing ${activeListings.length} listings`);

    let signalsComputed = 0;

    for (const listing of activeListings) {
      const signals = await this.computeListingSignals(listing);

      if (signals.length > 0) {
        await this.saveSignals(signals);
        signalsComputed += signals.length;
      }
    }

    console.log(`✅ Computed ${signalsComputed} total signals`);
    return signalsComputed;
  }

  private async computeListingSignals(listing: Listing): Promise<Signal[]> {
    const signals: Signal[] = [];

    // Get baseline for this listing
    const priceBand = this.getPriceBand(listing.list_price!);
    const baseline = await this.sql<Baseline[]>`
      SELECT *
      FROM town_type_band_baselines
      WHERE town = ${listing.town}
        AND property_type = ${listing.property_type}
        AND price_band = ${priceBand}
      LIMIT 1
    `;

    if (baseline.length === 0) return signals;

    const b = baseline[0];
    const medianDom = b.median_dom || 21;
    const medianPrice = b.median_list_price || listing.list_price!;

    // 1. Stale Listing
    if (listing.dom! >= Math.max(21, 1.5 * medianDom)) {
      const staleness = (listing.dom! - medianDom) / medianDom;
      const score = Math.min(100, Math.round(staleness * 50 + 50));
      signals.push({
        mls_id: listing.mls_id,
        signal_type: 'stale',
        signal_score: score,
        is_primary: false,
        metadata: { dom: listing.dom, median_dom: medianDom },
      });
    }

    // 2. Recent Price Drop
    const recentDrop = await this.checkRecentPriceDrop(listing.mls_id);
    if (recentDrop) {
      const dropPct = recentDrop.drop_percentage;
      const score = Math.min(100, Math.round(dropPct * 5));
      signals.push({
        mls_id: listing.mls_id,
        signal_type: 'recent_drop',
        signal_score: score,
        is_primary: false,
        metadata: recentDrop,
      });
    }

    // 3. Likely Price Cut
    if (
      listing.status === 'Active' &&
      listing.dom! >= 1.25 * medianDom &&
      listing.list_price! >= 1.03 * medianPrice
    ) {
      const overpriceRatio = (listing.list_price! - medianPrice) / medianPrice;
      const domRatio = (listing.dom! - medianDom) / medianDom;
      const score = Math.min(100, Math.round((overpriceRatio + domRatio) * 30));
      signals.push({
        mls_id: listing.mls_id,
        signal_type: 'likely_cut',
        signal_score: score,
        is_primary: false,
        metadata: { dom: listing.dom, median_dom: medianDom, price_vs_median: overpriceRatio },
      });
    }

    // 4. Underpriced
    if (listing.list_price! <= 0.97 * medianPrice && listing.dom! <= medianDom) {
      const underpriceRatio = (medianPrice - listing.list_price!) / medianPrice;
      const score = Math.min(100, Math.round(underpriceRatio * 200));
      signals.push({
        mls_id: listing.mls_id,
        signal_type: 'underpriced',
        signal_score: score,
        is_primary: false,
        metadata: { list_price: listing.list_price, median_price: medianPrice },
      });
    }

    // 5. Hot
    if (
      (listing.status === 'Pending' || listing.status === 'Under Agreement') &&
      listing.dom! <= Math.min(7, 0.5 * medianDom)
    ) {
      const speedRatio = medianDom / Math.max(listing.dom!, 1);
      const score = Math.min(100, Math.round(speedRatio * 30));
      signals.push({
        mls_id: listing.mls_id,
        signal_type: 'hot',
        signal_score: score,
        is_primary: false,
        metadata: { dom: listing.dom, median_dom: medianDom, status: listing.status },
      });
    }

    // Set primary signal (highest score)
    if (signals.length > 0) {
      signals.sort((a, b) => b.signal_score - a.signal_score);
      signals[0].is_primary = true;
    }

    return signals;
  }

  private async checkRecentPriceDrop(mlsId: string): Promise<any | null> {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const snapshots = await this.sql`
      SELECT 
        snapshot_date,
        list_price
      FROM listing_snapshots
      WHERE mls_id = ${mlsId}
        AND snapshot_date >= ${fourteenDaysAgo.toISOString().split('T')[0]}
      ORDER BY snapshot_date DESC
      LIMIT 2
    `;

    if (snapshots.length < 2) return null;

    const latest = Number(snapshots[0].list_price);
    const earlier = Number(snapshots[1].list_price);

    if (latest < earlier) {
      const dropAmount = earlier - latest;
      const dropPct = (dropAmount / earlier) * 100;

      if (dropPct >= 2) {
        return {
          drop_amount: dropAmount,
          drop_percentage: dropPct,
          previous_price: earlier,
          current_price: latest,
        };
      }
    }

    return null;
  }

  private async saveSignals(signals: Signal[]) {
    for (const signal of signals) {
      await this.sql`
        INSERT INTO listing_signals (
          mls_id, signal_type, signal_score, is_primary, metadata, computed_at
        ) VALUES (
          ${signal.mls_id}, ${signal.signal_type}, ${signal.signal_score},
          ${signal.is_primary}, ${this.sql.json(signal.metadata)}, NOW()
        )
        ON CONFLICT (mls_id, signal_type)
        DO UPDATE SET
          signal_score = EXCLUDED.signal_score,
          is_primary = EXCLUDED.is_primary,
          metadata = EXCLUDED.metadata,
          computed_at = NOW()
      `;
    }
  }

  private getPriceBand(price: number): string {
    if (price < 500000) return '0-500k';
    if (price < 1000000) return '500k-1m';
    if (price < 2000000) return '1m-2m';
    return '2m+';
  }

  private parsePriceBand(band: string): [number, number] {
    switch (band) {
      case '0-500k':
        return [0, 500000];
      case '500k-1m':
        return [500000, 1000000];
      case '1m-2m':
        return [1000000, 2000000];
      case '2m+':
        return [2000000, 999999999];
      default:
        return [0, 999999999];
    }
  }

  async close() {
    await this.sql.end();
  }
}
