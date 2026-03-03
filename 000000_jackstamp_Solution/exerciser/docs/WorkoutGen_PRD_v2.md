# Product Requirements Document

## WorkoutGen — Intelligent Workout Generator

IB Computer Science Internal Assessment
Client: Avery Swift, Personal Trainer
February 2026 | v2.0

---

## 1. Project Overview

WorkoutGen is a web-based application that intelligently generates workout routines for gym users. The application solves the problem of repetitive, stale workout routines by generating varied exercise selections while maintaining consistency with essential compound movements. It incorporates a preference-based feedback system inspired by spaced repetition algorithms, allowing users to influence future workout generation based on their exercise preferences.

### 1.1 Problem Statement

Gym-goers and personal trainers often default to the same exercises session after session, leading to workout staleness, reduced motivation, and physical plateaus. Existing workout apps either generate fully random routines with no historical awareness or lock users into rigid, pre-built programs with no customization. There is a need for an intelligent middle ground that maintains the consistency of foundational compound movements while systematically rotating accessory exercises based on history and user preferences.

### 1.2 Client Profile

Avery Swift is a personal trainer at Cape Cod Fitness Center in Hyannis, Massachusetts. He designs workout programs for multiple clients and has identified that his current manual approach to workout planning results in repetitive programming, particularly for isolation and accessory movements. He requires a tool that automates exercise rotation while respecting the importance of compound lifts and personal exercise preferences.

### 1.3 Technology Stack

- **Backend:** Python 3.11+ with FastAPI framework
- **Database:** SQLite 3 (file-based, serverless relational database)
- **Frontend:** TypeScript with React (Vite build tooling)
- **API Communication:** RESTful JSON API
- **Styling:** Tailwind CSS for responsive design

---

## 2. Success Criteria

The following success criteria were developed in consultation with the client (see Appendix A1 and A2) and will be used to evaluate the final product:

| # | Success Criterion | Priority |
|---|-------------------|----------|
| 1 | The system must allow the user to select from at least six muscle groups: Legs, Chest, Back, Shoulders, Arms, and Core. | Must Have |
| 2 | The system must generate a workout of five exercises for the selected muscle group, including at least one compound movement that remains consistent across sessions. If a muscle group has no compound exercises (e.g., Core), all five slots are filled with isolation exercises. | Must Have |
| 3 | The system must store workout history in a persistent SQLite database so that previously generated workouts can be referenced. | Must Have |
| 4 | When generating a new workout, the system must compare against the most recent workout for that muscle group and ensure no accessory exercises from the previous workout repeat, unless the available exercise pool is too small — in which case the system falls back to all available exercises and displays a notice to the user. | Must Have |
| 5 | The system must allow the user to rate each exercise on a scale of 1 to 5, indicating their preference. | Must Have |
| 6 | Exercise ratings must influence future workout generation, with higher-rated exercises appearing more frequently. | Must Have |
| 7 | The system must display a workout history view showing past workouts with dates and exercises. | Must Have |
| 8 | The system must allow the user to add custom exercises to the exercise database, specifying the muscle group, sub-muscle group, and whether it is a compound or isolation movement. | Must Have |
| 9 | The system must validate all user inputs, preventing empty fields, invalid ratings (outside 1–5), or duplicate exercise entries. | Must Have |
| 10 | The system must provide a responsive web interface that works on both desktop browsers and mobile devices. | Must Have |
| 11 | The system must allow the user to delete or edit existing exercises in the database. | Must Have |
| 12 | Each exercise in a generated workout must display its type (compound or isolation). | Should Have |

---

## 3. System Architecture

### 3.1 High-Level Architecture

The application follows a client-server architecture with clear separation of concerns:

**Frontend (TypeScript/React)** → **REST API (FastAPI)** → **SQLite Database**

### 3.2 Backend Architecture

The Python backend is structured using a modular approach:

- **main.py:** Application entry point, FastAPI app initialization, CORS configuration (allows `http://localhost:5173` during development)
- **database.py:** SQLite connection management, table creation
- **seed_data.py:** Pre-loaded exercise data, called by database.py on first run
- **models.py:** Pydantic models for request/response validation
- **routers/exercises.py:** CRUD endpoints for exercise management, including rating updates
- **routers/workouts.py:** Workout generation and history endpoints
- **services/generator.py:** Core workout generation algorithm with history-awareness and preference weighting

### 3.3 Frontend Architecture

The React frontend is organized by feature:

