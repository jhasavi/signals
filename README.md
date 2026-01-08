# Market Signals Platform

**Status**: ✅ PRODUCTION READY (v1.0.0 - January 6, 2026)

An analytics platform for MLS listing data that surfaces actionable market opportunities through computed signals. Analyzes 7,600+ listings across 399+ Massachusetts towns to detect price patterns, market velocity, and relative value signals.

**This is NOT an IDX public search site** - it's a market intelligence tool for buyers, sellers, and agents to identify opportunities through baseline-aware signal detection.

## 🎯 Quick Links

- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Start here! Complete overview of what's fixed and working
- **[USER_GUIDE.md](USER_GUIDE.md)** - Step-by-step usage instructions for buyers/sellers/agents
- **[FILTER_GUIDE.md](FILTER_GUIDE.md)** - Comprehensive filtering guide with examples
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical deep-dive into system design
- **[FEATURES.md](FEATURES.md)** - Complete feature list and roadmap
- **[TEST_RESULTS.md](TEST_RESULTS.md)** - Comprehensive test report (22 test cases, 95% pass)
- **[VALUE_PROPOSITION.md](VALUE_PROPOSITION.md)** - Use cases and market positioning

## ✨ What Makes This Different

**Traditional MLS Alert**: "Email me all 3-bed condos under $500k"  
**Market Signals**: "Email me condos that are **underpriced**, **had price drops**, or **sitting too long**"

- ✅ **Baseline-Aware**: Compares properties to town + type + price-band segments
- ✅ **Multi-Signal Detection**: 8 types (price drops, underpriced, high DOM, etc.)
- ✅ **Scored Opportunities**: Ranked 0-100 by magnitude
- ✅ **Actionable Insights**: Each signal explains "why it matters"
- ✅ **Email Notifications**: Daily digests with matches

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL (or Supabase account)
- pnpm 8+
- Resend API key (for email alerts)

### Setup (5 minutes)

```bash
# 1. Clone and install
git clone <repo>
cd signals
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your:
#   - DATABASE_URL
#   - RESEND_API_KEY
#   - MLS feed URLs

# 3. Initialize database
pnpm --filter db migrate

# 4. Load data (first time)
pnpm ingest          # Fetch & normalize MLS data (~30s)
pnpm compute-signals # Generate signals (~10s)

# 5. Start web app
./START_DEV.sh
# Visit http://localhost:3000
```

### Daily Operations

```bash
# Automated workflow (set up cron):
pnpm ingest          # 6:00 AM - Refresh MLS data
pnpm compute-signals # 6:30 AM - Compute new signals
pnpm send-alerts     # 9:00 AM - Send email digests
```

## 📊 Features

### Core Capabilities ✅

- **Market Dashboard**: Browse 399+ towns with listing stats
- **Town Analytics**: Active counts, prices, DOM trends by property type
- **Smart Signals**: 8 types detecting opportunities
- **Advanced Filtering**: Property type, price buckets, inventory levels, beds/baths, DOM, status
- **Saved Alerts**: Email notifications with matching properties
- **Baseline Comparison**: Segment-aware (town + type + price band)
- **Email Notifications**: HTML digests via Resend

### Advanced Filtering System 🔍

Filter listings by multiple criteria to find exactly what you're looking for:

**Property Type Filters**:
- Single Family (SF)
- Condo (CC)
- Multi-Family (MF)

**Price Range Buckets**:
- Under $150K
- $150K - $500K
- $500K - $1M
- $1M - $2M
- $2M - $4M
- $4M+

**Inventory Level**:
- Low Inventory (< 50 listings) - Hot markets with limited supply
- High Inventory (≥ 50 listings) - More buyer negotiation leverage

**Additional Filters**:
- Bedrooms: Min/Max range
- Bathrooms: Min/Max range (supports half-baths)
- Days on Market: Min/Max range
- Status: Active, Pending, Under Agreement
- Sort: Signal score, Price, DOM, or Newest first

