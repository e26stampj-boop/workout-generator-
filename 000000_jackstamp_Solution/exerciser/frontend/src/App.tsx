import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar";
import Dashboard from "./pages/Dashboard";
import GenerateWorkout from "./pages/GenerateWorkout";
import WorkoutHistory from "./pages/WorkoutHistory";
import ManageExercises from "./pages/ManageExercises";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <main className="mx-auto max-w-5xl px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/generate/:muscleGroup" element={<GenerateWorkout />} />
            <Route path="/history" element={<WorkoutHistory />} />
            <Route path="/exercises" element={<ManageExercises />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
