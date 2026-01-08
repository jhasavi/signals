# Market Signals - Features & Capabilities

## Core Features

### 1. Market Intelligence Dashboard ✅

**Browse Towns**

- View 399+ Massachusetts towns with active listings
- See total listings, average prices, and DOM by property type (SF, CC, MF)
- Filter out unmapped/invalid town names automatically
- Click any town to drill down into detailed analytics

**Town-Level Analytics**

- Active listing counts in real-time
- Average and median prices
- Days on Market trends
- Toggle between property types (Single Family, Condo, Multi-Family)
- Adjust timeframe (30/60/90/180 days)

**Signal Visualization**

- Color-coded signal cards with icons
- Clear descriptions of what each signal means
- Property counts per signal type
- One-click access to matching listings

### 2. Smart Market Signals ✅

**Price-Based Signals**

- **Price Reductions**: Properties with recent price drops (motivated sellers)
- **Price Increases**: Listings testing higher prices (market heating up)
- **Underpriced**: Below comparable properties in same town/type/price band
- **Overpriced**: Above market value for segment

**Timing Signals**

- **New Listings**: Fresh on market within 7 days (beat competition)
- **High DOM**: Sitting 2x longer than comparable (negotiation leverage)
- **Low DOM**: Moving 2x faster than average (act quickly)
- **Back on Market**: Deal fell through (second chance)

**Signal Scoring**

- Each signal rated 0-100 based on magnitude
- Primary signal marked per listing
- Sorted by signal strength for prioritization

### 3. Saved Alerts System ✅

**Create Custom Searches**

- Select town from dropdown (399+ valid towns)
- Choose property type (SF/CC/MF)
- Pick signal type (price drops, underpriced, etc.)
- Set price range (min/max)
- Specify minimum bedrooms
- **Required**: Email address for notifications
- **Optional**: Phone number for future SMS

**Alert Management**

- View all saved alerts in one place
- See alert criteria at a glance
- "View Results" button to check current matches
- Delete unwanted alerts
- Toggle email notifications on/off per alert

**Email Notifications**

- Daily digest emails via Resend
- HTML-formatted with property details
- Signal scores and descriptions
- Direct links to view all matches
- Unsubscribe-ready (opt-out per alert)

### 4. Baseline-Aware Comparisons ✅

**Segmented Analysis**

- Baselines computed by: town + property_type + price_band
- Example: "Cambridge Condo $500k-$1M" vs "Foxboro SF $0-$500k"
- Median price and median DOM per segment
- 458 active baseline segments

**Relative Pricing**

- "Underpriced" = 10% below segment median (not citywide average)
- "Overpriced" = 10% above segment median
- Context-aware signals that account for local market conditions

### 5. Data Pipeline ✅

**Daily Automated Ingest**

- Fetch 3 MLS feeds (SF, CC, MF) from MLSPin
- Parse pipe-delimited format
- Map 2,654 TOWN_NUM codes to readable names
- Normalize ~7,600 listings
- Create daily snapshots for change detection

**Signal Computation**

- Calculate 458 town/type/price-band baselines
- Detect 8 signal types across all listings
- Score and rank signals
- Complete in <1 minute

### 6. User Experience ✅

**Clean Interface**

- Tailwind CSS styling
- Responsive design (mobile-friendly)
- Clear calls-to-action
- Descriptive help text throughout
- Loading states and error handling

**Actionable Insights**

- Every signal explains "why it matters"
- Suggested actions (negotiate, move fast, wait, etc.)
- Market context (DOM trends, price patterns)
- Direct links to property details

**SEO-Optimized**

- Server-side rendering with Next.js
- Fast page loads (<300ms)
- Indexed town pages for organic search

## Technical Features

### Data Quality

- ✅ Complete town name mapping (2,654 codes)
- ✅ Duplicate detection (latest state per MLS ID)
- ✅ Null handling (DOM, town, price fields)
- ✅ Invalid data filtering (numeric town codes excluded from UI)

### Performance

- ✅ Indexed database queries (<100ms)
- ✅ Batch upserts for ingest (7,600 records in 30s)
- ✅ Parallel feed fetching
- ✅ Server-side caching

