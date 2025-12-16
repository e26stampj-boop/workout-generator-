import random
from typing import List, Dict, Any, Tuple
from .models import Exercise, UserProfile

SPLITS = {
    3: ["full", "full", "full"],
    4: ["upper", "lower", "upper", "lower"],
    5: ["push", "pull", "legs", "upper", "lower"],
    6: ["push", "pull", "legs", "push", "pull", "legs"],
}

GOAL_REPS = {
    "strength": {"compound": (3, 6), "accessory": (6, 10)},
    "hypertrophy": {"compound": (6, 10), "accessory": (10, 15)},
    "fitness": {"compound": (6, 10), "accessory": (8, 12)},
}

def _filter_exercises(
    exercises: List[Exercise],
    profile: UserProfile,
) -> List[Exercise]:
    allowed = set(profile.equipment_available)
    avoid = set([a.lower() for a in profile.avoid_exercises])

    out = []
    for e in exercises:
        if e.name.lower() in avoid:
            continue
        if e.difficulty > 3:  # beginner guardrail
            continue
        if not (allowed.intersection(set(e.equipment))):
            continue
        out.append(e)
    return out

def _score(ex: Exercise, recent_names: set, movement_counts: Dict[str, int]) -> int:
    score = 100
    if ex.name in recent_names:
        score -= 40
    score -= movement_counts.get(ex.movement, 0) * 10
    if ex.compound:
        score += 15
    return score

def _pick_best(
    pool: List[Exercise],
    recent_names: set,
    movement_counts: Dict[str, int],
    k: int = 1
) -> List[Exercise]:
    ranked = sorted(pool, key=lambda e: _score(e, recent_names, movement_counts), reverse=True)
    # small randomness among top options to avoid identical plans every time
    top = ranked[:max(5, k)]
    random.shuffle(top)
    return top[:k]

def generate_plan(
    profile: UserProfile,
    exercises_raw: List[Dict[str, Any]],
    recent_exercise_names: List[str],
) -> Dict[str, Any]:
    exercises = [Exercise.from_dict(d) for d in exercises_raw]
    exercises = _filter_exercises(exercises, profile)

    split = SPLITS.get(profile.days_per_week, SPLITS[3])
    recent_set = set(recent_exercise_names)

    plan_days = []
    weekly_compound_targets = {"squat", "hinge", "push", "pull"}

    for day_index, day_type in enumerate(split, start=1):
        day = {"day": day_index, "type": day_type, "exercises": []}
        movement_counts: Dict[str, int] = {}

        # choose compounds first
        compounds = [e for e in exercises if e.compound]
        # encourage weekly coverage: if a movement hasn’t been hit yet, boost chances
        needed = weekly_compound_targets.copy()
        already = set([d["movement"] for d in day["exercises"] if "movement" in d])
        needed -= already

        # target 2 compounds for full/upper/lower, 1 for push/pull/legs
        compound_slots = 2 if day_type in {"full", "upper", "lower"} else 1

        for _ in range(compound_slots):
            pool = compounds
            picked = _pick_best(pool, recent_set, movement_counts, k=1)[0]
            movement_counts[picked.movement] = movement_counts.get(picked.movement, 0) + 1
            weekly_compound_targets.discard(picked.movement)
            day["exercises"].append(_format_exercise(picked, profile.goal, is_compound=True))

        # fill accessories until time limit is roughly met
        accessories = [e for e in exercises if not e.compound]
        time_used = sum(ex["time_cost"] for ex in day["exercises"])

        while time_used < profile.session_minutes - 10 and len(day["exercises"]) < 8:
            picked = _pick_best(accessories, recent_set, movement_counts, k=1)[0]
            movement_counts[picked.movement] = movement_counts.get(picked.movement, 0) + 1
            ex_fmt = _format_exercise(picked, profile.goal, is_compound=False)
            day["exercises"].append(ex_fmt)
            time_used += ex_fmt["time_cost"]
            recent_set.add(picked.name)  # reduce repeats within the same plan

        plan_days.append(day)

    return {
        "user_id": profile.user_id,
        "goal": profile.goal,
        "days_per_week": profile.days_per_week,
        "session_minutes": profile.session_minutes,
        "days": plan_days,
    }

def _format_exercise(ex: Exercise, goal: str, is_compound: bool) -> Dict[str, Any]:
    reps_low, reps_high = GOAL_REPS.get(goal, GOAL_REPS["fitness"])["compound" if is_compound else "accessory"]
    sets = 3 if is_compound else 3
    return {
        "name": ex.name,
        "movement": ex.movement,
        "compound": ex.compound,
        "sets": sets,
        "reps": f"{reps_low}-{reps_high}",
        "time_cost": ex.time_cost,
        "equipment": ex.equipment,
    }
