import { useNavigate } from "react-router-dom";
import type { MuscleGroup } from "../types";

const MUSCLE_GROUPS: MuscleGroup[] = [
  "Legs",
  "Chest",
  "Back",
  "Shoulders",
  "Arms",
  "Core",
];

export default function MuscleGroupSelector() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {MUSCLE_GROUPS.map((group) => (
        <button
          key={group}
          onClick={() => navigate(`/generate/${group}`)}
          className="min-h-[80px] rounded-lg bg-white p-6 text-lg font-semibold shadow transition-all hover:bg-blue-50 hover:shadow-md"
        >
          {group}
        </button>
      ))}
    </div>
  );
}
