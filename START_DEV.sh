#!/bin/bash
cd /Users/sanjeevjha/signals

# Kill any existing dev servers
echo "🔍 Checking for existing dev servers..."
pkill -f "next dev" || true
pkill -f "pnpm dev" || true
sleep 2

# Export environment variables
export $(cat .env | xargs)

# Start dev server on port 3000
echo "🚀 Starting dev server on port 3000..."
PORT=3000 pnpm dev
