import logging
from collections import defaultdict

from opentelemetry.metrics import Histogram
from pydantic_ai.usage import RunUsage

from chatbot.util.observability import meter

chat_agent_tokens = meter.create_histogram(name="chat_agent_tokens", description="Token usage for chat agent calls", unit="tokens")
chat_agent_costs = meter.create_histogram(name="chat_agent_costs", description="Cost per chat agent LLM call", unit="USD", explicit_bucket_boundaries_advisory=[0.00001, 0.00005, 0.0001, 0.0002, 0.0005, 0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1])
chat_agent_requests = meter.create_histogram(name="chat_agent_requests", description="Request count for chat agent calls", unit="requests")

post_creation_agent_tokens = meter.create_histogram(name="post_creation_agent_tokens", description="Token usage for post creation agent calls", unit="tokens")
post_creation_agent_costs = meter.create_histogram(
    name="post_creation_agent_costs", description="Cost per post creation agent LLM call", unit="USD", explicit_bucket_boundaries_advisory=[0.00001, 0.00005, 0.0001, 0.0002, 0.0005, 0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1]
)
post_creation_agent_requests = meter.create_histogram(name="post_creation_agent_requests", description="Request count for post creation agent calls", unit="requests")

_logger = logging.getLogger(__name__)


# These are the OpenAI prices per token (converted from per-1000-token pricing)
# Azure prices depend on region and deployment but should be similar enough
PRICING_CONFIG = {
    "gpt-4o-mini": {"input": 0.00015 / 1000, "output": 0.0006 / 1000, "cached_input": 0.000075 / 1000},
    "gpt-4.1-nano": {"input": 0.0001 / 1000, "output": 0.0004 / 1000, "cached_input": 0.000025 / 1000},
    "gpt-4.1-mini": {"input": 0.0004 / 1000, "output": 0.0016 / 1000, "cached_input": 0.0001 / 1000},
    "gpt-4.1-base": {"input": 0.002 / 1000, "output": 0.008 / 1000, "cached_input": 0.0005 / 1000},
}


class UsageMetrics:
    def __init__(self, tokens_metric: Histogram, costs_metric: Histogram, requests_metric: Histogram):
        self.tokens_metric = tokens_metric
        self.costs_metric = costs_metric
        self.requests_metric = requests_metric
        self.total_usage: dict[str, RunUsage] = defaultdict(RunUsage)

    def _calculate_costs(self, model: str, input_tokens: int, output_tokens: int, cached_input_tokens: int) -> tuple[float, float, float, float]:
        actual_input_tokens = input_tokens - cached_input_tokens
        input_cost = actual_input_tokens * PRICING_CONFIG[model]["input"]
        output_cost = output_tokens * PRICING_CONFIG[model]["output"]
        cached_cost = cached_input_tokens * PRICING_CONFIG[model]["cached_input"]
        total_cost = input_cost + output_cost + cached_cost
        return input_cost, output_cost, cached_cost, total_cost

    def record_llm_call_usage(self, node_name: str, model: str, usage: RunUsage) -> None:
        self.total_usage[model] += usage

        input_cost, output_cost, cached_cost, total_cost = self._calculate_costs(model, usage.input_tokens, usage.output_tokens, usage.cache_read_tokens)

        base_labels = {"level": "node", "node": node_name, "model": model}

        self.tokens_metric.record(usage.input_tokens, {**base_labels, "token_type": "input"})
        self.costs_metric.record(input_cost, {**base_labels, "token_type": "input"})

        self.tokens_metric.record(usage.output_tokens, {**base_labels, "token_type": "output"})
        self.costs_metric.record(output_cost, {**base_labels, "token_type": "output"})

        self.tokens_metric.record(usage.cache_read_tokens, {**base_labels, "token_type": "cached_input"})
        self.costs_metric.record(cached_cost, {**base_labels, "token_type": "cached_input"})

        self.costs_metric.record(total_cost, {**base_labels, "token_type": "total"})
        self.requests_metric.record(usage.requests, base_labels)

    def finalize(self) -> None:
        total_input_tokens = sum(usage.input_tokens for usage in self.total_usage.values())
        total_output_tokens = sum(usage.output_tokens for usage in self.total_usage.values())
        total_cached_input_tokens = sum(usage.cache_read_tokens for usage in self.total_usage.values())
        total_requests = sum(usage.requests for usage in self.total_usage.values())

        total_input_cost = 0.0
        total_output_cost = 0.0
        total_cached_cost = 0.0
        total_cost = 0.0

        for model, usage in self.total_usage.items():
            input_cost, output_cost, cached_cost, model_total_cost = self._calculate_costs(model, usage.input_tokens, usage.output_tokens, usage.cache_read_tokens)
            total_input_cost += input_cost
            total_output_cost += output_cost
            total_cached_cost += cached_cost
            total_cost += model_total_cost
        base_labels = {"level": "query", "model": "all"}

        self.tokens_metric.record(total_input_tokens, {**base_labels, "token_type": "input"})
        self.costs_metric.record(total_input_cost, {**base_labels, "token_type": "input"})

        self.tokens_metric.record(total_output_tokens, {**base_labels, "token_type": "output"})
        self.costs_metric.record(total_output_cost, {**base_labels, "token_type": "output"})

        self.tokens_metric.record(total_cached_input_tokens, {**base_labels, "token_type": "cached_input"})
        self.costs_metric.record(total_cached_cost, {**base_labels, "token_type": "cached_input"})

        self.costs_metric.record(total_cost, {**base_labels, "token_type": "total"})
        self.requests_metric.record(total_requests, base_labels)


class ChatAgentUsageMetrics(UsageMetrics):
    def __init__(self) -> None:
        super().__init__(tokens_metric=chat_agent_tokens, costs_metric=chat_agent_costs, requests_metric=chat_agent_requests)


class PostCreationAgentUsageMetrics(UsageMetrics):
    def __init__(self) -> None:
        super().__init__(tokens_metric=post_creation_agent_tokens, costs_metric=post_creation_agent_costs, requests_metric=post_creation_agent_requests)


def create_chat_agent_usage_metrics() -> ChatAgentUsageMetrics:
    return ChatAgentUsageMetrics()


def create_post_creation_agent_usage_metrics() -> PostCreationAgentUsageMetrics:
    return PostCreationAgentUsageMetrics()
