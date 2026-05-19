import { useEffect, useRef, useState } from "react";
import { createStoreScriptVersion } from "../api/stores";
import type { StoreScriptVersion } from "../api/stores";
import { getScripts } from "../api/scripts";
import type { Script } from "../types";
import { DIFFICULTY_LABELS, GENRES } from "../utils/labels";

export default function AddVersionForm({
  storeId,
  onAdded,
  onCancel,
}: {
  storeId: number;
  onAdded: (v: StoreScriptVersion) => void;
  onCancel?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Script[]>([]);
  const [selected, setSelected] = useState<Script | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [price, setPrice] = useState("");
  const [durationOverride, setDurationOverride] = useState("");
  const [versionName, setVersionName] = useState("");
  const [npcCount, setNpcCount] = useState("");
  const [gmCount, setGmCount] = useState("");
  const [hasFood, setHasFood] = useState(false);
  const [hasCostumeChange, setHasCostumeChange] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newDifficulty, setNewDifficulty] = useState("easy");
  const [newMale, setNewMale] = useState(0);
  const [newFemale, setNewFemale] = useState(0);
  const [newAny, setNewAny] = useState(0);
  const [newGenres, setNewGenres] = useState<number[]>([]);
  const [newDuration, setNewDuration] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleSearch(q: string) {
    setQuery(q);
    setSelected(null);
    setShowNew(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); setDropdownOpen(false); return; }
    setSearching(true);
    setDropdownOpen(true);
    debounceRef.current = setTimeout(async () => {
      try {
        setResults((await getScripts({ q })).scripts);
      } finally { setSearching(false); }
    }, 500);
  }

  function selectScript(s: Script) {
    setSelected(s);
    setQuery(s.title);
    setDropdownOpen(false);
    setShowNew(false);
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const extras = {
      npc_count: npcCount ? parseInt(npcCount) : null,
      gm_count: gmCount ? parseInt(gmCount) : null,
      has_food: hasFood || null,
      has_costume_change: hasCostumeChange || null,
    };
    try {
      let version: StoreScriptVersion;
      if (showNew) {
        version = await createStoreScriptVersion(storeId, {
          title: newTitle, difficulty: newDifficulty,
          male_slots: newMale, female_slots: newFemale, any_slots: newAny,
          genres: newGenres, duration_override: Number(newDuration),
          price: Number(price), version_name: versionName || undefined,
          ...extras,
        });
      } else {
        if (!selected) { setError("請選擇劇本"); setSubmitting(false); return; }
        version = await createStoreScriptVersion(storeId, {
          script_id: selected.id, price: Number(price),
          duration_override: durationOverride ? Number(durationOverride) : undefined,
          version_name: versionName || undefined,
          ...extras,
        });
      }
      onAdded(version);
      setQuery(""); setSelected(null); setShowNew(false);
      setPrice(""); setDurationOverride(""); setVersionName("");
      setNpcCount(""); setGmCount(""); setHasFood(false); setHasCostumeChange(false);
      setNewTitle(""); setNewDifficulty("easy"); setNewMale(0); setNewFemale(0);
      setNewAny(0); setNewGenres([]); setNewDuration("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "新增失敗");
    } finally { setSubmitting(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-surface-2">
      <p className="text-sm font-medium text-gray-700">新增劇本版本</p>

      <div ref={containerRef} className="relative">
        <input type="text" value={query} onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setDropdownOpen(true)}
          placeholder="搜尋現有劇本..." disabled={showNew}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-40" />
        {searching && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">搜尋中...</span>}
        {dropdownOpen && (
          <div className="absolute z-10 w-full mt-1 bg-surface-2 border border-gray-200 rounded-md shadow-md overflow-hidden">
            {results.length === 0 ? (
              <div className="px-4 py-3 space-y-2">
                <p className="text-sm text-gray-400">找不到符合的劇本</p>
                <button type="button" onClick={() => { setShowNew(true); setDropdownOpen(false); }}
                  className="text-sm text-brand hover:text-brand-hover">+ 新增全新劇本</button>
              </div>
            ) : (
              <ul className="max-h-48 overflow-y-auto divide-y divide-gray-100">
                {results.map((s) => (
                  <li key={s.id}>
                    <button type="button" onClick={() => selectScript(s)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2">
                      <span className="font-medium text-gray-900">{s.title}</span>
                      <span className="text-xs text-gray-400">{DIFFICULTY_LABELS[s.difficulty]}</span>
                    </button>
                  </li>
                ))}
                <li>
                  <button type="button" onClick={() => { setShowNew(true); setDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-brand hover:bg-gray-50">
                    + 新增全新劇本
                  </button>
                </li>
              </ul>
            )}
          </div>
        )}
      </div>

      {showNew && (
        <div className="space-y-3 border border-brand/20 rounded-md p-3 bg-brand/5">
          <p className="text-xs text-brand font-medium">新劇本（將送交 admin 審核）</p>
          <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
            placeholder="劇本名稱" required
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
          <select value={newDifficulty} onChange={(e) => setNewDifficulty(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand">
            {(["easy", "medium", "hard"] as const).map((d) => (
              <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
            ))}
          </select>
          <div className="grid grid-cols-3 gap-2">
            {([["男生名額", newMale, setNewMale], ["女生名額", newFemale, setNewFemale], ["不限名額", newAny, setNewAny]] as const).map(([label, val, setter]) => (
              <div key={label}>
                <label className="text-xs text-gray-500 mb-0.5 block">{label}</label>
                <input type="number" min={0} value={val} onChange={(e) => setter(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {GENRES.map(([val, label]) => (
              <button key={val} type="button"
                onClick={() => setNewGenres((g) => g.includes(val) ? g.filter((v) => v !== val) : [...g, val])}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${newGenres.includes(val) ? "bg-brand text-white border-brand" : "border-gray-300 text-gray-600 hover:border-gray-400"}`}>
                {label}
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-0.5 block">時長（小時）</label>
            <input type="number" min={1} value={newDuration} onChange={(e) => setNewDuration(e.target.value)} required
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
          </div>
          <button type="button" onClick={() => { setShowNew(false); setQuery(""); }}
            className="text-xs text-gray-400 hover:text-gray-600">取消，改搜尋現有劇本</button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-0.5 block">定價（必填）</label>
          <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} required
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
        </div>
        {!showNew && (
          <div>
            <label className="text-xs text-gray-500 mb-0.5 block">時長（選填，小時）</label>
            <input type="number" min={1} value={durationOverride} onChange={(e) => setDurationOverride(e.target.value)}
              placeholder={selected?.duration != null ? `留空則同劇本（${selected.duration} 小時）` : "留空則沿用劇本預設"}
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
          </div>
        )}
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-0.5 block">版本名稱（選填）</label>
        <input type="text" value={versionName} onChange={(e) => setVersionName(e.target.value)}
          placeholder="如：標準版、體驗版"
          className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-0.5 block">NPC 數（選填）</label>
          <input type="number" min={0} value={npcCount} onChange={(e) => setNpcCount(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-0.5 block">GM 數（選填）</label>
          <input type="number" min={0} value={gmCount} onChange={(e) => setGmCount(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
        </div>
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input type="checkbox" checked={hasFood} onChange={(e) => setHasFood(e.target.checked)} className="rounded" />
          附餐飲
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input type="checkbox" checked={hasCostumeChange} onChange={(e) => setHasCostumeChange(e.target.checked)} className="rounded" />
          換裝
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={submitting}
          className="flex-1 bg-brand text-white py-2 rounded-md text-sm font-medium hover:bg-brand-hover disabled:opacity-50">
          {submitting ? "新增中..." : "新增"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700 px-3">
            取消
          </button>
        )}
      </div>
    </form>
  );
}
