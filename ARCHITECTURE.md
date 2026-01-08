# Market Signals - System Architecture

## Overview

Market Signals is a real estate market intelligence platform that analyzes MLS listing data to surface actionable investment opportunities through computed signals.

**Purpose**: Transform raw MLS data into buyer/seller/agent intelligence by detecting price patterns, market velocity, and relative value signals.

## System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      MLS Data Sources                        │
│   (Single Family, Condo, Multi-Family Pipe-Delimited Feeds) │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Ingest Pipeline (Daily)                     │
│  • Parse pipe-delimited MLS feeds                            │
│  • Map TOWN_NUM codes to names (2600+ mappings)              │
│  • Normalize listing data                                    │
│  • Upsert into PostgreSQL                                    │
│  • Create daily snapshots for change detection               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                PostgreSQL Database (Supabase)                │
│  • listings_raw: Current listing state (7,600+ records)      │
│  • listing_snapshots: Daily snapshots for trend analysis     │
│  • town_type_band_baselines: Market stats by segment         │
│  • listing_signals: Computed opportunity signals             │
│  • saved_searches: User alert configurations                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Signal Computation Engine (Daily)               │
│  • Calculate town/type/price-band baselines                  │
│  • Detect price reductions & increases                       │
│  • Identify underpriced/overpriced listings                  │
│  • Flag high/low DOM anomalies                               │
│  • Score each signal (0-100)                                 │
│  • Mark primary signal per listing                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 Next.js Web Application                      │
│  • Market Overview: Browse towns & stats                     │
│  • Town Dashboard: View signals & trends                     │
│  • Alerts Page: Create saved searches                        │
│  • Signal Details: Filter & explore opportunities            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Email Notification System (Resend)              │
│  • Daily digest emails                                       │
│  • Matched properties with signal scores                     │
│  • Actionable insights & direct links                        │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Data Ingestion (Daily 6am)

```bash
pnpm ingest
```

**Process**:

1. Fetch 3 MLS feeds (SF, CC, MF) from MLSPin
2. Parse pipe-delimited format into JS objects
3. Map TOWN_NUM numeric codes to town names using `town-mapping-complete.ts` (2,654 mappings from official towns.txt)
4. Normalize field names (LIST_NO→mls_id, LIST_PRICE→list_price, etc.)
5. Compute DOM (days on market) from list_date if not provided
6. Upsert to `listings_raw` (latest state per MLS ID)
7. Insert to `listing_snapshots` (historical tracking)

**Output**: ~7,600 listings with properly mapped town names

### 2. Signal Computation (Daily 6:30am)

```bash
pnpm compute-signals
```

**Process**:

**Step 1: Compute Baselines**

- Group listings by town, property_type, and price_band
- Calculate median price, median DOM for each segment
- Store in `town_type_band_baselines`
- Example: "Cambridge CC 500k-1m" has median $725k, 18 DOM

**Step 2: Detect Signals**
For each active listing:

- **Price Reduction**: Previous snapshot had higher price
- **Price Increase**: Previous snapshot had lower price
- **New Listing**: First snapshot within 7 days
- **Back on Market**: Status changed from off-market to active
- **Underpriced**: List price < 90% of segment median
- **Overpriced**: List price > 110% of segment median
- **Low DOM**: DOM < 50% of segment median (hot/fast)
- **High DOM**: DOM > 200% of segment median (stale)

**Step 3: Score & Prioritize**

- Each signal gets 0-100 score based on magnitude
- Underpriced by 20% = higher score than 11%
- Mark one primary signal per listing (highest score)

**Output**: ~334 signals across all towns

### 3. User Interaction

