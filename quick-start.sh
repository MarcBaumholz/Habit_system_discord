#!/bin/bash

# Discord Habit System - Quick Start Script
# This script provides the fastest way to get the system running

echo "🚀 Discord Habit System - Quick Start"
echo "====================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp env.example .env
    echo ""
    echo "⚠️  IMPORTANT: You need to edit .env file with your tokens!"
    echo ""
    echo "Required values in .env:"
    echo "- DISCORD_BOT_TOKEN=your_bot_token_here"
    echo "- DISCORD_GUILD_ID=your_server_id_here" 
    echo "- NOTION_TOKEN=your_notion_token_here"
    echo ""
    echo "Press Enter when you've updated .env file..."
    read
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    
    # Install Node.js via package manager
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    echo "✅ Node.js installed"
else
    echo "✅ Node.js already installed: $(node --version)"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Test the system
echo ""
echo "🧪 Testing system components..."

# Test if we can run a simple script
if [ -f "test-learning-simple.js" ]; then
    echo "✅ Test files found"
else
    echo "❌ Test files missing"
fi

echo ""
echo "🎉 Quick setup complete!"
echo ""
echo "📋 To start the bot:"
echo "   npm run dev"
echo ""
echo "📋 To test the system:"
echo "   node test-learning-simple.js"
echo ""
echo "📖 See STARTUP_GUIDE.md for detailed instructions"
