#!/bin/bash

# Start the CrewAI Agents API server

echo "🚀 Starting CrewAI Agents API..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run setup.sh first."
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please copy .env.example to .env and configure it."
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Start the API server
python api.py
