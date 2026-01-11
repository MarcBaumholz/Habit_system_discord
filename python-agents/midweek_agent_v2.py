"""
Second Weekly Check-In Agent (v2)
Uses batch-filtered Notion retrieval for clean mid-week analysis.
"""

import os
import json
import yaml
from datetime import datetime
from typing import Dict, Any
from crewai import Agent, Task, Crew, LLM
from tools.notion_tool_v2 import NotionHabitToolV2


class SecondMeetAnalysisAgent:
    """
    CrewAI-based agent for the second weekly check-in using Notion tool v2.
    """

    def __init__(self):
        """Initialize the agent with Perplexity LLM and Notion tool v2."""
        with open('config/agents.yaml', 'r') as f:
            config = yaml.safe_load(f)
            self.agent_config = config.get('team_dynamics_analyst_v2', config['team_dynamics_analyst'])

        self.llm = LLM(
            model="perplexity/sonar",
            api_key=os.getenv("PERPLEXITY_API_KEY"),
            temperature=0.5
        )

        self.notion_tool = NotionHabitToolV2()

        self.agent = Agent(
            role=self.agent_config['role'],
            goal=self.agent_config['goal'],
            backstory=self.agent_config['backstory'],
            tools=[],
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

    def run_second_meet_analysis(self) -> Dict[str, Any]:
        """
        Execute the second weekly check-in analysis for all active users.
        """
        print(f"\n{'='*60}")
        print(f"🎯 STARTING SECOND WEEKLY CHECK-IN - {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        print(f"{'='*60}\n")

        preflight = self.notion_tool._get_second_meet_analysis_data()
        if preflight.get('total_active_users', 0) == 0:
            print(f"⚠️ No active users found for batch '{preflight.get('batch_name')}'. Skipping LLM run.")
            return {
                'status': 'no_data',
                'timestamp': datetime.now().isoformat(),
                'analysis': json.dumps(preflight, indent=2, default=str),
                'day_of_week': datetime.now().strftime('%A')
            }

        data_payload = json.dumps(preflight, indent=2, default=str)

        analysis_task = Task(
            description=f"""
            Conduct a precise mid-week inspection for every active user. This replaces the verbose weekly recap—keep everything razor sharp.

            Ground rules:
            1. Use ONLY the Notion data payload provided below. Never invent users, habits, toolboxes, or buddy data that Notion did not return. If a field is missing, say "Notion data unavailable" and move on.
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
            
            Notion data payload:
            {data_payload}
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

        crew = Crew(
            agents=[self.agent],
            tasks=[analysis_task],
            verbose=True
        )

        result = crew.kickoff()

        print(f"\n{'='*60}")
        print("✅ SECOND WEEKLY CHECK-IN COMPLETE")
        print(f"{'='*60}\n")

        return {
            'status': 'success',
            'timestamp': datetime.now().isoformat(),
            'analysis': str(result),
            'day_of_week': datetime.now().strftime('%A')
        }


def main():
    """Main execution function."""
    try:
        agent = SecondMeetAnalysisAgent()
        result = agent.run_second_meet_analysis()
        return result
    except Exception as e:
        print(f"❌ Error running second weekly check-in: {str(e)}")
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
    print("\n" + "=" * 60)
    print("FINAL RESULT:")
    print("=" * 60)
    print(result.get('analysis', result))
