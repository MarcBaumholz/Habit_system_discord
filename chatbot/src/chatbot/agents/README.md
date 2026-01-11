# Chatbot Agents

This directory contains the core logic of the agents, implemented using a combination of `pydantic-graph` for graph-based workflow control and `pydantic-ai` for interactions with large language models.

## Agent Overview

Each subdirectory represents a distinct agent or sub-graph responsible for a specific part of the process.

*   **`chat_agent/`**: The main AskAI agent that orchestrates the conversation. It handles user input, manages chat history, decides when to call tools or the retrieval agent, formats the final prompt for the LLM, and processes the response.
*   **`retrieval_agent/`**: An agent specialized in retrieving relevant context from the indexed knowledge base and posts based on a given query.
*   **`post_creation_agent/`**: An agent specialized for post creation. It has different prompts than the `chat_agent` and is designed to output a structured `Post` object.
*   **`shared/`**: This directory contains reusable components that are shared across multiple agents, such as common tools, state models, and graph nodes.

## Common Structure within Agent Directories

Each agent directory (e.g., `chat_agent/`) generally follows this structure:

```
<agent_name>/
├── prompts/              # Directory holding prompt templates (.md files).
├── agent.py              # The main graph definition (state, nodes, edges).
├── state.py              # Pydantic models for the agent's specific state.
├── tools.py              # Agent-specific tool definitions.
├── structured_outputs.py # Pydantic models for parsing LLM outputs.
```

## Key Concepts

*   **`pydantic-graph`:** A library for building stateful, multi-actor applications with LLMs by representing logic as a graph. It is used here to define the overall flow and state management of the agents.
    *   **State:** A Pydantic model holding information passed between nodes (e.g., chat history, retrieved documents, current query).
    *   **Nodes:** Python functions or callables representing steps in the agent's process (e.g., call LLM, retrieve documents, format prompt).
    *   **Edges:** Define the flow between nodes, potentially based on conditions in the state.
*   **`pydantic-ai`:** A library for running LLMs with structured inputs and outputs. In this project, it is primarily used within graph nodes to call the LLM, handle tool use, and parse the model's response.
*   **Structured Outputs:** Using Pydantic models (`structured_outputs.py`) ensures that the output from LLMs is reliably parsed into a usable format for subsequent steps in the graph.
*   **Tools (`tools.py`):** Functions that the agent can call to interact with its environment. These can be defined in the `shared` directory for reuse or within an agent's own directory for specific tasks.
*   **Prompts (`prompts/`)**: Externalizing prompt templates makes them easier to manage and modify without changing the agent's core code.

---
*Refer to the `agent.py` file within each specific agent directory for the detailed implementation of its graph logic.* 