**Example Filter Combinations**:
1. Condos in Boston, $500K-$1M, 2+ beds, Low Inventory
2. Single Family in Cambridge, $1M-$2M, with price reduction signal
3. Multi-Family, High DOM (60+ days), under $4M
4. Active listings only, sorted by newest first

### Signal Types

| Signal                 | What It Means            | Use Case               |
| ---------------------- | ------------------------ | ---------------------- |
| 💰 **Price Reduction** | Recent price drop        | Motivated sellers      |
| ✨ **New Listing**     | Fresh on market (7 days) | Beat competition       |
| 🎯 **Underpriced**     | <90% of segment median   | Below-market deals     |
| 🏷️ **Overpriced**      | >110% of segment median  | Avoid or lowball       |
| ⏰ **High DOM**        | 2x segment median        | Negotiation leverage   |
| ⚡ **Low DOM**         | 0.5x segment median      | Hot property, act fast |
| 📈 **Price Increase**  | Price raised             | Market testing         |
| 🔄 **Back on Market**  | Deal fell through        | Second chance          |

### Data Quality ✅

- **7,639 active listings** ingested daily
- **399 towns** with proper names (99.97% mapping success)
- **458 baselines** computed (town + type + price band)
- **334 signals** detected (~5% of listings = high quality filter)

## 🏗️ Architecture

```
MLS Feeds (SF/CC/MF)
    ↓
Ingest Pipeline (town mapping: 2,654 codes → names)
    ↓
PostgreSQL (listings, snapshots, baselines, signals, alerts)
    ↓
Signal Computation (baseline-aware scoring)
    ↓
Next.js Web App (server-rendered, <300ms loads)
    ↓
Email Notifications (Resend API, HTML digests)
```

**Tech Stack**:

- Next.js 14 (App Router), React 18, Tailwind CSS
- Node.js 20, TypeScript, postgres.js
- PostgreSQL 15+ (Supabase-compatible)
- Resend for email delivery
- pnpm monorepo (6 packages)

**Performance**:

- Page loads: <300ms ✅
- DB queries: <50ms ✅
- Full pipeline: 42 seconds ✅

## 📁 Project Structure

```
market-signals/
├── apps/
│   └── web/                 # Next.js web application
│       ├── src/
│       │   ├── app/         # App Router pages
│       │   │   ├── page.tsx              # Home: Town list
│       │   │   ├── town/[town]/          # Town dashboard
│       │   │   │   ├── page.tsx          # Stats & signal counts
│       │   │   │   └── signals/page.tsx  # Signal listings grid
│       │   │   ├── alerts/page.tsx       # Saved searches
│       │   │   └── api/alerts/           # API routes
│       │   ├── components/  # React components
│       │   └── lib/         # Utilities & DB client
│       └── package.json
├── packages/
│   ├── db/                  # Database migrations
│   │   ├── migrations/
│   │   │   └── 001_initial_schema.sql
│   │   └── src/migrate.ts
│   ├── ingest/              # MLS feed ingestion
│   │   └── src/
│   │       ├── index.ts     # Main ingest script
│   │       ├── fetcher.ts   # HTTP client with retry
│   │       ├── database.ts  # DB operations
│   │       ├── signals.ts   # Signal computation
│   │       └── types.ts     # TypeScript types
│   └── compute-signals/     # Signal computation runner
│       └── src/compute.ts
├── package.json             # Root package with scripts
├── pnpm-workspace.yaml
└── .env                     # Environment variables
```

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ and pnpm 8+
- PostgreSQL database (or Supabase account)
- MLS feed URLs (with secure tokens)

### 2. Install Dependencies

```bash
# Install pnpm if you don't have it
npm install -g pnpm

# Install all dependencies
pnpm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Database connection (Supabase-compatible)
DATABASE_URL=postgresql://user:password@host:port/database

# MLS Feed URLs (keep server-side only, never expose to client)
# These should be secure URLs with embedded tokens
MLS_SF_FEED_URL=https://your-mls-url/singlefamily?token=xxxxx
MLS_CC_FEED_URL=https://your-mls-url/condo?token=xxxxx
MLS_MF_FEED_URL=https://your-mls-url/multifamily?token=xxxxx
```

