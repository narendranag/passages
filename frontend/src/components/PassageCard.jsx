import { useState } from "react";

export default function PassageCard({ passage, onDelete }) {
  const [confirming, setConfirming] = useState(false);

  const handleDelete = () => {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    onDelete(passage.id);
  };

  return (
    <article className="bg-surface-800 rounded-lg p-6 border border-gray-800 hover:border-gray-700 transition-colors">
      <blockquote className="font-serif text-gray-200 text-lg leading-relaxed italic mb-4">
        "{passage.selected_text}"
      </blockquote>

      {passage.note && (
        <p className="text-sm text-gray-400 mb-4 pl-4 border-l-2 border-gray-700">
          {passage.note}
        </p>
      )}

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-3 text-gray-500">
          {passage.author_name && <span>{passage.author_name}</span>}
          {passage.source_title && (
            <a
              href={passage.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400/70 hover:text-blue-400 truncate max-w-xs"
            >
              {passage.source_title}
            </a>
          )}
          <span>
            {new Date(passage.saved_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        <button
          onClick={handleDelete}
          className={`text-xs px-2 py-1 rounded transition-colors ${
            confirming
              ? "bg-red-900/30 text-red-400 border border-red-800"
              : "text-gray-600 hover:text-gray-400"
          }`}
        >
          {confirming ? "Confirm delete?" : "Delete"}
        </button>
      </div>

      {passage.tags.length > 0 && (
        <div className="flex gap-2 mt-3">
          {passage.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-surface-700 text-gray-400 px-2 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
