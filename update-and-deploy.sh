#!/bin/bash

# Discord Habit System - Update and Deploy Script
# This script pulls latest changes from Git and deploys them

set -e  # Exit on any error

echo "🔄 Discord Habit System - Update and Deploy Script"
echo "=================================================="

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

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    print_error "Not in a git repository! Please initialize git first."
    exit 1
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
print_status "Current branch: $CURRENT_BRANCH"

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    print_warning "You have uncommitted changes!"
    print_status "Please commit your changes before updating:"
    echo "  git add ."
    echo "  git commit -m 'Your commit message'"
    echo "  git push"
    exit 1
fi

# Pull latest changes
print_status "Pulling latest changes from remote..."
git pull origin $CURRENT_BRANCH

if [ $? -eq 0 ]; then
    print_success "Latest changes pulled successfully"
else
    print_error "Failed to pull changes"
    exit 1
fi

# Install/update dependencies
print_status "Installing dependencies..."
npm install

# Build the application
print_status "Building application..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Application built successfully"
else
    print_error "Failed to build application"
    exit 1
fi

# Run tests (optional)
print_status "Running tests..."
if npm test; then
    print_success "All tests passed"
else
    print_warning "Some tests failed, but continuing with deployment"
fi

# Deploy using the deploy script
print_status "Deploying updated application..."
./deploy.sh

print_success "🎉 Update and deployment completed successfully!"
print_status "Your Discord Habit System is now running with the latest changes!"
