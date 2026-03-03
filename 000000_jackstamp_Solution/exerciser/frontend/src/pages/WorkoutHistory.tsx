import { useEffect, useState } from "react";
import WorkoutList from "../components/WorkoutList";
import { getWorkoutHistory } from "../services/api";
import type { SavedWorkout, MuscleGroup } from "../types";

const MUSCLE_GROUPS: MuscleGroup[] = [
  "Legs",
  "Chest",
  "Back",
  "Shoulders",
  "Arms",
  "Core",
];

export default function WorkoutHistory() {
  const [workouts, setWorkouts] = useState<SavedWorkout[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getWorkoutHistory(filter || undefined)
      .then(setWorkouts)
      .catch(() => setError("Failed to load workout history."))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Workout History</h1>

      {/* Filter buttons */}
      <div className="mt-4 mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("")}
          className={`min-h-11 rounded-full px-4 py-1.5 text-sm font-medium ${
            filter === ""
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          All
        </button>
        {MUSCLE_GROUPS.map((group) => (
          <button
            key={group}
            onClick={() => setFilter(group)}
            className={`min-h-11 rounded-full px-4 py-1.5 text-sm font-medium ${
              filter === group
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {group}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-b-transparent" />
        </div>
      ) : (
        <WorkoutList workouts={workouts} />
      )}
    </div>
  );
}
