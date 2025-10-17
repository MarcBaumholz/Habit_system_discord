"""
Pydantic Models für User Profile und Mentor-Agent
Basierend auf der Notion "8. Personality DB" Struktur
"""

from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Literal
from datetime import datetime
from enum import Enum


class PersonalityType(str, Enum):
    """16 Personalities Typen"""
    INTJ = "INTJ"
    ENTJ = "ENTJ"
    INTP = "INTP"
    ENTP = "ENTP"
    INFJ = "INFJ"
    ENFJ = "ENFJ"
    INFP = "INFP"
    ENFP = "ENFP"
    ISTJ = "ISTJ"
    ESTJ = "ESTJ"
    ISFJ = "ISFJ"
    ESFJ = "ESFJ"
    ISTP = "ISTP"
    ESTP = "ESTP"
    ISFP = "ISFP"
    ESFP = "ESFP"


class LifePhase(str, Enum):
    """Lebensphasen"""
    STUDENT = "Student"
    CAREER_START = "Berufseinstieg"
    ESTABLISHED = "Etabliert"
    TRANSITION = "Übergang"
    RETIREMENT = "Ruhestand"


class UserProfile(BaseModel):
    """User Profile basierend auf Notion Personality DB"""
    
    # Basis-Identifikation
    id: str
    discord_id: str = Field(alias="discordId")
    user_id: Optional[str] = None  # Relation zur Users DB
    join_date: Optional[datetime] = Field(default=None, alias="joinDate")
    
    # Persönlichkeit & Psychologie
    personality_type: Optional[PersonalityType] = Field(default=None, alias="personalityType")
    core_values: List[str] = Field(default_factory=list, alias="coreValues")
    big_five_traits: Optional[str] = Field(default=None, alias="bigFiveTraits")  # JSON als String
    
    # Ziele & Vision
    life_vision: Optional[str] = Field(default=None, alias="lifeVision")
    main_goals: List[str] = Field(default_factory=list, alias="mainGoals")
    life_domains: List[str] = Field(default_factory=list, alias="lifeDomains")
    life_phase: Optional[LifePhase] = Field(default=None, alias="lifePhase")
    desired_identity: Optional[str] = Field(default=None, alias="desiredIdentity")
    
    # Open Space
    open_space: Optional[str] = Field(default=None, alias="openSpace")
    
    class Config:
        use_enum_values = True
        allow_population_by_field_name = True
        json_schema_extra = {
            "example": {
                "discord_id": "123456789",
                "personality_type": "INTJ",
                "core_values": ["Freiheit", "Gesundheit", "Familie"],
                "life_vision": "Ich möchte in 5 Jahren ein gesundes, produktives Leben führen...",
                "main_goals": ["Fitness aufbauen", "Karriere voranbringen", "Beziehungen stärken"],
                "life_phase": "Etabliert"
            }
        }


class ProofData(BaseModel):
    """Proof-Daten für Verhaltensanalyse"""
    habit_name: str
    date: datetime
    is_minimal_dose: bool = False
    is_cheat_day: bool = False
    note: Optional[str] = None
    unit: str = "1"


class UserBehaviorAnalysis(BaseModel):
    """Analyse basierend auf Proofs und Profil"""
    consistency_score: float = Field(ge=0.0, le=1.0, default=0.0)
    preferred_execution_time: Optional[str] = None
    success_patterns: List[str] = Field(default_factory=list)
    struggle_patterns: List[str] = Field(default_factory=list)
    habit_streaks: Dict[str, int] = Field(default_factory=dict)
    weekly_completion_rate: float = Field(ge=0.0, le=1.0, default=0.0)
    total_proofs: int = 0
    current_streak: int = 0


class MentorResponse(BaseModel):
    """Strukturierte Mentor-Antwort"""
    message: str
    advice: List[str] = Field(default_factory=list)
    suggested_actions: List[str] = Field(default_factory=list)
    encouragement_level: int = Field(ge=1, le=10, default=7)
    follow_up_date: Optional[datetime] = None
    risk_level: Literal["On Track", "Needs Attention", "At Risk", "Critical"] = "On Track"


class MentorContext(BaseModel):
    """Vollständiger Kontext für Mentor-Agent"""
    user_profile: UserProfile
    recent_proofs: List[ProofData] = Field(default_factory=list)
    behavior_analysis: UserBehaviorAnalysis
    current_habits: List[Dict] = Field(default_factory=list)
    current_week: int
    recent_learnings: List[str] = Field(default_factory=list)
    recent_hurdles: List[Dict] = Field(default_factory=list)


class NotionUserProfile(BaseModel):
    """Raw Notion Profile Data (wie es aus der API kommt)"""
    id: str
    discord_id: str
    join_date: Optional[str] = None
    personality_type: Optional[str] = None
    core_values: List[str] = Field(default_factory=list)
    life_vision: Optional[str] = None
    main_goals: List[str] = Field(default_factory=list)
    big_five_traits: Optional[str] = None
    life_domains: List[str] = Field(default_factory=list)
    life_phase: Optional[str] = None
    desired_identity: Optional[str] = None
    open_space: Optional[str] = None

    def to_user_profile(self) -> UserProfile:
        """Konvertiert Notion-Daten zu UserProfile"""
        return UserProfile(
            id=self.id,
            discord_id=self.discord_id,
            join_date=datetime.fromisoformat(self.join_date) if self.join_date else None,
            personality_type=PersonalityType(self.personality_type) if self.personality_type else None,
            core_values=self.core_values,
            big_five_traits=self.big_five_traits,
            life_vision=self.life_vision,
            main_goals=self.main_goals,
            life_domains=self.life_domains,
            life_phase=LifePhase(self.life_phase) if self.life_phase else None,
            desired_identity=self.desired_identity,
            open_space=self.open_space
        )
