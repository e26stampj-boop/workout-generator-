from dataclasses import dataclass, asdict
from typing import List, Dict, Any

@dataclass(frozen=True)
class Exercise:
    name: str
    movement: str           # squat/hinge/push/pull/core/carry
    compound: bool
    equipment: List[str]    # ["barbell", "dumbbell", "machine", "bodyweight"]
    difficulty: int         # 1-5
    time_cost: int          # minutes estimate
    muscles: List[str]

    @staticmethod
    def from_dict(d: Dict[str, Any]) -> "Exercise":
        return Exercise(**d)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class UserProfile:
    user_id: str
    goal: str               # strength/hypertrophy/fitness
    days_per_week: int      # 3-6
    session_minutes: int
    equipment_available: List[str]
    avoid_exercises: List[str]

    @staticmethod
    def from_dict(d: Dict[str, Any]) -> "UserProfile":
        return UserProfile(**d)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
