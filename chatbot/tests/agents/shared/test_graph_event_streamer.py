import asyncio
import json

import pytest
from pydantic import BaseModel

from chatbot.agents.shared.graph_event_streamer import AnswerEvent, ErrorEvent, GraphEventStreamer


async def _consume_all(streamer: GraphEventStreamer) -> list[str]:
    out: list[str] = []
    async for item in streamer:
        out.append(item)
    return out


@pytest.mark.asyncio
async def test_emit_json_and_iteration_closes():
    event_streamer: GraphEventStreamer[AnswerEvent] = GraphEventStreamer(debug=False)
    consumer = asyncio.create_task(_consume_all(event_streamer))
    event_streamer.emit_json(AnswerEvent(answer="hello"))
    await event_streamer.close()
    items = await consumer
    assert len(items) == 1
    payload = json.loads(items[0])
    assert payload == {"answer": "hello"}


@pytest.mark.asyncio
@pytest.mark.parametrize("debug,expected_count,expected_answer", [(False, 0, None), (True, 1, "visible")])
async def test_emit_debug_gated_by_flag(debug, expected_count, expected_answer):
    event_streamer: GraphEventStreamer[AnswerEvent] = GraphEventStreamer(debug=debug)
    event_streamer.emit_debug(AnswerEvent(answer="visible"))
    await event_streamer.close()
    items = await _consume_all(event_streamer)
    assert len(items) == expected_count
    if expected_count:
        assert json.loads(items[0])["answer"] == expected_answer


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "chunk,expected",
    [
        ("foo\n\nbar\n\n", ["foo\n\n", "bar\n\n"]),
        ("foo", ["foo"]),
        ("\n\n", ["\n\n"]),
        ("", []),
    ],
)
async def test_stream_answer_chunk_splitting(chunk, expected):
    event_streamer: GraphEventStreamer[AnswerEvent] = GraphEventStreamer(debug=False)
    event_streamer.stream_answer_chunk(chunk)
    await event_streamer.close()
    answers = [json.loads(i)["answer"] for i in await _consume_all(event_streamer)]
    assert answers == expected


class _FailingModel(BaseModel):
    def model_dump_json(self, *args, **kwargs) -> str:  # type: ignore[override]
        raise RuntimeError("boom")


@pytest.mark.asyncio
async def test_encoding_failure_emits_error_event():
    event_streamer: GraphEventStreamer[ErrorEvent] = GraphEventStreamer(debug=False)
    event_streamer.emit_json(_FailingModel())  # type: ignore[arg-type]
    await event_streamer.close()
    items = await _consume_all(event_streamer)
    assert len(items) == 1
    payload = json.loads(items[0])
    assert payload == {"error": "Failed to encode payload"}
