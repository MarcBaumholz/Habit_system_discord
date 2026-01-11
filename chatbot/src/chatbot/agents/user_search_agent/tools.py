import logging
from typing import Literal

from pydantic_ai import RunContext
from pydantic_graph import GraphRunContext

from chatbot.agents.user_search_agent.state import UserSearchAgentDependencies, UserSearchAgentState
from chatbot.api_clients.user_api import SearchUsersOrder, User, UserCoreApi
from chatbot.util.auth import FlipBearerAuth

_logger = logging.getLogger(__name__)

UserSortOrder = Literal["first_name", "last_name", "department"]


def _map_sort_order(sort_order: UserSortOrder) -> SearchUsersOrder:
    mapping: dict[UserSortOrder, SearchUsersOrder] = {
        "first_name": "USER_FIRST_NAME_ASC",
        "last_name": "USER_LAST_NAME_ASC",
        "department": "USER_DEPARTMENT_ASC",
    }
    return mapping[sort_order]


async def get_user_attribute_definitions(ctx: RunContext[GraphRunContext[UserSearchAgentState, UserSearchAgentDependencies]]) -> str:
    """
    This tool returns all user attribute definitions that are available in the system. Call this first when
    looking for user attributes to include in the `search_users_by_name` or `search_users_by_attribute` tools.
    """
    graph_ctx = ctx.deps

    if not isinstance(graph_ctx.deps.auth, FlipBearerAuth):
        return "Error fetching user attribute definitions"

    api = UserCoreApi(graph_ctx.deps.app_services.http_client, graph_ctx.deps.app_services.settings)
    attribute_definitions = await api.get_user_attribute_definitions(graph_ctx.deps.auth)
    visible_attributes = [attr for attr in attribute_definitions.definitions if attr.user_permission in ["VIEW", "EDIT"]]
    attribute_text = "\n\t -".join([f"Name: {attr.title.text}; Technical Name: {attr.technical_name}" for attr in visible_attributes])

    return f"Attribute Definitions:\n{attribute_text}"


async def search_users_by_name(
    ctx: RunContext[GraphRunContext[UserSearchAgentState, UserSearchAgentDependencies]],
    query: str,
    include_attributes: list[str] | None = None,
    sort_by: list[UserSortOrder] | None = None,
    max_results: int = 100,
) -> str:
    """
    Search for users by name or department. This is the primary tool for finding users by their name.
    Automatically handles pagination to retrieve up to max_results users.

    IMPORTANT: The maximum allowed value for max_results is 100. If you need more users, you must make
    multiple search calls with different queries to narrow down the results.

    Args:
        query: The search query to find users. Can be first name, last name, full name, or department.
        include_attributes: List of user attribute technical names to include in the response. The attribute
            definitions can be fetched using the `get_user_attribute_definitions` tool. Provide only
            attributes that are relevant to answer the user's question.
        sort_by: Optional list to sort results. Available options: "first_name", "last_name", "department".
        max_results: Maximum number of users to retrieve (default: 100, max: 100). API handles pagination automatically.
    """
    graph_ctx = ctx.deps

    if not isinstance(graph_ctx.deps.auth, FlipBearerAuth):
        return "Error fetching user search results"

    max_allowed = graph_ctx.deps.app_services.settings.user_search_max_results
    if max_results > max_allowed:
        return f"Error: max_results ({max_results}) exceeds the maximum allowed value of {max_allowed}. Please use a value of {max_allowed} or less."

    order_by = [_map_sort_order(order) for order in sort_by] if sort_by else None
    api = UserCoreApi(graph_ctx.deps.app_services.http_client, graph_ctx.deps.app_services.settings)

    users = await api.search_users(
        auth=graph_ctx.deps.auth,
        query=query,
        order_by=order_by,
        max_results=max_results,
    )

    if not users:
        return "No users found"

    graph_ctx.state.add_users(users)

    def format_user(user: User) -> str:
        result = f"- {user.first_name} {user.last_name}\n"
        if include_attributes:
            result += "\n".join([f"  - {attr.name}: {attr.value}" for attr in user.user_attributes if attr.name in include_attributes])
        return result

    user_info = "\n".join([format_user(user) for user in users])
    total_message = f"**Found {len(users)} user(s)**"
    if len(users) == max_results:
        total_message += f" (limited to {max_results})"
    return f"{total_message}:\n{user_info}"


async def search_users_by_attribute(
    ctx: RunContext[GraphRunContext[UserSearchAgentState, UserSearchAgentDependencies]],
    attribute_name: str,
    attribute_value: str,
    include_attributes: list[str] | None = None,
    sort_by: list[UserSortOrder] | None = None,
    max_results: int = 100,
) -> str:
    """
    Search for users by filtering on a specific user attribute. Use this when you need to find users
    with a specific attribute value (e.g., all users in a specific department or with a specific role).
    Automatically handles pagination to retrieve up to max_results users.

    IMPORTANT: The maximum allowed value for max_results is 100. If you need more users, you must make
    multiple search calls with different queries to narrow down the results.

    Args:
        attribute_name: The technical name of the attribute to filter by. Use `get_user_attribute_definitions`
            to get available attribute names.
        attribute_value: The value to filter for.
        include_attributes: List of additional user attribute technical names to include in the response.
        sort_by: Optional list to sort results. Available options: "first_name", "last_name", "department".
        max_results: Maximum number of users to retrieve (default: 100, max: 100). API handles pagination automatically.
    """
    graph_ctx = ctx.deps

    if not isinstance(graph_ctx.deps.auth, FlipBearerAuth):
        return "Error fetching user search results"

    max_allowed = graph_ctx.deps.app_services.settings.user_search_max_results
    if max_results > max_allowed:
        return f"Error: max_results ({max_results}) exceeds the maximum allowed value of {max_allowed}. Please use a value of {max_allowed} or less."

    order_by = [_map_sort_order(order) for order in sort_by] if sort_by else None
    api = UserCoreApi(graph_ctx.deps.app_services.http_client, graph_ctx.deps.app_services.settings)

    users = await api.search_users(
        auth=graph_ctx.deps.auth,
        attribute_technical_name=attribute_name,
        attribute_value=attribute_value,
        order_by=order_by,
        max_results=max_results,
    )

    if not users:
        return "No users found matching the specified attribute filter"

    graph_ctx.state.add_users(users)

    def format_user(user: User) -> str:
        result = f"- {user.first_name} {user.last_name}\n"
        if include_attributes:
            result += "\n".join([f"  - {attr.name}: {attr.value}" for attr in user.user_attributes if attr.name in include_attributes])
        return result

    user_info = "\n".join([format_user(user) for user in users])
    total_message = f"**Found {len(users)} user(s)**"
    if len(users) == max_results:
        total_message += f" (limited to {max_results})"
    return f"{total_message}:\n{user_info}"
