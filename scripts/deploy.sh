#!/bin/bash
# RockyFit deploy script — run after any code changes
# Usage: bash scripts/deploy.sh

set -e

echo "🔨 Building RockyFit..."
cd "$(dirname "$0")/.."
npm run build

echo "🚀 Deploying to Vercel..."
npx vercel --prod --yes

echo "✅ Deploy complete → https://rockyfit.vercel.app"
