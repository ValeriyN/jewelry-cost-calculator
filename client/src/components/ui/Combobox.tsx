import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface Option {
  id: number;
  name: string;
}

interface Props {
  label?: string;
  options: Option[];
  value: number | null;
  onChange: (value: number | null) => void;
  onCreateNew?: (name: string) => Promise<Option> | void;
  placeholder?: string;
  createLabel?: string;
  error?: string;
}

export default function Combobox({
  label,
  options,
  value,
  onChange,
  onCreateNew,
  placeholder = "Оберіть...",
  createLabel,
  error,
}: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.id === value);

  const filtered = options.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleCreate = async () => {
    if (!onCreateNew || !search.trim()) return;
    setCreating(true);
    const newOpt = await onCreateNew(search.trim());
    if (newOpt) {
      onChange(newOpt.id);
    }
    setSearch("");
    setOpen(false);
    setCreating(false);
  };

  return (
    <div className="flex flex-col gap-1" ref={containerRef}>
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setSearch("");
        }}
        className={`
          w-full px-4 py-3 text-sm rounded-xl border bg-white text-left flex items-center justify-between
          focus:outline-none focus:ring-2 focus:ring-primary-500
          ${error ? "border-red-400" : "border-gray-300"}
        `}
      >
        <span className={selected ? "text-gray-900" : "text-gray-400"}>
          {selected?.name ?? placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2 border-b border-gray-100">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Пошук..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div className="py-1">
            {value !== null && (
              <button
                type="button"
                onClick={() => { onChange(null); setOpen(false); }}
                className="w-full px-4 py-2.5 text-sm text-gray-500 text-left hover:bg-gray-50"
              >
                — Без категорії
              </button>
            )}

            {filtered.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => { onChange(opt.id); setOpen(false); }}
                className={`w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 ${
                  opt.id === value ? "text-primary-600 font-medium bg-primary-50" : "text-gray-900"
                }`}
              >
                {opt.name}
              </button>
            ))}

            {onCreateNew && search.trim() && !filtered.find((o) => o.name.toLowerCase() === search.toLowerCase()) && (
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="w-full px-4 py-2.5 text-sm text-primary-600 font-medium text-left hover:bg-primary-50"
              >
                {createLabel ?? `+ Створити «${search}»`}
              </button>
            )}

            {filtered.length === 0 && !search && (
              <p className="px-4 py-3 text-sm text-gray-400 text-center">Порожньо</p>
            )}
          </div>
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
