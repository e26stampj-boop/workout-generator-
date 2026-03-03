import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MuscleGroupSelector from "../components/MuscleGroupSelector";
import { getWorkoutHistory } from "../services/api";
import type { SavedWorkout } from "../types";

export default function Dashboard() {
  const [recentWorkouts, setRecentWorkouts] = useState<SavedWorkout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWorkoutHistory()
      .then((data) => setRecentWorkouts(data.slice(0, 3)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold">Select a Muscle Group</h1>
      <p className="mt-1 mb-6 text-gray-500">
        Choose a muscle group to generate a workout.
      </p>

      <MuscleGroupSelector />

      <div className="mt-10">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        {loading ? (
          <div className="mt-4 flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-b-transparent" />
          </div>
        ) : recentWorkouts.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">
            No workouts yet — select a muscle group to get started!
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {recentWorkouts.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-sm"
              >
                <div>
                  <span className="font-medium">{w.muscle_group}</span>
                  <span className="ml-3 text-sm text-gray-400">
                    {new Date(w.created_at).toLocaleDateString()}
                  </span>
                </div>
                <span className="text-sm text-gray-400">
                  {w.exercises.length} exercises
                </span>
              </div>
            ))}
            <Link
              to="/history"
              className="mt-2 inline-block text-sm text-blue-600 hover:underline"
            >
              View all history →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
