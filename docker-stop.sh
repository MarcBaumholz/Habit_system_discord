#!/bin/bash

# Multi-Agent Discord Bot Docker Stop Script

echo "🛑 Stopping Multi-Agent Discord Bot..."

# Stop Docker container
echo "📦 Stopping Docker container..."
docker-compose down

echo "✅ Multi-Agent Discord Bot stopped!"
echo ""
echo "📋 To start again, run: ./docker-start.sh"