# Quick Start Guide

## First Time Setup

### 1. Run Setup Script

```bash
./setup.sh
```

This will:

- Create `.env` from template
- Install dependencies with pnpm
- Run database migrations

### 2. Configure Environment

Edit `.env` with your credentials:

```env
# Your PostgreSQL connection string
DATABASE_URL=postgresql://user:password@host:5432/database

# Your MLS feed URLs (keep these secret!)
MLS_SF_FEED_URL=https://api.mlspin.com/sf-feed?token=YOUR_TOKEN
MLS_CC_FEED_URL=https://api.mlspin.com/cc-feed?token=YOUR_TOKEN
MLS_MF_FEED_URL=https://api.mlspin.com/mf-feed?token=YOUR_TOKEN
```

### 3. Populate Data

```bash
# Fetch MLS listings (takes 1-2 minutes)
pnpm ingest

# Compute signals (takes 30-60 seconds)
pnpm compute-signals
```

### 4. Start Web App

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Daily Operations

Run these commands daily (or set up cron):

```bash
# Morning: Update listings
pnpm ingest

# After ingest: Recompute signals
pnpm compute-signals
```

---

## Troubleshooting

### "No data available"

Run `pnpm ingest` first

### "No signals computed"

Run `pnpm compute-signals` after ingesting data

### Database errors

Check `DATABASE_URL` in `.env` - must be valid PostgreSQL connection string

### MLS feed errors

- Verify feed URLs are correct
- Check that tokens haven't expired
- Ensure your IP is whitelisted (if required by MLS)

---

## File Locations

- **Config**: `.env` (create from `.env.example`)
- **Logs**: Check terminal output when running commands
- **Database**: Connect with any PostgreSQL client using `DATABASE_URL`

---

## Key Pages

- **Home**: [http://localhost:3000](http://localhost:3000) - Town list
- **Town Dashboard**: `/town/[TownName]` - Stats and signals
- **Signals**: `/town/[TownName]/signals?type=SF&signal=likely_cut` - Listing grid
- **Alerts**: [http://localhost:3000/alerts](http://localhost:3000/alerts) - Saved searches

---

## Getting Help

- See [README.md](README.md) for comprehensive documentation
- See [IMPLEMENTATION.md](IMPLEMENTATION.md) for technical details
- Check `.env.example` for required environment variables
