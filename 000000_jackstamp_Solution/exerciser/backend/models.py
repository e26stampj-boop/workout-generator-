from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

VALID_MUSCLE_GROUPS = ["Legs", "Chest", "Back", "Shoulders", "Arms", "Core"]
VALID_EXERCISE_TYPES = ["compound", "isolation"]


# --- Exercise models ---

class ExerciseCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    muscle_group: str
    sub_muscle_group: str = Field(..., min_length=2, max_length=50)
    exercise_type: str
    equipment: str = Field(..., min_length=2, max_length=50)
    default_rating: int = Field(default=3, ge=1, le=5)


class ExerciseUpdate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    muscle_group: str
    sub_muscle_group: str = Field(..., min_length=2, max_length=50)
    exercise_type: str
    equipment: str = Field(..., min_length=2, max_length=50)
    default_rating: int = Field(default=3, ge=1, le=5)
    user_rating: Optional[int] = Field(default=None, ge=1, le=5)


class ExerciseResponse(BaseModel):
    id: int
    name: str
    muscle_group: str
    sub_muscle_group: str
    exercise_type: str
    equipment: str
    default_rating: int
    user_rating: Optional[int]
    created_at: Optional[str] = None


class RatingUpdate(BaseModel):
    rating: int = Field(..., ge=1, le=5)


# --- Workout models ---

class GenerateRequest(BaseModel):
    muscle_group: str
    exclude_exercise_ids: list[int] = []


class WorkoutExercise(BaseModel):
    exercise_id: int
    name: str
    exercise_type: str
    sub_muscle_group: str
    equipment: str
    position: int


class GeneratedWorkout(BaseModel):
    muscle_group: str
    exercises: list[WorkoutExercise]
    notice: Optional[str] = None


class SaveWorkoutRequest(BaseModel):
    muscle_group: str
    exercises: list[WorkoutExercise]


class WorkoutResponse(BaseModel):
    id: int
    muscle_group: str
    created_at: str
    exercises: list[WorkoutExercise]
