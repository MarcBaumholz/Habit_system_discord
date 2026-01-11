"""
Simple test script to verify the second weekly check-in agent works
and data retrieval is correctly populated.
"""
from dotenv import load_dotenv
from midweek_agent_v2 import SecondMeetAnalysisAgent
from tools.notion_tool_v2 import NotionHabitToolV2


load_dotenv()

tool = NotionHabitToolV2()
data = tool._get_second_meet_analysis_data()

print("\n" + "=" * 60)
print("DATA RETRIEVAL CHECK:")
print("=" * 60)
print(f"Batch: {data.get('batch_name')}")
print(f"Active users: {data.get('total_active_users')}")
print(f"Week range: {data.get('week_start')} to {data.get('week_end')}")

users_data = data.get('users_data', [])
if not users_data:
    print("No active users found for the configured batch. Skipping LLM run.")
else:
    sample_user = users_data[0]
    print(f"Sample user: {sample_user.get('user', {}).get('name')}")
    print(f"Habits: {sample_user.get('total_habits')} | Proofs: {sample_user.get('proof_count')}")

    agent = SecondMeetAnalysisAgent()
    result = agent.run_second_meet_analysis()

    print("\n" + "=" * 60)
    print("RESULT:")
    print("=" * 60)
    print(result.get('analysis', result))
