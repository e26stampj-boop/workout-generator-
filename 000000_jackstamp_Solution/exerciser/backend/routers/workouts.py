from fastapi import APIRouter, HTTPException
from database import get_db
from models import (
    GenerateRequest,
    GeneratedWorkout,
    SaveWorkoutRequest,
    WorkoutResponse,
    WorkoutExercise,
    VALID_MUSCLE_GROUPS,
)
from services.generator import generate_workout

router = APIRouter(prefix="/api", tags=["workouts"])


@router.post("/workouts/generate", response_model=GeneratedWorkout)
async def generate(request: GenerateRequest):
    if request.muscle_group not in VALID_MUSCLE_GROUPS:
        raise HTTPException(
            status_code=400,
            detail=f"Please select a valid muscle group. Must be one of: {', '.join(VALID_MUSCLE_GROUPS)}",
        )

    db = await get_db()
    try:
        # Check that at least one exercise exists
        cursor = await db.execute(
            "SELECT COUNT(*) FROM exercises WHERE muscle_group = ?",
            (request.muscle_group,),
        )
        count = (await cursor.fetchone())[0]
        if count == 0:
            raise HTTPException(
                status_code=400,
                detail=f"No exercises found for {request.muscle_group}. Add some exercises first.",
            )

        result = await generate_workout(db, request.muscle_group, request.exclude_exercise_ids)
        return result
    finally:
        await db.close()


@router.post("/workouts/save", response_model=WorkoutResponse)
async def save(request: SaveWorkoutRequest):
    if request.muscle_group not in VALID_MUSCLE_GROUPS:
        raise HTTPException(status_code=400, detail="Please select a valid muscle group.")

    db = await get_db()
    try:
        cursor = await db.execute(
            "INSERT INTO workouts (muscle_group) VALUES (?)",
            (request.muscle_group,),
        )
        workout_id = cursor.lastrowid

        for ex in request.exercises:
            await db.execute(
                """INSERT INTO workout_exercises
                   (workout_id, exercise_id, exercise_name, position, is_compound)
                   VALUES (?, ?, ?, ?, ?)""",
                (
                    workout_id,
                    ex.exercise_id,
                    ex.name,
                    ex.position,
                    ex.exercise_type == "compound",
                ),
            )
        await db.commit()

        # Return the saved workout
        cursor = await db.execute(
            "SELECT * FROM workouts WHERE id = ?", (workout_id,)
        )
        workout_row = await cursor.fetchone()

        cursor = await db.execute(
            """SELECT we.exercise_id, we.exercise_name AS name, we.position, we.is_compound,
                      COALESCE(e.sub_muscle_group, '') AS sub_muscle_group,
                      COALESCE(e.equipment, '') AS equipment
               FROM workout_exercises we
               LEFT JOIN exercises e ON we.exercise_id = e.id
               WHERE we.workout_id = ?
               ORDER BY we.position""",
            (workout_id,),
        )
        exercise_rows = await cursor.fetchall()

        exercises = []
        for row in exercise_rows:
            exercises.append(WorkoutExercise(
                exercise_id=row["exercise_id"] or 0,
                name=row["name"],
                exercise_type="compound" if row["is_compound"] else "isolation",
                sub_muscle_group=row["sub_muscle_group"],
                equipment=row["equipment"],
                position=row["position"],
            ))

        return WorkoutResponse(
            id=workout_row["id"],
            muscle_group=workout_row["muscle_group"],
            created_at=str(workout_row["created_at"]),
            exercises=exercises,
        )
    finally:
        await db.close()


@router.get("/workouts/history", response_model=list[WorkoutResponse])
async def history(muscle_group: str = None):
    db = await get_db()
    try:
        if muscle_group:
            if muscle_group not in VALID_MUSCLE_GROUPS:
                raise HTTPException(status_code=400, detail="Please select a valid muscle group.")
            cursor = await db.execute(
                "SELECT * FROM workouts WHERE muscle_group = ? ORDER BY created_at DESC",
                (muscle_group,),
            )
        else:
            cursor = await db.execute(
                "SELECT * FROM workouts ORDER BY created_at DESC"
            )
        workout_rows = await cursor.fetchall()

        result = []
        for w in workout_rows:
            cursor = await db.execute(
                """SELECT we.exercise_id, we.exercise_name AS name, we.position, we.is_compound,
                          COALESCE(e.sub_muscle_group, '') AS sub_muscle_group,
                          COALESCE(e.equipment, '') AS equipment
                   FROM workout_exercises we
                   LEFT JOIN exercises e ON we.exercise_id = e.id
                   WHERE we.workout_id = ?
                   ORDER BY we.position""",
                (w["id"],),
            )
            exercise_rows = await cursor.fetchall()

            exercises = []
            for row in exercise_rows:
                exercises.append(WorkoutExercise(
                    exercise_id=row["exercise_id"] or 0,
                    name=row["name"],
                    exercise_type="compound" if row["is_compound"] else "isolation",
                    sub_muscle_group=row["sub_muscle_group"],
                    equipment=row["equipment"],
                    position=row["position"],
                ))

            result.append(WorkoutResponse(
                id=w["id"],
                muscle_group=w["muscle_group"],
                created_at=str(w["created_at"]),
                exercises=exercises,
            ))

        return result
    finally:
        await db.close()


@router.get("/workouts/{workout_id}", response_model=WorkoutResponse)
async def get_workout(workout_id: int):
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM workouts WHERE id = ?", (workout_id,)
        )
        workout_row = await cursor.fetchone()
        if not workout_row:
            raise HTTPException(status_code=404, detail="Workout not found.")

        cursor = await db.execute(
            """SELECT we.exercise_id, we.exercise_name AS name, we.position, we.is_compound,
                      COALESCE(e.sub_muscle_group, '') AS sub_muscle_group,
                      COALESCE(e.equipment, '') AS equipment
               FROM workout_exercises we
               LEFT JOIN exercises e ON we.exercise_id = e.id
               WHERE we.workout_id = ?
               ORDER BY we.position""",
            (workout_id,),
        )
        exercise_rows = await cursor.fetchall()

        exercises = []
        for row in exercise_rows:
            exercises.append(WorkoutExercise(
                exercise_id=row["exercise_id"] or 0,
                name=row["name"],
                exercise_type="compound" if row["is_compound"] else "isolation",
                sub_muscle_group=row["sub_muscle_group"],
                equipment=row["equipment"],
                position=row["position"],
            ))

        return WorkoutResponse(
            id=workout_row["id"],
            muscle_group=workout_row["muscle_group"],
            created_at=str(workout_row["created_at"]),
            exercises=exercises,
        )
    finally:
        await db.close()
