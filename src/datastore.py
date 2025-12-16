import json
from pathlib import Path
from typing import List, Dict, Any, Optional

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
EXERCISES_PATH = DATA_DIR / "exercises.json"
USERS_PATH = DATA_DIR / "users.json"
PLANS_PATH = DATA_DIR / "plans.json"

def _read_json(path: Path, default):
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(default, indent=2))
    return json.loads(path.read_text())

def _write_json(path: Path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2))

def load_exercises() -> List[Dict[str, Any]]:
    return _read_json(EXERCISES_PATH, default=[])

def load_users() -> List[Dict[str, Any]]:
    return _read_json(USERS_PATH, default=[])

def save_user(user_dict: Dict[str, Any]) -> None:
    users = load_users()
    # upsert by user_id
    users = [u for u in users if u.get("user_id") != user_dict.get("user_id")]
    users.append(user_dict)
    _write_json(USERS_PATH, users)

def load_plans() -> List[Dict[str, Any]]:
    return _read_json(PLANS_PATH, default=[])

def save_plan(plan_dict: Dict[str, Any]) -> None:
    plans = load_plans()
    plans.append(plan_dict)
    _write_json(PLANS_PATH, plans)

def get_recent_exercise_names(user_id: str, lookback_plans: int = 3) -> List[str]:
    plans = [p for p in load_plans() if p.get("user_id") == user_id]
    plans = plans[-lookback_plans:]
    names: List[str] = []
    for p in plans:
        for day in p.get("days", []):
            for ex in day.get("exercises", []):
                names.append(ex.get("name", ""))
    return [n for n in names if n]
