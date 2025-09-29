#!/bin/bash

# Discord Habit System - Installation Script
# This script sets up the Discord Habit System from a fresh clone

echo "🚀 Discord Habit System - Installation Script"
echo "=============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node -v)"
    echo "   Please upgrade Node.js: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo ""
    echo "📝 Creating .env file from template..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ .env file created from .env.example"
        echo "⚠️  Please edit .env file with your actual values"
    else
        echo "⚠️  No .env.example found. Please create .env file manually"
    fi
else
    echo "✅ .env file already exists"
fi

# Build the project
echo ""
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Project built successfully"

# Run tests
echo ""
echo "🧪 Running tests..."
npm test

if [ $? -ne 0 ]; then
    echo "⚠️  Some tests failed. Please check your setup."
    echo "   Make sure to set up your .env file with correct values"
else
    echo "✅ All tests passed!"
fi

echo ""
echo "🎉 Installation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your Discord, Notion, and Perplexity credentials"
echo "2. Set up Notion databases with required properties (see SETUP.md)"
echo "3. Configure Discord bot permissions"
echo "4. Run 'npm start' to start the bot"
echo ""
echo "📖 For detailed setup instructions, see SETUP.md"
echo "📖 For requirements, see requirements.txt"
echo ""
echo "🚀 Happy habit building!"
