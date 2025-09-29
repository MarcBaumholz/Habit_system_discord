#!/bin/bash

# Discord Habit System - Docker Stop Script
# This script stops and cleans up the Docker container

echo "🛑 Stopping Discord Habit System..."

# Check if container is running
if docker-compose ps | grep -q "Up"; then
    echo "📦 Stopping container..."
    docker-compose down
    
    echo "🧹 Cleaning up..."
    docker-compose down --volumes --remove-orphans
    
    echo "✅ Discord Habit System stopped successfully!"
else
    echo "⚠️  No running containers found."
fi

echo ""
echo "📋 Container Status:"
docker-compose ps

echo ""
echo "🔧 To start again, run: ./docker-start.sh"
