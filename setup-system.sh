#!/bin/bash

# Discord Habit System - Complete Setup Script
# This script installs all required dependencies and sets up the system

echo "🚀 Starting Discord Habit System Setup..."

# Check if running on Raspberry Pi
if [[ $(uname -m) == "aarch64" || $(uname -m) == "armv7l" ]]; then
    echo "📱 Detected Raspberry Pi - using ARM-compatible Node.js"
    NODE_VERSION="18.19.0"
else
    echo "💻 Detected standard system"
    NODE_VERSION="18.19.0"
fi

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js ${NODE_VERSION}..."
    
    # Download and install Node.js
    cd /tmp
    wget https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-arm64.tar.xz
    tar -xf node-v${NODE_VERSION}-linux-arm64.tar.xz
    sudo cp -r node-v${NODE_VERSION}-linux-arm64/* /usr/local/
    
    # Add to PATH
    echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.bashrc
    source ~/.bashrc
    
    echo "✅ Node.js installed successfully"
else
    echo "✅ Node.js already installed: $(node --version)"
fi

# Navigate to project directory
cd /home/pi/Documents/habit_System/Habit_system_discord

# Install project dependencies
echo "📦 Installing project dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your actual tokens and IDs"
else
    echo "✅ .env file already exists"
fi

# Make scripts executable
chmod +x *.js
chmod +x tests/*.js

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Edit .env file with your Discord bot token and Notion token"
echo "2. Set up your Discord server with the required channels"
echo "3. Run: npm run dev"
echo ""
echo "📖 See STARTUP_GUIDE.md for detailed instructions"
echo ""
echo "🔧 Test the system:"
echo "   node test-learning-simple.js"
echo "   node test-bot-functionality.js"
