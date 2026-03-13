import { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchUserPassages } from "../api";
import FeedCard from "../components/FeedCard";

export default function UserProfile() {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchUserPassages(userId, { page });
      setData(result);
    } catch (e) {
      console.error("Failed to load profile:", e);
    } finally {
      setLoading(false);
    }
  }, [userId, page]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-surface-900">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <Link to="/" className="text-sm text-gray-500 hover:text-gray-400">
              Passages
            </Link>
            <h1 className="text-xl font-semibold text-white mt-1">
              {data.user.name}'s Passages
            </h1>
            <p className="text-sm text-gray-500">{data.total} public passages</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {data.items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">No public passages yet.</p>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              {data.items.map((item) => (
                <FeedCard key={item.id} item={item} hideUser />
              ))}
            </div>

            {data.pages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="text-sm text-gray-400 hover:text-gray-300 disabled:text-gray-700"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {data.page} of {data.pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                  disabled={page === data.pages}
                  className="text-sm text-gray-400 hover:text-gray-300 disabled:text-gray-700"
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
