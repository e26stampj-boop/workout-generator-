import { useEffect, useState } from "react";
import RatingStars from "../components/RatingStars";
import {
  getExercises,
  createExercise,
  updateExercise,
  deleteExercise,
} from "../services/api";
import type { Exercise, ExerciseCreate, MuscleGroup } from "../types";

const MUSCLE_GROUPS: MuscleGroup[] = [
  "Legs",
  "Chest",
  "Back",
  "Shoulders",
  "Arms",
  "Core",
];

const EXERCISE_TYPES = ["compound", "isolation"] as const;

const EMPTY_FORM: ExerciseCreate = {
  name: "",
  muscle_group: "Legs",
  sub_muscle_group: "",
  exercise_type: "compound",
  equipment: "",
  default_rating: 3,
};

export default function ManageExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState<string>("");

  // Add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<ExerciseCreate>({ ...EMPTY_FORM });
  const [addError, setAddError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ExerciseCreate & { user_rating?: number | null }>({ ...EMPTY_FORM });
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Exercise | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Success toast
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const loadExercises = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getExercises();
      setExercises(data);
    } catch {
      setError("Failed to load exercises.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExercises();
  }, []);

  // Filter + search
  const filtered = exercises.filter((ex) => {
    const matchesGroup = filterGroup === "" || ex.muscle_group === filterGroup;
    const matchesSearch =
      search === "" ||
      ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.sub_muscle_group.toLowerCase().includes(search.toLowerCase()) ||
      ex.equipment.toLowerCase().includes(search.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  // --- Add ---
  const handleAdd = async () => {
    setAddError(null);
    if (!addForm.name.trim() || !addForm.sub_muscle_group.trim() || !addForm.equipment.trim()) {
      setAddError("All fields are required.");
      return;
    }
    setAddLoading(true);
    try {
      const created = await createExercise(addForm);
      setExercises((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setAddForm({ ...EMPTY_FORM });
      setShowAddForm(false);
      showSuccess(`"${created.name}" added successfully.`);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response: { data: { detail: string } } }).response?.data?.detail
          : "Failed to add exercise.";
      setAddError(msg || "Failed to add exercise.");
    } finally {
      setAddLoading(false);
    }
  };

  // --- Edit ---
  const startEdit = (ex: Exercise) => {
    setEditingId(ex.id);
    setEditForm({
      name: ex.name,
      muscle_group: ex.muscle_group,
      sub_muscle_group: ex.sub_muscle_group,
      exercise_type: ex.exercise_type,
      equipment: ex.equipment,
      default_rating: ex.default_rating,
      user_rating: ex.user_rating,
    });
    setEditError(null);
  };

  const handleEdit = async () => {
    if (editingId === null) return;
    setEditError(null);
    if (!editForm.name.trim() || !editForm.sub_muscle_group.trim() || !editForm.equipment.trim()) {
      setEditError("All fields are required.");
      return;
    }
    setEditLoading(true);
    try {
      const updated = await updateExercise(editingId, editForm);
      setExercises((prev) =>
        prev.map((ex) => (ex.id === editingId ? updated : ex)).sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingId(null);
      showSuccess(`"${updated.name}" updated successfully.`);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response: { data: { detail: string } } }).response?.data?.detail
          : "Failed to update exercise.";
      setEditError(msg || "Failed to update exercise.");
    } finally {
      setEditLoading(false);
    }
  };

  // --- Delete ---
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteExercise(deleteTarget.id);
      setExercises((prev) => prev.filter((ex) => ex.id !== deleteTarget.id));
      showSuccess(`"${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
    } catch {
      setError("Failed to delete exercise.");
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manage Exercises</h1>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setAddError(null);
            setAddForm({ ...EMPTY_FORM });
          }}
          className="min-h-11 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showAddForm ? "Cancel" : "+ Add Exercise"}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mt-4 flex items-center justify-between rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            ✕
          </button>
        </div>
      )}

      {/* Success toast */}
      {successMsg && (
        <div className="mt-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-green-700">
          {successMsg}
        </div>
      )}

      {/* Add Exercise Form */}
      {showAddForm && (
        <div className="mt-4 rounded-lg bg-white p-4 shadow">
          <h2 className="mb-3 font-semibold">Add New Exercise</h2>
          {addError && (
            <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {addError}
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Exercise name"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              className="min-h-11 rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <select
              value={addForm.muscle_group}
              onChange={(e) => setAddForm({ ...addForm, muscle_group: e.target.value })}
              className="min-h-11 rounded border border-gray-300 px-3 py-2 text-sm"
            >
              {MUSCLE_GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Sub-muscle group"
              value={addForm.sub_muscle_group}
              onChange={(e) => setAddForm({ ...addForm, sub_muscle_group: e.target.value })}
              className="min-h-11 rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <select
              value={addForm.exercise_type}
              onChange={(e) => setAddForm({ ...addForm, exercise_type: e.target.value as "compound" | "isolation" })}
              className="min-h-11 rounded border border-gray-300 px-3 py-2 text-sm"
            >
              {EXERCISE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Equipment"
              value={addForm.equipment}
              onChange={(e) => setAddForm({ ...addForm, equipment: e.target.value })}
              className="min-h-11 rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Default rating:</span>
              <RatingStars
                rating={addForm.default_rating ?? 3}
                onChange={(r) => setAddForm({ ...addForm, default_rating: r })}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleAdd}
              disabled={addLoading}
              className="min-h-11 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {addLoading ? "Adding..." : "Add Exercise"}
            </button>
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Search exercises..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-h-11 flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterGroup("")}
            className={`min-h-11 rounded-full px-3 py-1.5 text-sm font-medium ${
              filterGroup === ""
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            All
          </button>
          {MUSCLE_GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setFilterGroup(g)}
              className={`min-h-11 rounded-full px-3 py-1.5 text-sm font-medium ${
                filterGroup === g
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise count */}
      <p className="mt-3 text-sm text-gray-400">
        {filtered.length} exercise{filtered.length !== 1 ? "s" : ""}
        {search || filterGroup ? " matching" : ""}
      </p>

      {/* Exercise List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-b-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-4 text-sm text-gray-400">No exercises found.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {filtered.map((ex) =>
            editingId === ex.id ? (
              /* --- Inline edit row --- */
              <div key={ex.id} className="rounded-lg bg-blue-50 p-4 shadow">
                {editError && (
                  <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {editError}
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="min-h-11 rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                  <select
                    value={editForm.muscle_group}
                    onChange={(e) => setEditForm({ ...editForm, muscle_group: e.target.value })}
                    className="min-h-11 rounded border border-gray-300 px-3 py-2 text-sm"
                  >
                    {MUSCLE_GROUPS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={editForm.sub_muscle_group}
                    onChange={(e) => setEditForm({ ...editForm, sub_muscle_group: e.target.value })}
                    className="min-h-11 rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                  <select
                    value={editForm.exercise_type}
                    onChange={(e) => setEditForm({ ...editForm, exercise_type: e.target.value as "compound" | "isolation" })}
                    className="min-h-11 rounded border border-gray-300 px-3 py-2 text-sm"
                  >
                    {EXERCISE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={editForm.equipment}
                    onChange={(e) => setEditForm({ ...editForm, equipment: e.target.value })}
                    className="min-h-11 rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Default:</span>
                    <RatingStars
                      rating={editForm.default_rating ?? 3}
                      onChange={(r) => setEditForm({ ...editForm, default_rating: r })}
                    />
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    onClick={() => setEditingId(null)}
                    className="min-h-11 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEdit}
                    disabled={editLoading}
                    className="min-h-11 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {editLoading ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              /* --- Display row --- */
              <div
                key={ex.id}
                className="flex flex-col gap-2 rounded-lg bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{ex.name}</span>
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
                  <div className="mt-1 text-sm text-gray-500">
                    {ex.muscle_group} &middot; {ex.sub_muscle_group} &middot; {ex.equipment}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <RatingStars rating={ex.user_rating ?? ex.default_rating} readonly />
                    {ex.user_rating && (
                      <span className="text-xs text-gray-400">user rated</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(ex)}
                    className="min-h-11 rounded-lg bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(ex)}
                    className="min-h-11 rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Delete Exercise</h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete{" "}
              <span className="font-medium">{deleteTarget.name}</span>? This
              action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="min-h-11 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="min-h-11 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