**Web Dashboard** (http://localhost:3000):

1. **Home Page**: Browse 399 towns with stats
   - Only shows towns with proper names (filters numeric codes)
   - Displays total listings, avg price, avg DOM by property type
2. **Town Dashboard** (/town/[name]):
   - Market stats cards (active listings, prices, DOM)
   - Signal type cards with counts and descriptions
   - Property type & timeframe toggles
   - "Market Opportunities" banner when signals exist
3. **Alerts Page** (/alerts):
   - Create saved searches with town, type, signal filters
   - Price range & bed count filters
   - **Required**: Email address for notifications
   - Optional: Phone for future SMS
   - View/delete saved alerts

### 4. Notifications (Manual/Cron)

```bash
pnpm send-alerts
```

**Process**:

1. Query all alerts with `notify_via_email = true`
2. For each alert, find matching listings with fresh signals (last 24hrs)
3. Group alerts by email address
4. Send HTML digest with:
   - Total match count
   - Property details (address, price, beds, signal type)
   - Signal scores
   - Direct links to view all matches
5. Log results

**Email Provider**: Resend (API key in .env)

## Database Schema

### listings_raw

```sql
mls_id VARCHAR(50) PRIMARY KEY
property_type VARCHAR(10)  -- SF, CC, MF
status VARCHAR(50)          -- Active, Pending, Sold, etc.
list_price DECIMAL(12,2)
town VARCHAR(100)           -- Mapped name (Boston, Cambridge, etc.)
address VARCHAR(200)
beds INTEGER
baths DECIMAL(3,1)
sqft INTEGER
dom INTEGER                 -- Days on Market
list_date DATE
pending_date DATE
sold_date DATE
sold_price DECIMAL(12,2)
raw_data JSONB             -- Original MLS record
updated_at TIMESTAMP
```

### listing_snapshots

```sql
id SERIAL PRIMARY KEY
mls_id VARCHAR(50)
snapshot_date DATE
list_price DECIMAL(12,2)
status VARCHAR(50)
```

### town_type_band_baselines

```sql
id SERIAL PRIMARY KEY
town VARCHAR(100)
property_type VARCHAR(10)
price_band VARCHAR(20)      -- 0-500k, 500k-1m, 1m-2m, 2m+
median_price DECIMAL(12,2)
median_dom INTEGER
listing_count INTEGER
computed_at TIMESTAMP
```

### listing_signals

```sql
id SERIAL PRIMARY KEY
mls_id VARCHAR(50)
signal_type VARCHAR(50)     -- underpriced, price-reduction, high-dom, etc.
signal_score DECIMAL(5,2)   -- 0-100 strength
is_primary BOOLEAN          -- True for main signal
metadata JSONB              -- Additional context
computed_at TIMESTAMP
```

### saved_searches

```sql
id SERIAL PRIMARY KEY
user_id VARCHAR(100)        -- Anonymous session ID
name VARCHAR(200)
town VARCHAR(100)
property_type VARCHAR(10)
signal_type VARCHAR(50)
min_price DECIMAL(12,2)
max_price DECIMAL(12,2)
min_beds INTEGER
contact_email VARCHAR(200)  -- Required
contact_phone VARCHAR(50)   -- Optional
notify_via_email BOOLEAN DEFAULT TRUE
created_at TIMESTAMP
updated_at TIMESTAMP
```

## Signal Types & Logic

| Signal Type         | Detection Logic                                       | Use Case                                   |
| ------------------- | ----------------------------------------------------- | ------------------------------------------ |
| **price-reduction** | list_price < previous_snapshot.list_price             | Motivated sellers, negotiation opportunity |
| **new-listing**     | first_snapshot_date within 7 days                     | Beat competition, first showing            |
| **underpriced**     | list_price < segment_median \* 0.9                    | Below-market deals, value plays            |
| **overpriced**      | list_price > segment_median \* 1.1                    | Avoid or lowball, sellers unrealistic      |
| **high-dom**        | dom > segment_median_dom \* 2                         | Sitting too long, room to negotiate        |
| **low-dom**         | dom < segment_median_dom \* 0.5                       | Hot property, move fast or lose            |
| **price-increase**  | list_price > previous_snapshot.list_price             | Market heating up or seller testing        |
| **back-on-market**  | previous_status = 'off' AND current_status = 'active' | Deal fell through, second chance           |

## Technology Stack

**Backend**:

- Node.js 20+ with TypeScript
- postgres.js for database access
- tsx for TypeScript execution

**Frontend**:

- Next.js 14 (App Router, Server Components)
- React 18
- Tailwind CSS
- Server-side rendering for SEO & speed

**Database**:

- PostgreSQL 15+ (hosted on Supabase)
- ~7,600 active listings
- ~400 towns with baselines
- ~334 computed signals

**Infrastructure**:

- pnpm monorepo with 6 packages
- Resend for email delivery
- Environment-based configuration

**Packages**:

```
packages/
  db/              Database client & migrations
  ingest/          MLS feed parsing & town mapping
  compute-signals/ Baseline & signal computation
  notifications/   Email digest system
  web/             Next.js application
```

## Key Design Decisions

### 1. Town Mapping Strategy

**Problem**: MLS feeds use numeric TOWN_NUM codes (1, 12, 101, etc.)  
**Solution**: Generated complete mapping from official towns.txt (2,654 entries)  
**Benefit**: All towns display as readable names (Boston, Cambridge, etc.)

### 2. Signal Scoring

**Problem**: How to rank multiple signals?  
**Solution**: 0-100 score based on magnitude + mark primary signal  
**Benefit**: Users see most important opportunity first

### 3. Baseline Segmentation

**Problem**: Cambridge $1M condo vs Foxboro $500k SF = different markets  
**Solution**: Compute medians by town + property_type + price_band  
**Benefit**: "Underpriced" is relative to comparable properties

### 4. Snapshot-Based Change Detection

**Problem**: Detect price changes without complex diffing  
**Solution**: Daily snapshots + compare current vs previous  
**Benefit**: Simple, reliable price reduction/increase detection

### 5. Anonymous User IDs

**Problem**: Don't want full auth for MVP  
**Solution**: Cookie-based anonymous IDs + email for notifications  
**Benefit**: Low friction, GDPR-friendly, works immediately

## Performance Considerations

**Ingest**: ~7,600 records in 30 seconds (batch upserts)  
**Compute**: ~400 baselines + 334 signals in 10 seconds (SQL aggregations)  
**Web**: Server-side rendering, <300ms page loads  
**Queries**: Indexed on town, property_type, status, list_price

## Security & Privacy

- No PII stored beyond optional email/phone
- User IDs are anonymous session identifiers
- Database hosted on Supabase (encrypted at rest)
- Email delivery via Resend (no spam, opt-out ready)
- No listing addresses exposed publicly (agent listings only)

## Scalability Limits

**Current Scale**: 7,600 listings, 400 towns, 334 signals  
**Bottlenecks**:

- MLS feed parsing (single-threaded)
- Signal computation (in-memory processing)
- Email sending (rate-limited by Resend)

**Future Scale** (with optimization):

- 50,000+ listings: Parallel feed processing
- 1,000+ towns: Distributed signal computation
- 10,000+ users: Queue-based email delivery

## Monitoring & Debugging

**Logs**:

- Ingest: stdout with counts & sample fields
- Compute: signal type counts & baseline stats
- Web: Next.js dev server logs
- Email: Resend dashboard for delivery status

**Health Checks**:

```sql
-- Check data freshness
SELECT MAX(updated_at) FROM listings_raw;

-- Verify town mapping
SELECT COUNT(*) FROM listings_raw WHERE town ~ '^[0-9]+';  -- Should be 0-2

-- Signal distribution
SELECT signal_type, COUNT(*) FROM listing_signals
WHERE is_primary = true GROUP BY signal_type;
```

## Deployment Considerations

**Daily Cron Jobs** (production):

```cron
0 6 * * * cd /path/to/signals && pnpm ingest
30 6 * * * cd /path/to/signals && pnpm compute-signals
0 9 * * * cd /path/to/signals && pnpm send-alerts
```

**Environment Variables**:

```env
DATABASE_URL=postgresql://...
RESEND_API_KEY=re_...
MLS_SF_FEED_URL=https://...
MLS_CC_FEED_URL=https://...
MLS_MF_FEED_URL=https://...
```

**Web Hosting**:

- Vercel/Netlify for Next.js app
- Supabase for PostgreSQL
- Resend for email
- GitHub Actions for automated workflows

## Future Enhancements

1. **Authentication**: Replace anonymous IDs with proper user accounts
2. **SMS Alerts**: Wire up Twilio using captured phone numbers
3. **More Signals**: Sqft price anomalies, tax assessment gaps, school premiums
4. **Historical Charts**: Price trends, DOM patterns over time
5. **Map View**: Visualize signals geographically
6. **Agent CRM**: Lead management, client matching
7. **API Access**: Webhooks for real-time signal delivery
8. **Mobile App**: Native iOS/Android with push notifications

---

**Last Updated**: January 6, 2026  
**Version**: 1.0.0  
**Author**: Market Signals Team
