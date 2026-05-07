import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getStoreScriptVersions,
  updateStoreScriptVersion,
  createStoreScriptVersion,
} from "../api/stores";
import type { StoreScriptVersion } from "../api/stores";
import { getScripts } from "../api/scripts";
import type { Script } from "../types";
import { DIFFICULTY_LABELS, GENRES } from "../utils/labels";
import { useRef } from "react";

function AddForm({
  storeId,
  onAdded,
  onCancel,
}: {
  storeId: number;
  onAdded: (v: StoreScriptVersion) => void;
  onCancel: () => void;
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
    }, 300);
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
              時長 override（選填，小時）
            </label>
            <input
              type="number"
              min={1}
              value={durationOverride}
              onChange={(e) => setDurationOverride(e.target.value)}
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

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-brand text-white py-2 rounded-md text-sm font-medium hover:bg-brand-hover disabled:opacity-50"
        >
          {submitting ? "新增中..." : "新增"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-gray-500 hover:text-gray-700 px-3"
        >
          取消
        </button>
      </div>
    </form>
  );
}

function ComingSoonSection({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="bg-gray-50 border border-gray-200 rounded-lg p-5 opacity-60">
      <h2 className="font-semibold text-gray-500 mb-1">{title}</h2>
      <p className="text-sm text-gray-400">{description}</p>
    </section>
  );
}

export default function StoreManagePage() {
  const { id } = useParams<{ id: string }>();
  const storeId = Number(id);
  const [versions, setVersions] = useState<StoreScriptVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    getStoreScriptVersions(storeId)
      .then(setVersions)
      .finally(() => setLoadingVersions(false));
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">店家管理</h1>

      <div className="space-y-4">
        {/* 劇本版本 */}
        <section className="bg-surface border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">劇本版本</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAdd((s) => !s)}
                className="text-sm bg-brand text-white px-3 py-1 rounded-md hover:bg-brand-hover"
              >
                {showAdd ? "取消" : "新增劇本"}
              </button>
              <Link
                to={`/stores/${id}/script_versions`}
                className="text-sm text-gray-400 hover:text-brand"
              >
                查看全部 →
              </Link>
            </div>
          </div>

          {showAdd && (
            <div className="mb-4">
              <AddForm
                storeId={storeId}
                onAdded={handleAdded}
                onCancel={() => setShowAdd(false)}
              />
            </div>
          )}

          {loadingVersions ? (
            <p className="text-sm text-gray-400">載入中...</p>
          ) : versions.length === 0 ? (
            <p className="text-sm text-gray-400">尚未上架任何劇本</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {versions.slice(0, 5).map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {v.script.title}
                      {v.version_name && (
                        <span className="ml-1.5 text-xs text-gray-400">
                          （{v.version_name}）
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {
                        DIFFICULTY_LABELS[
                          v.script.difficulty as keyof typeof DIFFICULTY_LABELS
                        ]
                      }
                      ・{v.script.total_slots} 人
                      {v.price != null && ` · $${v.price}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleAvailable(v)}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ml-4 ${v.available ? "bg-brand" : "bg-gray-200"}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${v.available ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>
                </li>
              ))}
              {versions.length > 5 && (
                <li className="pt-3">
                  <Link
                    to={`/stores/${id}/script_versions`}
                    className="text-sm text-gray-400 hover:text-brand"
                  >
                    查看全部 {versions.length} 筆 →
                  </Link>
                </li>
              )}
            </ul>
          )}
        </section>

        <ComingSoonSection
          title="活動"
          description="查看與管理此店家的揪團活動"
        />
        <ComingSoonSection
          title="店家資訊"
          description="編輯店家名稱、簡介等基本資料"
        />
        <ComingSoonSection
          title="成員與權限"
          description="管理可操作此店家的帳號與角色"
        />
      </div>
    </div>
  );
}
