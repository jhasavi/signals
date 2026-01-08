#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

function loadDatabaseUrl() {
  const envPath = path.resolve(__dirname, '..', 'web', '.env.local');
  if (fs.existsSync(envPath)) {
    const contents = fs.readFileSync(envPath, 'utf8');
    const m = contents.match(/^DATABASE_URL=(.+)$/m);
    if (m) return m[1].trim();
  }
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  console.error('DATABASE_URL not found. Set it in web/.env.local or environment.');
  process.exit(1);
}

const DATABASE_URL = loadDatabaseUrl();
const sql = postgres(DATABASE_URL, { max: 5 });

function cleanAddress(addr) {
  if (!addr) return '';
  let s = addr.trim();
  if (s.startsWith('"') && s.endsWith('"')) s = s.slice(1, -1).trim();
  s = s.replace(/"\s*"/g, ' ');
  s = s.replace(/"/g, '');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function normalizeAddress(addr) {
  if (!addr) return '';
  let s = cleanAddress(addr);
  s = s
    .replace(/[\u2018\u2019\u201c\u201d]/g, '')
    .replace(/,\s*/g, ', ')
    .replace(/\s*,\s*/g, ', ');
  s = s
    .replace(/\bN\.?\b/gi, 'North')
    .replace(/\bS\.?\b/gi, 'South')
    .replace(/\bE\.?\b/gi, 'East')
    .replace(/\bW\.?\b/gi, 'West')
    .replace(/\bNE\.?\b/gi, 'NE')
    .replace(/\bNW\.?\b/gi, 'NW')
    .replace(/\bSE\.?\b/gi, 'SE')
    .replace(/\bSW\.?\b/gi, 'SW');
  const expansions = {
    '\\bSt\\.?\\b': 'Street',
    '\\bRd\\.?\\b': 'Road',
    '\\bAve\\.?\\b': 'Avenue',
    '\\bDr\\.?\\b': 'Drive',
    '\\bLn\\.?\\b': 'Lane',
    '\\bBlvd\\.?\\b': 'Boulevard',
    '\\bPl\\.?\\b': 'Place',
    '\\bCt\\.?\\b': 'Court',
    '\\bCir\\.?\\b': 'Circle',
    '\\bPkwy\\.?\\b': 'Parkway',
    '\\bHwy\\.?\\b': 'Highway',
    '\\bTer\\.?\\b': 'Terrace',
  };
  for (const k of Object.keys(expansions)) {
    s = s.replace(new RegExp(k, 'gi'), expansions[k]);
  }
  s = s
    .toLowerCase()
    .split(' ')
    .map((w) => {
      if (/^\d+$/.test(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
  s = s
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
  return s;
}

(async () => {
  try {
    console.log('Connecting to DB...');
    await sql`CREATE TABLE IF NOT EXISTS listing_duplicates (
      canonical_mls_id text NOT NULL,
      duplicate_mls_id text NOT NULL,
      reason text,
      created_at timestamptz DEFAULT NOW()
    );`;

    const rows =
      await sql`SELECT mls_id, address, town, sqft, list_price, beds, baths, created_at FROM listings_raw WHERE address IS NOT NULL`;
    const groups = new Map();
    for (const r of rows) {
      const key = `${normalizeAddress(r.address).toLowerCase()}|${(r.town || '').toLowerCase()}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(r);
    }

    let groupCount = 0;
    let dupCount = 0;

    for (const [k, arr] of groups.entries()) {
      if (arr.length <= 1) continue;
      groupCount++;
      // choose canonical: prefer rows with sqft + price, then highest list_price
      arr.sort((a, b) => {
        const aScore = (a.sqft ? 1 : 0) + (a.list_price ? 1 : 0);
        const bScore = (b.sqft ? 1 : 0) + (b.list_price ? 1 : 0);
        if (bScore !== aScore) return bScore - aScore;
        if (b.list_price && a.list_price) return b.list_price - a.list_price;
        return new Date(b.created_at) - new Date(a.created_at);
      });
      const canonical = arr[0];
      for (let i = 1; i < arr.length; i++) {
        const dup = arr[i];
        await sql`INSERT INTO listing_duplicates (canonical_mls_id, duplicate_mls_id, reason) VALUES (${canonical.mls_id}, ${dup.mls_id}, 'same-normalized-address') ON CONFLICT DO NOTHING`;
        dupCount++;
      }
    }

    console.log('Groups with duplicates:', groupCount);
    console.log('Duplicate entries recorded:', dupCount);
    process.exit(0);
  } catch (err) {
    console.error('Error deduping listings:', err);
    process.exit(1);
  }
})();
