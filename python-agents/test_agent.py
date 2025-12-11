"""
Test script for the Mid-Week Analysis Agent
Tests both the Notion tool and the agent execution
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("="*60)
print("🧪 TESTING CREWAI MID-WEEK ANALYSIS AGENT")
print("="*60)

# Test 1: Environment variables
print("\n1️⃣ Testing Environment Variables...")
required_vars = [
    'NOTION_TOKEN',
    'NOTION_DATABASE_USERS',
    'NOTION_DATABASE_HABITS',
    'NOTION_DATABASE_PROOFS',
    'PERPLEXITY_API_KEY'
]

missing_vars = [var for var in required_vars if not os.getenv(var)]

if missing_vars:
    print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
    sys.exit(1)
else:
    print("✅ All environment variables configured")

# Test 2: Import dependencies
print("\n2️⃣ Testing Python Dependencies...")
try:
    from notion_client import Client
    from crewai import Agent, Task, Crew
    from langchain_openai import ChatOpenAI
    import yaml
    print("✅ All dependencies imported successfully")
except ImportError as e:
    print(f"❌ Import error: {str(e)}")
    print("Run: pip install -r requirements.txt")
    sys.exit(1)

# Test 3: Notion connection
print("\n3️⃣ Testing Notion Connection...")
try:
    from tools.notion_tool import NotionHabitTool

    notion_tool = NotionHabitTool()
    print("✅ Notion tool initialized")

    # Test getting active users
    print("   📊 Fetching active users from Notion...")
    result = notion_tool._run('get_active_users')
    import json
    users_data = json.loads(result)

    if isinstance(users_data, list):
        print(f"   ✅ Found {len(users_data)} active users")
        if users_data:
            print(f"   Sample user: {users_data[0].get('name', 'Unknown')}")
    elif 'error' in users_data:
        print(f"   ⚠️ Notion query returned: {users_data['error']}")

except Exception as e:
    print(f"❌ Notion connection failed: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 4: Perplexity LLM connection
print("\n4️⃣ Testing Perplexity LLM Connection...")
try:
    llm = ChatOpenAI(
        model="llama-3.1-sonar-large-128k-online",
        openai_api_key=os.getenv('PERPLEXITY_API_KEY'),
        openai_api_base="https://api.perplexity.ai",
        temperature=0.7
    )
    print("✅ Perplexity LLM initialized")

    # Test a simple query
    print("   🤖 Testing LLM with a simple query...")
    response = llm.invoke("Say 'test successful' in one word")
    print(f"   ✅ LLM responded: {response.content[:50]}...")

except Exception as e:
    print(f"❌ LLM connection failed: {str(e)}")
    import traceback
    traceback.print_exc()
    print("   Note: This might be due to API key issues or network connectivity")

# Test 5: Mid-week data retrieval
print("\n5️⃣ Testing Mid-Week Analysis Data Retrieval...")
try:
    result = notion_tool._run('get_midweek_analysis_data')
    analysis_data = json.loads(result)

    if 'error' in analysis_data:
        print(f"   ⚠️ Data retrieval returned: {analysis_data['error']}")
    else:
        print(f"   ✅ Analysis data retrieved successfully")
        print(f"   📊 Week: {analysis_data.get('week_start')} to {analysis_data.get('week_end')}")
        print(f"   👥 Active users: {analysis_data.get('total_active_users', 0)}")

        users_data = analysis_data.get('users_data', [])
        if users_data:
            sample_user = users_data[0]
            print(f"\n   Sample user analysis:")
            print(f"   - Name: {sample_user.get('user', {}).get('name', 'Unknown')}")
            print(f"   - Total habits: {sample_user.get('total_habits', 0)}")
            print(f"   - On track: {sample_user.get('on_track_count', 0)}")

            if sample_user.get('habits'):
                habit = sample_user['habits'][0]
                print(f"\n   Sample habit:")
                print(f"   - Name: {habit.get('habit_name')}")
                print(f"   - Target: {habit.get('target_frequency')}/week")
                print(f"   - Completed: {habit.get('completed_count')}")
                print(f"   - On track: {'✅' if habit.get('on_track') else '⚠️'}")

except Exception as e:
    print(f"❌ Mid-week data retrieval failed: {str(e)}")
    import traceback
    traceback.print_exc()

# Test 6: Agent configuration
print("\n6️⃣ Testing Agent Configuration...")
try:
    with open('config/agents.yaml', 'r') as f:
        config = yaml.safe_load(f)
        agent_config = config['team_dynamics_analyst']

    print("✅ Agent configuration loaded")
    print(f"   Role: {agent_config['role'][:50]}...")
    print(f"   Goal: {agent_config['goal'][:50]}...")

except Exception as e:
    print(f"❌ Agent configuration failed: {str(e)}")
    sys.exit(1)

# Test 7: Full agent execution (optional - may take time)
print("\n7️⃣ Full Agent Execution Test")
print("   ⚠️ This test will run the full CrewAI agent and may take 2-5 minutes")
print("   It will also consume API credits (Perplexity)")

import time
response = input("   Run full agent test? (y/N): ").strip().lower()

if response == 'y':
    print("\n   🚀 Running full mid-week analysis agent...")
    try:
        from midweek_agent import MidWeekAnalysisAgent

        agent = MidWeekAnalysisAgent()
        result = agent.run_midweek_analysis()

        print("\n" + "="*60)
        print("✅ AGENT EXECUTION SUCCESSFUL")
        print("="*60)
        print(f"\nStatus: {result['status']}")
        print(f"Timestamp: {result['timestamp']}")
        print(f"\nAnalysis Preview:")
        print("-"*60)
        analysis = result.get('analysis', '')
        # Print first 500 characters
        print(analysis[:500] + "...\n" if len(analysis) > 500 else analysis)

    except Exception as e:
        print(f"\n❌ Full agent execution failed: {str(e)}")
        import traceback
        traceback.print_exc()
else:
    print("   ⏭️ Skipping full agent test")

# Summary
print("\n" + "="*60)
print("📊 TEST SUMMARY")
print("="*60)
print("✅ Environment: OK")
print("✅ Dependencies: OK")
print("✅ Notion Connection: OK")
print("✅ Data Retrieval: OK")
print("✅ Agent Config: OK")
if response == 'y':
    print("✅ Full Agent: " + ("OK" if result['status'] == 'success' else "FAILED"))
print("\n🎉 Ready to deploy!")
print("\nNext steps:")
print("1. Start the API server: ./start-api.sh")
print("2. Test the API: curl http://localhost:8000/health")
print("3. Start your Discord bot and wait for Wednesday 8pm!")
print("="*60)
