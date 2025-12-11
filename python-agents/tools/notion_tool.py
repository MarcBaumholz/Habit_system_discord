"""
Custom Notion Tool for CrewAI Agents
Provides access to Notion databases for habit tracking analysis
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from notion_client import Client
from crewai_tools import BaseTool
import os


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
        self.notion = Client(auth=os.getenv('NOTION_TOKEN'))
        self.databases = {
            'users': os.getenv('NOTION_DATABASE_USERS'),
            'habits': os.getenv('NOTION_DATABASE_HABITS'),
            'proofs': os.getenv('NOTION_DATABASE_PROOFS'),
        }

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

    def _get_active_users(self) -> List[Dict[str, Any]]:
        """Get all active users from Notion"""
        response = self.notion.databases.query(
            database_id=self.databases['users'],
            filter={
                'property': 'Status',
                'select': {
                    'equals': 'active'
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

        return users

    def _get_user_habits(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all habits for a specific user"""
        response = self.notion.databases.query(
            database_id=self.databases['habits'],
            filter={
                'property': 'User',
                'relation': {
                    'contains': user_id
                }
            }
        )

        habits = []
        for page in response['results']:
            props = page['properties']
            habits.append({
                'id': page['id'],
                'name': self._get_title(props.get('Name', {})),
                'frequency': props.get('Frequency', {}).get('number', 1),
                'minimalDose': self._get_rich_text(props.get('Minimal Dose', {})),
                'domains': [d['name'] for d in props.get('Domains', {}).get('multi_select', [])],
                'smartGoal': self._get_rich_text(props.get('SMART Goal ', {})),  # Note the trailing space!
                'why': self._get_rich_text(props.get('Why', {}))
            })

        return habits

    def _get_user_proofs(self, user_id: str, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """Get proofs for a user within a date range"""
        response = self.notion.databases.query(
            database_id=self.databases['proofs'],
            filter={
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
            sorts=[
                {
                    'property': 'Date',
                    'direction': 'descending'
                }
            ]
        )

        proofs = []
        for page in response['results']:
            props = page['properties']
            proofs.append({
                'id': page['id'],
                'habitId': props.get('Habit', {}).get('relation', [{}])[0].get('id', ''),
                'date': props.get('Date', {}).get('date', {}).get('start', ''),
                'unit': self._get_rich_text(props.get('Unit', {})),
                'isMinimalDose': props.get('Is Minimal Dose ', {}).get('checkbox', False),
                'isCheatDay': props.get('Is Cheat Day', {}).get('checkbox', False)
            })

        return proofs

    def _get_midweek_analysis_data(self) -> Dict[str, Any]:
        """
        Get all data needed for mid-week analysis
        Returns active users with their habits and this week's proofs
        """
        # Calculate week range (Monday to Sunday)
        today = datetime.now()
        monday = today - timedelta(days=today.weekday())
        sunday = monday + timedelta(days=6)

        start_date = monday.strftime('%Y-%m-%d')
        end_date = sunday.strftime('%Y-%m-%d')

        # Get active users
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
