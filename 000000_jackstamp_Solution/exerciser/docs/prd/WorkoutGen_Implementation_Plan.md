# WorkoutGen Implementation Plan

## Context
Greenfield project — only `docs/` folder exists. Building the full WorkoutGen application from the [PRD v2](../WorkoutGen_PRD_v2.md): a FastAPI + React workout generator for an IB Computer Science IA.

**Approach:** Backend-first, then frontend. 8 interactive phases, each ending with a testable checkpoint. You'll kick off each phase with me.

---

## Phase 1: Project Scaffolding + Database + Seed Data

**Files to create:**
- `backend/requirements.txt` — fastapi, uvicorn, pydantic, aiosqlite
- `backend/database.py` — async SQLite connection, table creation (3 tables from PRD Section 4), PRAGMA foreign_keys ON
- `backend/seed_data.py` — 56 exercises as INSERT OR IGNORE (idempotent)
- `backend/main.py` — minimal FastAPI app, startup event calls `init_db()`, CORS for localhost:5173

**Checkpoint:** `uvicorn main:app --port 8000` starts clean. `sqlite3 workoutgen.db "SELECT COUNT(*) FROM exercises;"` returns 56. Swagger UI at `/docs` loads (empty).

---

## Phase 2: Pydantic Models + Exercise CRUD Endpoints

**Files to create:**
- `backend/models.py` — ExerciseCreate, ExerciseUpdate, ExerciseResponse, RatingUpdate + VALID_MUSCLE_GROUPS list
- `backend/routers/__init__.py`
- `backend/routers/exercises.py` — GET /api/muscle-groups, GET/POST /api/exercises, PUT/DELETE /api/exercises/{id}, PUT /api/exercises/{id}/rating
- Update `backend/main.py` to register router

**Checkpoint:** Via Swagger UI or curl — list exercises, create one, update rating, delete. Duplicate name returns 400. Invalid rating returns 422.

---

## Phase 3: Workout Generation Algorithm

**Files to create:**
- `backend/services/__init__.py`
- `backend/services/generator.py` — the core algorithm: compound selection (1, highest-rated), history exclusion, preference-weighted random selection with sub-muscle diversity
- `backend/routers/workouts.py` — POST /api/workouts/generate (preview), POST /api/workouts/save, GET /api/workouts/history, GET /api/workouts/{id}
- Update `backend/models.py` — GenerateRequest, WorkoutExercise, GeneratedWorkout, SaveWorkoutRequest, WorkoutResponse
- Update `backend/main.py` to register workouts router

**Key algorithm details:**
- `effective_rating = user_rating ?? default_rating`; weight = `effective_rating / 3.0`
- After selecting an isolation exercise, remove all exercises from that sub-muscle group from the pool
- If pool < needed after history exclusion, fall back to full isolation pool + set notice
- Core (0 compounds): skip compound step, fill all 5 slots with isolations
- Generate returns preview only; save is a separate call

**Checkpoint:** Generate Legs → 5 exercises, first is compound. Generate Core → 5 isolations. Save a Legs workout, generate again → different isolations. History endpoint returns saved workouts.

---

## Phase 4: Frontend Scaffolding + Types + API Client

**Files to create:**
- `frontend/package.json` — react, react-dom, react-router-dom, typescript, vite, @vitejs/plugin-react, tailwindcss, postcss, autoprefixer, axios
- `frontend/tsconfig.json`, `frontend/vite.config.ts` (with proxy `/api` → `localhost:8000`), `frontend/tailwind.config.js`, `frontend/postcss.config.js`
- `frontend/index.html`
- `frontend/src/main.tsx`, `frontend/src/index.css` (Tailwind directives)
- `frontend/src/App.tsx` — BrowserRouter with 4 routes: `/`, `/generate/:muscleGroup`, `/history`, `/exercises`
- `frontend/src/types/index.ts` — Exercise, ExerciseCreate, WorkoutExercise, GeneratedWorkout, SavedWorkout, MuscleGroup
- `frontend/src/services/api.ts` — axios instance + typed functions for every endpoint
- `frontend/src/components/NavBar.tsx` — responsive nav with hamburger on mobile
- 4 placeholder pages (Dashboard, GenerateWorkout, WorkoutHistory, ManageExercises)

