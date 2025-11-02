# 💰 Money Agent - Weekly Accountability & Price Pool Management

Automated weekly accountability agent that tracks habit compliance, charges for missed habits, and manages a cumulative price pool with Discord reporting.

## 🎯 Overview

The Money Agent automatically:
- **Runs every Sunday at 9 PM** (Europe/Berlin timezone)
- **Tracks all users** from your Notion Users database
- **Calculates habit compliance** by comparing target frequency vs actual proofs
- **Charges €0.50 per missed habit occurrence**
- **Saves all charges** to a Notion Price Pool database
- **Sends a formatted report** to your Discord accountability channel

## 📊 How It Works

### Weekly Check Flow

1. **Fetch Users**: Retrieves all active users from Notion Users DB
2. **Get Habits**: For each user, fetches their habits from Habits DB
3. **Count Proofs**: Queries Proofs DB for evidence submitted Monday-Sunday
4. **Calculate Compliance**: Compares target frequency vs actual proofs
5. **Generate Charges**: Creates €0.50 charges for each missed occurrence
6. **Save to Notion**: Logs all charges in the Price Pool database
7. **Send Report**: Posts formatted accountability report to Discord

### Example Calculation

**User**: Marc (@marc)
**Week**: Oct 21-27, 2025

**Habits**:
- Morning Exercise (5x/week): 5 proofs → €0.00 (perfect!)
- Meditation (5x/week): 3 proofs → €1.00 (2 missed)
- Guitar (3x/week): 2 proofs → €0.50 (1 missed)

**Total Charge**: €1.50

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd money_agent
pip install -r requirements.txt
```

### 2. Configure Environment

Add to your `.env` file:

```env
# Required: Price Pool Database ID
NOTION_DATABASE_PRICE_POOL=29bd42a1faf581dca967e97291af5495

# Already configured (verify these exist)
NOTION_TOKEN=your_notion_token
DISCORD_BOT_TOKEN=your_discord_token
DISCORD_ACCOUNTABILITY_GROUP=your_channel_id
NOTION_DATABASE_USERS=user_db_id
NOTION_DATABASE_HABITS=habits_db_id
NOTION_DATABASE_PROOFS=proofs_db_id
```

### 3. Verify Configuration

```bash
python main.py --config
```

This checks that all required settings are configured.

### 4. Test Run (Dry Run)

```bash
python main.py --dry-run
```

This runs the full accountability check without saving anything (preview mode).

### 5. Start the Scheduler

```bash
python main.py
```

The agent will now run automatically every Sunday at 9 PM.

## 💻 Usage

### Running Modes

#### Scheduler Mode (Default)
```bash
python main.py
```
Runs in background, executes check every Sunday at 9 PM.

#### Force Run (Immediate)
```bash
python main.py --force
```
Runs the accountability check right now (saves charges).

#### Dry Run (Preview)
```bash
python main.py --dry-run
```
Runs the full check without saving to Notion or sending to Discord.

#### Report Only (Read-Only)
```bash
python main.py --report
```
Generates and displays the report without creating any charges.

#### Check Configuration
```bash
python main.py --config
```
Validates all settings and shows configuration status.

#### Show Next Run
```bash
python main.py --next
```
Displays when the next scheduled check will occur.

#### Test Discord
```bash
python main.py --test-discord
```
Sends a test message to Discord to verify connection.

### Command Line Options

```
--force           Run check immediately (ignore schedule)
--dry-run         Preview mode (no changes saved)
--report          Generate report only (read-only)
--config          Check configuration status
--next            Show next scheduled run
--test-discord    Test Discord connection
--log-level       Set logging level (DEBUG, INFO, WARNING, ERROR)
```

## 📁 Project Structure

```
money_agent/
├── agents/
│   └── money_agent.py          # Main orchestrator
├── tools/
│   ├── notion_tools.py         # Notion API operations
│   └── calculation_tools.py    # Compliance calculations
├── scheduler/
│   └── weekly_scheduler.py     # APScheduler setup
├── discord/
│   └── report_sender.py        # Discord formatting & sending
├── models/
│   ├── compliance_models.py    # Pydantic models for compliance
│   └── price_pool_models.py    # Pydantic models for price pool
├── config/
│   └── settings.py             # Configuration management
├── tests/
│   └── test_money_agent.py     # Unit & integration tests
├── main.py                      # CLI entry point
├── requirements.txt             # Dependencies
└── README.md                    # This file
```

## 🗄️ Notion Database Schema

### Price Pool Database

**Database Name**: `9. price pool DB`
**Database ID**: `29bd42a1faf581dca967e97291af5495`

**Properties**:
- **Discord ID** (Title) - User's Discord ID
- **Week date** (Date) - Start date of the week (Monday)
- **User** (Relation) - Link to Users DB
- **Message** (Rich Text) - Description (e.g., "Meditation: 2 missed (3/5)")
- **Price** (Number) - Charge amount in euros

### Required Databases

- **Users DB**: Discord ID, Name, Habits (relation)
- **Habits DB**: Habit name, Target frequency
- **Proofs DB**: User, Habit, Date

## ⚙️ Configuration

### Schedule Settings

Edit in `config/settings.py`:

```python
SCHEDULE_DAY = "sunday"        # Day of week
SCHEDULE_HOUR = 21             # 9 PM
SCHEDULE_MINUTE = 0            # On the hour
SCHEDULE_TIMEZONE = "Europe/Berlin"
```

### Pricing Settings

```python
CHARGE_PER_MISS = 0.50  # €0.50 per missed occurrence
```

### Feature Flags

```python
DRY_RUN = False         # Set to True to prevent saving
ENABLE_DISCORD = True   # Set to False to disable Discord
```

## 🧪 Testing

### Unit Tests

```bash
pytest tests/test_calculation_tools.py -v
```

### Integration Tests

```bash
pytest tests/test_notion_tools.py -v
```

### Full Test Suite

```bash
pytest tests/ -v
```

## 📊 Discord Report Format

```
📊 WEEKLY ACCOUNTABILITY REPORT
Week: Oct 21 - Oct 27, 2025

