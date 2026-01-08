import dotenv from 'dotenv';
import { join } from 'path';
import { SignalComputer } from '../../ingest/src/signals.js';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '../../.env') });

const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  console.log('🎯 Starting signal computation...\n');

  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const computer = new SignalComputer(DATABASE_URL);

  try {
    // Step 1: Compute baselines
    await computer.computeBaselines(180);

    // Step 2: Compute signals for all active listings
    await computer.computeSignals();

    console.log('\n✅ Signal computation completed successfully!\n');
  } catch (error) {
    console.error('❌ Error during signal computation:', error);
    process.exit(1);
  } finally {
    await computer.close();
  }
}

if (typeof process !== 'undefined' && !process.env.VITEST) {
  main().catch((err) => {
    console.error('❌ Error during signal computation:', err);
    process.exit(1);
  });
}