- **pages/:** Dashboard, Generate Workout, Workout History, Manage Exercises
- **components/:** Reusable UI components (ExerciseCard, RatingStars, MuscleGroupSelector, WorkoutList, NavBar)
- **services/api.ts:** Centralized API client with typed request/response interfaces
- **types/:** TypeScript interfaces mirroring backend models

**State Management:** Each page manages its own local state via React hooks (`useState`, `useEffect`). The selected muscle group is passed between Dashboard and Generate Workout via URL parameters (route params).

**Routing:**

| Path | Page Component | Notes |
|------|---------------|-------|
| `/` | Dashboard | Landing page with muscle group selection |
| `/generate/:muscleGroup` | GenerateWorkout | Workout display with rating and save |
| `/history` | WorkoutHistory | Past workouts list |
| `/exercises` | ManageExercises | CRUD interface |

---

## 4. Database Schema

The SQLite database consists of three main tables with the following structure:

### 4.1 exercises Table

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| name | TEXT | NOT NULL, UNIQUE |
| muscle_group | TEXT | NOT NULL |
| sub_muscle_group | TEXT | NOT NULL |
| exercise_type | TEXT | NOT NULL (compound/isolation) |
| equipment | TEXT | NOT NULL |
| default_rating | INTEGER | DEFAULT 3 |
| user_rating | INTEGER | DEFAULT NULL (1-5) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

### 4.2 workouts Table

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| muscle_group | TEXT | NOT NULL |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

### 4.3 workout_exercises Table

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| workout_id | INTEGER | FOREIGN KEY -> workouts.id ON DELETE CASCADE |
| exercise_id | INTEGER | FOREIGN KEY -> exercises.id ON DELETE SET NULL |
| exercise_name | TEXT | NOT NULL (snapshot of name at time of workout) |
| position | INTEGER | NOT NULL (order in workout) |
| is_compound | BOOLEAN | NOT NULL |

**Note on deletion:** When an exercise is deleted, historical workout_exercises rows preserve the `exercise_name` snapshot so workout history remains intact. The `exercise_id` is set to NULL to indicate the exercise no longer exists in the database.

---

## 5. API Specification

The backend exposes the following RESTful endpoints:

### 5.1 Exercise Endpoints

**GET /api/muscle-groups**
- Response: `["Legs", "Chest", "Back", "Shoulders", "Arms", "Core"]`

**GET /api/exercises?muscle_group={group}**
- Response: Array of exercise objects
```json
[{
  "id": 1, "name": "Barbell Back Squat", "muscle_group": "Legs",
  "sub_muscle_group": "Quadriceps", "exercise_type": "compound",
  "equipment": "Barbell", "default_rating": 5, "user_rating": null
}]
```

**POST /api/exercises**
- Request body:
```json
{
  "name": "Hip Thrust", "muscle_group": "Legs",
  "sub_muscle_group": "Glutes", "exercise_type": "compound",
  "equipment": "Barbell", "default_rating": 3
}
```
- Response: Created exercise object

**PUT /api/exercises/{id}**
- Request body: Complete exercise object (all fields required)
```json
{
  "name": "Hip Thrust", "muscle_group": "Legs",
  "sub_muscle_group": "Glutes", "exercise_type": "compound",
  "equipment": "Barbell", "default_rating": 3, "user_rating": 4
}
```
- Response: Updated exercise object

**DELETE /api/exercises/{id}**
- Response: `{ "message": "Exercise deleted successfully" }`

### 5.2 Workout Endpoints

**POST /api/workouts/generate**
- Request body: `{ "muscle_group": "Legs" }`
- Response: Generated workout preview (not yet saved)
```json
{
  "muscle_group": "Legs",
  "exercises": [
    { "exercise_id": 1, "name": "Barbell Back Squat", "exercise_type": "compound",
      "sub_muscle_group": "Quadriceps", "equipment": "Barbell", "position": 1 }
  ]
}
```

**POST /api/workouts/save**
- Request body: Workout object from generate response
- Response: Saved workout with id and timestamp

**GET /api/workouts/history?muscle_group={group}**
- Response: Array of past workouts (most recent first)

**GET /api/workouts/{id}**
- Response: Workout detail object with exercises

### 5.3 Rating Endpoint

**PUT /api/exercises/{id}/rating**
- Request body: `{ "rating": 4 }`
- Response: Updated exercise object

### 5.4 Error Response Format

