# Market Signals - User Guide

## Getting Started

### For First-Time Users

**Step 1: Browse the Market Overview**

1. Visit http://localhost:3000
2. You'll see a list of ~399 Massachusetts towns
3. Each town shows:
   - Total listings count
   - Average price by property type (SF/CC/MF)
   - Average days on market
4. Click any town name to drill down

**Step 2: Explore Town Analytics**

1. Click on a town (e.g., "Boston", "Cambridge", "Acton")
2. You'll see:
   - Active listing counts
   - Price statistics (average & median)
   - Market signals with counts
3. Use the toggles to:
   - Switch property types (Single Family / Condo / Multi-Family)
   - Adjust timeframe (30/60/90/180 days)

**Step 3: Understand Market Signals**
Each signal card shows:

- **Icon & Name**: Visual identifier
- **Description**: What the signal means
- **Property Count**: How many listings match
- **View Details Button**: See full list

**Signal Types Explained**:

- 💰 **Price Reductions**: Sellers just dropped their price (motivated!)
- ✨ **New Listings**: Fresh on market (be first to see them)
- 📈 **Price Increases**: Testing higher price (market heating up)
- 🔄 **Back on Market**: Previous deal fell through (second chance)
- ⏰ **Long on Market**: Sitting too long (negotiate harder)
- ⚡ **Moving Fast**: Selling quickly (act now or miss out)
- 🎯 **Below Market**: Priced under comparable homes (potential deal)
- 🏷️ **Above Market**: Overpriced vs neighbors (wait for cut)

### For Buyers

**Finding Deals**:

1. Go to your target town's dashboard
2. Look for these signals:
   - **Price Reductions** → Motivated sellers
   - **Below Market** → Bargain opportunities
   - **Long on Market** → Room to negotiate
   - **Back on Market** → Eager sellers
3. Click "View Details" to see matching properties
4. Sort by signal score (highest = best opportunity)

**Creating Alerts**:

1. Click "Alerts" in navigation
2. Fill out the form:
   - **Alert Name**: "Boston Underpriced Condos" (helps you remember)
   - **Town**: Select from dropdown
   - **Property Type**: SF/CC/MF
   - **Signal Type**: Pick what matters (e.g., "Underpriced")
   - **Price Range**: Min/Max budget
   - **Min Beds**: Optional filter
   - **Email**: **REQUIRED** (where alerts go)
   - **Phone**: Optional (for future SMS)
3. Check "Send me alerts by email"
4. Click "Create Alert"

**Example Alert**: "Newton SF Bargains"

- Town: Newton
- Type: Single Family
- Signal: Underpriced
- Price: $800k - $1.5M
- Beds: 3+
- Email: buyer@example.com
- Result: Daily emails when SF homes in Newton are underpriced, $800k-$1.5M, 3+ beds

### For Sellers

**Timing Your Listing**:

1. Check your town's dashboard
2. Look at:
   - **Active Listings**: Competition level
   - **Avg DOM**: How long homes sit
   - **Price Reduction Count**: Market softness indicator
3. Signals to watch:
   - Many "Price Reductions" = soft market (price aggressively)
   - Many "Moving Fast" = hot market (list higher)
   - High Avg DOM = buyers have leverage (be realistic)

**Competitive Analysis**:

1. View your town + property type
2. Check "Above Market" signal
   - These are your overpriced competitors
   - They'll cut prices eventually
3. Check "Below Market" signal
   - These are underpriced comps
   - Your competition for buyers

**Example Strategy**:

- You're selling a Cambridge condo for $750k
- Dashboard shows:
  - 12 condos with "Price Reductions" signal
  - Avg DOM jumped from 15 to 45 days
  - 8 condos "Above Market" (sitting unsold)
- **Action**: Price at $725k to undercut competition and move fast

### For Agents

**Client Matching**:

1. Create one alert per buyer client
2. Set their exact criteria (town, type, price, beds)
3. Add signal filters relevant to them:
   - Budget-conscious? → "Underpriced" + "Price Reductions"
   - Investors? → "Long on Market" + "Below Market"
   - Move-up buyers? → "New Listings" + "Moving Fast"
4. Get daily digest of matches
5. Forward relevant properties to clients

**Market Monitoring**:

1. Create alerts for your farm areas
2. Set broad criteria (all types, all signals)
3. Track:
   - Inventory levels (active count trends)
   - DOM changes (market velocity shifts)
   - Price cut frequency (seller sentiment)
4. Use insights for listing presentations

**Example Setup**:
**Alert 1**: "Watertown Buyer - First-Time"

- Town: Watertown
- Type: Condo
- Signals: Underpriced, Price Reductions
- Price: $400k-$600k
- Beds: 2+

