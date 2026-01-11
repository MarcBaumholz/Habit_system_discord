#!/bin/bash

# Discord Habit System - Deployment Script
# This script builds and deploys the latest version of the bot
# Uses docker compose to ensure all configuration from docker-compose.yml is applied

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

# Check if docker compose is available (v2 plugin version)
if ! docker compose version > /dev/null 2>&1; then
    print_error "docker compose (v2) is not available! Please install Docker Compose v2."
    print_status "Alternatively, install docker-compose: sudo apt-get install docker-compose"
    exit 1
fi

print_status "Docker Compose is available ✓"

# Stop and remove existing container using docker compose
print_status "Stopping and removing existing container (if running)..."
# First try docker compose down (for containers managed by docker-compose)
if docker compose down 2>/dev/null; then
    print_status "Container stopped via docker compose"
else
    print_status "No container managed by docker-compose found"
fi

# Force remove container by name if it still exists (handles containers created outside docker-compose)
if docker ps -a --format '{{.Names}}' | grep -q "^habit-discord-bot$"; then
    print_status "Found existing container 'habit-discord-bot', force removing it..."
    docker rm -f habit-discord-bot 2>/dev/null && print_status "Container removed successfully" || print_warning "Could not remove container (may not exist)"
else
    print_status "No existing container found"
fi

# Build new image using docker compose (this ensures all docker-compose.yml settings are applied)
print_status "Building new Docker image..."
docker compose build --no-cache

if [ $? -eq 0 ]; then
    print_success "Docker image built successfully"
else
    print_error "Failed to build Docker image"
    exit 1
fi

# Start container using docker compose (this applies all configuration from docker-compose.yml)
print_status "Starting container with docker compose..."
print_status "This will apply all configuration: resource limits, volumes, health checks, networks, etc."
docker compose up -d

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
if docker compose ps | grep -q "Up"; then
    print_success "Container is running"

    # Show container logs
    print_status "Container logs (last 20 lines):"
    echo "----------------------------------------"
    docker compose logs --tail 20 habit-discord-bot
    echo "----------------------------------------"

    print_status "Useful commands:"
    print_status "  • View live logs: docker compose logs -f habit-discord-bot"
    print_status "  • Stop container: docker compose stop"
    print_status "  • Restart container: docker compose restart"
    print_status "  • View status: docker compose ps"

else
    print_error "Container failed to start"
    print_status "Checking logs for errors:"
    docker compose logs habit-discord-bot
    exit 1
fi

print_success "🎉 Deployment completed successfully!"
print_status "Your Discord Habit System is now running with the latest changes!"
