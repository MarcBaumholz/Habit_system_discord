#!/bin/bash

# Setup script for Python CrewAI Agents

echo "========================================"
echo "Setting up Python CrewAI Agents"
echo "========================================"

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

echo "✓ Python 3 found: $(python3 --version)"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✓ Virtual environment created"
else
    echo "✓ Virtual environment already exists"
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "📥 Installing Python dependencies..."
pip install -r requirements.txt

echo ""
echo "========================================"
echo "✅ Setup complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Copy .env.example to .env:"
echo "   cp .env.example .env"
echo ""
echo "2. Edit .env and add your API keys:"
echo "   - NOTION_TOKEN"
echo "   - NOTION_DATABASE_* (Users, Habits, Proofs)"
echo "   - PERPLEXITY_API_KEY"
echo ""
echo "3. Activate the virtual environment:"
echo "   source venv/bin/activate"
echo ""
echo "4. Start the API server:"
echo "   python api.py"
echo ""
echo "5. Test the agent:"
echo "   python midweek_agent.py"
echo ""
echo "========================================"
