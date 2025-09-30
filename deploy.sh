#!/bin/bash

# Discord Habit System - Deployment Script
# This script builds and deploys the latest version of the bot

set -e  # Exit on any error

echo "🚀 Discord Habit System - Deployment Script"
echo "=============================================="

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

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error ".env file not found! Please create it with your environment variables."
    exit 1
fi

print_status "Environment file found ✓"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running! Please start Docker first."
    exit 1
fi

print_status "Docker is running ✓"

# Stop existing container if running
print_status "Stopping existing container..."
if docker ps -q -f name=discord-habit-system | grep -q .; then
    docker stop discord-habit-system
    docker rm discord-habit-system
    print_success "Existing container stopped and removed"
else
    print_status "No existing container found"
fi

# Build new image
print_status "Building new Docker image..."
docker build -t discord-habit-system:latest .

if [ $? -eq 0 ]; then
    print_success "Docker image built successfully"
else
    print_error "Failed to build Docker image"
    exit 1
fi

# Start new container
print_status "Starting new container..."
docker-compose up -d

if [ $? -eq 0 ]; then
    print_success "Container started successfully"
else
    print_error "Failed to start container"
    exit 1
fi

# Wait a moment for container to start
sleep 5

# Check container status
print_status "Checking container status..."
if docker ps -q -f name=discord-habit-system | grep -q .; then
    print_success "Container is running"
    
    # Show container logs
    print_status "Container logs (last 20 lines):"
    echo "----------------------------------------"
    docker logs --tail 20 discord-habit-system
    echo "----------------------------------------"
    
    print_status "To view live logs: docker logs -f discord-habit-system"
    print_status "To stop container: docker-compose down"
    print_status "To restart: docker-compose restart"
    
else
    print_error "Container failed to start"
    print_status "Checking logs for errors:"
    docker logs discord-habit-system
    exit 1
fi

print_success "🎉 Deployment completed successfully!"
print_status "Your Discord Habit System is now running with the latest changes!"
