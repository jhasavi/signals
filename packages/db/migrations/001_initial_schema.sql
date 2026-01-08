-- Migration: 001_initial_schema.sql
-- Create tables for Market Signals platform

-- Store the latest normalized listing data per mls_id
CREATE TABLE IF NOT EXISTS listings_raw (
  id SERIAL PRIMARY KEY,
  mls_id VARCHAR(50) UNIQUE NOT NULL,
  property_type VARCHAR(10) NOT NULL, -- 'SF', 'CC', 'MF'
  status VARCHAR(50) NOT NULL,
  list_price DECIMAL(12, 2),
  town VARCHAR(100) NOT NULL,
  address TEXT,
  beds INTEGER,
  baths DECIMAL(3, 1),
  sqft INTEGER,
  dom INTEGER, -- days on market
  list_date DATE,
  pending_date DATE,
  sold_date DATE,
  sold_price DECIMAL(12, 2),
  raw_data JSONB, -- store original feed data
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Daily snapshots to detect price changes and track history
CREATE TABLE IF NOT EXISTS listing_snapshots (
  id SERIAL PRIMARY KEY,
  mls_id VARCHAR(50) NOT NULL,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  list_price DECIMAL(12, 2),
  status VARCHAR(50),
  dom INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (mls_id, snapshot_date)
);

-- Precomputed baselines per (town, property_type, price_band)
CREATE TABLE IF NOT EXISTS town_type_band_baselines (
  id SERIAL PRIMARY KEY,
  town VARCHAR(100) NOT NULL,
  property_type VARCHAR(10) NOT NULL,
  price_band VARCHAR(50) NOT NULL, -- e.g., '0-500k', '500k-1m', '1m+'
  lookback_days INTEGER NOT NULL DEFAULT 180,
  median_dom INTEGER,
  median_list_price DECIMAL(12, 2),
  price_cut_rate DECIMAL(5, 4), -- percentage as decimal (0.15 = 15%)
  sample_size INTEGER,
  computed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (town, property_type, price_band, lookback_days)
);

-- Computed signal scores and labels for each listing
CREATE TABLE IF NOT EXISTS listing_signals (
  id SERIAL PRIMARY KEY,
  mls_id VARCHAR(50) NOT NULL,
  signal_type VARCHAR(50) NOT NULL, -- 'stale', 'recent_drop', 'likely_cut', 'underpriced', 'hot'
  signal_score INTEGER NOT NULL, -- 0-100
  is_primary BOOLEAN DEFAULT FALSE,
  metadata JSONB, -- store additional context (e.g., price_change%, days_since_drop)
  computed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (mls_id, signal_type)
);

-- Saved searches/alerts (user_id nullable for MVP)
CREATE TABLE IF NOT EXISTS saved_searches (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100), -- nullable for MVP; can be anonymous session id
  name VARCHAR(200),
  town VARCHAR(100) NOT NULL,
  property_type VARCHAR(10) NOT NULL,
  signal_type VARCHAR(50),
  min_price DECIMAL(12, 2),
  max_price DECIMAL(12, 2),
  min_beds INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_listings_raw_town ON listings_raw(town);
CREATE INDEX IF NOT EXISTS idx_listings_raw_property_type ON listings_raw(property_type);
CREATE INDEX IF NOT EXISTS idx_listings_raw_status ON listings_raw(status);
CREATE INDEX IF NOT EXISTS idx_listings_raw_dom ON listings_raw(dom);
CREATE INDEX IF NOT EXISTS idx_listings_raw_list_price ON listings_raw(list_price);
CREATE INDEX IF NOT EXISTS idx_listings_raw_updated_at ON listings_raw(updated_at);
CREATE INDEX IF NOT EXISTS idx_listings_raw_town_type ON listings_raw(town, property_type);

CREATE INDEX IF NOT EXISTS idx_listing_snapshots_mls_id ON listing_snapshots(mls_id);
CREATE INDEX IF NOT EXISTS idx_listing_snapshots_date ON listing_snapshots(snapshot_date);

CREATE INDEX IF NOT EXISTS idx_baselines_town_type ON town_type_band_baselines(town, property_type);
CREATE INDEX IF NOT EXISTS idx_baselines_lookup ON town_type_band_baselines(town, property_type, price_band);

CREATE INDEX IF NOT EXISTS idx_signals_mls_id ON listing_signals(mls_id);
CREATE INDEX IF NOT EXISTS idx_signals_type ON listing_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_signals_primary ON listing_signals(is_primary) WHERE is_primary = TRUE;

CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_town ON saved_searches(town);
