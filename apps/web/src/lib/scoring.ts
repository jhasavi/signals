import { sql } from '@/lib/db';
import { validatePrice, validateSqft, validatePps } from './validation';

interface ListingMinimal {
  mls_id: string;
  list_price: number | null;
  sqft: number | null;
  town: string;
  property_type: string | null;
  dom?: number | null;
}

export interface ScoreComponents {
  ppsComponent: number;
  priceComponent: number;
  domComponent: number;
  signalComponent: number;
  rawScore: number;
  finalScore: number;
  medians: { price: number | null; sqft: number | null; pps: number | null };
}

export async function computeAndPersistScore(
  listing: ListingMinimal,
  hasPrimarySignal: boolean = false,
  signalTypes: string[] = []
): Promise<ScoreComponents> {
  const rawSqft = listing.sqft || null;
  const rawPrice = listing.list_price || null;
  const sqftValidated = validateSqft(rawSqft);
  const priceValidated = validatePrice(rawPrice);
  const sqft = sqftValidated || 0;
  const town = listing.town || '';
  const propType = listing.property_type || null;

  // determine a size window +/-25% when sqft available
  const minSqft = sqft > 0 ? Math.floor(sqft * 0.75) : 0;
  const maxSqft = sqft > 0 ? Math.ceil(sqft * 1.25) : 9999999;

  // Try median within town + property_type + size window
  let medRow: any = null;
  if (propType) {
    medRow = await sql`
      SELECT
        percentile_cont(0.5) WITHIN GROUP (ORDER BY list_price) AS med_price,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY sqft) AS med_sqft,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY (list_price::numeric / NULLIF(sqft,0))) AS med_pps
      FROM listings_raw lr
      WHERE LOWER(lr.town) = LOWER(${town})
        AND lr.property_type = ${propType}
        AND lr.list_price IS NOT NULL
        AND lr.sqft IS NOT NULL
        AND lr.sqft BETWEEN ${minSqft} AND ${maxSqft}
        AND lr.list_price BETWEEN 20000 AND 50000000
        AND (lr.list_price::numeric / NULLIF(lr.sqft,0)) BETWEEN 5 AND 5000
    `;
  }

  // fallback: broader town-level medians
  if (!medRow || !medRow[0] || (!medRow[0].med_pps && !medRow[0].med_price)) {
    medRow = await sql`
      SELECT
        percentile_cont(0.5) WITHIN GROUP (ORDER BY list_price) AS med_price,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY sqft) AS med_sqft,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY (list_price::numeric / NULLIF(sqft,0))) AS med_pps
      FROM listings_raw lr
      WHERE LOWER(lr.town) = LOWER(${town})
        AND lr.list_price IS NOT NULL
        AND lr.sqft IS NOT NULL
        AND lr.list_price BETWEEN 20000 AND 50000000
        AND (lr.list_price::numeric / NULLIF(lr.sqft,0)) BETWEEN 5 AND 5000
    `;
  }

  const med = medRow && medRow[0] ? medRow[0] : { med_price: null, med_sqft: null, med_pps: null };
  const medPrice = med.med_price ? Number(med.med_price) : null;
  const medSqft = med.med_sqft ? Number(med.med_sqft) : null;
  const medPps = med.med_pps ? Number(med.med_pps) : null;

  const listingPpsRaw =
    priceValidated && sqftValidated ? Number(priceValidated) / Number(sqftValidated) : null;
  const listingPps = validatePps(listingPpsRaw);

  const ppsDiffPct = listingPps && medPps ? ((medPps - listingPps) / medPps) * 100 : 0;
  const priceDiffPct =
    medPrice && priceValidated ? ((medPrice - priceValidated) / medPrice) * 100 : 0;

  // Components with weights: pps 50, price 25, dom 10, signal 15
  const ppsComponent = Math.max(Math.min(ppsDiffPct, 50), 0);
  const priceComponent = Math.max(Math.min(priceDiffPct, 25), 0);

  let domComponent = 0;
  if (listing.dom && listing.dom >= 90) domComponent = 10;
  else if (listing.dom && listing.dom >= 45) domComponent = 5;

  let signalComponent = 0;
  if (hasPrimarySignal) signalComponent = 15;
  else if (signalTypes.some((t) => t.includes('price_reduction') || t.includes('price-reduction')))
    signalComponent = 10;

  const rawScore = Math.round(ppsComponent + priceComponent + domComponent + signalComponent);
  const finalScore = Math.min(Math.max(rawScore, 0), 100);

  const components: ScoreComponents = {
    ppsComponent: Math.round(ppsComponent),
    priceComponent: Math.round(priceComponent),
    domComponent,
    signalComponent,
    rawScore,
    finalScore,
    medians: { price: medPrice, sqft: medSqft, pps: medPps },
  };

  // Persist into listing_scores (create table if needed)
  await sql`
    CREATE TABLE IF NOT EXISTS listing_scores (
      mls_id text PRIMARY KEY,
      score integer,
      components jsonb,
      computed_at timestamptz
    )
  `;

  await sql`
    INSERT INTO listing_scores (mls_id, score, components, computed_at)
    VALUES (${listing.mls_id}, ${components.finalScore}, ${components as any}, now())
    ON CONFLICT (mls_id) DO UPDATE
      SET score = EXCLUDED.score,
          components = EXCLUDED.components,
          computed_at = EXCLUDED.computed_at
  `;

  return components;
}

export async function getPersistedScore(mlsId: string): Promise<ScoreComponents | null> {
  const rows = await sql`
    SELECT score, components FROM listing_scores WHERE mls_id = ${mlsId}
  `;
  if (!rows[0]) return null;
  return rows[0].components as ScoreComponents;
}