**Checkpoint:** `npm run dev` at localhost:5173. All 4 routes render placeholders. NavBar links work. Vite proxy to backend works (verify GET /api/muscle-groups in Network tab). `npx tsc --noEmit` passes.

---

## Phase 5: Dashboard + Generate Workout Page (Core UI)

**Files to build out:**
- `frontend/src/components/MuscleGroupSelector.tsx` — 6 buttons in 2x3 grid, navigates to `/generate/{group}`
- `frontend/src/components/ExerciseCard.tsx` — name, type badge (compound=blue, isolation=green), sub-muscle, equipment, rating stars
- `frontend/src/components/RatingStars.tsx` — 5 clickable stars, calls PUT /api/exercises/{id}/rating
- `frontend/src/pages/Dashboard.tsx` — MuscleGroupSelector + recent workout summary
- `frontend/src/pages/GenerateWorkout.tsx` — generate on load, display 5 ExerciseCards, rate inline, "Generate New" and "Save Workout" buttons, notice banner for fallback pool

**Checkpoint:** Full happy path — select Legs → see 5 exercises → rate one → generate new (isolations change) → save → success message. Core generates 5 isolations. Mobile layout works at 375px.

---

## Phase 6: Workout History Page

**Files to build out:**
- `frontend/src/components/WorkoutList.tsx` — expandable cards showing date, muscle group, exercises with type badges
- `frontend/src/pages/WorkoutHistory.tsx` — muscle group filter buttons + WorkoutList, loading/empty states

**Checkpoint:** Saved workouts from Phase 5 appear. Filter by muscle group works. Expand a card to see exercises. Empty state shows when no history.

---

## Phase 7: Manage Exercises Page

**Files to build out:**
- `frontend/src/pages/ManageExercises.tsx` — table/card view of all exercises, search by name, filter by muscle group, Add Exercise form (validated), Edit inline/modal, Delete with confirmation dialog

**Checkpoint:** See all 56 exercises. Search "curl" filters correctly. Add "Chin-Up" → appears in list. Add "Chin-Up" again → uniqueness error. Edit → updates. Delete → confirmation → removed.

---

## Phase 8: Polish + Error Handling + Final Testing

**Modifications across all files:**
- Add loading spinners, empty states, error alerts (dismissible), success toasts (auto-dismiss 3s) to all pages
- Backend: validate muscle group on generate, return 400 if < 5 exercises available
- NavBar: active route highlighting, hamburger menu toggle on mobile
- Responsive: 44px min touch targets, mobile card layouts, no horizontal overflow at 375px

**Checkpoint:** Run through full PRD test table (Section 12) — all 22 test cases pass.

---

## Phase Dependency Graph

```
P1: Database + Seed → P2: Models + CRUD → P3: Algorithm
                                              ↓
                                          P4: Frontend Scaffold
                                              ↓
                                     P5: Dashboard + Generate
                                        ↓              ↓
                                   P6: History    P7: Manage Exercises
                                        ↓              ↓
                                       P8: Polish + Final Testing
```

## Files Summary

**Backend (10 files):** requirements.txt, database.py, seed_data.py, main.py, models.py, routers/__init__.py, routers/exercises.py, routers/workouts.py, services/__init__.py, services/generator.py

**Frontend (20 files):** package.json, tsconfig.json, vite.config.ts, tailwind.config.js, postcss.config.js, index.html, src/main.tsx, src/index.css, src/App.tsx, src/types/index.ts, src/services/api.ts, src/components/NavBar.tsx, src/components/MuscleGroupSelector.tsx, src/components/ExerciseCard.tsx, src/components/RatingStars.tsx, src/components/WorkoutList.tsx, src/pages/Dashboard.tsx, src/pages/GenerateWorkout.tsx, src/pages/WorkoutHistory.tsx, src/pages/ManageExercises.tsx

**Total: 30 files** + auto-generated workoutgen.db
