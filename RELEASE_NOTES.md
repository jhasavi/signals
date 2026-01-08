# Release v1.0.0 — Market Signals

Date: 2026-01-08

Overview

This release delivers the initial public-ready version of Market Signals. Highlights:

- Advanced filtering UI + server-side filters (property type, price buckets, inventory classification, beds/baths, DOM, status, sorting)
- Alerts system: create saved searches and match counts; server API endpoints
- Production-safe email integration (Resend) with feature flag when `RESEND_API_KEY` is set
- Comprehensive documentation: `FILTER_GUIDE.md`, `DEPLOYMENT_CHECKLIST.md`, `README.md`
- CI: lint, tests, and build in GitHub Actions

Important files

- `apps/web` — Next.js web app (App Router)
- `packages/compute-signals` — signal computation package
- `packages/db` — migrations and DB client
- `packages/ingest` — data ingest pipeline

Environment variables (set before deploying)

- `DATABASE_URL` (required)
- `MLS_SF_FEED_URL`, `MLS_CC_FEED_URL`, `MLS_MF_FEED_URL` (required)
- `NEXT_PUBLIC_APP_URL` (recommended: https://signals.namastebostonhomes.com)
- `RESEND_API_KEY` (optional — enable email sending)

Post-release steps

1. Add Vercel environment variables in Project Settings.
2. Add DNS CNAME for `signals.namastebostonhomes.com` to Vercel.
3. Verify auth cookie domain if sharing login across subdomains.
4. Run smoke tests: visit homepage, create sample alert, run `pnpm send-alerts`.

Notes

- Build and tests validated locally before tagging.
- See `DEPLOYMENT_CHECKLIST.md` for detailed ops steps.

Changelog

- Initial public release: filters, alerts, docs, CI, release automation
