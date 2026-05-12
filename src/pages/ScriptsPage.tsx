import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getScripts } from "../api/scripts";
import { getStores } from "../api/stores";
import type { Script, Store } from "../types";
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
  GENRE_LABELS,
} from "../utils/labels";

type Tab = "scripts" | "stores";

function ScriptsTab() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState("");

  useEffect(() => {
    setLoading(true);
    getScripts(difficulty ? { difficulty } : {})
      .then(setScripts)
      .finally(() => setLoading(false));
  }, [difficulty]);

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
        {(["", "easy", "medium", "hard"] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDifficulty(d)}
            className={`text-sm px-3 py-1.5 rounded-full border transition-colors shrink-0 ${
              difficulty === d
                ? "bg-brand text-white border-brand"
                : "border-gray-300 text-gray-600 hover:border-gray-400"
            }`}
          >
            {d === "" ? "全部" : DIFFICULTY_LABELS[d]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-16">載入中...</div>
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
                      {script.genres.slice(0, 2).map((g) => (
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
  const [tab, setTab] = useState<Tab>("scripts");

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