All errors follow FastAPI's default format:
```json
{ "detail": "Exercise name is required and must be unique." }
```
HTTP status codes: 400 (bad request), 404 (not found), 422 (validation error).

---

## 6. Workout Generation Algorithm

### 6.1 Overview

The workout generation algorithm is the core computational feature of the application. It produces varied, intelligent workout plans by combining three strategies: compound movement persistence, history-based rotation, and preference-weighted selection.

### 6.2 Algorithm Steps

**Step 1 — Compound Movement Selection:** Query all compound exercises for the selected muscle group. Select the single highest-rated compound exercise. This compound remains consistent across sessions for that muscle group (e.g., Barbell Back Squat always appears in Legs workouts). If the user has rated compound exercises, the highest-rated is chosen. If ratings are tied, the exercise with the higher `default_rating` wins. If a muscle group has no compound exercises (e.g., Core), skip this step — all 5 slots will be filled with isolation exercises.

**Step 2 — History Retrieval:** Fetch the most recent workout for the selected muscle group from the database. Extract the list of accessory (isolation) exercises used in that workout. If no prior workout exists, skip to Step 4.

**Step 3 — Accessory Exercise Pool:** Query all isolation exercises for the muscle group. Remove any that were used in the most recent workout (matched by sub-muscle group). This ensures accessory exercises rotate between workouts.

**Step 4 — Preference-Weighted Selection:** For the remaining pool, calculate a selection weight for each exercise:

```
effective_rating = user_rating IF user_rating IS NOT NULL ELSE default_rating
weight = effective_rating / 3.0
```

A rating of 5 gives weight 1.67x. A rating of 1 gives weight 0.33x. A rating of 3 (the default) gives weight 1.0x.

Use weighted random selection to fill the remaining 4 exercise slots (or all 5 if no compounds exist), ensuring sub-muscle group diversity — once an exercise from a sub-muscle group is selected, remove remaining exercises from that same sub-muscle group before the next pick.

**Fallback:** If excluding last workout's exercises leaves fewer candidates than needed, fall back to the full isolation pool and mark the workout with a notice: "Limited exercise pool — some exercises may repeat from your last workout."

**Step 5 — Assembly and Storage Preview:** Combine compound and accessory selections into a workout of 5 exercises. Return as a preview to the user. The workout is only saved to the database when the user clicks "Save Workout."

### 6.3 Pseudocode

```
FUNCTION generate_workout(muscle_group):
    compounds = GET exercises WHERE muscle_group AND type = 'compound'
    selected_compound = SELECT top 1 by (user_rating ?? default_rating)

    last_workout = GET most recent workout WHERE muscle_group
    last_accessories = GET isolation exercises FROM last_workout

    all_isolations = GET exercises WHERE muscle_group AND type = 'isolation'
    available = all_isolations EXCLUDE last_accessories (by sub_muscle_group)

    IF available.length < needed_count:
        available = all_isolations    // fallback if pool too small
        mark_limited_pool = true

    needed_count = 5 - (1 IF selected_compound ELSE 0)

    FOR each remaining slot (needed_count):
        effective_rating = ex.user_rating ?? ex.default_rating
        weights = [effective_rating / 3.0 FOR ex IN available]
        selected = weighted_random_choice(available, weights)
        ADD selected to workout
        REMOVE same sub_muscle exercises from available

    workout = [selected_compound] + selected_accessories
    RETURN workout as preview (not yet saved)
```

---

## 7. Exercise Database (Seed Data)

The application ships with the following pre-loaded exercises. Users can add, edit, or delete exercises as needed.

### Legs (14 exercises: 7 compound, 7 isolation)

| Exercise Name | Sub-Muscle | Type | Equipment | Default Rating |
|--------------|------------|------|-----------|---------------|
| Barbell Back Squat | Quadriceps | Compound | Barbell | 5 |
| Conventional Deadlift | Posterior Chain | Compound | Barbell | 5 |
| Romanian Deadlift | Hamstrings | Compound | Barbell | 4 |
| Leg Press | Quadriceps | Compound | Machine | 4 |
| Hack Squat | Quadriceps | Compound | Machine | 4 |
| Front Squat | Quadriceps | Compound | Barbell | 4 |
| Bulgarian Split Squat | Quadriceps | Compound | Dumbbell | 3 |
| Seated Hamstring Curl | Hamstrings | Isolation | Machine | 3 |
| Lying Hamstring Curl | Hamstrings | Isolation | Machine | 3 |
| Seated Quad Extension | Quadriceps | Isolation | Machine | 3 |
| Hip Adduction | Adductors | Isolation | Machine | 3 |
| Hip Abduction | Abductors | Isolation | Machine | 3 |
| Standing Calf Raise | Calves | Isolation | Machine | 3 |
| Seated Calf Raise | Calves | Isolation | Machine | 3 |

