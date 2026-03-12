import { useState, useEffect, useCallback } from "react";
import { fetchPassages, deletePassage, fetchTags } from "./api";
import PassageCard from "./components/PassageCard";
import SearchBar from "./components/SearchBar";

export default function App() {
  const [passages, setPassages] = useState([]);
  const [tags, setTags] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-surface-900">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">Passages</h1>
            <p className="text-sm text-gray-500">
              The best of what you've read
            </p>
          </div>
          <div className="text-sm text-gray-600">
            {passages.length} passage{passages.length !== 1 && "s"}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
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
              <PassageCard key={p.id} passage={p} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
