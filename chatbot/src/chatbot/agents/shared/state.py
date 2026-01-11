from __future__ import annotations

import logging
from collections.abc import Sequence
from dataclasses import dataclass, field
from datetime import datetime
from typing import TYPE_CHECKING, Any, cast

from pydantic_ai.messages import ModelMessage, ModelResponse

from chatbot.agents.shared.graph_event_streamer import GraphEventStreamer
from chatbot.api_clients.user_api import User
from chatbot.pydantic_models import CompanyInfoData, Document, ToolCall
from chatbot.util.auth import FlipBearerAuth
from chatbot.util.timing_metrics import TimingMetrics
from chatbot.util.usage_metrics import UsageMetrics
from chatbot.utils import extract_tool_calls_from_message

if TYPE_CHECKING:
    from chatbot.agents.shared.subagent import SubAgent
    from chatbot.app_services import AppServices

_logger = logging.getLogger(__name__)


@dataclass
class AgentGraphDependencies:
    # Request-specific dependencies
    company_info: CompanyInfoData
    auth: FlipBearerAuth
    timing_metrics: TimingMetrics
    usage_metrics: UsageMetrics
    event_streamer: GraphEventStreamer[Any]
    current_datetime: datetime
    # Application-wide services (settings, http_client, models, feature_toggles, agent graphs)
    app_services: AppServices


@dataclass
class AgentState:
    query: str = ""
    answer: str = ""
    messages: list[ModelMessage] = field(default_factory=list)
    tool_calls: list[ToolCall] = field(default_factory=list)
    iteration: int = 0

    def get_number_of_tool_calls(self, tool_name: str) -> int:
        return len([call for call in self.tool_calls if call.name == tool_name])

    def add_message(self, message: ModelMessage) -> None:
        if message in self.messages:
            return

        self.messages.append(message)

        if isinstance(message, ModelResponse):
            new_tool_calls = extract_tool_calls_from_message(message)
            if new_tool_calls:
                self.tool_calls.extend(new_tool_calls)


@dataclass
class SubAgentExecutionResults:
    results: list[SubAgentExecutionResult[AgentState]] = field(default_factory=list)

    def for_agent[T: AgentState](self, agent_class: type[SubAgent[T]]) -> list[T]:
        result = list[T]()
        for execution_result in self.results:
            if execution_result.agent_class == agent_class:
                result.append(cast(T, execution_result.result))

        return result

    def append[T: AgentState](self, agent: SubAgent[T], state: T) -> None:
        self.results.append(SubAgentExecutionResult(type(agent), state))


@dataclass
class SubAgentExecutionResult[T: AgentState]:
    agent_class: type[SubAgent[AgentState]]
    result: T


@dataclass
class OrchestrationAgentState(AgentState):
    sub_agent_execution_results: SubAgentExecutionResults = field(default_factory=SubAgentExecutionResults)
    refined_context: Sequence[Document | User] = field(default_factory=list)
