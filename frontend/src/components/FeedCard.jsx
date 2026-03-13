import { Link } from "react-router-dom";

export default function FeedCard({ item, hideUser }) {
  const text =
    item.selected_text.length > 300
      ? item.selected_text.slice(0, 300) + "..."
      : item.selected_text;

  return (
    <article className="py-4 border-b border-gray-800/50 hover:bg-surface-800/30 transition-colors px-2 -mx-2 rounded">
      <blockquote className="font-serif text-gray-200 leading-relaxed italic">
        "{text}"
      </blockquote>

      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 flex-wrap">
        {item.author_name && (
          <span className="text-gray-400">{item.author_name}</span>
        )}
        {item.author_name && item.source_title && (
          <span className="text-gray-700">/</span>
        )}
        {item.source_title && (
          <a
            href={item.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400/60 hover:text-blue-400 truncate max-w-xs"
          >
            {item.source_title}
          </a>
        )}
        <span className="text-gray-700">·</span>
        <span>
          {new Date(item.saved_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
        {!hideUser && item.saved_by && (
          <>
            <span className="text-gray-700">·</span>
            <Link
              to={`/u/${item.user_id}`}
              className="text-gray-400 hover:text-gray-300"
            >
              {item.saved_by}
            </Link>
          </>
        )}
      </div>

      {item.tags && item.tags.length > 0 && (
        <div className="flex gap-1.5 mt-2">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-surface-800 text-gray-500 px-1.5 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
