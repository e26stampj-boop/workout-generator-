import os
import aiosqlite

DATABASE_PATH = os.path.join(os.path.dirname(__file__), "workoutgen.db")


async def get_db() -> aiosqlite.Connection:
    db = await aiosqlite.connect(DATABASE_PATH)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA foreign_keys = ON")
    return db


async def init_db():
    db = await get_db()
    try:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS exercises (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                muscle_group TEXT NOT NULL,
                sub_muscle_group TEXT NOT NULL,
                exercise_type TEXT NOT NULL CHECK(exercise_type IN ('compound', 'isolation')),
                equipment TEXT NOT NULL,
                default_rating INTEGER DEFAULT 3 CHECK(default_rating BETWEEN 1 AND 5),
                user_rating INTEGER DEFAULT NULL CHECK(user_rating IS NULL OR user_rating BETWEEN 1 AND 5),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS workouts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                muscle_group TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS workout_exercises (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                workout_id INTEGER NOT NULL,
                exercise_id INTEGER,
                exercise_name TEXT NOT NULL,
                position INTEGER NOT NULL,
                is_compound BOOLEAN NOT NULL,
                FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
                FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE SET NULL
            )
        """)

        await db.commit()

        # Seed data (INSERT OR IGNORE — safe to run every startup)
        from seed_data import seed
        await seed(db)

    finally:
        await db.close()
