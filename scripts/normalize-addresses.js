#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

// Load DATABASE_URL from apps/web/.env.local if present
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
    const rows = await sql`SELECT mls_id, address FROM listings_raw`;
    let changed = 0;
    for (const r of rows) {
      const original = r.address;
      const normalized = normalizeAddress(original);
      if (normalized && normalized !== original) {
        await sql`UPDATE listings_raw SET address = ${normalized} WHERE mls_id = ${r.mls_id}`;
        changed++;
        if (changed % 50 === 0) console.log('Updated', changed);
      }
    }
    console.log('Done. Addresses updated:', changed);
    process.exit(0);
  } catch (err) {
    console.error('Error normalizing addresses:', err);
    process.exit(1);
  }
})();
