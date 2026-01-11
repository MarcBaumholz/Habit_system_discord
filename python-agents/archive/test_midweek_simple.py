"""
Simple test script to verify midweek agent works
"""
from dotenv import load_dotenv
from midweek_agent import MidWeekAnalysisAgent

# Load environment variables
load_dotenv()

# Initialize and run
agent = MidWeekAnalysisAgent()
result = agent.run_midweek_analysis()

# Print result
print("\n" + "="*60)
print("RESULT:")
print("="*60)
print(result.get('analysis', result))
