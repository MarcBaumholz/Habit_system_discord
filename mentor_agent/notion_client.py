"""
Notion Client für Personality DB
Erweitert den bestehenden TypeScript NotionClient
"""

import os
import json
from typing import List, Optional, Dict, Any
from datetime import datetime
import requests

from models import NotionUserProfile, UserProfile, ProofData


class NotionPersonalityClient:
    """Python Notion Client für Personality DB"""
    
    def __init__(self):
        self.notion_token = os.getenv('NOTION_TOKEN')
        self.personality_db_id = os.getenv('NOTION_DATABASE_PERSONALITY')  # Neue ENV Variable
        self.base_url = "https://api.notion.com/v1"
        self.headers = {
            "Authorization": f"Bearer {self.notion_token}",
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28"
        }
    
    def get_user_profile(self, discord_id: str) -> Optional[NotionUserProfile]:
        """Holt User Profile aus Personality DB"""
        try:
            url = f"{self.base_url}/databases/{self.personality_db_id}/query"
            
            payload = {
                "filter": {
                    "property": "Discord ID",
                    "title": {
                        "equals": discord_id
                    }
                }
            }
            
            response = requests.post(url, headers=self.headers, json=payload)
            response.raise_for_status()
            
            data = response.json()
            results = data.get('results', [])
            
            if not results:
                return None
            
            page = results[0]
            properties = page['properties']
            
            # Extrahiere Daten aus Notion Properties
            profile = NotionUserProfile(
                id=page['id'],
                discord_id=self._extract_text(properties['Discord ID']),
                join_date=properties['Join Date']['date']['start'] if properties['Join Date']['date'] else None,
                personality_type=properties['Personality T...']['select']['name'] if properties['Personality T...']['select'] else None,
                core_values=[item['name'] for item in properties['Core Values']['multi_select']] if properties['Core Values']['multi_select'] else [],
                life_vision=self._extract_text(properties['Life Vision']),
                main_goals=self._extract_text(properties['Main Goals']).split('\n') if self._extract_text(properties['Main Goals']) else [],
                big_five_traits=self._extract_text(properties['Big five traits']),
                life_domains=[item['name'] for item in properties['Life domains']['multi_select']] if properties['Life domains']['multi_select'] else [],
                life_phase=properties['Life Phase']['select']['name'] if properties['Life Phase']['select'] else None,
                desired_identity=self._extract_text(properties['Desired Identity']),
                open_space=self._extract_text(properties['Open Space'])
            )
            
            return profile
            
        except Exception as e:
            print(f"❌ Error getting user profile: {e}")
            return None
    
    def get_recent_proofs(self, discord_id: str, days: int = 7) -> List[ProofData]:
        """Holt recent Proofs für einen User (vereinfacht - müsste über Users DB Relation)"""
        # TODO: Implementiere echte Proof-Abfrage über Users DB Relation
        # Für jetzt: Mock-Daten für Test
        return [
            ProofData(
                habit_name="Morning Workout",
                date=datetime.now(),
                is_minimal_dose=False,
                is_cheat_day=False,
                note="30 Minuten Laufen",
                unit="30"
            ),
            ProofData(
                habit_name="Reading",
                date=datetime.now(),
                is_minimal_dose=True,
                is_cheat_day=False,
                note="10 Minuten gelesen",
                unit="10"
            )
        ]
    
    def get_user_habits(self, discord_id: str) -> List[Dict]:
        """Holt Habits für einen User"""
        # TODO: Implementiere echte Habit-Abfrage
        return [
            {
                "name": "Morning Workout",
                "frequency": 5,
                "domains": ["Health", "Fitness"]
            },
            {
                "name": "Reading",
                "frequency": 7,
                "domains": ["Intellectual", "Personal Growth"]
            }
        ]
    
    def get_recent_learnings(self, discord_id: str) -> List[str]:
        """Holt recent Learnings"""
        # TODO: Implementiere echte Learning-Abfrage
        return [
            "Konsistenz ist wichtiger als Perfektion",
            "Kleine Schritte führen zu großen Veränderungen"
        ]
    
    def get_recent_hurdles(self, discord_id: str) -> List[Dict]:
        """Holt recent Hurdles"""
        # TODO: Implementiere echte Hurdle-Abfrage
        return [
            {
                "name": "Zeitmangel",
                "description": "Schwierig Zeit für Workouts zu finden",
                "type": "Time Management"
            }
        ]
    
    def _extract_text(self, property_data: Dict) -> str:
        """Extrahiert Text aus Notion Rich Text Property"""
        if not property_data or 'rich_text' not in property_data:
            return ""
        
        rich_text = property_data['rich_text']
        if not rich_text:
            return ""
        
        return rich_text[0]['text']['content'] if rich_text[0]['text'] else ""
    
    def calculate_week_number(self) -> int:
        """Berechnet aktuelle Woche (vereinfacht)"""
        # Vereinfachte Berechnung - Woche seit 1. Januar 2025
        start_date = datetime(2025, 1, 1)
        current_date = datetime.now()
        days_diff = (current_date - start_date).days
        return (days_diff // 7) + 1
