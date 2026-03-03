import axios from "axios";
import type {
  Exercise,
  ExerciseCreate,
  ExerciseUpdate,
  GeneratedWorkout,
  SavedWorkout,
  MuscleGroup,
} from "../types";

const api = axios.create({
  baseURL: "/api",
});

// --- Exercises ---

export const getMuscleGroups = () =>
  api.get<MuscleGroup[]>("/muscle-groups").then((r) => r.data);

export const getExercises = (muscleGroup?: string) =>
  api
    .get<Exercise[]>("/exercises", {
      params: muscleGroup ? { muscle_group: muscleGroup } : {},
    })
    .then((r) => r.data);

export const createExercise = (data: ExerciseCreate) =>
  api.post<Exercise>("/exercises", data).then((r) => r.data);

export const updateExercise = (id: number, data: ExerciseUpdate) =>
  api.put<Exercise>(`/exercises/${id}`, data).then((r) => r.data);

export const deleteExercise = (id: number) =>
  api.delete(`/exercises/${id}`).then((r) => r.data);

export const updateRating = (id: number, rating: number) =>
  api.put<Exercise>(`/exercises/${id}/rating`, { rating }).then((r) => r.data);

// --- Workouts ---

export const generateWorkout = (muscleGroup: string, excludeExerciseIds?: number[]) =>
  api
    .post<GeneratedWorkout>("/workouts/generate", {
      muscle_group: muscleGroup,
      exclude_exercise_ids: excludeExerciseIds ?? [],
    })
    .then((r) => r.data);

export const saveWorkout = (workout: GeneratedWorkout) =>
  api.post<SavedWorkout>("/workouts/save", workout).then((r) => r.data);

export const getWorkoutHistory = (muscleGroup?: string) =>
  api
    .get<SavedWorkout[]>("/workouts/history", {
      params: muscleGroup ? { muscle_group: muscleGroup } : {},
    })
    .then((r) => r.data);

export const getWorkout = (id: number) =>
  api.get<SavedWorkout>(`/workouts/${id}`).then((r) => r.data);
