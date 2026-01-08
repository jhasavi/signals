import dotenv from 'dotenv';
import { join } from 'path';
import { MLSFetcher } from './fetcher.js';
import { Database } from './database.js';
import { normalizeMLSListing } from './utils.js';

// Load environment variables from workspace root
dotenv.config({ path: join(process.cwd(), '../../.env') });

const DATABASE_URL = process.env.DATABASE_URL;
const MLS_SF_FEED_URL = process.env.MLS_SF_FEED_URL;
const MLS_CC_FEED_URL = process.env.MLS_CC_FEED_URL;
const MLS_MF_FEED_URL = process.env.MLS_MF_FEED_URL;

async function main() {
  console.log('🚀 Starting MLS ingest process...\n');

  // Validate environment variables
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set');
    process.exit(1);
  }

  if (!MLS_SF_FEED_URL || !MLS_CC_FEED_URL || !MLS_MF_FEED_URL) {
    console.error('❌ One or more MLS feed URLs are not set');
    console.error('   Required: MLS_SF_FEED_URL, MLS_CC_FEED_URL, MLS_MF_FEED_URL');
    process.exit(1);
  }

  const fetcher = new MLSFetcher({
    maxRetries: 3,
    retryDelay: 2000,
    timeout: 30000,
  });

  const db = new Database(DATABASE_URL);

  const feeds = [
    { url: MLS_SF_FEED_URL, type: 'SF' as const, name: 'Single Family' },
    { url: MLS_CC_FEED_URL, type: 'CC' as const, name: 'Condo' },
    { url: MLS_MF_FEED_URL, type: 'MF' as const, name: 'Multi-Family' },
  ];

  let totalFetched = 0;
  let totalUpserted = 0;
  let totalSnapshots = 0;
  let nullTownCount = 0;
  let numericTownCount = 0;
  let nullDomCount = 0;

  for (const feed of feeds) {
    try {
      console.log(`\n📋 Processing ${feed.name} (${feed.type})...`);

      // Fetch listings from MLS feed
      const rawListings = await fetcher.fetchFeed(feed.url, feed.type);
      totalFetched += rawListings.length;

      if (rawListings.length === 0) {
        console.log(`⚠️  No listings found for ${feed.type}`);
        continue;
      }

      // Debug: Log first listing to see structure
      if (rawListings.length > 0) {
        console.log(
          `🔍 Sample listing fields:`,
          Object.keys(rawListings[0]).slice(0, 10).join(', ')
        );
      }

      // Normalize listings
      const normalized = rawListings
        .map((listing) => {
          const normalized = normalizeMLSListing(listing, feed.type);

          // Track town and DOM issues
          if (!normalized.town) {
            nullTownCount++;
          } else if (/^\d+$/.test(normalized.town)) {
            numericTownCount++;
          }
          if (!normalized.dom) {
            nullDomCount++;
          }

          return normalized;
        })
        .filter((listing) => {
          const isValid = listing.mls_id && listing.town;
          return isValid;
        }); // Filter out invalid entries

      console.log(`📝 Normalized ${normalized.length} valid listings`);
      if (numericTownCount > 0) {
        console.warn(
          `⚠️  ${numericTownCount} listings with numeric town codes (expected for pipe-delimited feeds)`
        );
      }
      if (nullDomCount > 0) {
        console.warn(
          `⚠️  ${nullDomCount} listings with null DOM (will be computed from list_date)`
        );
      }

      // Upsert into listings_raw
      const upserted = await db.upsertListings(normalized);
      totalUpserted += upserted;
      console.log(`💾 Upserted ${upserted} listings into listings_raw`);

      // Insert daily snapshots
      const snapshots = await db.insertSnapshots(normalized);
      totalSnapshots += snapshots;
      console.log(`📸 Created ${snapshots} snapshots`);
    } catch (error: any) {
      console.error(`❌ Error processing ${feed.type}:`, error.message);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 INGEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total fetched:        ${totalFetched}`);
  console.log(`Total upserted:       ${totalUpserted}`);
  console.log(`Total snapshots:      ${totalSnapshots}`);
  console.log(`Null towns:           ${nullTownCount}`);
  console.log(`Numeric town codes:   ${numericTownCount}`);
  console.log(`Null DOMs:            ${nullDomCount}`);
  console.log('='.repeat(50));

  await db.close();
  console.log('\n✅ Ingest process completed!\n');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
