import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  getStoreScriptVersions,
  updateStoreScriptVersion,
  createStoreScriptVersion,
} from "../api/stores";
import type { StoreScriptVersion } from "../api/stores";
import { getScripts } from "../api/scripts";
import type { Script } from "../types";
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS, GENRES } from "../utils/labels";

// ── Add form ────────────────────────────────────────────────────────────────

function AddForm({
  storeId,
  onAdded,
}: {
  storeId: number;
  onAdded: (v: StoreScriptVersion) => void;
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

  // new script fields
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
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      )
        setDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearch(q: string) {
    setQuery(q);
    setSelected(null);
    setShowNew(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setResults([]);
      setDropdownOpen(false);
      return;
    }
    setSearching(true);
    setDropdownOpen(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const all = await getScripts();
        setResults(all.filter((s) => s.title.includes(q)));
      } finally {
        setSearching(false);
      }
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
    try {
      let version: StoreScriptVersion;
      if (showNew) {
        version = await createStoreScriptVersion(storeId, {
          title: newTitle,
          difficulty: newDifficulty,
          male_slots: newMale,
          female_slots: newFemale,
          any_slots: newAny,
          genres: newGenres,
          duration_override: Number(newDuration),
          price: Number(price),
          version_name: versionName || undefined,
        });
      } else {
        if (!selected) {
          setError("請選擇劇本");
          setSubmitting(false);
          return;
        }
        version = await createStoreScriptVersion(storeId, {
          script_id: selected.id,
          price: Number(price),
          duration_override: durationOverride
            ? Number(durationOverride)
            : undefined,
          version_name: versionName || undefined,
        });
      }
      onAdded(version);
      // reset
      setQuery("");
      setSelected(null);
      setShowNew(false);
      setPrice("");
      setDurationOverride("");
      setVersionName("");
      setNewTitle("");
      setNewDifficulty("easy");
      setNewMale(0);
      setNewFemale(0);
      setNewAny(0);
      setNewGenres([]);
      setNewDuration("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "新增失敗");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-gray-200 rounded-lg p-4 space-y-3 bg-surface-2"
    >
      <p className="text-sm font-medium text-gray-700">新增劇本版本</p>

      {/* Script search */}
      <div ref={containerRef} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setDropdownOpen(true)}
          placeholder="搜尋現有劇本..."
          disabled={showNew}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-40"
        />
        {searching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            搜尋中...
          </span>
        )}
        {dropdownOpen && (
          <div className="absolute z-10 w-full mt-1 bg-surface-2 border border-gray-200 rounded-md shadow-md overflow-hidden">
            {results.length === 0 ? (
              <div className="px-4 py-3 space-y-2">
                <p className="text-sm text-gray-400">找不到符合的劇本</p>
                <button
                  type="button"
                  onClick={() => {
                    setShowNew(true);
                    setDropdownOpen(false);
                  }}
                  className="text-sm text-brand hover:text-brand-hover"
                >
                  + 新增全新劇本
                </button>
              </div>
            ) : (
              <ul className="max-h-48 overflow-y-auto divide-y divide-gray-100">
                {results.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => selectScript(s)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <span className="font-medium text-gray-900">
                        {s.title}
                      </span>
                      <span className="text-xs text-gray-400">
                        {DIFFICULTY_LABELS[s.difficulty]}
                      </span>
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNew(true);
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-brand hover:bg-gray-50"
                  >
                    + 新增全新劇本
                  </button>
                </li>
              </ul>
            )}
          </div>
        )}
      </div>

      {/* New script fields */}
      {showNew && (
        <div className="space-y-3 border border-brand/20 rounded-md p-3 bg-brand/5">
          <p className="text-xs text-brand font-medium">
            新劇本（將送交 admin 審核）
          </p>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="劇本名稱"
            required
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <select
            value={newDifficulty}
            onChange={(e) => setNewDifficulty(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          >
            {(["easy", "medium", "hard"] as const).map((d) => (
              <option key={d} value={d}>
                {DIFFICULTY_LABELS[d]}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["男生名額", newMale, setNewMale],
                ["女生名額", newFemale, setNewFemale],
                ["不限名額", newAny, setNewAny],
              ] as const
            ).map(([label, val, setter]) => (
              <div key={label}>
                <label className="text-xs text-gray-500 mb-0.5 block">
                  {label}
                </label>
                <input
                  type="number"
                  min={0}
                  value={val}
                  onChange={(e) => setter(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {GENRES.map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() =>
                  setNewGenres((g) =>
                    g.includes(val) ? g.filter((v) => v !== val) : [...g, val],
                  )
                }
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${newGenres.includes(val) ? "bg-brand text-white border-brand" : "border-gray-300 text-gray-600 hover:border-gray-400"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-0.5 block">
              時長（小時）
            </label>
            <input
              type="number"
              min={1}
              value={newDuration}
              onChange={(e) => setNewDuration(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setShowNew(false);
              setQuery("");
            }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            取消，改搜尋現有劇本
          </button>
        </div>
      )}

      {/* Common fields */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-0.5 block">
            定價（必填）
          </label>
          <input
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        {!showNew && (
          <div>
            <label className="text-xs text-gray-500 mb-0.5 block">
              時長（選填，小時）
            </label>
            <input
              type="number"
              min={1}
              value={durationOverride}
              onChange={(e) => setDurationOverride(e.target.value)}
              placeholder={
                selected?.duration != null
                  ? `留空則同劇本（${selected.duration} 小時）`
                  : "留空則沿用劇本預設"
              }
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
        )}
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-0.5 block">
          版本名稱（選填）
        </label>
        <input
          type="text"
          value={versionName}
          onChange={(e) => setVersionName(e.target.value)}
          placeholder="如：標準版、體驗版"
          className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-brand text-white py-2 rounded-md text-sm font-medium hover:bg-brand-hover disabled:opacity-50"
      >
        {submitting ? "新增中..." : "新增"}
      </button>
    </form>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function StoreScriptVersionsPage() {
  const { id } = useParams<{ id: string }>();
  const storeId = Number(id);
  const [versions, setVersions] = useState<StoreScriptVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    getStoreScriptVersions(storeId)
      .then(setVersions)
      .finally(() => setLoading(false));
  }, [storeId]);

  async function toggleAvailable(v: StoreScriptVersion) {
    const updated = await updateStoreScriptVersion(storeId, v.id, {
      available: !v.available,
    });
    setVersions((vs) => vs.map((x) => (x.id === updated.id ? updated : x)));
  }

  function handleAdded(v: StoreScriptVersion) {
    setVersions((vs) => [...vs, v]);
    setShowAdd(false);
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">劇本版本</h1>
        <button
          onClick={() => setShowAdd((s) => !s)}
          className="text-sm bg-brand text-white px-4 py-2 rounded-md hover:bg-brand-hover"
        >
          {showAdd ? "取消" : "新增劇本"}
        </button>
      </div>

      {showAdd && (
        <div className="mb-6">
          <AddForm storeId={storeId} onAdded={handleAdded} />
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-400 py-16">載入中...</div>
      ) : versions.length === 0 ? (
        <div className="text-center text-gray-400 py-16">尚未上架任何劇本</div>
      ) : (
        <div className="bg-surface border border-gray-200 rounded-lg divide-y divide-gray-100 overflow-hidden">
          {versions.map((v) => (
            <div key={v.id} className="flex items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {v.script.title}
                  </p>
                  {v.version_name && (
                    <span className="text-xs text-gray-400">
                      （{v.version_name}）
                    </span>
                  )}
                  {v.script.status === "pending" && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                      待審核
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-medium mr-1.5 ${DIFFICULTY_COLORS[v.script.difficulty as keyof typeof DIFFICULTY_COLORS]}`}
                  >
                    {
                      DIFFICULTY_LABELS[
                        v.script.difficulty as keyof typeof DIFFICULTY_LABELS
                      ]
                    }
                  </span>
                  {v.script.total_slots} 人{v.price != null && ` · $${v.price}`}
                  {v.duration_override && ` · ${v.duration_override} 小時`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleAvailable(v)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${v.available ? "bg-brand" : "bg-gray-200"}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${v.available ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
