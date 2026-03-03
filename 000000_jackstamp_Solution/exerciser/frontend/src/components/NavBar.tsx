import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard" },
  { path: "/history", label: "History" },
  { path: "/exercises", label: "Exercises" },
];

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/" || location.pathname.startsWith("/generate");
    }
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex h-14 items-center justify-between">
          <Link to="/" className="text-lg font-bold text-gray-900">
            WorkoutGen
          </Link>

          {/* Desktop nav */}
          <div className="hidden gap-6 md:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium ${
                  isActive(item.path)
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Hamburger button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded text-gray-600 hover:text-gray-900 md:hidden"
            aria-label="Toggle menu"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="border-t pb-3 pt-2 md:hidden">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={`flex min-h-11 items-center px-3 py-2 text-sm font-medium ${
                  isActive(item.path)
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