⚠️ **Security Note**: MLS feed URLs contain sensitive tokens. Never commit `.env` to git or expose these URLs to the client-side code.

### 4. Run Database Migrations

Create all required tables:

```bash
pnpm db:migrate
```

This creates:

- `listings_raw` - Latest normalized listing per MLS ID
- `listing_snapshots` - Daily snapshots for price change detection
- `town_type_band_baselines` - Precomputed market baselines
- `listing_signals` - Computed signal scores and labels
- `saved_searches` - User-saved alert criteria

### 5. Ingest MLS Data

Fetch and populate listings from all three feeds:

```bash
pnpm ingest
```

This will:

- Fetch SF, CC, and MF feeds from configured URLs
- Parse and normalize listing data
- Upsert into `listings_raw` table
- Create daily snapshots in `listing_snapshots`
- Log counts and any errors

**Run this daily** to keep data fresh (via cron, GitHub Actions, or scheduler).

### 6. Compute Signals

Calculate baselines and signal scores:

```bash
pnpm compute-signals
```

This will:

- Compute baselines per (town, property_type, price_band) for 180-day lookback
- Calculate median DOM, median price, and price cut rate
- Compute 5 signal types for all active listings
- Assign 0-100 scores and mark primary signal per listing

**Run this after ingest** to update signals based on latest data.

### 7. Start Web Application

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Web Interface

1. **Home Page** (`/`)
   - Lists all towns with available listings
   - Shows total listings, avg price, and avg DOM per property type
   - Click any town to view dashboard

2. **Town Dashboard** (`/town/[town]`)
   - Toggle between SF/CC/MF property types
   - Toggle timeframe (30/90/180 days)
   - View key stats: active listings, avg/median price, avg DOM
   - See signal counts with clickable cards

3. **Signals Page** (`/town/[town]/signals`)
   - Filtered listing grid for specific signal type
   - Each listing shows: photo, address, price, beds/baths/sqft, DOM, status
   - Filter by price range and min beds
   - Sort by signal score or price
   - Price change % displayed when available

4. **Alerts Page** (`/alerts`)
   - Create saved searches by town, type, signal, price, beds
   - View all saved alerts
   - Click "View Results" to see matching listings
   - Delete alerts when no longer needed

### Command Reference

```bash
# Development
pnpm dev              # Start Next.js dev server (port 3000)

# Data Pipeline
pnpm ingest           # Fetch MLS feeds and populate DB
pnpm compute-signals  # Compute baselines and signals

# Database
pnpm db:migrate       # Run schema migrations

# Production
pnpm build            # Build Next.js for production
pnpm start            # Start production server
```

## Database Schema

### Tables

**listings_raw**

- Latest normalized listing data per `mls_id`
- Columns: mls_id (unique), property_type, status, list_price, town, address, beds, baths, sqft, dom, dates, raw_data (jsonb)
- Indexed on: town, property_type, status, dom, list_price, updated_at

**listing_snapshots**

- Daily snapshots for price change detection
- Columns: mls_id, snapshot_date, list_price, status, dom
- Unique constraint: (mls_id, snapshot_date)

**town_type_band_baselines**

- Precomputed market baselines per (town, property_type, price_band)
- Columns: town, property_type, price_band, lookback_days, median_dom, median_list_price, price_cut_rate, sample_size
- Used for signal thresholds

**listing_signals**

- Computed signal scores per listing
- Columns: mls_id, signal_type, signal_score (0-100), is_primary, metadata (jsonb)
- Unique constraint: (mls_id, signal_type)

**saved_searches**

- User-saved search criteria
- Columns: user_id (nullable for MVP), name, town, property_type, signal_type, price ranges, min_beds

## Signal Definitions

All signals are computed relative to market baselines (median DOM, median price, price cut rate) for each town/type/price band combination.

1. **Stale Listing**
   - `dom >= max(21, 1.5 × median_dom)`
   - Properties sitting on market much longer than typical

