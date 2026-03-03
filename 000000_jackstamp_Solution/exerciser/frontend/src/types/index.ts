export interface Exercise {
  id: number;
  name: string;
  muscle_group: string;
  sub_muscle_group: string;
  exercise_type: "compound" | "isolation";
  equipment: string;
  default_rating: number;
  user_rating: number | null;
  created_at?: string;
}

export interface ExerciseCreate {
  name: string;
  muscle_group: string;
  sub_muscle_group: string;
  exercise_type: "compound" | "isolation";
  equipment: string;
  default_rating?: number;
}

export interface ExerciseUpdate extends ExerciseCreate {
  user_rating?: number | null;
}

export interface WorkoutExercise {
  exercise_id: number;
  name: string;
  exercise_type: "compound" | "isolation";
  sub_muscle_group: string;
  equipment: string;
  position: number;
}

export interface GeneratedWorkout {
  muscle_group: string;
  exercises: WorkoutExercise[];
  notice?: string | null;
}

export interface SavedWorkout {
  id: number;
  muscle_group: string;
  created_at: string;
  exercises: WorkoutExercise[];
}

export type MuscleGroup = "Legs" | "Chest" | "Back" | "Shoulders" | "Arms" | "Core";
