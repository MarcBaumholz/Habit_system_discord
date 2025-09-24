# Operations

## Environments
- Local development with a Discord test server
- Production workspace with restricted permissions

## Deployment
- Node app on Fly.io/Render/Heroku or Docker
- Background schedulers for reminders/summaries (cron)

## Runtime Config
- .env (see example)
- Channel/role IDs stored in config Notion DB

## Incident Handling
- Alert on Notion API failures or rate limits
- Fallback: queue retries; do not drop proofs
