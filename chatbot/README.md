# Chatbot Service

This service provides the main API for the AskAI Chatbot. It handles user interactions, orchestrates the retrieval and generation process using a combination of `pydantic-graph` for defining agent workflows and `pydantic-ai` for LLM interactions, and returns responses to the user.

## Project Structure

```
chatbot/
├── src/
│   └── chatbot/
│       ├── agents/         # Core agent definitions (see src/chatbot/agents/README.md)
│       │   ├── chat_agent/
│       │   ├── retrieval_agent/
│       │   ├── post_creation_agent/
│       │   └── shared/       # Shared components for agents (tools, state, nodes)
│       ├── api/            # FastAPI application and error handling
│       │   ├── api.py      # FastAPI app and endpoints
│       │   └── error_handlers.py # Custom FastAPI error handling
│       ├── util/           # Utility modules
│       │   ├── observability.py
│       │   └── configure_logging.py
│       ├── app_services.py # Service lifecycle management (startup, shutdown)
│       ├── config.py       # Configuration settings (models, API keys)
│       ├── pydantic_models.py # Core Pydantic models for data structures
│       ├── utils.py        # General utility functions
│       └── __init__.py
├── Dockerfile              # Instructions for building the service Docker image
├── Makefile                # Used for running tests and development commands
├── pyproject.toml          # Python project and dependency management
└── tests/                  # Unit and integration tests
```

- **Note:** The project uses a `src` layout. All imports should use the `chatbot.` prefix (e.g., `from chatbot.api.api import app`).
- **Dependencies:** Use `pyproject.toml` for dependency management.

## Key Components

*   **FastAPI (`src/chatbot/api/api.py`)**: Exposes the HTTP endpoints for interacting with the chatbot.
*   **Service Management (`src/chatbot/app_services.py`)**: The `AppServices` class handles the initialization, management, and clean shutdown of all application components, including agents and external service connections.
*   **`pydantic-graph` and `pydantic-ai` Agents (`src/chatbot/agents/`)**: Implement the core logic for:
    *   Managing conversation state.
    *   Deciding when to retrieve information or use tools.
    *   Calling other agents/processes (e.g., retrieval).
    *   Formatting prompts and generating the final response.
    *   (Note: `pydantic-graph` is included as a core dependency of the `pydantic-ai` library.)
*   **Shared Agent Components (`src/chatbot/agents/shared/`)**: Contains reusable components for the agents, including:
    *   **Tools (`tools/`)**: Functions that agents can call to interact with the outside world (e.g., `call_retrieval_agent`, `get_current_date_time`).
    *   **State (`state.py`)**: Shared Pydantic models defining the state that is passed between agent nodes.
    *   **Nodes (`nodes.py`)**: Reusable processing steps (nodes) for the agent graphs.
*   **Configuration (`src/chatbot/config.py`)**: Loads settings from environment variables for connecting to LLMs, vector stores, and other services.
*   **Pydantic Models (`src/chatbot/pydantic_models.py`)**: Centralizes the core data structures (e.g., `Document`, `CompanyInfoData`) used throughout the application.
*   **Error Handling (`src/chatbot/api/error_handlers.py`)**: Centralized FastAPI error handling and custom exception logic.
*   **Utilities (`src/chatbot/utils.py`, `src/chatbot/util/`)**: Helper functions and modules for tasks like document conversion, logging, observability, and chat history management.

## Database