### Chest (8 exercises: 5 compound, 3 isolation)

| Exercise Name | Sub-Muscle | Type | Equipment | Default Rating |
|--------------|------------|------|-----------|---------------|
| Barbell Bench Press | Pectorals | Compound | Barbell | 5 |
| Incline Barbell Bench | Upper Pecs | Compound | Barbell | 4 |
| Dumbbell Bench Press | Pectorals | Compound | Dumbbell | 4 |
| Incline Dumbbell Press | Upper Pecs | Compound | Dumbbell | 4 |
| Push-Up | Pectorals | Compound | Bodyweight | 3 |
| Cable Fly | Pectorals | Isolation | Cable | 3 |
| Pec Deck | Pectorals | Isolation | Machine | 3 |
| Dumbbell Fly | Pectorals | Isolation | Dumbbell | 3 |

### Back (9 exercises: 6 compound, 3 isolation)

| Exercise Name | Sub-Muscle | Type | Equipment | Default Rating |
|--------------|------------|------|-----------|---------------|
| Barbell Row | Lats/Rhomboids | Compound | Barbell | 5 |
| Pull-Up | Lats | Compound | Bodyweight | 5 |
| Lat Pulldown | Lats | Compound | Cable | 4 |
| Seated Cable Row | Mid-Back | Compound | Cable | 4 |
| Dumbbell Row | Lats | Compound | Dumbbell | 4 |
| T-Bar Row | Mid-Back | Compound | Barbell | 4 |
| Face Pull | Rear Delts | Isolation | Cable | 3 |
| Straight-Arm Pulldown | Lats | Isolation | Cable | 3 |
| Reverse Cable Fly | Mid-Back | Isolation | Cable | 3 |

**Note:** Back has many compounds and few isolations. The algorithm will select 1 compound + 4 from the isolation pool. With only 3 isolations, some repetition between workouts is expected. Users are encouraged to add more Back isolation exercises for better rotation.

### Shoulders (7 exercises: 3 compound, 4 isolation)

| Exercise Name | Sub-Muscle | Type | Equipment | Default Rating |
|--------------|------------|------|-----------|---------------|
| Overhead Press | Anterior Delt | Compound | Barbell | 5 |
| Dumbbell Shoulder Press | Anterior Delt | Compound | Dumbbell | 4 |
| Arnold Press | All Delts | Compound | Dumbbell | 4 |
| Lateral Raise | Lateral Delt | Isolation | Dumbbell | 3 |
| Front Raise | Anterior Delt | Isolation | Dumbbell | 3 |
| Rear Delt Fly | Posterior Delt | Isolation | Dumbbell | 3 |
| Cable Lateral Raise | Lateral Delt | Isolation | Cable | 3 |

### Arms (10 exercises: 2 compound, 8 isolation)

| Exercise Name | Sub-Muscle | Type | Equipment | Default Rating |
|--------------|------------|------|-----------|---------------|
| Close-Grip Bench Press | Triceps | Compound | Barbell | 4 |
| Tricep Dip | Triceps | Compound | Bodyweight | 4 |
| Barbell Curl | Biceps | Isolation | Barbell | 4 |
| Dumbbell Curl | Biceps | Isolation | Dumbbell | 3 |
| Hammer Curl | Brachialis | Isolation | Dumbbell | 3 |
| Preacher Curl | Biceps | Isolation | Machine | 3 |
| Tricep Pushdown | Triceps | Isolation | Cable | 3 |
| Overhead Tricep Extension | Triceps | Isolation | Dumbbell | 3 |
| Skull Crusher | Triceps | Isolation | Barbell | 3 |

**Note:** Both compound exercises target Triceps. The algorithm's sub-muscle diversity rule in Step 4 ensures Biceps isolation exercises are also selected, preventing an all-Triceps workout.

### Core (8 exercises: 0 compound, 8 isolation)

