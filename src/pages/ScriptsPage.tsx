import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getScripts } from "../api/scripts";
import { getStores } from "../api/stores";
import { useAuth } from "../contexts/AuthContext";
import type { Script, Store } from "../types";
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
  GENRE_LABELS,
  GENRES,
} from "../utils/labels";

type Tab = "scripts" | "stores";

const QUICK_GENRES = [3, 0, 14, 5]; // 情感, 推理, 演繹, 機制

function FilterDrawer({
  difficulty,
  genres,
  onDifficultyChange,
  onGenreToggle,
  onClear,
  onClose,
}: {
  difficulty: string;
  genres: number[];
  onDifficultyChange: (d: string) => void;
  onGenreToggle: (g: number) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-72 bg-surface z-50 flex flex-col shadow-xl border-l border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <span className="font-semibold text-gray-900">篩選</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          <div>
            <div className="text-xs font-medium text-gray-500 mb-3">難度</div>
            <div className="flex flex-wrap gap-2">
              {(["", "easy", "medium", "hard"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => onDifficultyChange(d)}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                    difficulty === d
                      ? "bg-brand text-white border-brand"
                      : "border-gray-300 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {d === "" ? "全部" : DIFFICULTY_LABELS[d]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-gray-500 mb-3">類型</div>
            <div className="flex flex-wrap gap-2">
              {GENRES.map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => onGenreToggle(id)}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                    genres.includes(id)
                      ? "bg-brand text-white border-brand"
                      : "border-gray-300 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClear}
            className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:border-gray-400 transition-colors"
          >
            清除
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-brand text-white text-sm font-medium"
          >
            完成
          </button>
        </div>
      </div>
    </>
  );
}

function ScriptsTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { token } = useAuth();
  const isLoggedIn = !!token;

  const difficulty = searchParams.get("difficulty") ?? "";
  const genresParam = searchParams.get("genres") ?? "";
  const genres = genresParam ? genresParam.split(",").map(Number) : [];
  const q = searchParams.get("q") ?? "";

  const [searchQuery, setSearchQuery] = useState(q);

  const filterKey = `${difficulty}|${genresParam}|${q}`;

  function updateDifficulty(d: string) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (d) next.set("difficulty", d);
        else next.delete("difficulty");
        return next;
      },
      { replace: true }
    );
  }

  function toggleGenre(g: number) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const current = prev.get("genres")
          ? prev.get("genres")!.split(",").map(Number)
          : [];
        const updated = current.includes(g)
          ? current.filter((x) => x !== g)
          : [...current, g];
        if (updated.length) next.set("genres", updated.join(","));
        else next.delete("genres");
        return next;
      },
      { replace: true }
    );
  }

  function clearFilters() {
    setSearchParams({}, { replace: true });
    setSearchQuery("");
  }

  useEffect(() => {
    setSearchQuery(q);
  }, [q]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (searchQuery.trim()) {
            next.set("q", searchQuery.trim());
          } else {
            next.delete("q");
          }
          return next;
        },
        { replace: true }
      );
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, setSearchParams]);

  useEffect(() => {
    setPage(1);
    setScripts([]);
    setHasMore(false);
    setError(false);
  }, [filterKey]);

  useEffect(() => {
    let stale = false;

    if (page === 1) setLoading(true);
    else setLoadingMore(true);

    getScripts({
      difficulty: difficulty || undefined,
      genres: genres.length ? genres : undefined,
      q: q || undefined,
      page,
    })
      .then((res) => {
        if (stale) return;
        setScripts((prev) =>
          page === 1 ? res.scripts : [...prev, ...res.scripts]
        );
        setHasMore(res.has_more);
      })
      .catch(() => {
        if (stale) return;
        setError(true);
      })
      .finally(() => {
        if (stale) return;
        setLoading(false);
        setLoadingMore(false);
      });

    return () => { stale = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, page]);

  useEffect(() => {
    if (loading || loadingMore || !hasMore || !isLoggedIn) return;

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setPage((p) => p + 1);
    });

    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);

    return () => observerRef.current?.disconnect();
  }, [loading, loadingMore, hasMore, isLoggedIn]);

  const activeCount = (difficulty ? 1 : 0) + genres.length;

  return (
    <>
      {/* Search Input Box */}
      <div className="mb-5 relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <svg
            className="h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          placeholder="搜尋劇本名稱..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-full text-sm bg-surface placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      <div className="flex flex-wrap lg:flex-nowrap lg:items-center gap-x-2 gap-y-1.5 mb-4">
        {(["", "easy", "medium", "hard"] as const).map((d) => (
          <button
            key={d}
            onClick={() => updateDifficulty(d)}
            className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
              difficulty === d
                ? "bg-brand text-white border-brand"
                : "border-gray-300 text-gray-600 hover:border-gray-400"
            }`}
          >
            {d === "" ? "全部" : DIFFICULTY_LABELS[d]}
          </button>
        ))}

        <div className="w-full lg:hidden" />
        <div className="hidden lg:block w-px h-4 bg-gray-300 shrink-0" />

        {QUICK_GENRES.map((g) => (
          <button
            key={g}
            onClick={() => toggleGenre(g)}
            className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
              genres.includes(g)
                ? "bg-brand text-white border-brand"
                : "border-gray-300 text-gray-600 hover:border-gray-400"
            }`}
          >
            {GENRE_LABELS[g]}
          </button>
        ))}

        <div className="hidden lg:block w-px h-4 bg-gray-300 shrink-0" />

        <button
          onClick={() => setDrawerOpen(true)}
          className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-colors ${
            activeCount > 0
              ? "bg-brand text-white border-brand"
              : "border-gray-300 text-gray-600 hover:border-gray-400"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="8" y1="12" x2="16" y2="12" />
            <line x1="11" y1="18" x2="13" y2="18" />
          </svg>
          篩選
          {activeCount > 0 && (
            <span className="bg-surface text-brand font-bold rounded-full w-4 h-4 flex items-center justify-center text-xs leading-none">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-16">載入中...</div>
      ) : error ? (
        <div className="text-center text-gray-400 py-16">載入失敗，請重新整理</div>
      ) : scripts.length === 0 ? (
        <div className="text-center text-gray-400 py-16">沒有符合條件的劇本</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {scripts.map((script) => (
            <Link
              key={script.id}
              to={`/scripts/${script.id}`}
              className="block group rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300"
            >
              <div className="relative aspect-[3/4] bg-gray-900">
                {script.cover_image_url ? (
                  <img
                    src={script.cover_image_url}
                    alt={script.title}
                    className="w-full h-full object-cover object-center opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 text-4xl">
                    📖
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <span
                  className={`absolute top-2.5 right-2.5 text-xs px-1.5 py-0.5 rounded font-medium ${DIFFICULTY_COLORS[script.difficulty]}`}
                >
                  {DIFFICULTY_LABELS[script.difficulty]}
                </span>
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h2 className="font-semibold text-white text-xs leading-snug mb-1.5 line-clamp-2">
                    {script.title}
                  </h2>
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex gap-1 flex-wrap">
                      {(script.genres ?? [])
                        .filter((g) => g >= 15)
                        .map((g) => (
                          <span key={g} className="text-xs text-amber-400 font-medium">
                            {GENRE_LABELS[g]}
                          </span>
                        ))}
                      {(script.genres ?? [])
                        .filter((g) => g < 15)
                        .slice(0, 2)
                        .map((g) => (
                          <span key={g} className="text-xs text-white/65">
                            {GENRE_LABELS[g]}
                          </span>
                        ))}
                    </div>
                    <span className="text-xs text-white/55 shrink-0">
                      {script.total_slots}人
                      {script.duration != null && ` · ${script.duration}h`}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {hasMore && (
        isLoggedIn ? (
          <div ref={loadMoreRef} className="py-8 text-center text-sm text-gray-400">
            {loadingMore ? "載入更多劇本中..." : "向下捲動載入更多"}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center gap-4 border-t border-gray-100 mt-6">
            <p className="text-gray-500 text-sm font-medium">登入後查看更多劇本</p>
            <div className="flex gap-3">
              <Link
                to="/profile"
                className="px-5 py-2 rounded-full bg-brand text-white text-sm font-medium hover:bg-brand-hover transition-colors"
              >
                登入 / 註冊
              </Link>
            </div>
          </div>
        )
      )}

      {drawerOpen && (
        <FilterDrawer
          difficulty={difficulty}
          genres={genres}
          onDifficultyChange={updateDifficulty}
          onGenreToggle={toggleGenre}
          // FE-6: clear-only, don't close (consistent with EventsPage)
          onClear={clearFilters}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </>
  );
}

function StoresTab() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStores()
      .then(setStores)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <div className="text-center text-gray-400 py-16">載入中...</div>;
  if (stores.length === 0)
    return (
      <div className="text-center text-gray-400 py-16">目前沒有店家資料</div>
    );

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {stores.map((store) => (
        <div
          key={store.id}
          className="bg-surface rounded-lg border border-gray-200 p-4"
        >
          <h2 className="font-semibold text-gray-900 text-sm mb-1">
            {store.name}
          </h2>
          <p className="text-xs text-gray-400">@{store.owner.handle}</p>
        </div>
      ))}
    </div>
  );
}

export default function ScriptsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get("tab") as Tab | null) ?? "scripts";

  function setTab(t: Tab) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (t === "scripts") next.delete("tab");
      else next.set("tab", t);
      return next;
    }, { replace: true });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900">劇本</h1>
      </div>

      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {(
          [
            ["scripts", "劇本"],
            ["stores", "店家"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key
                ? "border-brand text-brand"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "scripts" ? <ScriptsTab /> : <StoresTab />}
    </div>
  );
}
