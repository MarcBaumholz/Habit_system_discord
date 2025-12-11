#!/bin/bash

echo "======================================"
echo "🧪 Testing CrewAI API Service"
echo "======================================"

# Check if API is running
echo ""
echo "1️⃣ Checking if API is running..."
if curl -s http://localhost:8000 > /dev/null 2>&1; then
    echo "✅ API is running"
else
    echo "❌ API is not running"
    echo "   Start it with: ./start-api.sh"
    exit 1
fi

# Test root endpoint
echo ""
echo "2️⃣ Testing root endpoint..."
curl -s http://localhost:8000 | python3 -m json.tool

# Test health endpoint
echo ""
echo "3️⃣ Testing health endpoint..."
HEALTH=$(curl -s http://localhost:8000/health)
echo "$HEALTH" | python3 -m json.tool

# Check if all env vars are configured
echo ""
echo "4️⃣ Checking environment configuration..."
STATUS=$(echo "$HEALTH" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['status'])")

if [ "$STATUS" = "healthy" ]; then
    echo "✅ All environment variables configured"
else
    echo "⚠️ Some environment variables missing:"
    echo "$HEALTH" | python3 -c "import sys, json; data=json.load(sys.stdin); print(', '.join(data['environment_check']['missing_variables']))"
fi

# Test mid-week analysis (optional - uses API credits)
echo ""
echo "5️⃣ Mid-Week Analysis Test"
echo "   ⚠️ This will use Perplexity API credits and take 2-5 minutes"
read -p "   Run full analysis test? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "   🚀 Running mid-week analysis..."
    START_TIME=$(date +%s)

    RESULT=$(curl -s -X POST http://localhost:8000/analyze/midweek)

    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    echo "   ✅ Analysis completed in ${DURATION}s"
    echo ""
    echo "   Result preview:"
    echo "$RESULT" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('analysis', 'No analysis')[:500])"
else
    echo "   ⏭️ Skipped full analysis test"
fi

echo ""
echo "======================================"
echo "✅ API Testing Complete"
echo "======================================"
