"""
Mid-Week Team Dynamics Agent
Analyzes habit progress and group dynamics every Wednesday
"""

import os
import yaml
from datetime import datetime
from typing import Dict, Any
from crewai import Agent, Task, Crew, LLM
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

        # Initialize Perplexity LLM for CrewAI using LiteLLM
        # Using perplexity/sonar model format (requires litellm)
        self.llm = LLM(
            model="perplexity/sonar",
            api_key=os.getenv("PERPLEXITY_API_KEY"),
            temperature=0.5
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
            Conduct a precise mid-week inspection for every active user. This replaces the verbose weekly recap—keep everything razor sharp.

            Ground rules:
            1. Call the Notion Habit Tracker tool with `get_midweek_analysis_data` to pull ONLY active users, their active habits, and this week's proofs. Never invent users, habits, toolboxes, or buddy data that Notion did not return. If a field is missing, say "Notion data unavailable" and move on.
            2. Filter the fetched payload so that each section references the correct user, the user's assigned buddy (if Notion shows one), and proofs belonging to those exact records. Do not mix users or reuse proofs across buddies.
            3. If learnings or hurdles are present in Notion, compress them into a one-sentence cause analysis; if Notion does not provide entries, skip that bullet entirely.

            Analysis requirements:
            - Calculate expected completions by mid-week (Wednesday ≈ 3/7 of weekly target) and tag each habit bullet with `✅` when `completed_count >= expected_by_now` or `⚠️` otherwise. Mention target, actual, and any `why`/`minimal dose` context if available.
            - "What worked" and "What didn't" must be separate one-sentence bullets that cite actual Notion signals (proof streak, reason text, etc.).
            - If a habit or user is behind, create a `Mini Toolbox` bullet that references a concrete action grounded in Notion data (e.g., the stored minimal dose, a linked resource). If there is no resource or hint in Notion, state `Mini Toolbox — awaiting Notion data` instead of fabricating.
            - Provide an `Adaptive Goal Cue` bullet only when the user is off track; keep it one sentence focused on trimming the plan based on actual numbers.
            - Include a `Buddy Check-In` bullet referencing the correct buddy. Use the buddy’s name/goal/proof counts from Notion if they exist; if Notion lacks buddy data, say `Buddy Check-In — No buddy assigned in Notion`.

            Format your response exactly like a Notion doc with tight bullets (one sentence per bullet, no extra prose):
            ## Mid-Week Precision Update - [Date]

            ### Group Performance
            - 📊 **Active Users:** [count] | **Habits On Track:** [sum_on_track]/[sum_total]
            - 🔁 **Patterns:** [observed pattern tied to data] (omit if none)
            - ⚠️ **Risk Flags:** [specific risk bullet tied to data] (omit if none)

            ### Personal Dashboards
            For each user (skip users with zero active habits):
            **[User Name]** — [on_track_count]/[total_habits] habits on track · proofs this week: [proof_count] · week: [week_range]
            - ✅ **[Habit Name]** ([completed_count]/[target_frequency]; expected [expected_by_now]) — one sentence referencing why/minimal dose.
            - ⚠️ **[Habit Name]** ([completed_count]/[target_frequency]; expected [expected_by_now]) — one sentence root-cause from Notion.
            - 🧠 **What Worked** — one sentence (only if data).
            - 🚫 **What Didn’t Work** — one sentence (only if data).
            - 🧱 **Learnings/Hurdles** — one sentence that names the cause (only if Notion provides relevant text).
            - 🧰 **Mini Toolbox** — [resource note or "Mini Toolbox — awaiting Notion data"] (only if the user missed a goal).
            - 🌀 **Adaptive Goal Cue** — one sentence (only when the user is behind).
            - 👥 **Buddy Check-In** — [buddy name goal/progress + proof count OR "Buddy Check-In — No buddy data in Notion"].

            Do NOT add weekly strategy sections, encouragement paragraphs, or speculative ideas. Every bullet must come straight from Notion ground truth.
            """,
            agent=self.agent,
            expected_output="""
            A Notion-styled mid-week summary that:
            - Presents the group performance section exactly as specified
            - Provides one structured block per active user with the bullet taxonomy above, skipping bullets that lack Notion data
            - Flags missing buddy/toolbox data explicitly instead of inventing content
            - Uses one-sentence bullets with precise numbers pulled from Notion
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
