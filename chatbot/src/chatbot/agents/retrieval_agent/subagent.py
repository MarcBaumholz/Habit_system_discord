import time
from typing import cast

from pydantic_ai import RunContext
from pydantic_graph import GraphRunContext

from chatbot.agents.retrieval_agent.agent import ProcessMessageNode, create_retrieval_agent
from chatbot.agents.retrieval_agent.state import RetrievalAgentDependencies, RetrievalAgentState
from chatbot.agents.shared.graph_event_streamer import RetrievalAgentStatesEvent
from chatbot.agents.shared.state import AgentGraphDependencies, OrchestrationAgentState
from chatbot.agents.shared.subagent import FewShotExample, SubAgent
from chatbot.utils import doc_2_string


class RetrievalSubAgent(SubAgent[RetrievalAgentState]):
    tool_name = "call_retrieval_agent"
    tool_description = """Delegate complex research tasks to a specialized retrieval agent.

    This tool invokes a dedicated retrieval agent that autonomously searches through internal
    documents, pages, and posts using multiple search strategies. The agent intelligently
    evaluates and filters results to find the most relevant information.

    IMPORTANT: This calls a sub-agent that performs multiple search operations. Use this for
    comprehensive research tasks rather than simple individual queries. The agent can handle
    complex, multi-faceted research questions that may require searching across different
    content types and time periods.

    Examples of good composite research tasks:
        - "What is our company's remote work policy, including recent updates and manager guidelines?"
        - "Find all information about Q2 sales targets, performance metrics, and team feedback"
        - "Research our IT support process: who handles requests, escalation procedures, and recent changes"
        - "Compile information about last week's all-hands meeting: agenda, key decisions, and follow-up actions"
        - "Gather comprehensive documentation about our product return policy and customer service procedures"

    The more comprehensive and specific your research task, the better the agent can assist.
    Include context, related topics, and desired scope in your request.

    Args:
        research_task: A comprehensive research question or topic for the retrieval agent to investigate.

    Returns:
        Relevant documents and information found by the retrieval agent.
    """
    feature_flag = None

    prompt_reference = """# When to Search (Trigger Rules)
Call `call_retrieval_agent` when ANY of the following apply:
- Query involves company-specific entities (teams, products, policies, benefits, processes, channels) or ambiguous terms with internal meaning
- You are not confident about relevant facts from context/history
- The answer might be time-sensitive → first use `get_current_date_time`, then retrieve
- When answering substantial questions, search first to check for relevant company information

# When NOT to Search
- The answer is already present in the immediately preceding tool output or chat history
- The user is only acknowledging or making small talk (e.g., "thanks", "ok")
- The user explicitly requested that you do not look it up

# Query Shaping (for retrieval queries)
When you call `call_retrieval_agent`, include:
- **Topic** and short intent (what you want to know)
- **Must-have details** (entities, fields, constraints)
- **Scope/time window** when relevant: If the user specifies a timeframe (e.g., "today", "last week", "Q1 2025"), first call `get_current_date_time` to determine the current date, then include specific dates in your retrieval query (e.g., "from March 10-16, 2025" instead of "from last week")
- Prefer concise, specific phrasing over long narratives"""

    few_shot_examples = [
        FewShotExample(
            task="Provide information about vacation policy",
            reason="Company-specific policy details require internal knowledge base search",
            conversation="""- Tool call: call_retrieval_agent("Vacation/leave policy: eligibility, accrual, approval flow, regional differences, latest updates")
- Tool response:
  - Title: Vacation & Leave Policy
  - Source: Knowledge Base / HR / Policies
  - Last Time Edited: 2025-03-12
  - Excerpt: "Employees accrue 1.75 days per month; carryover up to 5 days; manager approval required; regional holidays handled separately."
- Result: Found policy - employees accrue 1.75 days/month with up to 5 days carryover, manager approval required, regional holidays handled separately""",
        ),
        FewShotExample(
            task="Provide information about bug reporting process",
            reason="Internal process documentation needed, potentially time-sensitive",
            conversation="""- Tool call: get_current_date_time
- Tool response: "Today's date is Friday, April 04, 2025 and the current time is 09:02:15 AM"
- Tool call: call_retrieval_agent("Bug reporting process: tools, required fields, priority classes, escalation")
- Tool response:
  - Title: Engineering – Bug Reporting Guide
  - Source: Knowledge Base / Engineering / QA
  - Last Time Edited: 2023-08-15
  - Excerpt: "Use Linear for all bugs. Include: steps to reproduce, expected vs actual, logs/screenshots, environment, priority. Escalate P0 to #eng-incidents."
- Result: Found guide from 2023 (potentially outdated) - use Linear with steps to reproduce, expected vs actual, logs/screenshots, environment, priority. P0s escalate to #eng-incidents""",
        ),
        FewShotExample(
            task="Gather information about company core values",
            reason="Company culture and values are specific internal knowledge that may have been updated recently",
            conversation="""- Tool call: call_retrieval_agent("Company core values, mission, cultural principles, recent communications with examples")
- Tool response:
  - Title: Our Values
  - Source: Knowledge Base / About / Culture
  - Last Time Edited: 2025-02-20
  - Excerpt: "Customer Obsession; Ownership; Bias for Action; Learn & Improve; Build Together."
  - Title: All Hands Recap
  - Source: Posts / Leadership / Announcements
  - Last Time Edited: 2023-11-05
  - Excerpt: "Customer Obsession; Ownership; Bias for Action; Learn & Improve; Deliver Results."
- Result: Current values (2025-02-20) are Customer Obsession, Ownership, Bias for Action, Learn & Improve, and Build Together. Older 2023 post shows different fifth value (Deliver Results), indicating possible update""",
        ),
        FewShotExample(
            task="Check current status of travel stipend benefit",
            reason="Time-sensitive benefit information that may have changed, requires current date context and internal policy lookup",
            conversation="""- Tool call: get_current_date_time
- Tool response: "Today's date is Saturday, July 12, 2025 and the current time is 10:30:00 AM"
- Tool call: call_retrieval_agent("Travel stipend policy status: eligibility, dates, regional differences, latest updates")
- Tool response:
  - Title: Benefits Update – Travel Stipend Q3
  - Source: Knowledge Base / HR / Benefits
  - Last Time Edited: 2024-07-05
  - Excerpt: "Travel stipend continues through Q3 for full-time employees in EMEA and NA. APAC exception program ends June 30."
- Result: Found July 2024 update - stipend active through Q3 for full-time employees in EMEA and NA, APAC exception ended June 30""",
        ),
        FewShotExample(
            task="Find information about specific employee Marco Brunner",
            reason="Person-specific information and employment status requires internal search, names may be ambiguous",
            conversation="""- Tool call: call_retrieval_agent("Marco Brunner: role, team, recent updates, departure status")
- Tool response:
  - Title: Engineering Digest — Weekly Update
  - Source: Posts / Engineering / Weekly
  - Last Time Edited: 2025-09-12
  - Excerpt: "Marc decided to leave the company. He will go on parental leave and return briefly before departing fully."
- Result: Found mention of "Marc" (no surname) leaving after parental leave, but name doesn't fully match "Marco Brunner" - ambiguity exists""",
        ),
    ]

    async def run(
        self,
        ctx: RunContext[GraphRunContext[OrchestrationAgentState, AgentGraphDependencies]],
        research_task: str,
    ) -> RetrievalAgentState:
        graph_ctx = ctx.deps

        num_calls = graph_ctx.state.get_number_of_tool_calls(self.tool_name)
        if num_calls >= graph_ctx.deps.app_services.settings.max_retrieval_agent_calls:
            state = RetrievalAgentState(
                query=research_task,
                answer="Maximum number of retrieval calls exceeded.",
            )
            return state

        start_time = time.time()
        state = RetrievalAgentState(
            query=research_task,
            first_stage_results=[],
            second_stage_results=[],
            messages=[],
            iteration=0,
            seen_documents=set(),
            retrieval_time=0.0,
        )

        retrieval_graph = create_retrieval_agent()
        graph_run = await retrieval_graph.run(
            ProcessMessageNode(),
            state=state,
            deps=cast(RetrievalAgentDependencies, graph_ctx.deps),
        )

        end_time = time.time()
        state.retrieval_time = end_time - start_time

        graph_ctx.deps.timing_metrics.record_retrieval_time(state.retrieval_time)

        found_documents = graph_run.state.second_stage_results
        if found_documents:
            formatted_docs_str = "\n\n---\n\n".join([doc_2_string(doc) for doc in found_documents])
            graph_run.state.answer = f"Retrieved information from the company knowledge bases: \n\n {formatted_docs_str}"
        else:
            graph_run.state.answer = "No information found in the company knowledge bases"

        ctx.deps.deps.event_streamer.emit_debug(RetrievalAgentStatesEvent(retrieval_agent_states=[graph_run.state]))
        return graph_run.state
