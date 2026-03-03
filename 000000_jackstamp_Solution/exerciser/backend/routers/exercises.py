from fastapi import APIRouter, HTTPException
from database import get_db
from models import (
    ExerciseCreate,
    ExerciseUpdate,
    ExerciseResponse,
    RatingUpdate,
    VALID_MUSCLE_GROUPS,
    VALID_EXERCISE_TYPES,
)

router = APIRouter(prefix="/api", tags=["exercises"])


def _validate_muscle_group(muscle_group: str):
    if muscle_group not in VALID_MUSCLE_GROUPS:
        raise HTTPException(
            status_code=400,
            detail=f"Please select a valid muscle group. Must be one of: {', '.join(VALID_MUSCLE_GROUPS)}",
        )


def _validate_exercise_type(exercise_type: str):
    if exercise_type not in VALID_EXERCISE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Exercise type must be compound or isolation.",
        )


# --- Muscle Groups ---

@router.get("/muscle-groups")
async def list_muscle_groups():
    return VALID_MUSCLE_GROUPS


# --- Exercises CRUD ---

@router.get("/exercises", response_model=list[ExerciseResponse])
async def list_exercises(muscle_group: str = None):
    db = await get_db()
    try:
        if muscle_group:
            _validate_muscle_group(muscle_group)
            cursor = await db.execute(
                "SELECT * FROM exercises WHERE muscle_group = ? ORDER BY name",
                (muscle_group,),
            )
        else:
            cursor = await db.execute("SELECT * FROM exercises ORDER BY name")
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        await db.close()


@router.post("/exercises", response_model=ExerciseResponse, status_code=201)
async def create_exercise(exercise: ExerciseCreate):
    _validate_muscle_group(exercise.muscle_group)
    _validate_exercise_type(exercise.exercise_type)

    db = await get_db()
    try:
        # Check uniqueness
        cursor = await db.execute(
            "SELECT id FROM exercises WHERE name = ?", (exercise.name,)
        )
        if await cursor.fetchone():
            raise HTTPException(
                status_code=400,
                detail="Exercise name is required and must be unique.",
            )

        cursor = await db.execute(
            """INSERT INTO exercises (name, muscle_group, sub_muscle_group, exercise_type, equipment, default_rating)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (
                exercise.name,
                exercise.muscle_group,
                exercise.sub_muscle_group,
                exercise.exercise_type,
                exercise.equipment,
                exercise.default_rating,
            ),
        )
        await db.commit()

        cursor = await db.execute(
            "SELECT * FROM exercises WHERE id = ?", (cursor.lastrowid,)
        )
        row = await cursor.fetchone()
        return dict(row)
    finally:
        await db.close()


@router.put("/exercises/{exercise_id}", response_model=ExerciseResponse)
async def update_exercise(exercise_id: int, exercise: ExerciseUpdate):
    _validate_muscle_group(exercise.muscle_group)
    _validate_exercise_type(exercise.exercise_type)

    db = await get_db()
    try:
        # Check exists
        cursor = await db.execute(
            "SELECT id FROM exercises WHERE id = ?", (exercise_id,)
        )
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Exercise not found.")

        # Check name uniqueness (excluding self)
        cursor = await db.execute(
            "SELECT id FROM exercises WHERE name = ? AND id != ?",
            (exercise.name, exercise_id),
        )
        if await cursor.fetchone():
            raise HTTPException(
                status_code=400,
                detail="Exercise name is required and must be unique.",
            )

        await db.execute(
            """UPDATE exercises
               SET name = ?, muscle_group = ?, sub_muscle_group = ?, exercise_type = ?,
                   equipment = ?, default_rating = ?, user_rating = ?
               WHERE id = ?""",
            (
                exercise.name,
                exercise.muscle_group,
                exercise.sub_muscle_group,
                exercise.exercise_type,
                exercise.equipment,
                exercise.default_rating,
                exercise.user_rating,
                exercise_id,
            ),
        )
        await db.commit()

        cursor = await db.execute(
            "SELECT * FROM exercises WHERE id = ?", (exercise_id,)
        )
        row = await cursor.fetchone()
        return dict(row)
    finally:
        await db.close()


@router.delete("/exercises/{exercise_id}")
async def delete_exercise(exercise_id: int):
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id FROM exercises WHERE id = ?", (exercise_id,)
        )
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Exercise not found.")

        await db.execute("DELETE FROM exercises WHERE id = ?", (exercise_id,))
        await db.commit()
        return {"message": "Exercise deleted successfully"}
    finally:
        await db.close()


# --- Rating ---

@router.put("/exercises/{exercise_id}/rating", response_model=ExerciseResponse)
async def update_rating(exercise_id: int, rating_update: RatingUpdate):
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id FROM exercises WHERE id = ?", (exercise_id,)
        )
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Exercise not found.")

        await db.execute(
            "UPDATE exercises SET user_rating = ? WHERE id = ?",
            (rating_update.rating, exercise_id),
        )
        await db.commit()

        cursor = await db.execute(
            "SELECT * FROM exercises WHERE id = ?", (exercise_id,)
        )
        row = await cursor.fetchone()
        return dict(row)
    finally:
        await db.close()
