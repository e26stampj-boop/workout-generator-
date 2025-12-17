from typing import List
from .models import UserProfile
from . import datastore
from .generator import generate_plan

def prompt_list(msg: str) -> List[str]:
    raw = input(msg).strip()
    if not raw:
        return []
    return [x.strip() for x in raw.split(",") if x.strip()]

def create_or_update_profile() -> UserProfile:
    user_id = input("User id (e.g., jack): ").strip()
    goal = input("Goal (strength/hypertrophy/fitness): ").strip().lower()
    days = int(input("Days per week (3-6): ").strip())
    minutes = int(input("Session length in minutes: ").strip())
    equipment = prompt_list("Equipment available (comma-separated: barbell,dumbbell,machine,bodyweight): ")
    avoid = prompt_list("Exercises to avoid (comma-separated, optional): ")

    profile = UserProfile(
        user_id=user_id,
        goal=goal,
        days_per_week=days,
        session_minutes=minutes,
        equipment_available=equipment,
        avoid_exercises=avoid,
    )
    datastore.save_user(profile.to_dict())
    return profile

def generate_for_user(profile: UserProfile):
    exercises = datastore.load_exercises()
    recent = datastore.get_recent_exercise_names(profile.user_id, lookback_plans=3)
    plan = generate_plan(profile, exercises, recent)
    datastore.save_plan(plan)
    print_plan(plan)

def print_plan(plan):
    print("\n=== Generated Plan ===")
    for d in plan["days"]:
        print(f"\nDay {d['day']} ({d['type']}):")
        for ex in d["exercises"]:
            print(f"  - {ex['name']} | {ex['sets']} x {ex['reps']} | {ex['movement']}")