The chatbot service uses a PostgreSQL database for persisting data. Database schema changes are managed using [Alembic](https://alembic.sqlalchemy.org/), a database migration tool for SQLAlchemy.

### Database Configuration

Database connection settings are configured through environment variables (see `src/chatbot/config.py`):
- Database URL and connection parameters
- Connection pooling settings

### Database Tables

Database table definitions are located in `src/chatbot/database/tables.py`. These use SQLAlchemy ORM models to define the schema.

### Generating Migrations

When you make changes to the database models in `src/chatbot/database/tables.py`, you need to generate a new migration:

```bash
make makemigrations
```

This command:
1. Detects changes in your SQLAlchemy models
2. Automatically generates a new Alembic migration file in `alembic/versions/`
3. Creates a timestamped migration with detected schema changes

**Important Notes:**
- Always review the generated migration file before applying it
- Add a descriptive message to the migration if needed by editing the generated file
- Commit the generated migration file to version control
- When adding migrations that will be deployed, include `[MIGRATION]` in your changelog entry

## Testing

The chatbot service includes both unit tests and integration tests to ensure code quality and API correctness.

### Running Tests

```bash
# Run all tests (unit + integration)
make test

# Run only integration tests
make test-integration

# Run tests for a specific agent
make test-retrieval_agent
```

### Integration Tests

Integration tests are located in `tests/api/` and test the full application stack including:
- FastAPI endpoints
- Service layer logic
- Database operations with real PostgreSQL (via testcontainers)
- Authentication and authorization
- Multi-tenancy isolation

**Key features:**
- Uses **testcontainers** to spin up a real PostgreSQL database for each test run
- Tests run in isolation with fresh database state
- Applies actual Alembic migrations to ensure schema correctness

### Inline Snapshots

Integration tests use [inline-snapshot](https://github.com/15r10nk/inline-snapshot) to capture and verify API responses. Snapshots are stored directly in the test code, making them easy to review and maintain.

**Benefits:**
- Complete response validation (structure, types, values)
- Self-documenting tests (snapshots show exact expected responses)
- Easy to update when API changes are intentional
- Catches unintended API breaking changes

**Working with snapshots:**

```bash
# Create/fix snapshots for tests
make snapshot-fix
```

**Important:** When modifying API responses, always run `make snapshot-fix` and carefully review the changes to ensure they are intentional before committing.

## API Endpoints

The following endpoints are exposed by the FastAPI application in `src/chatbot/api/api.py`. All endpoints require an `x-api-key` header for authentication.

*   **`GET /chatbot/health`**
    *   **Description**: Checks the health status of the chatbot service and its internal components (retrieval, chat, post creation agents).
    *   **Request**: None (Authentication via `x-api-key` header).
    *   **Response**: `JSON` - e.g., `{"status": "healthy", "services": ["retrieval_agent", "chat_agent", "post_creation_agent"]}`
    *   **Authentication**: Required (`x-api-key` header).

*   **`POST /chatbot/generator/chat_stream/`**
    *   **Description**: Initiates a streaming chat conversation. Sends back events (`text/event-stream`) containing parts of the response, context, and debug information (if enabled).
    *   **Request Body**: `JSON` (`ChatRequest` model)
        *   `query` (string): The user's latest message.
        *   `chat_history` (array): List of previous messages in the conversation.
        *   `debug` (boolean, optional, default: `false`): Whether to include debug information in the stream.
        *   `user_id` (string): Identifier for the user.
        *   `bot_id` (string): Identifier for the bot.
        *   `chat_id` (string): Identifier for the specific chat session.
    *   **Response**: `StreamingResponse` (`text/event-stream`) with JSON objects per event.
    *   **Authentication**: Required (`x-api-key` header).

*   **`POST /chatbot/generator/chat/`**
    *   **Description**: Initiates a non-streaming chat conversation. Returns the complete response once the generation is finished.
    *   **Request Body**: `JSON` (`ChatRequest` model - same as `chat_stream`)
    *   **Response**: `JSON` - Contains the final `answer` and `refined_context`. If `debug=true`, includes additional internal state information.
    *   **Authentication**: Required (`x-api-key` header).

*   **`POST /chatbot/generator/post_creation/`**
    *   **Description**: Handles the creation or refinement of a post (e.g., a knowledge base article) based on the conversation context.
    *   **Request Body**: `JSON` (`PostCreationRequest` model)
        *   `query` (string): The user's relevant message/request.
        *   `chat_history` (array): List of previous messages.
        *   `user_id` (string): Identifier for the user.
        *   `bot_id` (string): Identifier for the bot.
        *   `chat_id` (string): Identifier for the specific chat session.
        *   `debug` (boolean, optional, default: `false`): Whether to include debug information.
        *   `post` (object, optional): Existing post details if refining, based on the `Post` Pydantic model defined in `agents/post_creation_agent/structured_outputs.py`.
    *   **Response**: `JSON` - Contains the agent's `answer` and the resulting `post` details. Includes context/debug info if requested.
    *   **Authentication**: Required (`x-api-key` header).

*   **`POST /chatbot/generator/get_title/`**
    *   **Description**: Generates a concise title for a given chat history.
    *   **Request Body**: `JSON` (`TitleRequest` model)
        *   `chat_history` (array): List of messages in the conversation.
    *   **Response**: `JSON` - A string containing the generated title.
    *   **Authentication**: Required (`x-api-key` header).

**Note:** For detailed request/response models, refer to the Pydantic models defined in `src/chatbot/api/api.py` (e.g., `ChatRequest`, `PostCreationRequest`, `TitleRequest`) and the agent-specific structured outputs.

## Additional Documentation

- See `src/chatbot/agents/README.md` for details on agent design and structure.
- See the `Makefile` for development and test commands.
- See the `Dockerfile` for containerization instructions. 
