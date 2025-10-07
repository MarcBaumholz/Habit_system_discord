#!/bin/bash

# Enhanced Habit Matching Deployment Script
# This script rebuilds and deploys the Discord bot with AI-powered semantic matching

set -e  # Exit on any error

echo "🚀 Deploying Enhanced Habit Matching System"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Not in the correct directory. Please run from the habit_System/Habit_system_discord directory."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error ".env file not found. Please create one with your Discord bot token and other configuration."
    exit 1
fi

print_status "Starting deployment process..."

# Step 1: Stop existing container
print_status "Stopping existing container..."
docker-compose down 2>/dev/null || print_warning "No existing container to stop"

# Step 2: Clean up old images
print_status "Cleaning up old Docker images..."
docker image prune -f 2>/dev/null || print_warning "No images to clean"

# Step 3: Build new image with latest changes
print_status "Building new Docker image with enhanced matching..."
docker-compose build --no-cache

if [ $? -ne 0 ]; then
    print_error "Docker build failed!"
    exit 1
fi

print_success "Docker image built successfully!"

# Step 4: Start the container
print_status "Starting container with enhanced habit matching..."
docker-compose up -d

if [ $? -ne 0 ]; then
    print_error "Failed to start container!"
    exit 1
fi

# Step 5: Wait for container to be ready
print_status "Waiting for container to be ready..."
sleep 10

# Step 6: Check container status
print_status "Checking container status..."
if docker-compose ps | grep -q "Up"; then
    print_success "Container is running!"
else
    print_error "Container failed to start properly!"
    docker-compose logs
    exit 1
fi

# Step 7: Show logs
print_status "Showing recent logs..."
docker-compose logs --tail=20

echo ""
echo "🎉 Enhanced Habit Matching System Deployed Successfully!"
echo "========================================================"
echo ""
echo "✅ AI-Powered Semantic Matching"
echo "✅ Comprehensive Synonym Recognition"
echo "✅ Enhanced Keyword Databases"
echo "✅ Multi-dimensional Scoring System"
echo "✅ Safe Fallback Mechanisms"
echo ""
echo "📊 Key Improvements:"
echo "• 🤖 AI analyzes every word for semantic meaning"
echo "• 📚 Recognizes synonyms and related activities"
echo "• 🎯 Context-aware habit matching"
echo "• 🔍 Enhanced music/instrument recognition"
echo "• 🛡️ No more incorrect habit assignments"
echo ""
echo "🔧 Management Commands:"
echo "• View logs: docker-compose logs -f"
echo "• Stop system: docker-compose down"
echo "• Restart: docker-compose restart"
echo "• Check status: docker-compose ps"
echo ""
print_success "Deployment complete! The enhanced habit matching system is now running."
