# Testing Strategy (TDD)

## Principles
- No mock data in production; use factories/seeders only in tests
- Unit tests per command/handler
- Integration tests for Notion sync and Discord events

## Test Areas
- Command validation (e.g., `/proof` requires attachment or unit)
- Streak calculations and cheatday logic
- Weekly summary generation
- Permission/role checks in channels
- Error handling: invalid tokens, Notion failures, missing permissions

## Tooling
- Node/TypeScript bot: Jest + ts-jest + supertest where applicable
- Contract tests for Notion API wrappers
