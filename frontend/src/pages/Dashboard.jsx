import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { fetchPassages, deletePassage, fetchTags, updateMe } from "../api";
import { useAuth } from "../context/AuthContext";
import PassageCard from "../components/PassageCard";
import SearchBar from "../components/SearchBar";

export default function Dashboard() {
  const [passages, setPassages] = useState([]);
  const [tags, setTags] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const { user, logout, updateUser } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, t] = await Promise.all([fetchPassages(filters), fetchTags()]);
      setPassages(p);
      setTags(t);
    } catch (e) {
      console.error("Failed to load:", e);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id) => {
    await deletePassage(id);
    setPassages((prev) => prev.filter((p) => p.id !== id));
  };

  const handleFilter = (newFilters) => {
    setFilters(newFilters);
  };

  const toggleDefaultPrivate = async () => {
    try {
      const updated = await updateMe({ default_private: !user.default_private });
      updateUser(updated);
    } catch (e) {
      console.error("Failed to update setting:", e);
    }
  };

  return (
    <div className="min-h-screen bg-surface-900">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <Link to="/" className="text-xl font-semibold text-white hover:text-gray-300">
              Passages
            </Link>
            <p className="text-sm text-gray-500">
              Your library — {passages.length} passage
              {passages.length !== 1 && "s"}
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">{user?.name}</span>
            <button
              onClick={logout}
              className="text-gray-500 hover:text-gray-300"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Settings bar */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleFilter({ ...filters, visibility: undefined })}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                !filters.visibility
                  ? "bg-blue-900/40 text-blue-300 border border-blue-800"
                  : "bg-surface-800 text-gray-500 border border-gray-800"
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleFilter({ ...filters, visibility: "public" })}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                filters.visibility === "public"
                  ? "bg-blue-900/40 text-blue-300 border border-blue-800"
                  : "bg-surface-800 text-gray-500 border border-gray-800"
              }`}
            >
              Public
            </button>
            <button
              onClick={() => handleFilter({ ...filters, visibility: "private" })}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                filters.visibility === "private"
                  ? "bg-blue-900/40 text-blue-300 border border-blue-800"
                  : "bg-surface-800 text-gray-500 border border-gray-800"
              }`}
            >
              Private
            </button>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-gray-500">Save privately by default</span>
            <button
              onClick={toggleDefaultPrivate}
              className={`relative w-8 h-4 rounded-full transition-colors ${
                user?.default_private ? "bg-blue-600" : "bg-gray-700"
              }`}
            >
              <span
                className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                  user?.default_private ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
          </label>
        </div>

        <SearchBar tags={tags} onFilter={handleFilter} />

        {loading ? (
          <div className="text-center text-gray-500 py-20">Loading...</div>
        ) : passages.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No passages yet</p>
            <p className="text-gray-600 text-sm mt-2">
              Use the Chrome extension to save passages from articles you read.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {passages.map((p) => (
              <PassageCard key={p.id} passage={p} onDelete={handleDelete} showVisibility />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