| Exercise Name | Sub-Muscle | Type | Equipment | Default Rating |
|--------------|------------|------|-----------|---------------|
| Plank | Rectus Abdominis | Isolation | Bodyweight | 4 |
| Hanging Leg Raise | Lower Abs | Isolation | Bodyweight | 4 |
| Cable Crunch | Rectus Abdominis | Isolation | Cable | 3 |
| Russian Twist | Obliques | Isolation | Bodyweight | 3 |
| Ab Wheel Rollout | Rectus Abdominis | Isolation | Ab Wheel | 3 |
| Side Plank | Obliques | Isolation | Bodyweight | 3 |
| Woodchop | Obliques | Isolation | Cable | 3 |
| Dead Bug | Core Stability | Isolation | Bodyweight | 3 |

**Note:** Core has no compound exercises. Per SC#2, all 5 slots are filled with isolation exercises and the compound selection step is skipped.

---

## 8. User Interface Specifications

### 8.1 Pages and Navigation

The application consists of four main views accessible via a navigation bar:

**Dashboard:** Landing page with muscle group selection buttons (six large, clearly labeled buttons). Shows a summary of recent workout activity.

**Generate Workout:** Displays the generated workout as a list of exercise cards. Each card shows: exercise name, type (compound/isolation badge), sub-muscle group, equipment needed. Includes a star-rating component (1–5) on each card. A "Generate New" button triggers generation. A "Save Workout" button commits the workout to the database and adds it to history. Users can regenerate before saving.

**Workout History:** Chronological list of past workouts. Each entry shows date, muscle group, and list of exercises. Expandable/collapsible cards for detail. Optional filter by muscle group.

**Manage Exercises:** Full CRUD interface for the exercise database. Table view with search/filter. Add Exercise form with validation. Edit and Delete actions with confirmation dialog.

### 8.2 UI States

Each page handles the following states:

- **Loading:** Show a spinner or skeleton placeholder while API calls are in flight.
- **Empty:** Show a helpful message when no data exists (e.g., "No workouts yet — select a muscle group to get started" on Dashboard, "No workout history" on History page).
- **Error:** Display the error message from the API in a dismissible alert.
- **Success:** Brief confirmation toast after save/delete/edit actions.

### 8.3 Responsive Design Requirements

- Mobile-first approach: all layouts must work at 375px width minimum
- Desktop layouts may use multi-column grids for exercise cards
- Navigation collapses to a hamburger menu on mobile
- Touch-friendly targets: minimum 44px tap areas for all interactive elements
- Rating stars must be easily tappable on mobile devices

---

## 9. Input Validation Rules

| Field | Validation Rule | Error Message |
|-------|----------------|---------------|
| Exercise Name | Non-empty, 2–100 characters, unique in database | "Exercise name is required and must be unique." |
| Muscle Group | Must be one of: Legs, Chest, Back, Shoulders, Arms, Core | "Please select a valid muscle group." |
| Sub-Muscle Group | Non-empty, 2–50 characters | "Sub-muscle group is required." |
| Exercise Type | Must be 'compound' or 'isolation' | "Exercise type must be compound or isolation." |
| Equipment | Non-empty, 2–50 characters | "Equipment field is required." |
| Rating | Integer between 1 and 5 inclusive | "Rating must be between 1 and 5." |

---

## 10. Project Structure

Recommended folder structure for VS Code development:

```
workoutgen/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── seed_data.py
│   ├── models.py
│   ├── routers/
│   │   ├── exercises.py
│   │   └── workouts.py
│   ├── services/
│   │   └── generator.py
│   ├── workoutgen.db
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── GenerateWorkout.tsx
│   │   │   ├── WorkoutHistory.tsx
│   │   │   └── ManageExercises.tsx
│   │   ├── components/
│   │   │   ├── ExerciseCard.tsx
│   │   │   ├── RatingStars.tsx
│   │   │   ├── MuscleGroupSelector.tsx
│   │   │   ├── WorkoutList.tsx
│   │   │   └── NavBar.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   └── types/
│   │       └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── README.md
```

**Changes from v1:** Removed separate `routers/ratings.py` — rating updates are handled by `PUT /api/exercises/{id}/rating` within `routers/exercises.py`. Added `seed_data.py` as an explicit module.

---

## 11. Dependencies

### 11.1 Backend (requirements.txt)

```
fastapi>=0.104.0
uvicorn>=0.24.0
pydantic>=2.5.0
aiosqlite>=0.19.0  # async SQLite support
```

### 11.2 Frontend (package.json key dependencies)

```
react: ^18.x
react-dom: ^18.x
react-router-dom: ^6.x
typescript: ^5.x
vite: ^5.x
tailwindcss: ^3.x
axios: ^1.x  # HTTP client for API calls
```

