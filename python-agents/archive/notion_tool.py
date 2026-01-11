"""
Custom Notion Tool for CrewAI Agents
Provides access to Notion databases for habit tracking analysis
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from pathlib import Path
from notion_client import Client
from crewai.tools import BaseTool
import os
import json


class NotionHabitTool(BaseTool):
    name: str = "Notion Habit Tracker"
    description: str = """
    Access Notion habit tracking databases to retrieve user data, habits, and proofs.
    Use this tool to analyze user progress, habit completion, and group dynamics.

    Available operations:
    - get_active_users: Get all active users in the system
    - get_user_habits: Get all habits for a specific user (requires user_id)
    - get_user_proofs: Get proofs for a user in a date range (requires user_id, start_date, end_date)
    - get_midweek_analysis_data: Get all data needed for mid-week analysis (gets all active users with their habits and proofs)

    Example usage:
    - "get_active_users"
    - "get_user_habits:user_id_here"
    - "get_user_proofs:user_id_here:2025-01-20:2025-01-26"
    - "get_midweek_analysis_data"
    """

    def __init__(self):
        super().__init__()
        # Use object.__setattr__ to bypass Pydantic validation for these internal attributes
        object.__setattr__(self, 'notion', Client(auth=os.getenv('NOTION_TOKEN')))
        object.__setattr__(self, 'databases', {
            'users': os.getenv('NOTION_DATABASE_USERS'),
            'habits': os.getenv('NOTION_DATABASE_HABITS'),
            'proofs': os.getenv('NOTION_DATABASE_PROOFS'),
        })
        object.__setattr__(self, '_data_source_cache', {})

    def _run(self, operation: str) -> str:
        """
        Execute Notion operations

        Args:
            operation: Operation string in format "operation_name:param1:param2"

        Returns:
            JSON string with results
        """
        import json

        parts = operation.split(':')
        op_name = parts[0]

        try:
            if op_name == 'get_active_users':
                result = self._get_active_users()
            elif op_name == 'get_user_habits':
                user_id = parts[1] if len(parts) > 1 else None
                if not user_id:
                    return json.dumps({"error": "user_id required for get_user_habits"})
                result = self._get_user_habits(user_id)
            elif op_name == 'get_user_proofs':
                if len(parts) < 4:
                    return json.dumps({"error": "get_user_proofs requires: user_id:start_date:end_date"})
                user_id, start_date, end_date = parts[1], parts[2], parts[3]
                result = self._get_user_proofs(user_id, start_date, end_date)
            elif op_name == 'get_midweek_analysis_data':
                result = self._get_midweek_analysis_data()
            else:
                return json.dumps({"error": f"Unknown operation: {op_name}"})

            return json.dumps(result, indent=2, default=str)
        except Exception as e:
            return json.dumps({"error": str(e)})

    def _resolve_data_source_id(self, database_id: str) -> str:
        """
        Resolve data source id for a database id (Notion API v2025+).
        Falls back to the provided database id when resolution is unavailable.
        """
        if not database_id:
            return database_id

        database_id = self._normalize_notion_id(database_id)

        cached = self._data_source_cache.get(database_id)
        if cached:
            return cached

        data_source_id = database_id
        try:
            database = self.notion.databases.retrieve(database_id=database_id)
            data_sources = database.get('data_sources')
            if isinstance(data_sources, list) and data_sources:
                data_source_id = data_sources[0].get('id', data_source_id)
            elif isinstance(data_sources, dict):
                data_source_id = data_sources.get('id', data_source_id)
            else:
                data_source = database.get('data_source')
                if isinstance(data_source, dict) and data_source.get('id'):
                    data_source_id = data_source['id']
        except Exception:
            data_source_id = database_id

        self._data_source_cache[database_id] = data_source_id
        return self._normalize_notion_id(data_source_id)

    def _normalize_notion_id(self, raw_id: str) -> str:
        """Normalize Notion IDs to UUID format when provided without hyphens."""
        if not raw_id:
            return raw_id
        cleaned = raw_id.replace("-", "").strip()
        if len(cleaned) != 32:
            return raw_id
        return f"{cleaned[0:8]}-{cleaned[8:12]}-{cleaned[12:16]}-{cleaned[16:20]}-{cleaned[20:32]}"

    def _query_database(self, database_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        """Query a Notion database/data source across SDK versions."""
        if not database_id:
            raise ValueError("Missing Notion database id")

        database_id = self._normalize_notion_id(database_id)
        payload = {k: v for k, v in body.items() if v is not None}
        last_error: Optional[Exception] = None

        if hasattr(self.notion, 'data_sources'):
            data_source_id = self._resolve_data_source_id(database_id)
            try:
                return self.notion.data_sources.query(
                    data_source_id=data_source_id,
                    **payload
                )
            except Exception as e:
                last_error = e

        if hasattr(self.notion.databases, 'query'):
            try:
                return self.notion.databases.query(
                    database_id=database_id,
                    **payload
                )
            except Exception as e:
                last_error = e

        try:
            return self.notion.databases.parent.request(
                path=f"databases/{database_id}/query",
                method="POST",
                body=payload
            )
        except Exception as e:
            last_error = e

        if last_error:
            raise last_error

        raise RuntimeError("Notion query failed with unknown error")

    def _get_current_batch(self) -> Optional[Dict[str, Any]]:
        """
        Get current batch metadata from file
        Returns None if no batch is active
        """
        try:
            batch_file_path = Path(__file__).resolve().parent.parent / 'data' / 'current-batch.json'
            if not batch_file_path.exists():
                return None

            with batch_file_path.open('r', encoding='utf-8') as f:
                batch = json.load(f)
                return batch
        except Exception as e:
            print(f"❌ Error reading batch file: {e}")
            return None

    def _is_batch_active(self) -> bool:
        """
        Check if current batch is active (status = 'active')
        Returns False if no batch exists or batch is in pre-phase
        """
        batch = self._get_current_batch()
        return batch is not None and batch.get('status') == 'active'

    def _get_active_users(self) -> List[Dict[str, Any]]:
        """
        Get all active users in the current batch from Notion
        Returns users with Status = 'active' AND in current batch
        """
        # Get current batch
        batch = self._get_current_batch()
        if not batch:
            print('⚠️ No current batch found - returning empty user list')
            return []

        batch_name = batch.get('name')
        if not batch_name:
            print('⚠️ Batch has no name - returning empty user list')
            return []

        # Query users with compound filter: Status = 'active' AND Batch contains batch_name
        response = self._query_database(
            self.databases['users'],
            body={
                'filter': {
                    'and': [
                        {
                            'property': 'Status',
                            'select': {
                                'equals': 'active'
                            }
                        },
                        {
                            'property': 'Batch',
                            'multi_select': {
                                'contains': batch_name
                            }
                        }
                    ]
                }
            }
        )

        users = []
        for page in response['results']:
            props = page['properties']
            users.append({
                'id': page['id'],
                'discordId': self._get_rich_text(props.get('DiscordID', {})),
                'name': self._get_title(props.get('Name', {})),
                'timezone': self._get_rich_text(props.get('Timezone', {})),
                'trustCount': props.get('Trust Count', {}).get('number', 0),
                'status': 'active'
            })

        print(f'📊 Found {len(users)} active users in batch "{batch_name}"')
        return users

    def _get_user_habits(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all habits for a specific user"""
        response = self._query_database(
            self.databases['habits'],
            body={
                'filter': {
                    'property': 'User',
                    'relation': {
                        'contains': user_id
                    }
                }
            }
        )

        habits = []
        for page in response['results']:
            props = page['properties']
            smart_goal = self._get_rich_text(props.get('SMART Goal ', {}))
            if not smart_goal:
                smart_goal = self._get_rich_text(props.get('SMART Goal', {}))
            habits.append({
                'id': page['id'],
                'name': self._get_title(props.get('Name', {})),
                'frequency': props.get('Frequency', {}).get('number', 1),
                'minimalDose': self._get_rich_text(props.get('Minimal Dose', {})),
                'domains': [d['name'] for d in props.get('Domains', {}).get('multi_select', [])],
                'smartGoal': smart_goal,
                'why': self._get_rich_text(props.get('Why', {}))
            })

        return habits

    def _get_user_proofs(self, user_id: str, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """Get proofs for a user within a date range"""
        response = self._query_database(
            self.databases['proofs'],
            body={
                'filter': {
                    'and': [
                        {
                            'property': 'User',
                            'relation': {
                                'contains': user_id
                            }
                        },
                        {
                            'property': 'Date',
                            'date': {
                                'on_or_after': start_date
                            }
                        },
                        {
                            'property': 'Date',
                            'date': {
                                'on_or_before': end_date
                            }
                        }
                    ]
                },
                'sorts': [
                    {
                        'property': 'Date',
                        'direction': 'descending'
                    }
                ]
            }
        )

        proofs = []
        for page in response['results']:
            props = page['properties']
            is_minimal_dose = props.get('Is Minimal Dose ', {}).get('checkbox')
            if is_minimal_dose is None:
                is_minimal_dose = props.get('Is Minimal Dose', {}).get('checkbox', False)
            proofs.append({
                'id': page['id'],
                'habitId': props.get('Habit', {}).get('relation', [{}])[0].get('id', ''),
                'date': props.get('Date', {}).get('date', {}).get('start', ''),
                'unit': self._get_rich_text(props.get('Unit', {})),
                'isMinimalDose': is_minimal_dose,
                'isCheatDay': props.get('Is Cheat Day', {}).get('checkbox', False)
            })

        return proofs

    def _get_midweek_analysis_data(self) -> Dict[str, Any]:
        """
        Get all data needed for mid-week analysis
        Returns active users with their habits and this week's proofs
        Only processes users if batch is active
        """
        # Check if batch is active
        if not self._is_batch_active():
            print('⏸️ No active batch - skipping midweek analysis')
            return {
                'analysis_date': datetime.now().strftime('%Y-%m-%d'),
                'week_start': '',
                'week_end': '',
                'total_active_users': 0,
                'users_data': [],
                'message': 'No active batch - midweek analysis skipped'
            }

        batch = self._get_current_batch()
        batch_name = batch.get('name', 'Unknown') if batch else 'Unknown'
        print(f'📊 Running midweek analysis for batch: {batch_name}')

        # Calculate week range (Monday to Sunday)
        today = datetime.now()
        monday = today - timedelta(days=today.weekday())
        sunday = monday + timedelta(days=6)

        start_date = monday.strftime('%Y-%m-%d')
        end_date = sunday.strftime('%Y-%m-%d')

        # Get active users in current batch
        users = self._get_active_users()

        # For each user, get habits and proofs
        analysis_data = []
        for user in users:
            habits = self._get_user_habits(user['id'])
            proofs = self._get_user_proofs(user['id'], start_date, end_date)

            # Calculate progress for each habit
            habit_progress = []
            for habit in habits:
                habit_proofs = [p for p in proofs if p['habitId'] == habit['id']]
                completed_count = len(habit_proofs)
                target_frequency = habit['frequency']

                # Calculate midweek expected (by Wednesday, should have completed ~3/7 of weekly goal)
                days_into_week = today.weekday() + 1  # Monday = 1
                expected_by_now = (target_frequency * days_into_week) / 7

                progress = {
                    'habit_name': habit['name'],
                    'target_frequency': target_frequency,
                    'completed_count': completed_count,
                    'expected_by_now': round(expected_by_now, 1),
                    'on_track': completed_count >= expected_by_now,
                    'minimal_dose': habit['minimalDose'],
                    'why': habit['why']
                }
                habit_progress.append(progress)

            analysis_data.append({
                'user': {
                    'id': user['id'],
                    'name': user['name'],
                    'discordId': user['discordId']
                },
                'habits': habit_progress,
                'proofs': proofs,
                'proof_count': len(proofs),
                'total_habits': len(habits),
                'on_track_count': sum(1 for h in habit_progress if h['on_track']),
                'week_range': f"{start_date} to {end_date}"
            })

        return {
            'analysis_date': today.strftime('%Y-%m-%d'),
            'week_start': start_date,
            'week_end': end_date,
            'total_active_users': len(users),
            'users_data': analysis_data
        }

    def _get_rich_text(self, prop: Dict) -> str:
        """Extract rich text content from Notion property"""
        rich_text = prop.get('rich_text', [])
        if not rich_text:
            return ''
        return rich_text[0].get('text', {}).get('content', '') or rich_text[0].get('plain_text', '')

    def _get_title(self, prop: Dict) -> str:
        """Extract title content from Notion property"""
        title = prop.get('title', [])
        if not title:
            return ''
        return title[0].get('text', {}).get('content', '') or title[0].get('plain_text', '')
