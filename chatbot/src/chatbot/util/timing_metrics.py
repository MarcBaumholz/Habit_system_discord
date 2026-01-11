import time

from opentelemetry.metrics import Histogram

from chatbot.util.observability import meter

chat_agent_time_2_first_token = meter.create_histogram(
    name="chat_agent_time_2_first_token_seconds",
    description="Time to first token for chat agent",
    unit="s",
    explicit_bucket_boundaries_advisory=[2.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0, 14.0, 16.0, 18.0, 20.0, 25.0, 30.0],
)

chat_agent_generation_time = meter.create_histogram(
    name="chat_agent_generation_time_seconds",
    description="Generation time for chat agent",
    unit="s",
    explicit_bucket_boundaries_advisory=[2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 12.0, 15.0],
)

chat_agent_total_time = meter.create_histogram(
    name="chat_agent_total_time_seconds",
    description="Total time for chat agent",
    unit="s",
    explicit_bucket_boundaries_advisory=[2.0, 4.0, 6.0, 8.0, 10.0, 12.0, 14.0, 16.0, 18.0, 20.0, 22.0, 24.0, 26.0, 28.0, 30.0],
)

chat_agent_retrieval_time = meter.create_histogram(
    name="chat_agent_retrieval_time_seconds",
    description="Total retrieval time for chat agent",
    unit="s",
    explicit_bucket_boundaries_advisory=[4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 12.0, 14.0, 16.0, 18.0, 20.0],
)

chat_agent_retrieval_times_per_iteration = meter.create_histogram(
    name="chat_agent_retrieval_times_per_iteration_seconds",
    description="Retrieval times per iteration for chat agent",
    unit="s",
    explicit_bucket_boundaries_advisory=[2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 12.0, 15.0],
)

post_creation_agent_total_time = meter.create_histogram(
    name="post_creation_agent_total_time_seconds",
    description="Total time for post creation agent",
    unit="s",
    explicit_bucket_boundaries_advisory=[5.0, 10.0, 15.0, 16.0, 18.0, 20.0, 22.0, 24.0, 26.0, 28.0, 30.0, 32.0, 34.0, 36.0, 38.0, 40.0, 42.0, 44.0, 46.0, 48.0, 50.0],
)

post_creation_agent_retrieval_time = meter.create_histogram(
    name="post_creation_agent_retrieval_time_seconds",
    description="Total retrieval time for post creation agent",
    unit="s",
    explicit_bucket_boundaries_advisory=[4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 12.0, 14.0, 16.0, 18.0, 20.0],
)

post_creation_agent_retrieval_times_per_iteration = meter.create_histogram(
    name="post_creation_agent_retrieval_times_per_iteration_seconds",
    description="Retrieval times per iteration for post creation agent",
    unit="s",
    explicit_bucket_boundaries_advisory=[4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 12.0, 14.0, 16.0, 18.0, 20.0],
)


class TimingMetrics:
    def __init__(self, total_time_metric: Histogram, retrieval_time_metric: Histogram, retrieval_times_per_iteration_metric: Histogram):
        self.total_time_metric = total_time_metric
        self.retrieval_time_metric = retrieval_time_metric
        self.retrieval_times_per_iteration_metric = retrieval_times_per_iteration_metric

        self._start_time: float | None = None
        self.retrieval_times: list[float] = []
        self.time_2_first_token: float | None = None

    @property
    def start_time(self) -> float:
        if self._start_time is None:
            raise RuntimeError("Timing not started - call start_total_timing() first")
        return self._start_time

    def start_total_timing(self) -> None:
        self._start_time = time.time()

    def record_retrieval_time(self, value: float) -> None:
        self.retrieval_times.append(value)

    def record_time_2_first_token(self, value: float) -> None:
        self.time_2_first_token = value

    def finalize(self) -> None:
        if self._start_time is None:
            return

        total_time = time.time() - self.start_time
        self.total_time_metric.record(total_time)

        if self.retrieval_times:
            for retrieval_time in self.retrieval_times:
                self.retrieval_times_per_iteration_metric.record(retrieval_time)
            total_retrieval = sum(self.retrieval_times)
            self.retrieval_time_metric.record(total_retrieval)


class ChatAgentTiming(TimingMetrics):
    def __init__(self) -> None:
        super().__init__(total_time_metric=chat_agent_total_time, retrieval_time_metric=chat_agent_retrieval_time, retrieval_times_per_iteration_metric=chat_agent_retrieval_times_per_iteration)

    def record_time_2_first_token(self, value: float) -> None:
        super().record_time_2_first_token(value)
        chat_agent_time_2_first_token.record(value)

    def finalize(self) -> None:
        if self._start_time is None:
            return

        total_time = time.time() - self.start_time
        self.total_time_metric.record(total_time)

        if self.time_2_first_token is not None:
            generation_time = total_time - self.time_2_first_token
            chat_agent_generation_time.record(generation_time)

        if self.retrieval_times:
            for retrieval_time in self.retrieval_times:
                self.retrieval_times_per_iteration_metric.record(retrieval_time)
            total_retrieval = sum(self.retrieval_times)
            self.retrieval_time_metric.record(total_retrieval)


class PostCreationAgentTiming(TimingMetrics):
    def __init__(self) -> None:
        super().__init__(total_time_metric=post_creation_agent_total_time, retrieval_time_metric=post_creation_agent_retrieval_time, retrieval_times_per_iteration_metric=post_creation_agent_retrieval_times_per_iteration)


def create_chat_agent_timing() -> ChatAgentTiming:
    return ChatAgentTiming()


def create_post_creation_agent_timing() -> PostCreationAgentTiming:
    return PostCreationAgentTiming()
