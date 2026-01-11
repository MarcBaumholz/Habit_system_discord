"""
Notion tool v2 for the second weekly check-in agent.
Targets active users in a specific batch and counts proofs from Monday to today.
"""

from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from pathlib import Path
from notion_client import Client
from crewai.tools import BaseTool
import os
import json


class NotionHabitToolV2(BaseTool):
    name: str = "Notion Habit Tracker V2"
    description: str = """
    Access Notion habit tracking databases to retrieve user data, habits, and proofs.
    This version targets active users in a specific batch and counts proofs from
    Monday to today.

    Available operations:
    - get_active_users_v2: Get all active users in the configured batch
    - get_user_habits_v2: Get all habits for a specific user (requires user_id)
    - get_user_proofs_v2: Get proofs for a user in a date range (requires user_id, start_date, end_date)
    - get_second_meet_analysis_data: Get all data needed for the second weekly check-in

    Example usage:
    - "get_active_users_v2"
    - "get_user_habits_v2:user_id_here"
    - "get_user_proofs_v2:user_id_here:2025-01-20:2025-01-26"
    - "get_second_meet_analysis_data"
    """

    def __init__(self):
        super().__init__()
        object.__setattr__(self, 'notion', Client(auth=os.getenv('NOTION_TOKEN')))
        object.__setattr__(self, 'databases', {
            'users': os.getenv('NOTION_DATABASE_USERS'),
            'habits': os.getenv('NOTION_DATABASE_HABITS'),
            'proofs': os.getenv('NOTION_DATABASE_PROOFS'),
        })
        object.__setattr__(self, 'batch_name', (os.getenv('NOTION_BATCH_NAME', 'general gen 20 26') or '').strip())
        object.__setattr__(self, '_data_source_cache', {})
        object.__setattr__(self, '_schema_cache', {})

    def _run(self, operation: str) -> str:
        """
        Execute Notion operations

        Args:
            operation: Operation string in format "operation_name:param1:param2"

        Returns:
            JSON string with results
        """
        parts = operation.split(':')
        op_name = parts[0]

        try:
            if op_name == 'get_active_users_v2':
                result = self._get_active_users()
            elif op_name == 'get_user_habits_v2':
                user_id = parts[1] if len(parts) > 1 else None
                if not user_id:
                    return json.dumps({"error": "user_id required for get_user_habits_v2"})
                result = self._get_user_habits(user_id)
            elif op_name == 'get_user_proofs_v2':
                if len(parts) < 4:
                    return json.dumps({"error": "get_user_proofs_v2 requires: user_id:start_date:end_date"})
                user_id, start_date, end_date = parts[1], parts[2], parts[3]
                result = self._get_user_proofs(user_id, start_date, end_date)
            elif op_name in ('get_second_meet_analysis_data', 'get_midweek_analysis_data_v2'):
                result = self._get_second_meet_analysis_data()
            else:
                return json.dumps({"error": f"Unknown operation: {op_name}"})

            return json.dumps(result, indent=2, default=str)
        except Exception as e:
            return json.dumps({"error": str(e)})

    def _normalize_notion_id(self, raw_id: str) -> str:
        """Normalize Notion IDs to UUID format when provided without hyphens."""
        if not raw_id:
            return raw_id
        cleaned = raw_id.replace("-", "").strip()
        if len(cleaned) != 32:
            return raw_id
        return f"{cleaned[0:8]}-{cleaned[8:12]}-{cleaned[12:16]}-{cleaned[16:20]}-{cleaned[20:32]}"

    def _resolve_data_source_id(self, database_id: str) -> str:
        """Resolve data source id for a database id (Notion API v2025+)."""
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

        data_source_id = self._normalize_notion_id(data_source_id)
        self._data_source_cache[database_id] = data_source_id
        return data_source_id

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

    def _get_database_properties(self, database_id: str) -> Dict[str, Any]:
        if not database_id:
            return {}
        database_id = self._normalize_notion_id(database_id)
        cached = self._schema_cache.get(database_id)
        if cached is not None:
            return cached
        try:
            database = self.notion.databases.retrieve(database_id=database_id)
            props = database.get('properties', {})
            if not props and hasattr(self.notion, 'data_sources'):
                data_source_id = self._resolve_data_source_id(database_id)
                try:
                    data_source = self.notion.data_sources.retrieve(data_source_id=data_source_id)
                    props = data_source.get('properties', {})
                except Exception:
                    pass
        except Exception:
            props = {}

        if not props:
            try:
                response = self._query_database(database_id, body={'page_size': 1})
                results = response.get('results', [])
                if results:
                    sample_props = results[0].get('properties', {})
                    props = {key: {'type': value.get('type')} for key, value in sample_props.items()}
            except Exception:
                props = {}
        self._schema_cache[database_id] = props
        return props

    def _find_property(self, database_id: str, candidates: Tuple[str, ...]) -> Tuple[Optional[str], Optional[str]]:
        props = self._get_database_properties(database_id)
        lower_candidates = {name.lower() for name in candidates}
        for prop_name, prop in props.items():
            if prop_name.lower() in lower_candidates:
                return prop_name, prop.get('type')
        return None, None

    def _resolve_batch_option_name(self, database_id: str, prop_name: str, prop_type: str) -> str:
        props = self._get_database_properties(database_id)
        prop = props.get(prop_name, {})
        options: List[Dict[str, Any]] = []
        if prop_type == 'select':
            options = prop.get('select', {}).get('options', [])
        elif prop_type == 'multi_select':
            options = prop.get('multi_select', {}).get('options', [])

        for option in options:
            option_name = option.get('name', '')
            if option_name.casefold() == self.batch_name.casefold():
                return option_name
        return self.batch_name

    def _build_batch_filter(self, database_id: str) -> Optional[Dict[str, Any]]:
        prop_name, prop_type = self._find_property(database_id, ('batch', 'Batch'))
        if not prop_name or not prop_type:
            props = self._get_database_properties(database_id)
            print(f"⚠️ Batch property not found; available properties: {list(props.keys())}")
            return None

        if prop_type == 'multi_select':
            batch_value = self._resolve_batch_option_name(database_id, prop_name, prop_type)
            return {'property': prop_name, 'multi_select': {'contains': batch_value}}
        if prop_type == 'select':
            batch_value = self._resolve_batch_option_name(database_id, prop_name, prop_type)
            return {'property': prop_name, 'select': {'equals': batch_value}}
        if prop_type == 'rich_text':
            return {'property': prop_name, 'rich_text': {'contains': self.batch_name}}
        if prop_type == 'title':
            return {'property': prop_name, 'title': {'contains': self.batch_name}}

        print(f"⚠️ Batch property type '{prop_type}' not filterable; skipping batch filter")
        return None

    def _get_current_week_range(self) -> Tuple[str, str]:
        today = datetime.now()
        monday = today - timedelta(days=today.weekday())
        start_date = monday.strftime('%Y-%m-%d')
        end_date = today.strftime('%Y-%m-%d')
        return start_date, end_date

    def _get_current_batch(self) -> Optional[Dict[str, Any]]:
        try:
            batch_file_path = Path(__file__).resolve().parent.parent / 'data' / 'current-batch.json'
            if not batch_file_path.exists():
                return None
            with batch_file_path.open('r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"❌ Error reading batch file: {e}")
            return None

    def _get_prop_case_insensitive(self, props: Dict[str, Any], names: Tuple[str, ...]) -> Dict[str, Any]:
        lower_names = {name.lower() for name in names}
        for key, value in props.items():
            if key.lower() in lower_names:
                return value
        return {}

    def _extract_batch_values(self, prop: Dict[str, Any]) -> List[str]:
        prop_type = prop.get('type')
        if prop_type == 'multi_select':
            return [item.get('name', '') for item in prop.get('multi_select', []) if item.get('name')]
        if prop_type == 'select':
            select = prop.get('select') or {}
            return [select.get('name', '')] if select.get('name') else []
        if prop_type == 'rich_text':
            text = self._get_rich_text(prop)
            return [text] if text else []
        if prop_type == 'title':
            text = self._get_title(prop)
            return [text] if text else []
        return []

    def _matches_batch(self, prop: Dict[str, Any], allow_missing: bool) -> bool:
        values = [value for value in self._extract_batch_values(prop) if value]
        if not values:
            return allow_missing
        target = self.batch_name.casefold()
        return any(value.casefold() == target for value in values)

    def _get_status_name(self, prop: Dict[str, Any]) -> str:
        prop_type = prop.get('type')
        if prop_type == 'status':
            return (prop.get('status') or {}).get('name', '')
        if prop_type == 'select':
            return (prop.get('select') or {}).get('name', '')
        return ''

    def _get_active_users(self) -> List[Dict[str, Any]]:
        batch_filter = self._build_batch_filter(self.databases['users'])
        status_prop, status_type = self._find_property(self.databases['users'], ('Status', 'status'))

        filters = []
        if status_prop and status_type == 'select':
            filters.append({'property': status_prop, 'select': {'equals': 'active'}})
        if batch_filter:
            filters.append(batch_filter)

        body = {'filter': {'and': filters}} if filters else {}
        response = self._query_database(self.databases['users'], body=body)

        users = []
        for page in response.get('results', []):
            props = page.get('properties', {})
            status_prop_value = self._get_prop_case_insensitive(props, ('status',))
            status_name = self._get_status_name(status_prop_value).casefold()
            if status_name and status_name != 'active':
                continue

            batch_prop_value = self._get_prop_case_insensitive(props, ('batch',))
            if not self._matches_batch(batch_prop_value, allow_missing=False):
                continue

            users.append({
                'id': page.get('id', ''),
                'discordId': self._get_rich_text(props.get('DiscordID', {})),
                'name': self._get_title(props.get('Name', {})),
                'nickname': self._get_rich_text(self._get_prop_case_insensitive(props, ('nickname',))),
                'buddy': self._get_buddy_value(self._get_prop_case_insensitive(props, ('buddy',))),
                'timezone': self._get_rich_text(self._get_prop_case_insensitive(props, ('timezone', 'Timezone'))),
                'personalChannelId': self._get_rich_text(self._get_prop_case_insensitive(props, ('Personal Channel ID', 'personal channel id'))),
                'status': 'active'
            })

        print(f'📊 Found {len(users)} active users in batch "{self.batch_name}"')
        return users

    def _get_user_habits(self, user_id: str) -> List[Dict[str, Any]]:
        batch_filter = self._build_batch_filter(self.databases['habits'])
        filters = [{
            'property': 'User',
            'relation': {'contains': user_id}
        }]
        if batch_filter:
            filters.append(batch_filter)

        response = self._query_database(
            self.databases['habits'],
            body={'filter': {'and': filters}} if filters else {}
        )

        habits = []
        for page in response.get('results', []):
            props = page.get('properties', {})
            batch_prop_value = self._get_prop_case_insensitive(props, ('batch',))
            if not self._matches_batch(batch_prop_value, allow_missing=False):
                continue
            smart_goal = self._get_rich_text(props.get('SMART Goal ', {}))
            if not smart_goal:
                smart_goal = self._get_rich_text(props.get('SMART Goal', {}))
            habits.append({
                'id': page.get('id', ''),
                'name': self._get_title(props.get('Name', {})),
                'frequency': props.get('Frequency', {}).get('number', 1),
                'minimalDose': self._get_rich_text(props.get('Minimal Dose', {})),
                'domains': [d['name'] for d in props.get('Domains', {}).get('multi_select', [])],
                'smartGoal': smart_goal,
                'why': self._get_rich_text(props.get('Why', {})),
                'hurdles': self._get_rich_text(props.get('Hurdles', {}))
            })

        return habits

    def _get_user_proofs(self, user_id: str, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        batch_filter = self._build_batch_filter(self.databases['proofs'])
        filters = [
            {
                'property': 'User',
                'relation': {'contains': user_id}
            },
            {
                'property': 'Date',
                'date': {'on_or_after': start_date}
            },
            {
                'property': 'Date',
                'date': {'on_or_before': end_date}
            }
        ]
        if batch_filter:
            filters.append(batch_filter)

        response = self._query_database(
            self.databases['proofs'],
            body={
                'filter': {'and': filters},
                'sorts': [{'property': 'Date', 'direction': 'descending'}]
            }
        )

        proofs = []
        for page in response.get('results', []):
            props = page.get('properties', {})
            batch_prop_value = self._get_prop_case_insensitive(props, ('batch',))
            if batch_prop_value and not self._matches_batch(batch_prop_value, allow_missing=True):
                continue
            is_minimal_dose = props.get('Is Minimal Dose ', {}).get('checkbox')
            if is_minimal_dose is None:
                is_minimal_dose = props.get('Is Minimal Dose', {}).get('checkbox', False)
            proofs.append({
                'id': page.get('id', ''),
                'habitId': props.get('Habit', {}).get('relation', [{}])[0].get('id', ''),
                'date': props.get('Date', {}).get('date', {}).get('start', ''),
                'unit': self._get_rich_text(props.get('Unit', {})),
                'note': self._get_rich_text(props.get('Note', {})),
                'isMinimalDose': is_minimal_dose,
                'isCheatDay': props.get('Is Cheat Day', {}).get('checkbox', False)
            })

        return proofs

    def _get_second_meet_analysis_data(self) -> Dict[str, Any]:
        start_date, end_date = self._get_current_week_range()
        users = self._get_active_users()

        analysis_data = []
        today = datetime.now()
        days_into_week = today.weekday() + 1

        for user in users:
            habits = self._get_user_habits(user['id'])
            proofs = self._get_user_proofs(user['id'], start_date, end_date)

            habit_progress = []
            for habit in habits:
                habit_proofs = [p for p in proofs if p['habitId'] == habit['id']]
                completed_count = len(habit_proofs)
                target_frequency = habit['frequency']
                expected_by_now = (target_frequency * days_into_week) / 7

                habit_progress.append({
                    'habit_name': habit['name'],
                    'target_frequency': target_frequency,
                    'completed_count': completed_count,
                    'expected_by_now': round(expected_by_now, 1),
                    'on_track': completed_count >= expected_by_now,
                    'minimal_dose': habit['minimalDose'],
                    'why': habit['why'],
                    'hurdles': habit['hurdles']
                })

            analysis_data.append({
                'user': {
                    'id': user['id'],
                    'name': user['name'],
                    'nickname': user['nickname'],
                    'discordId': user['discordId'],
                    'buddy': user['buddy'],
                    'timezone': user['timezone'],
                    'personalChannelId': user['personalChannelId']
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
            'batch_name': self.batch_name,
            'users_data': analysis_data
        }

    def _get_rich_text(self, prop: Dict[str, Any]) -> str:
        rich_text = prop.get('rich_text', [])
        if not rich_text:
            return ''
        return rich_text[0].get('text', {}).get('content', '') or rich_text[0].get('plain_text', '')

    def _get_title(self, prop: Dict[str, Any]) -> str:
        title = prop.get('title', [])
        if not title:
            return ''
        return title[0].get('text', {}).get('content', '') or title[0].get('plain_text', '')

    def _get_buddy_value(self, prop: Dict[str, Any]) -> str:
        prop_type = prop.get('type')
        if prop_type == 'select':
            return (prop.get('select') or {}).get('name', '')
        if prop_type == 'relation':
            relation = prop.get('relation', [])
            return relation[0].get('id', '') if relation else ''
        if prop_type == 'rich_text':
            return self._get_rich_text(prop)
        return ''
