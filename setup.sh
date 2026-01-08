#!/bin/bash

# Quick setup script for Market Signals platform

echo "🚀 Setting up Market Signals platform..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
  echo "⚠️  .env file not found. Creating from .env.example..."
  cp .env.example .env
  echo "✅ Created .env file"
  echo "⚠️  Please edit .env with your actual credentials before proceeding!"
  echo ""
  read -p "Press enter when you've updated .env with your credentials..."
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
  echo "❌ pnpm is not installed"
  echo "   Install it with: npm install -g pnpm"
  exit 1
fi

echo "📦 Installing dependencies..."
pnpm install

if [ $? -ne 0 ]; then
  echo "❌ Failed to install dependencies"
  exit 1
fi

echo ""
echo "🗄️  Running database migrations..."
pnpm db:migrate

if [ $? -ne 0 ]; then
  echo "❌ Failed to run migrations"
  echo "   Check your DATABASE_URL in .env"
  exit 1
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run 'pnpm ingest' to fetch MLS data"
echo "  2. Run 'pnpm compute-signals' to compute market signals"
echo "  3. Run 'pnpm dev' to start the web app"
echo ""
echo "See README.md for more details."