**Alert 2**: "Brookline Investor"

- Town: Brookline
- Type: Multi-Family
- Signals: Long on Market, Below Market
- Price: $1M-$2M
- Result: Daily emails with distressed opportunities

## Common Workflows

### Workflow 1: Finding Your First Home

**Goal**: Buy 2-bed condo in Arlington under $600k

**Steps**:

1. Visit http://localhost:3000
2. Click "Arlington"
3. Select "Condo" property type
4. Look for signals:
   - Price Reductions (8 properties)
   - Below Market (3 properties)
5. Click "View Details" on each
6. Create alert:
   - Town: Arlington
   - Type: Condo
   - Signal: Underpriced
   - Price: $0 - $600k
   - Beds: 2
   - Email: your@email.com
7. Check email daily for matches

### Workflow 2: Timing Your Sale

**Goal**: Decide when to list your Newton SF home

**Steps**:

1. Visit http://localhost:3000/town/Newton
2. Select "Single Family"
3. Check dashboard stats:
   - Active listings: 50 (high competition)
   - Avg DOM: 35 days (was 18 last quarter)
   - Price Reductions: 12 (softening market)
4. Conclusion: Wait 2 months or price aggressively
5. Create alert to monitor:
   - Town: Newton
   - Type: SF
   - Signal: Moving Fast
   - Result: Get notified when market heats up

### Workflow 3: Managing 10 Buyer Clients

**Goal**: Efficient property sourcing for multiple clients

**Steps**:

1. Go to http://localhost:3000/alerts
2. Create 10 alerts (one per client):
   - Client A: Somerville CC $500k-$700k 2bd
   - Client B: Cambridge SF $1M-$1.5M 3bd
   - Client C: Allston CC $400k-$500k 1bd
   - (etc.)
3. Set signal filters based on client needs:
   - Budget buyers → Underpriced, Price Reductions
   - Urgent buyers → New Listings, Moving Fast
   - Investors → Long on Market, Below Market
4. Receive daily digest with all matches
5. Forward relevant listings to each client
6. Track which signals convert to showings

### Workflow 4: Market Research for Listing Presentation

**Goal**: Show seller data-driven pricing strategy

**Steps**:

1. Visit seller's town dashboard
2. Screenshot key stats:
   - Active listings count
   - Avg/median prices
   - DOM trends
   - Signal distribution
3. Show "Above Market" properties:
   - "These 8 homes are overpriced and sitting"
4. Show "Price Reductions" count:
   - "12 sellers already cut prices this month"
5. Recommend pricing:
   - Below "Above Market" comps
   - Match "Moving Fast" pricing
6. Create alert to track:
   - Competitor price changes
   - New listings (competition)

## Interpreting Signals

### Signal: Underpriced (🎯)

**What it means**: List price is <90% of median for town/type/price-band  
**For buyers**: Strong deal indicator, act quickly  
**For sellers**: These are your price-cutting competitors  
**Caution**: Could indicate property issues (inspect carefully)

**Example**:

- Cambridge Condo $500k-$1M segment median: $750k
- This listing: $650k (13% below median)
- **Signal Score**: 87/100 (high priority)

### Signal: Price Reduction (💰)

**What it means**: Seller lowered price since last snapshot  
**For buyers**: Motivated seller, room for more negotiation  
**For sellers**: Competitor weakness, pricing pressure  
**Caution**: Check how many times reduced (desperation indicator)

**Example**:

- Previous price: $899k
- Current price: $849k
- **Reduction**: $50k (5.6%)
- **Signal Score**: 72/100

### Signal: Long on Market (⏰)

**What it means**: DOM > 2x median for segment  
**For buyers**: Seller desperate, make lowball offer  
**For sellers**: Avoid this fate by pricing right initially  
**Caution**: Long DOM may indicate overpricing or property defects

**Example**:

- Segment median DOM: 22 days
- This listing: 68 days (3x median)
- **Signal Score**: 91/100 (very stale)

### Signal: Moving Fast (⚡)

**What it means**: DOM < 50% of median (hot property)  
**For buyers**: Act immediately, likely multiple offers  
**For sellers**: This is your pricing target (competitive but realistic)  
**Caution**: May sell before you see it

**Example**:

- Segment median DOM: 30 days
- This listing: 8 days (73% faster)
- **Signal Score**: 88/100 (very hot)

### Signal: New Listing (✨)

**What it means**: First appeared within 7 days  
**For buyers**: Fresh inventory, be first to schedule showing  
**For sellers**: Your competition, watch pricing  
**Caution**: Not a quality indicator, just recency

**Example**:

- List date: 2 days ago
- **Signal Score**: 95/100 (very fresh)

