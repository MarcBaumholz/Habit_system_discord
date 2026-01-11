"""
Simple CrewAI test script - no Notion tool dependency
Tests if CrewAI is working with Perplexity LLM
"""

import os
from dotenv import load_dotenv
from crewai import Agent, Task, Crew, LLM

# Load environment variables
load_dotenv()

def test_crewai():
    """Simple test to verify CrewAI is working"""
    
    print("\n" + "="*60)
    print("🧪 Testing CrewAI with Perplexity LLM")
    print("="*60 + "\n")
    
    # Initialize Perplexity LLM for CrewAI
    llm = LLM(
        model="perplexity/sonar",
        api_key=os.getenv("PERPLEXITY_API_KEY"),
        temperature=0.5
    )
    
    # Create a simple agent (no tools)
    agent = Agent(
        role="Helpful Assistant",
        goal="Answer questions clearly and concisely",
        backstory="You are a helpful AI assistant that provides clear and accurate answers.",
        llm=llm,
        verbose=True,
        allow_delegation=False
    )
    
    # Create a simple task
    task = Task(
        description="""
        Please provide a brief analysis of habit tracking systems.
        Explain in 2-3 sentences:
        1. Why habit tracking is useful
        2. What makes a good habit tracking system
        3. One key challenge people face when building habits
        """,
        agent=agent,
        expected_output="A brief 2-3 sentence analysis about habit tracking systems"
    )
    
    # Create and run the crew
    crew = Crew(
        agents=[agent],
        tasks=[task],
        verbose=True
    )
    
    print("\n🚀 Starting CrewAI execution...\n")
    result = crew.kickoff()
    
    print("\n" + "="*60)
    print("✅ CrewAI Test Complete!")
    print("="*60)
    print("\n📝 Result:\n")
    print(result)
    print("\n" + "="*60)
    
    return result


if __name__ == "__main__":
    try:
        result = test_crewai()
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
