#!/usr/bin/env python3
"""
Test Script für Mentor Agent
Testet den Mentor-Agent mit deinem persönlichen Channel
"""

import os
import sys
import asyncio
from dotenv import load_dotenv

# Lade Environment Variables
load_dotenv()

# Füge den mentor_agent Pfad hinzu
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from mentor_agent import test_mentor_for_user, MentorAgent


async def main():
    """Hauptfunktion für den Test"""
    
    print("🧪 MENTOR AGENT TEST")
    print("=" * 50)
    
    # Test für deinen persönlichen Channel
    discord_id = "1422681618304471131"  # Dein persönlicher Channel
    
    print(f"🎯 Testing Mentor Agent für User: {discord_id}")
    print(f"📊 Notion DB ID: {os.getenv('NOTION_DATABASE_PERSONALITY', 'NOT SET')}")
    print(f"🤖 Perplexity API: {'✅ SET' if os.getenv('PERPLEXITY_API_KEY') else '❌ NOT SET'}")
    print()
    
    try:
        # Führe Test aus
        response = await test_mentor_for_user(discord_id)
        
        if response:
            print("✅ TEST ERFOLGREICH!")
            print(f"📝 Message: {response.message}")
            print(f"💡 Advice: {response.advice}")
            print(f"🎯 Actions: {response.suggested_actions}")
            print(f"📊 Risk Level: {response.risk_level}")
        else:
            print("❌ TEST FEHLGESCHLAGEN - Keine Response erhalten")
            
    except Exception as e:
        print(f"❌ FEHLER: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
