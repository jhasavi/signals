import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '../../.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in .env file');
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');

    // Read migration file (go up to package root, then into migrations folder)
    const migrationPath = join(__dirname, '../migrations/001_initial_schema.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Execute migration
    await sql.unsafe(migrationSQL);

    console.log('✅ Migration completed successfully!');
    console.log('📊 Created tables:');
    console.log('   - listings_raw');
    console.log('   - listing_snapshots');
    console.log('   - town_type_band_baselines');
    console.log('   - listing_signals');
    console.log('   - saved_searches');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigrations();
