"""
Mid-Week Team Dynamics Agent
Analyzes habit progress and group dynamics every Wednesday
"""

import os
import yaml
from datetime import datetime
from typing import Dict, Any
from crewai import Agent, Task, Crew
from langchain_openai import ChatOpenAI
from tools.notion_tool import NotionHabitTool


class MidWeekAnalysisAgent:
    """
    CrewAI-based agent for mid-week habit analysis and team dynamics
    """

    def __init__(self):
        """Initialize the agent with Perplexity LLM and Notion tool"""
        # Load agent configuration
        with open('config/agents.yaml', 'r') as f:
            config = yaml.safe_load(f)
            self.agent_config = config['team_dynamics_analyst']

        # Initialize Perplexity LLM (using OpenAI-compatible API)
        self.llm = ChatOpenAI(
            model="llama-3.1-sonar-large-128k-online",
            openai_api_key=os.getenv('PERPLEXITY_API_KEY'),
            openai_api_base="https://api.perplexity.ai",
            temperature=0.7
        )

        # Initialize Notion tool
        self.notion_tool = NotionHabitTool()

        # Create the agent
        self.agent = Agent(
            role=self.agent_config['role'],
            goal=self.agent_config['goal'],
            backstory=self.agent_config['backstory'],
            tools=[self.notion_tool],
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

    def run_midweek_analysis(self) -> Dict[str, Any]:
        """
        Execute mid-week analysis for all active users

        Returns:
            Dict containing analysis results with user-specific feedback
        """
        print(f"\n{'='*60}")
        print(f"🎯 STARTING MID-WEEK ANALYSIS - {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        print(f"{'='*60}\n")

        # Create analysis task
        analysis_task = Task(
            description="""
            Perform a comprehensive mid-week analysis of all active users' habit progress.

            Steps:
            1. Use the Notion Habit Tracker tool to get midweek analysis data (operation: get_midweek_analysis_data)
            2. Analyze each user's progress:
               - Compare actual completions vs expected completions by mid-week (Wednesday)
               - Identify which habits are on track and which are falling behind
            3. Evaluate group dynamics:
               - Who is performing exceptionally well?
               - Who is struggling and might need peer support?
               - Are there patterns across the group?
            4. Generate personalized feedback:
               - For each user, write a brief mid-week summary
               - For EACH habit, provide ONE sentence that:
                 * If ON TRACK: Celebrates their progress and connects to their "why"
                 * If BEHIND: Offers supportive encouragement and practical help
            5. Create a group dynamics summary highlighting:
               - Overall group performance
               - Top performers (to celebrate and inspire others)
               - Users who need support (to mobilize peer help)

            Format your response as:
            ## Mid-Week Summary - [Date]

            ### Group Overview
            [2-3 sentences about overall group dynamics and patterns]

            ### Individual Progress

            **[User Name]** ([X]/[Y] habits on track)
            - **[Habit Name]** (target: X/week, completed: Y) - [One sentence feedback]
            - **[Habit Name]** (target: X/week, completed: Y) - [One sentence feedback]

            [Repeat for each user]

            ### Team Dynamics Insights
            - **Top Performers**: [Names and brief recognition]
            - **Need Support**: [Names - presented positively, opportunity for peer support]
            - **Key Patterns**: [Any interesting observations about the group]
            """,
            agent=self.agent,
            expected_output="""
            A comprehensive mid-week analysis report with:
            - Group overview and dynamics
            - Individual progress for each user with habit-specific feedback
            - Team insights highlighting top performers and support needs
            - Motivational and supportive tone throughout
            """
        )

        # Create and run the crew
        crew = Crew(
            agents=[self.agent],
            tasks=[analysis_task],
            verbose=True
        )

        result = crew.kickoff()

        print(f"\n{'='*60}")
        print(f"✅ MID-WEEK ANALYSIS COMPLETE")
        print(f"{'='*60}\n")

        return {
            'status': 'success',
            'timestamp': datetime.now().isoformat(),
            'analysis': str(result),
            'day_of_week': datetime.now().strftime('%A')
        }


def main():
    """Main execution function"""
    try:
        agent = MidWeekAnalysisAgent()
        result = agent.run_midweek_analysis()
        return result
    except Exception as e:
        print(f"❌ Error running mid-week analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    result = main()
    print("\n" + "="*60)
    print("FINAL RESULT:")
    print("="*60)
    print(result.get('analysis', result))