---

## 12. Testing Strategy

Each success criterion must have corresponding test cases covering normal, abnormal, and extreme/boundary conditions:

| SC# | Test Action | Test Type | Test Data | Expected Outcome |
|-----|------------|-----------|-----------|-----------------|
| 1 | Select muscle group | Normal | Click "Legs" | Legs is selected, generation page loads |
| 1 | No selection made | Abnormal | Click Generate without selecting | Error: "Please select a muscle group" |
| 2 | Generate workout | Normal | Select Legs, generate | 5 exercises shown, including a compound |
| 2 | Empty exercise DB | Extreme | Delete all Legs exercises | Error: "Not enough exercises" |
| 2 | Generate Core workout | Normal | Select Core, generate | 5 isolation exercises (no compound expected) |
| 3 | Data persistence | Normal | Generate workout, restart app | Workout appears in history |
| 4 | History-based swap | Normal | Generate Legs twice | Accessory exercises differ between workouts |
| 4 | Only 3 exercises exist | Extreme | Remove exercises until 3 remain | Generates with available, shows limited pool notice |
| 4 | Sequential generation | Normal | Generate Legs 3 times | Workout 3 differs from workout 2 |
| 4 | Cross-group independence | Normal | Generate Legs, then Chest | Chest workout unaffected by Legs history |
| 5 | Rate exercise | Normal | Click 4 stars on Squat | Rating saved, displays 4 stars |
| 5 | Invalid rating | Abnormal | API call with rating=0 | Error: "Rating must be 1–5" |
| 5 | Rating persistence | Normal | Rate exercise, refresh browser | Rating is preserved |
| 6 | Preference influence | Normal | Rate exercise 5, generate 10 times | High-rated exercise appears more often |
| 7 | View history | Normal | Navigate to History | Past workouts displayed with dates |
| 8 | Add exercise | Normal | Fill all fields, submit | Exercise added to database |
| 8 | Duplicate name | Abnormal | Add existing exercise name | Error: "Exercise already exists" |
| 9 | Empty field | Abnormal | Submit with blank name | Error: "Name is required" |
| 10 | Mobile view | Normal | Open on 375px viewport | Layout responsive, no overflow |
| 11 | Edit exercise | Normal | Change name, save | Name updated in database |
| 11 | Delete exercise | Normal | Click delete, confirm | Exercise removed from database |
| 12 | Type display | Normal | Generate workout | Each exercise shows compound/isolation badge |

---

## 13. Development Milestones

| Phase | Tasks | Deliverables |
|-------|-------|-------------|
| Week 1–2 | Set up project structure, initialize backend with FastAPI, create SQLite database schema, seed exercise data | Working backend with database, seed data loaded |
| Week 3–4 | Implement exercise CRUD endpoints, build workout generation algorithm, implement history-based rotation logic | API endpoints functional, generation algorithm working |
| Week 5–6 | Build React frontend, implement Dashboard and Generate Workout pages, connect to API | Functional UI with workout generation |
| Week 7–8 | Implement rating system, build Workout History page, build Manage Exercises page | Full feature set complete |
| Week 9 | Input validation (frontend and backend), error handling, responsive design polish | Production-ready application |
| Week 10 | Full testing against all success criteria, bug fixes | Completed test plan with evidence |

---

## 14. Extensibility Considerations

The application is designed with extensibility in mind, supporting future enhancements without major architectural changes:

- **Database migration:** SQLite can be replaced with PostgreSQL by changing the connection string; the schema and queries remain compatible.
- **Multi-user support:** Adding a users table and authentication layer (e.g., JWT tokens) would enable multiple trainers to have separate workout histories and preferences.
- **Exercise categories:** The sub_muscle_group field supports arbitrary categorization; new muscle groups or sub-groups can be added without schema changes.
- **Workout templates:** A templates table could store predefined workout structures that the generation algorithm uses as starting points.
- **Progress tracking:** Adding weight, sets, and reps fields to workout_exercises would enable strength progression tracking.
- **API versioning:** The /api/ prefix supports versioned endpoints (e.g., /api/v2/) for backward-compatible upgrades.
- **Data backup:** Users can back up their data by copying `workoutgen.db`. A future enhancement could add JSON export/import.

---

## 15. Running the Application

The application is designed to run locally:

```bash
# Backend
cd workoutgen/backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend (separate terminal)
cd workoutgen/frontend
npm install
npm run dev
# Opens at http://localhost:5173
```
