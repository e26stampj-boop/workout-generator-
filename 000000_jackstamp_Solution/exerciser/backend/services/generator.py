import random
import aiosqlite


async def generate_workout(
    db: aiosqlite.Connection,
    muscle_group: str,
    exclude_exercise_ids: list[int] | None = None,
) -> dict:
    """
    Generate a 5-exercise workout for the given muscle group.

    Algorithm:
      1. Select the single highest-rated compound exercise (skip if none exist).
      2. Retrieve the most recent workout's isolation exercises for this muscle group.
      3. Build an accessory pool by excluding last workout's sub-muscle groups
         and any explicitly excluded exercise IDs (from the current preview).
      4. Use preference-weighted random selection with sub-muscle diversity.
      5. Return the workout as a preview (not saved).
    """
    notice = None

    # --- Step 1: Compound selection ---
    cursor = await db.execute(
        """SELECT * FROM exercises
           WHERE muscle_group = ? AND exercise_type = 'compound'
           ORDER BY COALESCE(user_rating, default_rating) DESC, default_rating DESC
           LIMIT 1""",
        (muscle_group,),
    )
    compound_row = await cursor.fetchone()
    selected_compound = dict(compound_row) if compound_row else None

    # --- Step 2: History retrieval ---
    last_sub_muscles = set()

    cursor = await db.execute(
        """SELECT id FROM workouts
           WHERE muscle_group = ?
           ORDER BY created_at DESC
           LIMIT 1""",
        (muscle_group,),
    )
    last_workout_row = await cursor.fetchone()

    if last_workout_row:
        last_workout_id = last_workout_row["id"]
        # Get isolation exercises from the last workout, joining to get sub_muscle_group
        cursor = await db.execute(
            """SELECT e.sub_muscle_group
               FROM workout_exercises we
               LEFT JOIN exercises e ON we.exercise_id = e.id
               WHERE we.workout_id = ? AND we.is_compound = 0 AND e.id IS NOT NULL""",
            (last_workout_id,),
        )
        rows = await cursor.fetchall()
        last_sub_muscles = {row["sub_muscle_group"] for row in rows}

    # --- Step 3: Accessory exercise pool ---
    cursor = await db.execute(
        """SELECT * FROM exercises
           WHERE muscle_group = ? AND exercise_type = 'isolation'""",
        (muscle_group,),
    )
    all_isolations = [dict(row) for row in await cursor.fetchall()]

    # Filter out exercises whose sub_muscle_group was in the last workout
    if last_sub_muscles:
        available = [
            ex for ex in all_isolations
            if ex["sub_muscle_group"] not in last_sub_muscles
        ]
    else:
        available = list(all_isolations)

    # Also exclude exercises from the current unsaved preview
    exclude_set = set(exclude_exercise_ids or [])
    if exclude_set:
        available = [ex for ex in available if ex["id"] not in exclude_set]

    # --- Step 4: Preference-weighted selection ---
    needed = 5 - (1 if selected_compound else 0)

    if len(available) < needed:
        available = list(all_isolations)  # fallback to full pool
        if len(all_isolations) < needed:
            notice = f"Limited exercise pool — only {len(all_isolations)} isolation exercises available."
        elif last_sub_muscles:  # only show notice if we actually tried to exclude
            notice = "Limited exercise pool — some exercises may repeat from your last workout."

    selected_accessories = []
    selected_ids = set()
    pool = list(available)

    for _ in range(needed):
        # If pool is empty (exhausted all sub-muscle groups), refill with
        # remaining unselected exercises to allow a second pick from the same group
        if not pool:
            pool = [ex for ex in available if ex["id"] not in selected_ids]
        if not pool:
            break

        weights = [
            (ex["user_rating"] if ex["user_rating"] is not None else ex["default_rating"]) / 3.0
            for ex in pool
        ]
        chosen = random.choices(pool, weights=weights, k=1)[0]
        selected_accessories.append(chosen)
        selected_ids.add(chosen["id"])

        # Remove same sub_muscle_group from pool for diversity
        chosen_sub = chosen["sub_muscle_group"]
        pool = [ex for ex in pool if ex["sub_muscle_group"] != chosen_sub]

    # --- Step 5: Assembly ---
    exercises = []
    position = 1

    if selected_compound:
        exercises.append({
            "exercise_id": selected_compound["id"],
            "name": selected_compound["name"],
            "exercise_type": "compound",
            "sub_muscle_group": selected_compound["sub_muscle_group"],
            "equipment": selected_compound["equipment"],
            "position": position,
        })
        position += 1

    for acc in selected_accessories:
        exercises.append({
            "exercise_id": acc["id"],
            "name": acc["name"],
            "exercise_type": "isolation",
            "sub_muscle_group": acc["sub_muscle_group"],
            "equipment": acc["equipment"],
            "position": position,
        })
        position += 1

    return {
        "muscle_group": muscle_group,
        "exercises": exercises,
        "notice": notice,
    }
