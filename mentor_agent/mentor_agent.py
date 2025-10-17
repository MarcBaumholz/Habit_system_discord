"""
Mentor Agent mit Pydantic und LLM-Integration
Für persönlichen Test im Channel 1422681618304471131
"""

import os
import json
from typing import List, Optional
from datetime import datetime, timedelta
from collections import Counter

from models import (
    UserProfile, 
    ProofData, 
    UserBehaviorAnalysis, 
    MentorResponse, 
    MentorContext,
    NotionUserProfile
)
from notion_client import NotionPersonalityClient


class MentorAgent:
    """Pydantic-basierter Mentor-Agent"""
    
    def __init__(self):
        self.notion_client = NotionPersonalityClient()
        self.perplexity_api_key = os.getenv('PERPLEXITY_API_KEY')
        self.base_url = "https://api.perplexity.ai/chat/completions"
        
    def analyze_user(self, discord_id: str) -> Optional[MentorContext]:
        """Sammelt alle relevanten User-Daten und erstellt Mentor-Context"""
        try:
            print(f"🔍 Analyzing user: {discord_id}")
            
            # 1. Load User Profile from Notion
            notion_profile = self.notion_client.get_user_profile(discord_id)
            if not notion_profile:
                print(f"❌ No profile found for user: {discord_id}")
                return None
            
            user_profile = notion_profile.to_user_profile()
            
            # 2. Load Recent Proofs
            recent_proofs = self.notion_client.get_recent_proofs(discord_id, days=7)
            
            # 3. Analyze Behavior
            behavior_analysis = self._analyze_behavior(user_profile, recent_proofs)
            
            # 4. Load Habits, Learnings, Hurdles
            habits = self.notion_client.get_user_habits(discord_id)
            learnings = self.notion_client.get_recent_learnings(discord_id)
            hurdles = self.notion_client.get_recent_hurdles(discord_id)
            
            # 5. Build Context
            context = MentorContext(
                user_profile=user_profile,
                recent_proofs=recent_proofs,
                behavior_analysis=behavior_analysis,
                current_habits=habits,
                current_week=self.notion_client.calculate_week_number(),
                recent_learnings=learnings,
                recent_hurdles=hurdles
            )
            
            print(f"✅ Context created for user: {discord_id}")
            return context
            
        except Exception as e:
            print(f"❌ Error analyzing user {discord_id}: {e}")
            return None
    
    def _analyze_behavior(self, profile: UserProfile, proofs: List[ProofData]) -> UserBehaviorAnalysis:
        """Analysiert Verhaltensmuster aus Proofs"""
        
        if not proofs:
            return UserBehaviorAnalysis()
        
        # Konsistenz berechnen
        expected_days = 7  # Letzte 7 Tage
        actual_days = len(set(p.date.date() for p in proofs))
        consistency = min(actual_days / expected_days, 1.0)
        
        # Zeitanalyse
        times = [p.date.hour for p in proofs if p.date]
        preferred_time = None
        if times:
            preferred_time = f"{Counter(times).most_common(1)[0][0]:02d}:00"
        
        # Streaks berechnen
        habit_streaks = {}
        for habit_name in set(p.habit_name for p in proofs):
            habit_proofs = [p for p in proofs if p.habit_name == habit_name]
            habit_streaks[habit_name] = self._calculate_streak(habit_proofs)
        
        # Completion Rate
        completion_rate = consistency
        
        # Patterns erkennen
        success_patterns = []
        struggle_patterns = []
        
        if completion_rate >= 0.8:
            success_patterns.append("Hohe Konsistenz in der letzten Woche")
        
        if completion_rate < 0.5:
            struggle_patterns.append("Niedrige Completion Rate")
        
        minimal_doses = len([p for p in proofs if p.is_minimal_dose])
        if minimal_doses > len(proofs) * 0.5:
            success_patterns.append("Gute Nutzung von Minimal Doses")
        
        return UserBehaviorAnalysis(
            consistency_score=consistency,
            preferred_execution_time=preferred_time,
            success_patterns=success_patterns,
            struggle_patterns=struggle_patterns,
            habit_streaks=habit_streaks,
            weekly_completion_rate=completion_rate,
            total_proofs=len(proofs),
            current_streak=max(habit_streaks.values()) if habit_streaks else 0
        )
    
    def _calculate_streak(self, proofs: List[ProofData]) -> int:
        """Berechnet Streak für eine Liste von Proofs"""
        if not proofs:
            return 0
        
        # Sortiere nach Datum
        sorted_proofs = sorted(proofs, key=lambda p: p.date, reverse=True)
        
        streak = 0
        current_date = datetime.now().date()
        
        for proof in sorted_proofs:
            proof_date = proof.date.date()
            if proof_date == current_date:
                streak += 1
                current_date -= timedelta(days=1)
            elif proof_date == current_date - timedelta(days=1):
                streak += 1
                current_date = proof_date - timedelta(days=1)
            else:
                break
        
        return streak
    
    async def generate_mentor_message(self, context: MentorContext) -> MentorResponse:
        """Generiert personalisierte Mentor-Nachricht mit Perplexity"""
        try:
            print(f"🤖 Generating mentor message for user: {context.user_profile.discord_id}")
            
            # Build Prompt
            prompt = self._build_mentor_prompt(context)
            
            # Call Perplexity API
            response = await self._call_perplexity_api(prompt)
            
            # Parse Response
            mentor_response = self._parse_mentor_response(response, context)
            
            print(f"✅ Mentor message generated")
            return mentor_response
            
        except Exception as e:
            print(f"❌ Error generating mentor message: {e}")
            return self._create_fallback_response(context)
    
    def _build_mentor_prompt(self, context: MentorContext) -> str:
        """Erstellt Prompt für LLM mit verbesserter Struktur und Chain-of-Thought"""
        
        profile = context.user_profile
        behavior = context.behavior_analysis
        
        prompt = f"""
ROLLE: Erfahrener persönlicher Mentor und Coach mit 15 Jahren Erfahrung in Gewohnheitsbildung, Verhaltenspsychologie und motivierendem Coaching.

AUFGABE: Erstelle eine personalisierte Mentor-Nachricht basierend auf umfassender Datenanalyse.

UMFASSENDER KONTEXT:

=== PERSÖNLICHKEITSPROFIL ===
- Discord ID: {profile.discord_id}
- Persönlichkeitstyp: {profile.personality_type or 'Nicht angegeben'}
- Core Values: {', '.join(profile.core_values) if profile.core_values else 'Nicht angegeben'}
- Lebensphase: {profile.life_phase or 'Nicht angegeben'}
- Kommunikationsstil: {profile.communication_style or 'Standard'}

=== PERFORMANCE-METRIKEN (Woche {context.current_week}/66) ===
- Completion Rate: {behavior.weekly_completion_rate * 100:.1f}%
- Consistency Score: {behavior.consistency_score * 100:.1f}%
- Current Streak: {behavior.current_streak} Tage
- Total Proofs: {behavior.total_proofs}
- Bestehende Gewohnheiten: {len(context.current_habits)}

=== ZIELE & VISION ===
Hauptziele:
{chr(10).join(f"- {goal}" for goal in profile.main_goals) if profile.main_goals else "- Keine Ziele definiert"}

Lebensvision:
{profile.life_vision or "Nicht angegeben"}

=== RECENTE HERAUSFORDERUNGEN ===
{chr(10).join(f"- {h.get('description', '')}" for h in context.recent_hurdles[:3]) if context.recent_hurdles else "- Keine Herausforderungen dokumentiert"}

=== RECENTE ERKENNTNISSE ===
{chr(10).join(f"- {l}" for l in context.recent_learnings[:3]) if context.recent_learnings else "- Keine Erkenntnisse dokumentiert"}

=== ERFOLGSMUSTER ===
{chr(10).join(f"- {p}" for p in behavior.success_patterns) if behavior.success_patterns else "- Noch keine Muster erkannt"}

=== VERBESSERUNGSBEREICHE ===
{chr(10).join(f"- {p}" for p in behavior.struggle_patterns) if behavior.struggle_patterns else "- Alles läuft gut!"}

ANALYSE-FRAMEWORK (Folge jedem Schritt):

SCHRITT 1 - Performance-Bewertung:
Gesamtbewertung: <Exzellent|Gut|Moderat|Benötigt Aufmerksamkeit|Kritisch>
Begründung: <basierend auf Completion Rate, Konsistenz und Trend>

SCHRITT 2 - Erfolgsanalyse:
Was funktioniert gut:
- Spezifische Erfolgsmuster identifizieren
- Positive Verhaltensweisen hervorheben
- Stärken und Ressourcen anerkennen

SCHRITT 3 - Herausforderungsanalyse:
Was verbessert werden kann:
- Spezifische Problembereiche identifizieren
- Hindernisse und Blockaden analysieren
- Verbesserungspotentiale erkennen

SCHRITT 4 - Persönlichkeitsanpassung:
Berücksichtige {profile.personality_type or 'ihren Persönlichkeitstyp'}:
- Passende Kommunikationsweise
- Motivationsstil
- Coaching-Ansatz
- Unterstützungsstrategien

SCHRITT 5 - Empfehlungen entwickeln:
Erstelle 2-3 konkrete, umsetzbare Ratschläge:
- Spezifisch und messbar
- Innerhalb von 24-48 Stunden umsetzbar
- Angepasst an Persönlichkeit und Ziele
- Mit klarem erwarteten Ergebnis

SCHRITT 6 - Motivation & Ermutigung:
Bestimme angemessenes Ermutigungsniveau:
- Completion Rate > 80%: Feiere Erfolge, halte Momentum
- Completion Rate 60-80%: Bestärke Fortschritte, gib Hoffnung
- Completion Rate 40-60%: Zeige Verständnis, gib konkrete Hilfe
- Completion Rate < 40%: Empathie zeigen, einfache Schritte

BEISPIEL-AUSGABE:
{{
  "message": "Liebe/r {profile.discord_id}, ich sehe, dass du diese Woche {behavior.weekly_completion_rate * 100:.1f}% deiner Gewohnheiten erfolgreich abgeschlossen hast. Das zeigt echte Fortschritte! Besonders beeindruckend ist dein {behavior.current_streak}-Tage-Streak - das beweist deine Entschlossenheit.",
  "advice": [
    "Konzentriere dich auf deine erfolgreichste Gewohnheit und baue sie weiter aus",
    "Nutze deine Erfolgsmuster für andere Gewohnheiten"
  ],
  "suggested_actions": [
    "Morgen früh die erfolgreichste Gewohnheit als erstes machen",
    "Ein Erfolgsmuster auf eine andere Gewohnheit übertragen"
  ],
  "encouragement_level": 8,
  "follow_up_date": "{(context.current_week + 1)}",
  "risk_level": "On Track"
}}

KRITISCHE AUSGABE-ANFORDERUNGEN:
- Return ONLY valid JSON
- message: Maximal 500 Zeichen, persönlich und ermutigend
- advice: 2-3 spezifische, umsetzbare Ratschläge
- suggested_actions: Konkrete nächste Schritte (2-3)
- encouragement_level: Integer 1-10
- follow_up_date: Nächste Woche als String
- risk_level: "On Track" | "Needs Attention" | "At Risk" | "Critical"

VALIDIERUNGS-CHECKLISTE:
✓ Alle Felder vorhanden und korrekt formatiert
✓ Scores innerhalb gültiger Bereiche
✓ Empfehlungen spezifisch und umsetzbar
✓ Berücksichtigt Persönlichkeitstyp
✓ JSON-Syntax ist gültig
✓ Message ist persönlich und nicht generisch
"""
        return prompt
    
    async def _call_perplexity_api(self, prompt: str) -> str:
        """Ruft Perplexity API auf"""
        headers = {
            "Authorization": f"Bearer {self.perplexity_api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "sonar",
            "messages": [
                {
                    "role": "system",
                    "content": "Du bist ein erfahrener persönlicher Mentor und Coach. Du hilfst Menschen dabei, ihre Gewohnheiten zu verbessern und ihre Ziele zu erreichen. Antworte immer auf Deutsch und sei ermutigend, aber auch ehrlich."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": 1000,
            "temperature": 0.7
        }
        
        import aiohttp
        async with aiohttp.ClientSession() as session:
            async with session.post(self.base_url, headers=headers, json=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    return data['choices'][0]['message']['content']
                else:
                    print(f"❌ Perplexity API error: {response.status}")
                    return ""
    
    def _parse_mentor_response(self, response: str, context: MentorContext) -> MentorResponse:
        """Parst LLM Response zu MentorResponse"""
        try:
            # Versuche JSON zu parsen
            if response.strip().startswith('{'):
                data = json.loads(response)
                return MentorResponse(
                    message=data.get('message', ''),
                    advice=data.get('advice', []),
                    suggested_actions=data.get('suggested_actions', []),
                    encouragement_level=data.get('encouragement_level', 7),
                    follow_up_date=datetime.fromisoformat(data['follow_up_date']) if data.get('follow_up_date') else None,
                    risk_level=data.get('risk_level', 'On Track')
                )
        except:
            pass
        
        # Fallback: Erstelle Response aus Text
        return MentorResponse(
            message=response[:500] if response else "Du machst großartige Fortschritte!",
            advice=["Bleib konsistent", "Feiere kleine Erfolge"],
            suggested_actions=["Heute eine kleine Gewohnheit ausführen", "Reflektiere über deine Fortschritte"],
            encouragement_level=8,
            risk_level="On Track"
        )
    
    def _create_fallback_response(self, context: MentorContext) -> MentorResponse:
        """Erstellt Fallback Response wenn LLM nicht verfügbar"""
        profile = context.user_profile
        behavior = context.behavior_analysis
        
        if behavior.weekly_completion_rate >= 0.8:
            message = f"🎉 Großartige Arbeit, {profile.discord_id}! Du bist sehr konsistent mit deinen Gewohnheiten."
            encouragement_level = 9
        elif behavior.weekly_completion_rate >= 0.5:
            message = f"👍 Gute Fortschritte, {profile.discord_id}! Du bist auf dem richtigen Weg."
            encouragement_level = 7
        else:
            message = f"💪 Hey {profile.discord_id}, jeder Tag ist eine neue Chance! Lass uns gemeinsam an deinen Gewohnheiten arbeiten."
            encouragement_level = 6
        
        return MentorResponse(
            message=message,
            advice=[
                "Bleib bei deinen Gewohnheiten",
                "Feiere kleine Erfolge",
                "Sei geduldig mit dir selbst"
            ],
            suggested_actions=[
                "Heute mindestens eine Gewohnheit ausführen",
                "Reflektiere über deine Ziele",
                "Plan die nächste Woche"
            ],
            encouragement_level=encouragement_level,
            risk_level="Needs Attention" if behavior.weekly_completion_rate < 0.5 else "On Track"
        )
    
    async def send_to_discord(self, channel_id: str, message: str):
        """Sendet Nachricht an Discord Channel"""
        # TODO: Implementiere Discord Webhook oder Bot Integration
        print(f"📤 Would send to Discord channel {channel_id}: {message[:100]}...")
        
        # Für Test: Einfach in Console ausgeben
        print(f"\n{'='*60}")
        print(f"MENTOR MESSAGE für Channel {channel_id}")
        print(f"{'='*60}")
        print(message)
        print(f"{'='*60}\n")


# Test-Funktion für persönlichen Channel
async def test_mentor_for_user(discord_id: str = "1422681618304471131"):
    """Testet den Mentor-Agent für einen spezifischen User"""
    agent = MentorAgent()
    
    print(f"🧪 Testing Mentor Agent for user: {discord_id}")
    
    # Analysiere User
    context = agent.analyze_user(discord_id)
    if not context:
        print("❌ No context created - user might not have profile")
        return
    
    print(f"✅ Context created successfully")
    print(f"   - Profile: {context.user_profile.personality_type}")
    print(f"   - Proofs: {len(context.recent_proofs)}")
    print(f"   - Consistency: {context.behavior_analysis.consistency_score:.2f}")
    
    # Generiere Mentor Message
    response = await agent.generate_mentor_message(context)
    
    print(f"✅ Mentor response generated")
    print(f"   - Message length: {len(response.message)}")
    print(f"   - Advice items: {len(response.advice)}")
    print(f"   - Risk level: {response.risk_level}")
    
    # Sende an Discord (simuliert)
    await agent.send_to_discord("1422681618304471131", response.message)
    
    return response


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_mentor_for_user())