### Signal: Back on Market (🔄)

**What it means**: Status changed from off-market to active  
**For buyers**: Deal fell through, seller re-motivated  
**For sellers**: Shows buyer strength/weakness in market  
**Caution**: Find out why deal failed (inspection? financing?)

**Example**:

- Was: Under Agreement
- Now: Active
- **Signal Score**: 79/100

### Signal: Price Increase (📈)

**What it means**: Seller raised price  
**For buyers**: Avoid or watch for eventual cut  
**For sellers**: Rare, indicates strong demand or seller testing  
**Caution**: Usually means overpricing or unrealistic seller

**Example**:

- Previous price: $799k
- Current price: $849k
- **Increase**: $50k (6.3%)
- **Signal Score**: 65/100

### Signal: Above Market (🏷️)

**What it means**: List price > 110% of segment median  
**For buyers**: Overpriced, wait for cut or skip  
**For sellers**: Don't do this (leads to price reductions)  
**Caution**: May have unique features justifying premium

**Example**:

- Segment median: $600k
- This listing: $699k (16.5% over)
- **Signal Score**: 78/100 (very overpriced)

## Troubleshooting

### Problem: Dropdown shows numeric codes

**Cause**: Old data cached or ingest didn't use new town mapping  
**Solution**:

```bash
cd /Users/sanjeevjha/signals
pnpm ingest  # Re-ingest with correct mappings
./START_DEV.sh  # Restart dev server
```

### Problem: Creating alert fails

**Cause**: Missing email/phone columns in database  
**Solution**:

```bash
pnpm --filter db migrate  # Run migrations
```

### Problem: No signals showing

**Cause**: Signal computation not run  
**Solution**:

```bash
pnpm compute-signals  # Run computation
```

### Problem: Dashboard shows "0 Active Listings"

**Cause**: Strict status filtering  
**Solution**: Already fixed - restart dev server

### Problem: Alerts not sending

**Cause**: Email script not running  
**Solution**:

```bash
pnpm send-alerts  # Manual send
# Or set up cron: 0 9 * * * cd /path && pnpm send-alerts
```

### Problem: Slow page loads

**Cause**: Large result sets  
**Solution**: Add pagination (Phase 2 roadmap)

## Tips & Best Practices

### For Buyers

1. **Create multiple alerts** for different scenarios (dream home + fallback options)
2. **Monitor DOM trends** to gauge market urgency
3. **Focus on 2+ signals** (e.g., Underpriced + Price Reduction = very motivated seller)
4. **Act fast on Low DOM** signals (these won't last)
5. **Research Long DOM** properties carefully (there's usually a reason)

### For Sellers

1. **Check dashboard before listing** to see competition
2. **Price below "Above Market"** comps to avoid sitting
3. **Watch for price cut waves** (market softening indicator)
4. **Time listings when "Moving Fast"** signal counts are high
5. **Create alert for your street** to track neighbor sales

### For Agents

1. **One alert per client** for clean organization
2. **Use signal filters** to pre-qualify matches
3. **Forward daily digest** selectively (quality > quantity)
4. **Track conversion rates** by signal type
5. **Screenshot dashboards** for listing presentations

## FAQs

**Q: How often does data update?**  
A: Daily. Ingest at 6am, signals at 6:30am, emails at 9am (configurable).

**Q: Why do some towns have no signals?**  
A: Not enough listings or no signals detected (all priced fairly, normal DOM).

**Q: Can I get real-time alerts?**  
A: Not yet (Phase 2 roadmap). Currently daily digests only.

**Q: What if I don't receive emails?**  
A: Check spam folder. Verify email address in alert. Run `pnpm send-alerts` manually.

**Q: How do I delete an alert?**  
A: Go to Alerts page, click "Delete" button on unwanted alert.

**Q: Can I edit an existing alert?**  
A: Not yet. Delete and recreate for now (edit feature in Phase 2).

**Q: Why do some listings have no signal?**  
A: Not every listing qualifies. Only ~5% have strong signals.

**Q: How is "underpriced" calculated?**  
A: List price < 90% of median for town + property_type + price_band segment.

**Q: What's a "price band"?**  
A: Grouping: $0-500k, $500k-$1M, $1M-$2M, $2M+. Ensures apples-to-apples comparison.

**Q: Can I export results to Excel?**  
A: Not yet (Phase 2 roadmap).

---

**Need More Help?**

- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical details
- [FEATURES.md](FEATURES.md) - Full feature list
- [VALUE_PROPOSITION.md](VALUE_PROPOSITION.md) - Use cases
- [QUICK_START.md](QUICK_START.md) - Setup instructions

**Last Updated**: January 6, 2026  
**Version**: 1.0.0
