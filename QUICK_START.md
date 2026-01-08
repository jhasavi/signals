# What's Fixed & How to Use Market Signals

## ✅ Issues Resolved

### 1. Alerts Dropdown - FIXED

- **Problem**: Showing numeric codes (05L, 06X, 1, 101, etc.)
- **Root Cause**: Town codes in MLS feed weren't being filtered
- **Fix**: Now uses same regex filter as home page: `town !~ '^[0-9]+[A-Z]?$'`
- **Result**: Dropdown shows only proper town names (Abington, Acton, Arlington, etc.)

### 2. Contact Information - ADDED

- **Problem**: No way to receive alerts
- **Fix**: Added required email field + optional phone + email notification toggle
- **Result**: Alerts now capture contact info; email delivery ready to be enabled

### 3. Email Notifications - READY

- **Added**: Complete email notification system using Resend
- **How to Use**: Run `pnpm send-alerts` to send digest emails to all users with alerts
- **What It Sends**: Formatted HTML emails with matched properties, signal scores, and direct links
- **Schedule**: Add to cron for daily digests (e.g., `0 9 * * * cd /path/to/signals && pnpm send-alerts`)

### 4. Better Messaging - IMPROVED

- **Alerts Page**: Added clear explanation of how alerts work and what makes them different
- **Dashboard**: Enhanced signal cards with descriptions, icons, and CTAs
- **Value Prop**: Created comprehensive VALUE_PROPOSITION.md explaining use cases

---

## 🎯 How to Use This Platform

### For Buyers

1. **Browse Market Overview** (home page): See which towns have listings and average prices
2. **Click a Town**: View detailed stats and active signals (price drops, underpriced, etc.)
3. **Create an Alert**: Set criteria (town, type, signal, price range) + your email
4. **Get Notified**: Receive daily emails when new properties match your criteria

### For Sellers/Agents

1. **Monitor Market Dashboard**: Check your town's signal counts (are prices dropping? inventory building?)
2. **Track Trends**: Watch DOM, price changes, and signal patterns over time
3. **Set Alerts**: Get notified when market shifts (e.g., "alert me when 5+ price cuts happen in Brookline SF")
4. **Time Your Listing**: Use signals to decide when market is hot vs soft

---

## 🚀 Quick Start

### Daily Workflow

```bash
# 1. Refresh data (run daily, ideally 6am)
pnpm ingest

# 2. Compute signals (after ingest completes)
pnpm compute-signals

# 3. Send alert emails (after signals computed)
pnpm send-alerts

# 4. Users check dashboard or receive emails
```

### Automation (Cron)

```cron
# /etc/crontab or user crontab
0 6 * * * cd /Users/sanjeevjha/signals && pnpm ingest >> /tmp/signals-ingest.log 2>&1
30 6 * * * cd /Users/sanjeevjha/signals && pnpm compute-signals >> /tmp/signals-compute.log 2>&1
0 9 * * * cd /Users/sanjeevjha/signals && pnpm send-alerts >> /tmp/signals-alerts.log 2>&1
```

---

## 📧 Email Setup

### Update Sender Address

Edit [packages/notifications/src/send-alerts.ts](packages/notifications/src/send-alerts.ts):

```typescript
from: 'Market Signals <alerts@yourdomain.com>',  // Change this
```

### Update Links

Replace `https://yourdomain.com` with your actual domain in:

- Email templates in send-alerts.ts
- Any alert links

### Test Email Sending

```bash
# Make sure RESEND_API_KEY is in .env
export $(cat .env | xargs)

# Send test (will send to any users with alerts)
pnpm send-alerts
```

---

## 🎨 What Makes This Different

### vs. Basic MLS Alert

| MLS Alert                               | Market Signals                                                                                 |
| --------------------------------------- | ---------------------------------------------------------------------------------------------- |
| "Email me all 3-bed condos under $500K" | "Email me 3-bed condos that are **underpriced**, **had price drops**, or **sitting too long**" |
| Shows everything (noisy)                | Shows opportunities (high signal)                                                              |
| No context                              | Explains why each property matters                                                             |

### vs. Zillow/Redfin

| Zillow                 | Market Signals                                 |
| ---------------------- | ---------------------------------------------- |
| Search listings        | Search opportunities                           |
| Sort by price/date     | Sort by signal strength                        |
| No market intelligence | Shows price cuts, DOM trends, relative pricing |

---

## 🔧 Customization

### Add More Signals

Edit [packages/compute-signals/src/index.ts](packages/compute-signals/src/index.ts) to add new signal types:

- Seasonal patterns
- School district premium/discount
- Sqft price anomalies
- Tax assessment vs list price

### Adjust Signal Thresholds

Current thresholds:

- **Underpriced**: 10% below median in price band
- **Overpriced**: 10% above median
- **High DOM**: 2x the median DOM
- **Stale**: 90+ days on market

Change these in compute-signals logic to tune sensitivity.

### Email Template

Customize HTML template in [packages/notifications/src/send-alerts.ts](packages/notifications/src/send-alerts.ts):

- Add your branding
- Change colors/styling
- Include more listing details
- Add unsubscribe link

---

## 💡 Next Steps to Improve

1. **User Accounts**: Replace anonymous user_id with real authentication
2. **SMS Alerts**: Wire up Twilio using the contact_phone field
3. **Alert Management**: Add edit/pause functionality (not just delete)
4. **Frequency Control**: Let users choose daily/weekly/instant notifications
5. **More Signals**: Add price per sqft anomalies, school district premiums, etc.
6. **Better Matching**: Show "why this matches" explanation in emails
7. **Unsubscribe**: Add one-click unsubscribe link to emails
8. **Analytics**: Track which signals convert to leads/sales

---

## 📊 Current Status

- ✅ **Data Pipeline**: Working (7,591 listings ingested)
- ✅ **Signal Computation**: Working (337 signals computed)
- ✅ **Web Dashboard**: Working (proper town names, stats, signal cards)
- ✅ **Alerts Page**: Fixed (clean town dropdown, contact capture)
- ✅ **Email System**: Ready (awaiting first send test)
- ⏸️ **SMS**: Not wired (phone field captured but no sending)
- ⏸️ **Auth**: Anonymous user_id (works but not ideal for production)

---

## ❓ FAQ

**Q: Why aren't alerts sending automatically?**
A: You need to run `pnpm send-alerts` manually or set up a cron job. It's not running automatically yet.

**Q: What if I create an alert but don't get any matches?**
A: Either (1) no properties match your criteria, (2) signals haven't been computed recently, or (3) you need to widen your search (higher price, fewer restrictions).

**Q: How often should I run ingest/compute/send?**
A: Daily is ideal. Ingest at 6am, compute at 6:30am, send at 9am. More frequent = fresher data but more processing.

**Q: Can I send test emails without real users?**
A: Yes, create an alert with your own email, then run `pnpm send-alerts`. If there are matching properties with recent signals, you'll get an email.

**Q: What's the difference between saved alerts and just checking the dashboard?**
A: Alerts are proactive (they come to you), dashboard is reactive (you check it). Both use the same signal data.

---

**See [VALUE_PROPOSITION.md](VALUE_PROPOSITION.md) for detailed use cases and examples.**
