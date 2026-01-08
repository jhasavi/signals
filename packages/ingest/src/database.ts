import postgres from 'postgres';
import { NormalizedListing } from './types.js';

export class Database {
  private sql: postgres.Sql;

  constructor(connectionString: string) {
    this.sql = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }

  async upsertListings(listings: NormalizedListing[]) {
    if (listings.length === 0) return 0;

    let upsertedCount = 0;

    for (const listing of listings) {
      try {
        await this.sql`
          INSERT INTO listings_raw (
            mls_id, property_type, status, list_price, town, address,
            beds, baths, sqft, dom, list_date, pending_date, sold_date,
            sold_price, raw_data, updated_at
          ) VALUES (
            ${listing.mls_id}, ${listing.property_type}, ${listing.status},
            ${listing.list_price}, ${listing.town}, ${listing.address},
            ${listing.beds}, ${listing.baths}, ${listing.sqft}, ${listing.dom},
            ${listing.list_date}, ${listing.pending_date}, ${listing.sold_date},
            ${listing.sold_price}, ${this.sql.json(listing.raw_data)}, NOW()
          )
          ON CONFLICT (mls_id) DO UPDATE SET
            property_type = EXCLUDED.property_type,
            status = EXCLUDED.status,
            list_price = EXCLUDED.list_price,
            town = EXCLUDED.town,
            address = EXCLUDED.address,
            beds = EXCLUDED.beds,
            baths = EXCLUDED.baths,
            sqft = EXCLUDED.sqft,
            dom = EXCLUDED.dom,
            list_date = EXCLUDED.list_date,
            pending_date = EXCLUDED.pending_date,
            sold_date = EXCLUDED.sold_date,
            sold_price = EXCLUDED.sold_price,
            raw_data = EXCLUDED.raw_data,
            updated_at = NOW()
        `;
        upsertedCount++;
      } catch (error) {
        console.error(`Error upserting listing ${listing.mls_id}:`, error);
      }
    }

    return upsertedCount;
  }

  async insertSnapshots(listings: NormalizedListing[]) {
    if (listings.length === 0) return 0;

    let insertedCount = 0;
    const today = new Date().toISOString().split('T')[0];

    for (const listing of listings) {
      try {
        await this.sql`
          INSERT INTO listing_snapshots (
            mls_id, snapshot_date, list_price, status, dom
          ) VALUES (
            ${listing.mls_id}, ${today}, ${listing.list_price},
            ${listing.status}, ${listing.dom}
          )
          ON CONFLICT (mls_id, snapshot_date) DO UPDATE SET
            list_price = EXCLUDED.list_price,
            status = EXCLUDED.status,
            dom = EXCLUDED.dom
        `;
        insertedCount++;
      } catch (error) {
        console.error(`Error inserting snapshot for ${listing.mls_id}:`, error);
      }
    }

    return insertedCount;
  }

  async close() {
    await this.sql.end();
  }
}
