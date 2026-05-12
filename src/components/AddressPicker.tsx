import { useEffect, useRef, useState } from "react";
import { getAddresses } from "../api/addresses";
import type { Address } from "../types";
import { REGION_LABELS } from "../utils/labels";

interface Props {
  value: Address | null;
  onChange: (address: Address | null) => void;
  versionId?: number;
  placeholder?: string;
}

export default function AddressPicker({
  value,
  onChange,
  versionId,
  placeholder = "搜尋場館名稱",
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Address[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    clearTimeout(timer.current);
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const data = await getAddresses({ q: query || undefined, version_id: versionId });
        setResults(data);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer.current);
  }, [query, open, versionId]);

  function handleOpen() {
    setOpen(true);
    setQuery("");
  }

  function select(a: Address) {
    onChange(a);
    setOpen(false);
  }

  function clear() {
    onChange(null);
  }

  if (value && !open) {
    return (
      <div className="flex flex-col gap-1 px-3 py-2 border border-gray-300 rounded-md bg-surface text-sm">
        <span className="font-medium text-gray-800 break-words">{value.name}</span>
        <div className="flex items-center gap-2 flex-wrap">
          {value.address && (
            <span className="text-xs text-gray-400 truncate max-w-[160px]">{value.address}</span>
          )}
          <div className="flex items-center gap-2 ml-auto shrink-0">
            {value.map_url && (
              <a
                href={value.map_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand hover:underline whitespace-nowrap"
                onClick={(e) => e.stopPropagation()}
              >
                地圖
              </a>
            )}
            <button
              type="button"
              onClick={clear}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <button
              type="button"
              onClick={handleOpen}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              更換
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={handleOpen}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
      />
      {open && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-surface border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {loading ? (
            <p className="px-3 py-2 text-sm text-gray-400">搜尋中...</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-400">找不到場館</p>
          ) : (
            results.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => select(a)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-start gap-2"
              >
                <span className="flex-1">
                  <span className="text-sm font-medium text-gray-800 block">{a.name}</span>
                  {a.address && (
                    <span className="text-xs text-gray-400">{a.address}</span>
                  )}
                </span>
                <span className="text-xs text-gray-400 whitespace-nowrap mt-0.5">{REGION_LABELS[a.region as keyof typeof REGION_LABELS] ?? a.region}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
