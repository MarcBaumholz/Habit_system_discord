import logging
from typing import cast

from pydantic_ai import RunContext
from pydantic_graph import GraphRunContext

from chatbot.agents.shared.graph_event_streamer import UserSearchAgentStatesEvent
from chatbot.agents.shared.state import AgentGraphDependencies, OrchestrationAgentState
from chatbot.agents.shared.subagent import FewShotExample, SubAgent
from chatbot.agents.user_search_agent.agent import SearchUsersNode, create_user_search_agent
from chatbot.agents.user_search_agent.state import UserSearchAgentDependencies, UserSearchAgentState
from chatbot.agents.user_search_agent.utils import format_users

_logger = logging.getLogger(__name__)


class UserSearchSubAgent(SubAgent[UserSearchAgentState]):
    tool_name = "call_user_search_agent"
    tool_description = """Delegate user search tasks to a specialized user search agent.

    This tool invokes a dedicated user search agent that can find users by name, department,
    or custom user attributes. The agent intelligently searches through the user directory
    and returns relevant user information.

    Use this tool when you need to:
    - Find specific users by name
    - Find users in a specific department
    - Find users with specific attributes (role, location, team, etc.)
    - Get detailed information about users including their attributes

    Args:
        search_task: A description of which users to find and what information is needed about them.

    Returns:
        Information about the users found, formatted as a list with requested attributes.
    """
    feature_flag = "ASK_AI_USER_TOOLS_ENABLED"

    prompt_reference = """# When to Search Users (Trigger Rules)
Call `call_user_search_agent` when ANY of the following apply:
- Query asks about specific people by name (e.g., "Who is John Smith?", "Find Marco Brunner")
- Query asks for users in a specific department, team, or role
- Query asks for users with specific attributes or characteristics
- Query requires finding contact information or details about employees
- Query asks about team composition or organizational structure

# When NOT to Search Users
- The answer is already present in the conversation history
- The query is about documents, posts, or policies (use retrieval agent instead)
- The user is only acknowledging or making small talk

# Query Shaping (for user search queries)
When you call `call_user_search_agent`, include:
- **Name or identifier** if searching for specific people
- **Attributes or criteria** if searching by characteristics (department, role, location, etc.)
- **Additional information needed** (what attributes should be included in the response)

# Examples
## Example 1 — Search by name
- User Query: "Who is John Smith?"
- Tool Call: call_user_search_agent("Find user named John Smith")
- Tool Response: "Found 1 user: John Smith, Engineering department"

## Example 2 — Search by department
- User Query: "Show me all people in the Sales department"
- Tool Call: call_user_search_agent("Find all users in Sales department")
- Tool Response: "Found 12 users in Sales department: Marco Brunner, Sarah Johnson, ..."

## Example 3 — Search with specific attributes
- User Query: "Find all backend developers in Berlin"
- Tool Call: call_user_search_agent("Find users with role 'Backend Developer' and location 'Berlin', include team and department information")
- Tool Response: "Found 8 users: Alice Johnson (Backend team, Engineering), Bob Smith (Platform team, Engineering), ..."
"""

    few_shot_examples = [
        FewShotExample(
            task="Find information about a specific employee",
            reason="User query asks about a specific person by name",
            conversation="""- Tool call: call_user_search_agent("Find user named Marco Brunner and show department and role")
- Tool response: "Found 1 user: Marco Brunner - department: Sales - role: Account Manager"
- Result: Found Marco Brunner who works as an Account Manager in the Sales department""",
        ),
        FewShotExample(
            task="Find users in a specific department",
            reason="User query asks about team composition or organizational structure",
            conversation="""- Tool call: call_user_search_agent("Find all users in Engineering department")
- Tool response: "Found 24 users in Engineering: Alice Johnson, Bob Smith, Charlie Brown, ..."
- Result: The Engineering department has 24 employees including Alice Johnson, Bob Smith, and Charlie Brown""",
        ),
        FewShotExample(
            task="Find users with specific attributes",
            reason="User query asks for people with specific characteristics or roles",
            conversation="""- Tool call: call_user_search_agent("Find users with role 'Manager' and show their departments")
- Tool response: "Found 8 users: Sarah Williams - department: Sales, Tom Davis - department: Marketing, Lisa Anderson - department: Engineering, ..."
- Result: Found 8 managers across different departments: Sarah Williams (Sales), Tom Davis (Marketing), Lisa Anderson (Engineering)""",
        ),
    ]

    async def run(
        self,
        ctx: RunContext[GraphRunContext[OrchestrationAgentState, AgentGraphDependencies]],
        search_task: str,
    ) -> UserSearchAgentState:
        graph_ctx = ctx.deps

        state = UserSearchAgentState(
            query=search_task,
            users=[],
            messages=[],
            iteration=0,
        )

        user_search_graph = create_user_search_agent()
        graph_run = await user_search_graph.run(
            SearchUsersNode(),
            state=state,
            deps=cast(UserSearchAgentDependencies, graph_ctx.deps),
        )

        found_users = graph_run.state.users
        if found_users:
            formatted_users = format_users(found_users)
            graph_run.state.answer = f"**Found {len(found_users)} user(s)**:\n{formatted_users}"
        else:
            graph_run.state.answer = "No users found matching the search criteria"

        ctx.deps.deps.event_streamer.emit_debug(UserSearchAgentStatesEvent(user_search_agent_states=[graph_run.state]))
        return graph_run.state
