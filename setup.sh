#!/bin/bash

# Yu-Gi-Oh! Deck Builder - Setup Script
# This script will set up the entire application

set -e  # Exit on error

echo "🎴 Yu-Gi-Oh! Deck Builder - Setup Script"
echo "========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Step 1: Install dependencies
echo "📦 Step 1: Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Step 2: Start MySQL
echo "🐳 Step 2: Starting MySQL database..."
npm run docker:up
echo "Waiting for MySQL to start (15 seconds)..."
sleep 15
echo "✅ MySQL started"
echo ""

# Step 3: Generate Prisma Client
echo "⚙️ Step 3: Generating Prisma Client..."
npm run db:generate
echo "✅ Prisma Client generated"
echo ""

# Step 4: Push database schema
echo "🗃️ Step 4: Pushing database schema..."
npm run db:push
echo "✅ Database schema pushed"
echo ""

# Step 5: Sync cards (this takes a while)
echo "🎴 Step 5: Syncing cards from YGOProDeck API..."
echo "⏱️ This may take 5-10 minutes depending on your connection..."
npm run sync:cards
echo "✅ Cards synced successfully"
echo ""

echo "========================================="
echo "🎉 Setup Complete!"
echo "========================================="
echo ""
echo "Your Yu-Gi-Oh! Deck Builder is ready to use!"
echo ""
echo "📝 Next Steps:"
echo "  1. Start the development server: npm run dev"
echo "  2. Open your browser: http://localhost:5173"
echo "  3. Start building your ultimate deck!"
echo ""
echo "📚 Useful Commands:"
echo "  npm run dev          - Start development server"
echo "  npm run db:studio    - Open Prisma Studio (database GUI)"
echo "  npm run docker:down  - Stop MySQL database"
echo ""
echo "Enjoy! 🎴✨"
