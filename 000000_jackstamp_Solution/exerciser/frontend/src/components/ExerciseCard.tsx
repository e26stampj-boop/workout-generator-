import RatingStars from "./RatingStars";
import type { WorkoutExercise } from "../types";

interface Props {
  exercise: WorkoutExercise;
  currentRating: number;
  onRatingChange?: (exerciseId: number, rating: number) => void;
}

export default function ExerciseCard({
  exercise,
  currentRating,
  onRatingChange,
}: Props) {
  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{exercise.name}</h3>
          <p className="text-sm text-gray-500">
            {exercise.sub_muscle_group} · {exercise.equipment}
          </p>
        </div>
        <span
          className={`rounded px-2 py-1 text-xs font-medium ${
            exercise.exercise_type === "compound"
              ? "bg-blue-100 text-blue-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {exercise.exercise_type}
        </span>
      </div>
      {onRatingChange && (
        <div className="mt-3">
          <RatingStars
            rating={currentRating}
            onChange={(r) => onRatingChange(exercise.exercise_id, r)}
          />
        </div>
      )}
    </div>
  );
}
