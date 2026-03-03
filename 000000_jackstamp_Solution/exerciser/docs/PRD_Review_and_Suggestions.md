# WorkoutGen PRD — Review & Suggestions

**Date:** 2026-02-17
**Reviewed Document:** WorkoutGen Product Requirements Document (February 2026, 17 pages)
**Review Perspective:** Developer / Architect

---

## Table of Contents

1. [Algorithm & Core Logic](#1-algorithm--core-logic)
2. [Database Schema](#2-database-schema)
3. [API Specification](#3-api-specification)
4. [Seed Data & Exercise Model](#4-seed-data--exercise-model)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Validation & Error Handling](#6-validation--error-handling)
7. [Testing Strategy](#7-testing-strategy)
8. [Project Structure & Dependencies](#8-project-structure--dependencies)
9. [Missing Sections](#9-missing-sections)
10. [Summary: Priority-Ranked Action Items](#10-summary-priority-ranked-action-items)

---

## 1. Algorithm & Core Logic

### 1.1 — Compound selection count is ambiguous

**Section 6.2, Step 1** says "Select 1–2 compound exercises" but never specifies the rule for when to pick 1 vs 2. The pseudocode (6.3) says `SELECT top 1-2 compounds by rating` without a decision criterion.

**Suggestion:** Define an explicit rule. For example: "Select the single highest-rated compound. If two compounds share the top rating, include both." Or simply fix it to always 1 compound (simplifies the algorithm and guarantees 4 accessory slots for rotation).

### 1.2 — Fallback when the available pool is too small is under-specified

Step 3 removes all isolation exercises that match the previous workout's sub-muscle groups. If the pool becomes empty, the pseudocode falls back to `all_isolations`. But the PRD doesn't state:

- Whether the user should be warned that rotation couldn't be achieved.
- What the minimum number of exercises per muscle group should be before generation is allowed at all.
- What happens when there are zero compound exercises for a muscle group.

**Suggestion:** Add a pre-generation validation step: "The system must require at least N exercises (with at least 1 compound) in a muscle group before allowing generation, and must display a clear message if the threshold is not met." The testing table (SC#2, Extreme) hints at this but the algorithm section itself doesn't define the rule.

### 1.3 — "Swap at least two" vs algorithm logic mismatch

Success Criterion #4 requires "swap at least two accessory exercises for different ones targeting the same sub-muscle groups." However, the algorithm in Section 6.2 excludes *all* accessories from the last workout (by sub-muscle group), not just two. These are different behaviors:

- SC#4 implies at minimum 2 must change, but others could repeat.
- The algorithm excludes everything from last time, meaning potentially *all* change.

**Suggestion:** Reconcile the wording. If the algorithm's behavior is intended (exclude all prior accessories), update SC#4 to: "When generating a new workout, no accessory exercise from the most recent workout for that muscle group should repeat, unless the available pool is too small." If the intention is exactly 2 swaps, the algorithm needs rewriting.

### 1.4 — Rating weight formula lacks edge case handling

The preference-weighted formula is `weight = base_weight * (user_rating / 3.0)`. When `user_rating` is NULL (never rated), what value is used? The exercises table has `default_rating` (INTEGER, DEFAULT 3) and `user_rating` (INTEGER, DEFAULT NULL). The pseudocode uses `ex.user_rating` without a COALESCE/fallback.

**Suggestion:** Explicitly state: "If `user_rating` is NULL, use `default_rating` for weight calculation." Add this to Section 6.2, Step 4.

### 1.5 — `frequency_weight` is never explained

The `exercises` table has a `frequency_weight` column (REAL, DEFAULT 1.0), and the pseudocode references `ex.frequency_weight` in the weight calculation. But the PRD never explains:

- What adjusts this value.
- Whether it's meant to decay over time, increase with use, or be manually set.
- The relationship between `frequency_weight` and `user_rating`.

**Suggestion:** Add a subsection to Section 6 explaining frequency_weight's purpose and lifecycle. Example: "frequency_weight is a system-managed value that [increases/decreases] each time an exercise is selected, providing natural rotation pressure."

### 1.6 — No consideration of workout depth beyond the most recent

The algorithm only looks at the single most recent workout. If a user generates 3 Legs workouts in a row, the system only avoids exercises from the immediately prior one — workout #1's exercises could reappear in workout #3.

**Suggestion:** Consider whether this is acceptable or whether the history window should be configurable (e.g., exclude from the last N workouts). Even if the current design is intentional, document the rationale.

---

## 2. Database Schema

### 2.1 — Missing ON DELETE behavior for foreign keys

The `workout_exercises` table has foreign keys to `workouts.id` and `exercises.id`, but no ON DELETE clause is specified. If a user deletes an exercise (SC#11), what happens to historical workout_exercises rows referencing it?

**Suggestion:** Define cascade/restrict behavior explicitly:
- `exercise_id FOREIGN KEY -> exercises.id ON DELETE RESTRICT` (prevent deletion if used in history), or
- `ON DELETE SET NULL` (preserve history but mark exercise as removed), or
- `ON DELETE CASCADE` (delete history entries — probably undesirable).

This is a critical design decision that affects SC#7 (workout history) and SC#11 (delete exercise).

### 2.2 — No index definitions

The schema defines columns and constraints but no indexes. For workout generation, the algorithm queries:
- Exercises by `muscle_group` and `exercise_type` (Step 1, Step 3)
- The most recent workout by `muscle_group` ordered by `created_at` DESC (Step 2)

**Suggestion:** Define indexes on:
- `exercises(muscle_group, exercise_type)`
- `workouts(muscle_group, created_at)`
- `workout_exercises(workout_id)`

### 2.3 — `user_rating` on exercises table vs separate ratings endpoint

The schema stores `user_rating` directly on the `exercises` table, but the API has a separate `/api/ratings` endpoint (GET and POST). This creates confusion:

- Is `user_rating` just a column on exercises, or is there a separate ratings table?
- The API spec shows GET `/api/ratings` returning "Array of rating objects" — but no ratings table is defined in Section 4.

**Suggestion:** Either (a) remove the `/api/ratings` endpoints and handle ratings through PUT `/api/exercises/{id}`, or (b) define a `ratings` table if per-workout rating history is intended.

### 2.4 — No `updated_at` timestamp on exercises

The `exercises` table has `created_at` but no `updated_at`. When users edit exercises (SC#11), there's no record of when the modification occurred.

**Suggestion:** Add `updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP` to the exercises table.

---

## 3. API Specification

### 3.1 — Missing request body schemas

The API table lists endpoints and response types but never defines the request bodies. For example:
- POST `/api/exercises` — what fields are required in the JSON body?
- POST `/api/workouts/generate` — does the body contain `{ "muscle_group": "Legs" }` or is it a query parameter?
- POST `/api/ratings` — what is the shape: `{ "exercise_id": 1, "rating": 4 }`?

**Suggestion:** Add a request/response schema subsection for each endpoint, or at minimum provide example payloads. This is critical for frontend-backend contract alignment.

### 3.2 — No error response format defined

The API spec doesn't define what error responses look like. The validation section (9) defines error messages, but there's no standard error envelope.

**Suggestion:** Define a standard error response format:
```json
{
  "detail": "Exercise name is required and must be unique.",
  "status_code": 422
}
```
Note: FastAPI uses this format by default for HTTPException, but documenting it makes the frontend contract explicit.

### 3.3 — No pagination for history endpoint

GET `/api/workouts/history` returns "Array of past workouts." As workout history grows, this becomes a performance issue.

**Suggestion:** Add pagination parameters: `?page=1&per_page=20` or cursor-based pagination. Even if not implemented in v1, acknowledging the limitation is valuable.

### 3.4 — Missing PATCH vs PUT semantics

PUT `/api/exercises/{id}` is listed for updates. The PRD doesn't specify whether this is a full replacement (PUT) or partial update (PATCH). This matters for the frontend — does the edit form need to send all fields or just changed ones?

**Suggestion:** Clarify: "PUT requires the complete exercise object. Omitted fields will be reset to defaults." Or switch to PATCH for partial updates.

---

## 4. Seed Data & Exercise Model

### 4.1 — Core has zero compound exercises

The seed data lists 8 Core exercises, all typed as "Isolation." The algorithm (Step 1) selects 1–2 compound exercises per muscle group. This means Core workouts will have 0 compounds and 5 isolations.

This isn't necessarily wrong — core work is often isolation-based — but it contradicts SC#2: "including at least one compound movement that remains consistent across sessions."

**Suggestion:** Either:
- Add compound core exercises to the seed data (e.g., categorize Plank or Hanging Leg Raise as compound, or add exercises like Weighted Carry, Turkish Get-Up).
- Add an exception in the algorithm: "If no compound exercises exist for a muscle group, all 5 slots are filled with isolation exercises." And update SC#2 to account for this.

### 4.2 — Back has too many compounds, too few isolations

Back has 6 compound exercises and only 2 isolation exercises (Face Pull, Straight-Arm Pulldown). The algorithm needs 3-4 isolation slots. With only 2 isolations, every Back workout will include the same 2 isolation exercises — defeating the rotation purpose.

**Suggestion:** Add more Back isolation exercises to the seed data (e.g., Reverse Fly, Single-Arm Cable Row, Dumbbell Pullover) or recategorize some compound Back exercises.

### 4.3 — Arms muscle group mixes biceps and triceps without clear sub-group handling

The Arms group contains both Biceps and Triceps sub-muscle groups. The algorithm ensures sub-muscle group diversity (Step 4), but the compound exercises are all Triceps-focused (Close-Grip Bench Press, Tricep Dip). A generated Arms workout could theoretically be 2 triceps compounds + 3 triceps isolations with zero biceps work.

**Suggestion:** Either:
- Split Arms into "Biceps" and "Triceps" as separate muscle groups, or
- Add algorithm logic that ensures both sub-muscle groups within Arms are represented, or
- Add compound Biceps exercises (though these are rare anatomically — Chin-Up could qualify).

### 4.4 — Equipment field has no controlled vocabulary

The equipment column is free text. Seed data uses: Barbell, Dumbbell, Machine, Cable, Bodyweight, Ab Wheel. But since users can add custom exercises, they might enter "barbell" (lowercase), "Smith Machine", "Bands", etc.

**Suggestion:** Either constrain equipment to an enum/dropdown in the UI and validation layer, or document that equipment is free-text and case-insensitive matching should be used for any future filtering features.

---

## 5. Frontend Architecture

### 5.1 — No state management strategy defined

The PRD lists pages and components but doesn't specify how state is managed. For a React + TypeScript app, this is an important architectural decision:
- Is each page self-contained with local state + API calls?
- Is there a global state (React Context, Zustand, Redux)?
- How is the "currently selected muscle group" shared between Dashboard and Generate Workout pages?

**Suggestion:** Add a brief state management subsection to Section 3.3. For this app's complexity, local state + prop drilling or a simple React Context is likely sufficient — but it should be stated.

### 5.2 — No routing strategy defined

The project structure shows `react-router-dom` as a dependency and lists pages, but there are no route definitions. What are the URL paths?

**Suggestion:** Add a route table:
| Path | Page Component | Notes |
|------|---------------|-------|
| `/` | Dashboard | Landing page |
| `/generate/:muscleGroup` | GenerateWorkout | After muscle group selection |
| `/history` | WorkoutHistory | Past workouts |
| `/exercises` | ManageExercises | CRUD interface |

### 5.3 — No loading/empty state UX patterns

The UI spec describes pages when data exists, but not:
- What the Dashboard looks like when no workouts have been generated yet.
- Loading spinners/skeletons while API calls are in flight.
- Empty state for Workout History when history is empty.

**Suggestion:** Add a brief UX states subsection covering: loading, empty, error, and success states for each page.

### 5.4 — "Save Workout" flow is unclear

Section 8.1 says the Generate Workout page has a "Save Workout" button that "confirms and stores." But the algorithm (Section 6) says Step 5 stores the workout in the database immediately upon generation. So is the workout saved on generation or only when the user clicks Save?

**Suggestion:** Clarify the flow. If workouts are auto-saved on generation, the "Save" button is redundant. If workouts are only saved on user confirmation, the algorithm pseudocode needs a separation between "generate preview" and "commit to database." This is an important UX decision — users may want to regenerate before saving.

---

## 6. Validation & Error Handling

### 6.1 — No backend validation for exercise deletion with dependencies

Section 9 defines validation for creating/editing exercises but doesn't address:
- Attempting to delete an exercise that's referenced in workout history.
- Attempting to delete all exercises in a muscle group (making future generation impossible).

**Suggestion:** Add deletion validation rules. At minimum: "Warn the user if deleting an exercise would leave fewer than 5 exercises (or fewer than 1 compound) in its muscle group."

### 6.2 — No CORS configuration documented

Section 3.2 mentions `main.py` handles CORS configuration, but the allowed origins aren't specified. During development, the React dev server (typically port 5173) and FastAPI (typically port 8000) run on different ports.

**Suggestion:** Add a note: "CORS is configured to allow requests from `http://localhost:5173` during development. Production CORS settings should restrict to the deployed frontend origin."

### 6.3 — No API rate limiting or abuse prevention

For a single-user local tool this may be unnecessary, but if the app is ever hosted, there's no mention of rate limiting or request throttling.

**Suggestion:** Low priority — add a one-liner to Section 14 (Extensibility): "Rate limiting middleware (e.g., SlowAPI) can be added for production deployment."

---

## 7. Testing Strategy

### 7.1 — No automated testing approach specified

Section 12 defines manual test cases mapped to success criteria, which is good. But there's no mention of:
- Unit tests for the generation algorithm (pytest).
- API integration tests (TestClient from FastAPI).
- Frontend component tests (React Testing Library / Vitest).

**Suggestion:** Add a subsection for automated testing strategy. Even if manual testing is the primary approach for the IA, specifying the framework (pytest for backend, Vitest for frontend) shows technical awareness.

### 7.2 — Missing test cases for concurrent/sequential generation

The test table doesn't include a case for:
- Generating the same muscle group 3+ times in a row (to verify rotation beyond 1 workout).
- Generating different muscle groups back-to-back (to verify history is per-muscle-group, not global).

**Suggestion:** Add test cases:
| SC# | Test Action | Test Type | Test Data | Expected Outcome |
|-----|------------|-----------|-----------|-----------------|
| 4 | Sequential generation | Normal | Generate Legs 3 times | Workout 3 differs from workout 2; may share exercises with workout 1 |
| 4 | Cross-group independence | Normal | Generate Legs, then Chest | Chest workout unaffected by Legs history |

### 7.3 — No test case for rating persistence across sessions

SC#6 tests that ratings influence generation, but there's no test verifying that ratings persist after browser refresh or server restart (which exercises the SQLite persistence path).

**Suggestion:** Add: "Rate an exercise 5, close and reopen the app, verify rating is preserved."

---

## 8. Project Structure & Dependencies

### 8.1 — `seed_data.py` is listed in project structure but not in Section 3.2

Section 3.2 (Backend Architecture) describes `database.py` as handling "seed data loading," but the project structure (Section 10) shows a separate `seed_data.py` file. These should be consistent.

**Suggestion:** Either mention `seed_data.py` in Section 3.2, or consolidate seeding into `database.py` and remove `seed_data.py` from the project structure.

### 8.2 — Missing `ratings.py` router behavior

Section 3.2 lists `routers/ratings.py` for "Exercise rating endpoints," but if ratings are just a column update on the exercises table (as the schema suggests), a separate router is over-engineered. Clarify what `ratings.py` does that `exercises.py` doesn't.

### 8.3 — No `.env` or configuration management

There's no mention of configuration management — database path, API port, CORS origins, etc. These are currently hardcoded or defaulted.

**Suggestion:** Add a brief note about configuration. Even a simple `config.py` with constants is worth documenting:
```
DATABASE_PATH = "workoutgen.db"
API_HOST = "0.0.0.0"
API_PORT = 8000
```

### 8.4 — React 18 dependency is outdated

The PRD specifies `react: ^18.x` and `react-dom: ^18.x`. As of February 2026, React 19 has been stable for over a year. This isn't a blocker, but worth noting.

**Suggestion:** Either update to React 19 or note that React 18 is intentionally chosen for stability/documentation availability.

---

## 9. Missing Sections

### 9.1 — No data backup or recovery strategy

SQLite is a file-based database (`workoutgen.db`). If the file is corrupted or accidentally deleted, all workout history and custom exercises are lost. There's no mention of backup, export, or recovery.

**Suggestion:** Add to Extensibility or as a new section: "Users can back up their data by copying `workoutgen.db`. A future enhancement could add JSON export/import for exercise databases and workout history."

### 9.2 — No accessibility (a11y) requirements

The UI spec covers responsive design but has no accessibility requirements:
- Keyboard navigation for muscle group selection and rating stars.
- Screen reader labels for interactive elements.
- Color contrast requirements.

**Suggestion:** Add a brief a11y subsection to Section 8: "All interactive elements must be keyboard-accessible. Rating stars must have aria-labels. Color contrast must meet WCAG 2.1 AA."

### 9.3 — No deployment documentation

The PRD describes a development setup but doesn't address how the app is deployed or distributed. Is it:
- Run locally by the trainer on their own machine?
- Hosted on a server?
- Dockerized?

**Suggestion:** Add a deployment subsection or at minimum state: "The application is designed to run locally. The trainer starts the backend with `uvicorn main:app` and accesses the frontend at `localhost:5173`."

### 9.4 — No version/changelog section in the document itself

The PRD has no document version or revision history. If it's updated iteratively (which is likely for an IA), there should be a record of changes.

**Suggestion:** Add a version table at the top:
| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Feb 2026 | Initial release |

---

## 10. Summary: Priority-Ranked Action Items

### Critical (will cause bugs or block implementation)
1. **Resolve SC#4 vs algorithm mismatch** — the success criterion and algorithm describe different rotation behaviors (Section 1.3)
2. **Handle Core muscle group having zero compounds** — breaks SC#2's guarantee of "at least one compound" (Section 4.1)
3. **Define ON DELETE behavior for foreign keys** — exercise deletion will either crash or silently corrupt history (Section 2.1)
4. **Clarify Save Workout flow** — is the workout saved on generation or on user confirmation? (Section 5.4)
5. **Specify `frequency_weight` behavior** — the column exists and is used in the algorithm but never explained (Section 1.5)

### High (will cause confusion during implementation)
6. **Add API request body schemas** — frontend developer needs to know payload shapes (Section 3.1)
7. **Fix compound selection ambiguity (1 vs 2)** — algorithm can't be coded without a decision rule (Section 1.1)
8. **Reconcile `user_rating` / `ratings` endpoint / ratings table** — the schema and API tell different stories (Section 2.3)
9. **Add Back isolation exercises to seed data** — only 2 exist, making rotation impossible (Section 4.2)
10. **Define NULL user_rating handling in weight formula** — pseudocode will produce NaN/error (Section 1.4)

### Medium (improve quality and completeness)
11. Add error response format for API (Section 3.2)
12. Define state management and routing strategy (Sections 5.1, 5.2)
13. Add loading/empty/error UI states (Section 5.3)
14. Add deletion validation rules (Section 6.1)
15. Reconcile `seed_data.py` in project structure vs architecture description (Section 8.1)
16. Add indexes to database schema (Section 2.2)

### Low (nice to have)
17. Add accessibility requirements (Section 9.2)
18. Add deployment documentation (Section 9.3)
19. Add document version history (Section 9.4)
20. Add pagination to history endpoint (Section 3.3)
21. Consider React 19 (Section 8.4)
