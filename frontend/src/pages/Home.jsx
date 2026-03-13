import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { fetchFeed, fetchTags } from "../api";
import { useAuth } from "../context/AuthContext";
import FeedCard from "../components/FeedCard";

export default function Home() {
  const [feed, setFeed] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [tags, setTags] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [f, t] = await Promise.all([
        fetchFeed({ search: search || undefined, tag: activeTag || undefined, page }),
        fetchTags(),
      ]);
      setFeed(f);
      setTags(t);
    } catch (e) {
      console.error("Failed to load feed:", e);
    } finally {
      setLoading(false);
    }
  }, [search, activeTag, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleTag = (tagName) => {
    setActiveTag(activeTag === tagName ? null : tagName);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-surface-900">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">Passages</h1>
            <p className="text-sm text-gray-500">
              The best of what people are reading
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {user ? (
              <Link
                to="/my/passages"
                className="text-blue-400/70 hover:text-blue-400"
              >
                My Library
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-400 hover:text-gray-300"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="bg-surface-600 hover:bg-blue-900/40 text-gray-200 border border-gray-700 rounded-lg px-3 py-1.5 transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search passages..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-surface-800 border border-gray-800 rounded-lg px-4 py-3 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-600 transition-colors"
          />
          {tags.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleTag(tag.name)}
                  className={`text-xs px-3 py-1 rounded-full transition-colors ${
                    activeTag === tag.name
                      ? "bg-blue-900/40 text-blue-300 border border-blue-800"
                      : "bg-surface-800 text-gray-500 border border-gray-800 hover:text-gray-400"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Feed */}
        {loading ? (
          <div className="text-center text-gray-500 py-20">Loading...</div>
        ) : feed.items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No passages yet</p>
            <p className="text-gray-600 text-sm mt-2">
              Be the first to share a passage.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              {feed.items.map((item) => (
                <FeedCard key={item.id} item={item} />
              ))}
            </div>

            {/* Pagination */}
            {feed.pages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="text-sm text-gray-400 hover:text-gray-300 disabled:text-gray-700 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {feed.page} of {feed.pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(feed.pages, p + 1))}
                  disabled={page === feed.pages}
                  className="text-sm text-gray-400 hover:text-gray-300 disabled:text-gray-700 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