2. **Recent Price Drop**
   - Price decreased by ≥2% in last 14 days
   - Detected via `listing_snapshots` comparison

3. **Likely Price Cut**
   - Status = Active AND `dom >= 1.25 × median_dom` AND `list_price >= 1.03 × median_price`
   - Overpriced properties getting stale

4. **Underpriced**
   - `list_price <= 0.97 × median_price` AND `dom <= median_dom`
   - Below-market listings moving quickly

5. **Hot**
   - Status = Pending/Under Agreement AND `dom <= min(7, 0.5 × median_dom)`
   - Properties going under contract very fast

Each listing gets a 0-100 score per applicable signal. The highest-scoring signal is marked as `is_primary`.

## MLS Photo Integration

Listing photos are served via:

```
https://media.mlspin.com/photo.aspx?mls={MLS_NUMBER}&n={PHOTO_INDEX}&w={WIDTH}&h={HEIGHT}
```

- `mls`: MLS listing ID (from database)
- `n`: Photo index (0 = primary photo)
- `w`, `h`: Dimensions in pixels

Photos are loaded client-side but **do not expose feed tokens** (those are only in server-side env vars).

## Automation & Scheduling

For production, schedule these commands to run daily:

```bash
# Run ingest at 2 AM daily
0 2 * * * cd /path/to/market-signals && pnpm ingest >> logs/ingest.log 2>&1

# Run signal computation at 3 AM daily (after ingest)
0 3 * * * cd /path/to/market-signals && pnpm compute-signals >> logs/signals.log 2>&1
```

## 🛠 Developer Tips

- Install dependencies: `pnpm install`
- Run Next.js dev server: `pnpm dev`
- Run TypeScript checks: `pnpm --filter web run type-check`
- Run unit tests: `pnpm test` (uses `vitest`)
- Format code: `pnpm format` (Prettier)
- Lint code: `pnpm lint` (requires ESLint installed via `pnpm install`)

CI: There is a basic GitHub Actions workflow at `.github/workflows/ci.yml` that installs dependencies, builds the workspace and runs `pnpm -w test`.

Contributions: Please open issues or PRs with descriptive titles and link to the relevant file paths. Run `pnpm format` and `pnpm test` before submitting a PR.


Or use GitHub Actions, AWS EventBridge, or your preferred scheduler.

## Security Considerations

- ✅ MLS feed URLs with tokens are server-side only (never sent to client)
- ✅ Database connection string is server-side only
- ✅ User IDs for saved searches are anonymous session IDs (no auth required for MVP)
- ✅ All API routes validate required fields
- ⚠️ For production: Add authentication, rate limiting, and input sanitization

## Troubleshooting

**No data showing in web app?**

- Ensure you've run `pnpm ingest` to fetch MLS data
- Check that `DATABASE_URL` is correctly set in `.env`
- Verify MLS feed URLs are valid and returning data

**No signals showing?**

- Run `pnpm compute-signals` after ingesting data
- Check that listings exist in `listings_raw` table
- Ensure at least 5 listings exist per town/type/price_band for baseline computation

**Database connection errors?**

- Verify `DATABASE_URL` format: `postgresql://user:password@host:port/database`
- Check that PostgreSQL is running and accessible
- For Supabase: Use the "Connection string" from Settings > Database

**MLS feed fetch failures?**

- Check that feed URLs are correct and tokens are valid
- Review retry logs in terminal output
- Ensure your IP is whitelisted by MLS provider (if required)

## Development

The project uses:

- **TypeScript** for type safety
- **Server Components** by default (client components marked with `'use client'`)
- **Postgres.js** for database access
- **Tailwind CSS** for styling
- **pnpm workspaces** for monorepo management

To add a new signal type:

1. Add computation logic in `packages/ingest/src/signals.ts`
2. Update `listing_signals` table if needed
3. Add UI label in `apps/web/src/lib/utils.ts` (`getSignalLabel`)
4. Test with `pnpm compute-signals`

## License

MIT

## Support

For issues or questions about this MVP, contact your development team or open an issue in the project repository.
