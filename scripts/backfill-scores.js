#!/usr/bin/env node
/**
 * Backfill listing_scores for all listings that have signals.
 * Run from repo root: `node scripts/backfill-scores.js`
 */
const path = require('path');
// Prefer repo packages if present (apps/web has postgres installed)
let postgres;
try {
  postgres = require('postgres');
} catch (e) {
  // fall back to apps/web node_modules folder
  postgres = require(path.join(__dirname, '..', 'apps', 'web', 'node_modules', 'postgres'));
}
try {
  require('dotenv').config();
} catch (e) {
  try {
    require(path.join(__dirname, '..', 'apps', 'web', 'node_modules', 'dotenv')).config();
  } catch (_) {}
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set in environment');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { max: 5 });

async function computeForMls(mlsId) {
  try {
    const listing =
      await sql`SELECT mls_id, list_price::numeric AS list_price, sqft::numeric AS sqft, town, property_type, dom::numeric AS dom FROM listings_raw WHERE mls_id = ${mlsId}`;
    if (!listing[0]) return null;
    const L = listing[0];
    const sqft = L.sqft ? Number(L.sqft) : 0;
    const minSqft = sqft > 0 ? Math.floor(sqft * 0.75) : 0;
    const maxSqft = sqft > 0 ? Math.ceil(sqft * 1.25) : 9999999;

    let medRow;
    if (L.property_type) {
      medRow = await sql`
        SELECT
          percentile_cont(0.5) WITHIN GROUP (ORDER BY list_price) AS med_price,
          percentile_cont(0.5) WITHIN GROUP (ORDER BY sqft) AS med_sqft,
          percentile_cont(0.5) WITHIN GROUP (ORDER BY (list_price::numeric / NULLIF(sqft,0))) AS med_pps
        FROM listings_raw lr
        WHERE LOWER(lr.town) = LOWER(${L.town})
          AND lr.property_type = ${L.property_type}
          AND lr.list_price IS NOT NULL
          AND lr.sqft IS NOT NULL
          AND lr.sqft BETWEEN ${minSqft} AND ${maxSqft}
          AND lr.list_price BETWEEN 20000 AND 50000000
          AND (lr.list_price::numeric / NULLIF(lr.sqft,0)) BETWEEN 5 AND 5000
      `;
    }
    if (!medRow || !medRow[0] || (!medRow[0].med_pps && !medRow[0].med_price)) {
      medRow = await sql`
        SELECT
          percentile_cont(0.5) WITHIN GROUP (ORDER BY list_price) AS med_price,
          percentile_cont(0.5) WITHIN GROUP (ORDER BY sqft) AS med_sqft,
          percentile_cont(0.5) WITHIN GROUP (ORDER BY (list_price::numeric / NULLIF(sqft,0))) AS med_pps
        FROM listings_raw lr
        WHERE LOWER(lr.town) = LOWER(${L.town})
          AND lr.list_price IS NOT NULL
          AND lr.sqft IS NOT NULL
          AND lr.list_price BETWEEN 20000 AND 50000000
          AND (lr.list_price::numeric / NULLIF(lr.sqft,0)) BETWEEN 5 AND 5000
      `;
    }
    const med =
      medRow && medRow[0] ? medRow[0] : { med_price: null, med_sqft: null, med_pps: null };
    const medPrice = med.med_price ? Number(med.med_price) : null;
    const medSqft = med.med_sqft ? Number(med.med_sqft) : null;
    const medPps = med.med_pps ? Number(med.med_pps) : null;

    const listingPps = L.sqft && L.list_price ? Number(L.list_price) / Number(L.sqft) : null;
    const ppsDiffPct = listingPps && medPps ? ((medPps - listingPps) / medPps) * 100 : 0;
    const priceDiffPct = medPrice ? ((medPrice - (L.list_price || 0)) / medPrice) * 100 : 0;

    const ppsComponent = Math.max(Math.min(ppsDiffPct, 50), 0);
    const priceComponent = Math.max(Math.min(priceDiffPct, 25), 0);
    let domComponent = 0;
    if (L.dom && L.dom >= 90) domComponent = 10;
    else if (L.dom && L.dom >= 45) domComponent = 5;

    const signals =
      await sql`SELECT signal_type, is_primary FROM listing_signals WHERE mls_id = ${mlsId}`;
    const hasPrimary = signals.some((s) => s.is_primary);
    const types = signals.map((s) => s.signal_type);
    let signalComponent = 0;
    if (hasPrimary) signalComponent = 15;
    else if (types.some((t) => t.includes('price_reduction') || t.includes('price-reduction')))
      signalComponent = 10;

    const rawScore = Math.round(ppsComponent + priceComponent + domComponent + signalComponent);
    const finalScore = Math.min(Math.max(rawScore, 0), 100);

    const components = {
      ppsComponent: Math.round(ppsComponent),
      priceComponent: Math.round(priceComponent),
      domComponent,
      signalComponent,
      rawScore,
      finalScore,
      medians: { price: medPrice, sqft: medSqft, pps: medPps },
    };

    await sql`CREATE TABLE IF NOT EXISTS listing_scores (mls_id text PRIMARY KEY, score integer, components jsonb, computed_at timestamptz)`;
    await sql`
      INSERT INTO listing_scores (mls_id, score, components, computed_at)
      VALUES (${mlsId}, ${components.finalScore}, ${components}, now())
      ON CONFLICT (mls_id) DO UPDATE
        SET score = EXCLUDED.score,
            components = EXCLUDED.components,
            computed_at = EXCLUDED.computed_at
    `;

    return { mlsId, finalScore };
  } catch (e) {
    console.error('error computing for', mlsId, e.message || e);
    return null;
  }
}

async function main() {
  console.log('Gathering MLS IDs with signals...');
  const rows = await sql`SELECT DISTINCT mls_id FROM listing_signals`;
  const mlsIds = rows.map((r) => r.mls_id);
  console.log('Found', mlsIds.length, 'listings to score.');

  let i = 0;
  for (const m of mlsIds) {
    i++;
    if (i % 50 === 0) console.log(`Processing ${i}/${mlsIds.length} (${m})`);
    await computeForMls(m);
  }

  console.log('Backfill complete');
  await sql.end({ timeout: 5 });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