👤 John Doe (@johndoe)
✅ Morning Exercise: 5/5 completed
❌ Meditation: 3/5 completed (2 missed) → €1.00
❌ Reading: 2/3 completed (1 missed) → €0.50
Subtotal: €1.50

👤 Jane Smith (@janesmith)
✅ Journaling: 5/5 completed
✅ Deep Work: 5/5 completed
Subtotal: €0.00 🎉

💰 PRICE POOL SUMMARY
This week's charges: €1.50
Total pool balance: €15.50

📈 Users tracked: 2
✨ Perfect weeks: 1
💸 Users with charges: 1

🎯 Next check: Sunday, Oct 28 at 9:00 PM
```

## 🛠️ Troubleshooting

### "Configuration validation failed"

Check that all required environment variables are set in `.env`:
```bash
python main.py --config
```

### "Channel not found"

Verify `DISCORD_ACCOUNTABILITY_GROUP` is correct:
```bash
python main.py --test-discord
```

### "Database not found"

Ensure the Notion integration has access to all databases:
1. Open each database in Notion
2. Click "..." → "Connections"
3. Add your integration

### "No users found"

Check that:
- Users database has Discord IDs
- Users have habits assigned (relation)
- Habits have target frequencies set

## 📝 Logging

Logs are written to:
- **Console**: Real-time output
- **File**: `money_agent.log`

Set log level:
```bash
python main.py --log-level DEBUG
```

## 🔒 Security

- **Never commit `.env`** to git
- **Keep API tokens secure**
- **Use environment variables** for all sensitive data
- **Review permissions** for Notion integration

## 🚀 Deployment

### Running as a Service (Linux)

Create `/etc/systemd/system/money-agent.service`:

```ini
[Unit]
Description=Money Agent - Habit Accountability
After=network.target

[Service]
Type=simple
User=your_user
WorkingDirectory=/path/to/money_agent
ExecStart=/usr/bin/python3 main.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable money-agent
sudo systemctl start money-agent
sudo systemctl status money-agent
```

### Running with Docker

```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY . /app

RUN pip install -r requirements.txt

CMD ["python", "main.py"]
```

Build and run:
```bash
docker build -t money-agent .
docker run -d --env-file .env money-agent
```

## 📈 Monitoring

### Check Status
```bash
tail -f money_agent.log
```

### View Next Run
```bash
python main.py --next
```

### Test Discord Connection
```bash
python main.py --test-discord
```

## 🎯 Features

✅ Automated weekly scheduling
✅ Notion database integration
✅ Discord rich embed reports
✅ Dry-run mode for testing
✅ Comprehensive logging
✅ Error handling & retries
✅ CLI with multiple modes
✅ Type hints & validation (Pydantic)
✅ Async/await throughout
✅ Unit & integration tests

## 📚 Dependencies

- `anthropic` - Claude AI SDK
- `notion-client` - Notion API
- `discord.py` - Discord bot
- `pydantic` - Data validation
- `apscheduler` - Job scheduling
- `pytz` - Timezone support
- `python-dotenv` - Environment variables
- `rich` - Terminal formatting
- `pytest` - Testing framework

## 🤝 Contributing

This is a personal project, but suggestions are welcome!

## 📄 License

MIT License - See LICENSE file

---

**Created**: January 2025
**Version**: 1.0.0
**Status**: ✅ Production Ready
