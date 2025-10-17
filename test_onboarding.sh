#!/bin/bash

echo "🧪 Starting Onboarding Test Monitoring..."
echo "=================================="
echo "📊 Bot Status:"
pm2 status
echo ""
echo "🔍 Monitoring logs for onboarding activity..."
echo "Press Ctrl+C to stop monitoring"
echo "=================================="

# Monitor logs for onboarding-related activity
tail -f logs/pm2-combined.log | grep --line-buffered -i "onboard\|modal\|profile\|interaction\|error" --color=always
