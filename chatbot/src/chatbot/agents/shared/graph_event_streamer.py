from __future__ import annotations

import asyncio
from abc import ABC
from collections.abc import AsyncGenerator
from typing import TYPE_CHECKING, Annotated, Any

from pydantic import BaseModel, Field

from chatbot.api_clients.user_api import User
from chatbot.pydantic_models import Document, ToolCall

# This is a fix to break the cicular import of shared/state.py -> shared/graph_event_streamer.py -> retrieval_agent/state.py -> shared/state.py
if TYPE_CHECKING:
    from chatbot.agents.retrieval_agent.state import RetrievalAgentState
    from chatbot.agents.user_search_agent.state import UserSearchAgentState
else:
    RetrievalAgentState = Any
    UserSearchAgentState = Any


class Event(BaseModel, ABC):
    event: str


class AnswerEvent(Event):
    event: str = "answer"
    answer: str


class RefinedContextEvent(Event):
    event: str = "refined_context"
    refined_context: list[Document | User]


class RetrievalAgentStatesEvent(Event):
    event: str = "retrieval_agent_states"
    retrieval_agent_states: list[RetrievalAgentState]


class UserSearchAgentStatesEvent(Event):
    event: str = "user_search_agent_states"
    user_search_agent_states: list[UserSearchAgentState]


class ToolCallsEvent(Event):
    event: str = "tool_calls"
    tool_calls: list[ToolCall]


class Time2FirstTokenEvent(Event):
    event: str = "time_2_first_token"
    time_2_first_token: float


class TriggerFlipFlowEvent(Event):
    event: str = "trigger_flip_flow"
    user_id: str | None = None
    api_client_id: str | None = None
    keyword: str
    name: str
    reason: str
    index: int


class ErrorEvent(Event):
    event: str = "error"
    error: str


ChatAgentEvent = Annotated[
    AnswerEvent | RefinedContextEvent | RetrievalAgentStatesEvent | UserSearchAgentStatesEvent | ToolCallsEvent | Time2FirstTokenEvent | TriggerFlipFlowEvent | ErrorEvent,
    Field(discriminator="event"),
]
PostCreationAgentEvent = Annotated[
    AnswerEvent | RefinedContextEvent | RetrievalAgentStatesEvent | UserSearchAgentStatesEvent | ToolCallsEvent | ErrorEvent,
    Field(discriminator="event"),
]


class GraphEventStreamer[E: Event]:
    def __init__(
        self,
        *,
        debug: bool = False,
    ) -> None:
        self.debug = debug
        self._queue: asyncio.Queue[str] = asyncio.Queue()

    def stream_answer_chunk(self, chunk: str) -> None:
        # HACK: The Botplatform expects chunks ending with "\n\n" to stream.
        chunks = chunk.split("\n\n")
        parts = [c + "\n\n" for c in chunks[:-1]] + [chunks[-1]]

        for part in parts:
            if not part:
                continue
            self._put_model(AnswerEvent(answer=part))

    def emit_json(self, payload: E) -> None:
        self._put_model(payload)

    def emit_debug(self, payload: E) -> None:
        if not self.debug:
            return
        self.emit_json(payload)

    async def __aiter__(self) -> AsyncGenerator[str]:
        while True:
            try:
                item = await self._queue.get()
            except asyncio.QueueShutDown:
                break
            yield item

    def _put_model(self, model: BaseModel) -> None:
        try:
            self._queue.put_nowait(model.model_dump_json(exclude={"event"}) + "\n")
        except Exception:
            self._queue.put_nowait(ErrorEvent(error="Failed to encode payload").model_dump_json(exclude={"event"}) + "\n")

    async def close(self) -> None:
        self._queue.shutdown()
