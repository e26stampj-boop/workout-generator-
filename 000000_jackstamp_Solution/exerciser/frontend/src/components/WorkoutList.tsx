import { useState } from "react";
import type { SavedWorkout } from "../types";

interface Props {
  workouts: SavedWorkout[];
}

export default function WorkoutList({ workouts }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (workouts.length === 0) {
    return (
      <p className="text-sm text-gray-400">No workout history yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      {workouts.map((w) => (
        <div key={w.id} className="rounded-lg bg-white shadow">
          <button
            onClick={() => setExpandedId(expandedId === w.id ? null : w.id)}
            className="flex w-full items-center justify-between p-4 text-left"
          >
            <div>
              <span className="font-semibold">{w.muscle_group}</span>
              <span className="ml-3 text-sm text-gray-400">
                {new Date(w.created_at).toLocaleDateString()}
              </span>
            </div>
            <span className="text-gray-400">
              {expandedId === w.id ? "▲" : "▼"}
            </span>
          </button>
          {expandedId === w.id && (
            <div className="border-t px-4 pb-4">
              {w.exercises.map((ex) => (
                <div
                  key={ex.position}
                  className="flex items-center justify-between py-2"
                >
                  <span>
                    {ex.position}. {ex.name}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      ex.exercise_type === "compound"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {ex.exercise_type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
