import { useState } from "react";

export default function SearchBar({ tags, onFilter }) {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState(null);

  const handleSearch = (value) => {
    setSearch(value);
    onFilter({ search: value || undefined, tag: activeTag || undefined });
  };

  const handleTag = (tagName) => {
    const next = activeTag === tagName ? null : tagName;
    setActiveTag(next);
    onFilter({ search: search || undefined, tag: next || undefined });
  };

  return (
    <div className="mb-8">
      <input
        type="text"
        placeholder="Search passages..."
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
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
  );
}
