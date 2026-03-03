import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import ExerciseCard from "../components/ExerciseCard";
import {
  generateWorkout,
  saveWorkout,
  updateRating,
} from "../services/api";
import type { GeneratedWorkout } from "../types";

export default function GenerateWorkout() {
  const { muscleGroup } = useParams<{ muscleGroup: string }>();
  const [workout, setWorkout] = useState<GeneratedWorkout | null>(null);
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Track current exercise IDs via ref so doGenerate can read them
  // without adding workout to its dependency array
  const currentExerciseIds = useRef<number[]>([]);
  useEffect(() => {
    currentExerciseIds.current =
      workout?.exercises.map((ex) => ex.exercise_id) ?? [];
  }, [workout]);

  const doGenerate = useCallback(async () => {
    if (!muscleGroup) return;
    const excludeIds = currentExerciseIds.current;
    setLoading(true);
    setError(null);
    setSaved(false);
    setSuccessMsg(null);
    try {
      const data = await generateWorkout(muscleGroup, excludeIds);
      setWorkout(data);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response: { data: { detail: string } } }).response?.data
              ?.detail
          : "Failed to generate workout.";
      setError(msg || "Failed to generate workout.");
    } finally {
      setLoading(false);
    }
  }, [muscleGroup]);

  useEffect(() => {
    doGenerate();
  }, [doGenerate]);

  const handleRating = async (exerciseId: number, rating: number) => {
    setRatings((prev) => ({ ...prev, [exerciseId]: rating }));
    try {
      await updateRating(exerciseId, rating);
    } catch {
      // rating save failed silently — local state still shows the stars
    }
  };

  const handleSave = async () => {
    if (!workout) return;
    setSaving(true);
    setError(null);
    try {
      await saveWorkout(workout);
      setSaved(true);
      setSuccessMsg("Workout saved!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setError("Failed to save workout.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to="/" className="text-sm text-blue-600 hover:underline">
            ← Back
          </Link>
          <h1 className="mt-1 text-2xl font-bold">{muscleGroup} Workout</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={doGenerate}
            disabled={loading}
            className="min-h-11 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate New"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || saved || !workout}
            className="min-h-11 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : saved ? "Saved ✓" : "Save Workout"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between rounded bg-red-50 border border-red-200 px-4 py-3 text-red-700">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 rounded bg-green-50 border border-green-200 px-4 py-3 text-green-700">
          {successMsg}{" "}
          <Link to="/history" className="underline">
            View history
          </Link>
        </div>
      )}

      {workout?.notice && (
        <div className="mb-4 rounded bg-yellow-50 border border-yellow-200 px-4 py-3 text-yellow-800">
          {workout.notice}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-b-transparent" />
        </div>
      ) : workout ? (
        <div className="space-y-4">
          {workout.exercises.map((ex) => (
            <ExerciseCard
              key={ex.position}
              exercise={ex}
              currentRating={ratings[ex.exercise_id] ?? 0}
              onRatingChange={handleRating}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