### Reliability

- ✅ Migration system for schema changes
- ✅ Retry logic for MLS feed fetching (3 attempts)
- ✅ Error logging throughout pipeline
- ✅ Graceful failure handling

### Security

- ✅ Anonymous user IDs (cookie-based)
- ✅ No PII beyond optional email/phone
- ✅ Environment-based secrets (.env)
- ✅ Database hosted on secure Supabase
- ✅ HTTPS-ready

## Feature Comparison

### vs. Traditional MLS Alert

| Feature        | MLS Alert                   | Market Signals                                 |
| -------------- | --------------------------- | ---------------------------------------------- |
| Alert Type     | "Email me all 3-bed condos" | "Email me underpriced condos with price drops" |
| Context        | None                        | Compared to town/type/price segment            |
| Prioritization | Chronological               | Signal strength (0-100)                        |
| Actionability  | Low (just lists properties) | High (explains why it matters)                 |
| Noise Level    | High (100s of emails)       | Low (only high-signal matches)                 |

### vs. Zillow/Redfin

| Feature       | Zillow              | Market Signals                         |
| ------------- | ------------------- | -------------------------------------- |
| Search        | Browse all listings | Find opportunities                     |
| Sorting       | Price, beds, date   | Signal strength                        |
| Intelligence  | None                | 8 market signals                       |
| Alerts        | New listing only    | New + price drops + underpriced + more |
| Market Trends | Limited             | Town/type/band baselines               |

## Feature Roadmap

### Phase 2 (Next 3 Months)

- [ ] User authentication (replace anonymous IDs)
- [ ] SMS alerts via Twilio
- [ ] Historical price charts per listing
- [ ] Map view with signal overlays
- [ ] Export to CSV/Excel

### Phase 3 (Next 6 Months)

- [ ] More signal types (sqft anomalies, school premiums, tax gaps)
- [ ] Agent CRM features (lead tracking, client matching)
- [ ] Mobile app (iOS/Android)
- [ ] API access for integrations
- [ ] Neighborhood-level analytics

### Phase 4 (Next 12 Months)

- [ ] Predictive signals (machine learning)
- [ ] Comps analysis (automated BPOs)
- [ ] Mortgage calculator integration
- [ ] Agent performance metrics
- [ ] Multi-market expansion (beyond MA)

## Known Limitations

### Current Constraints

- **2 unmapped towns**: TOWN_NUM 203, 2015 not in towns.txt (1-2 listings)
- **No DOM data**: MLS feeds lack DOM/list_date, computed from snapshot diffs
- **Anonymous users**: No persistent accounts, just session cookies
- **Manual email sending**: `pnpm send-alerts` must be run manually or via cron
- **No SMS yet**: Phone numbers captured but not wired to Twilio
- **Single state**: Only Massachusetts (MLSPin coverage)

### Data Refresh

- **Ingest frequency**: Daily (not real-time)
- **Signal lag**: Signals computed after ingest (6:30am daily)
- **Email timing**: Manual send or cron schedule
- **Snapshot interval**: 24 hours (can't detect intraday changes)

### Scale Limits

- **7,600 listings**: Current data size
- **399 towns**: Properly mapped
- **334 signals**: Active opportunities
- **~50 alerts**: Current saved searches

## Support & Feedback

**Documentation**:

- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical details
- [QUICK_START.md](QUICK_START.md) - Usage instructions
- [VALUE_PROPOSITION.md](VALUE_PROPOSITION.md) - Use cases

**Issues**:

- Check console logs for errors
- Verify DATABASE_URL in .env
- Ensure migrations ran: `pnpm --filter db migrate`
- Restart dev server: `./START_DEV.sh`

**Questions**:

- What does this signal mean? → See signal card descriptions
- Why no matches for my alert? → Widen criteria (price range, signal type)
- How often do signals update? → Daily after compute runs
- Can I get real-time alerts? → Not yet (Phase 2 roadmap)

---

**Feature Status Legend**:

- ✅ Implemented & tested
- 🔄 In progress
- [ ] Planned (roadmap)
- ⚠️ Known issue

**Last Updated**: January 6, 2026
