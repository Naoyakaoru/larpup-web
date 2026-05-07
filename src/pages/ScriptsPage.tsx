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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {scripts.map((script) => (
            <Link
              key={script.id}
              to={`/scripts/${script.id}`}
              className="block bg-surface rounded-lg border border-gray-200 p-4 hover:border-brand-light hover:shadow-sm transition-all"
            >
              {script.cover_image_url && (
                <img
                  src={script.cover_image_url}
                  alt={script.title}
                  className="w-full h-32 object-cover rounded-md mb-3"
                />
              )}
              <div className="flex items-start justify-between gap-2 mb-2">
                <h2 className="font-semibold text-gray-900 text-sm leading-tight">
                  {script.title}
                </h2>
                <span
                  className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLORS[script.difficulty]}`}
                >
                  {DIFFICULTY_LABELS[script.difficulty]}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {script.genres.map((g) => (
                  <span
                    key={g}
                    className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full"
                  >
                    {GENRE_LABELS[g]}
                  </span>
                ))}
              </div>
              <div className="text-xs text-gray-400">
                {[
                  script.male_slots ? `${script.male_slots}男` : "",
                  script.female_slots ? `${script.female_slots}女` : "",
                  script.any_slots ? `${script.any_slots}不限` : "",
                ]
                  .filter(Boolean)
                  .join("・")}
                ・共 {script.total_slots} 人
                {script.duration != null && (
                  <span className="ml-1">・⏱ {script.duration}h</span>
                )}
              </div>
              {script.description && (
                <p className="mt-2 text-xs text-gray-500 line-clamp-2">
                  {script.description}
                </p>
              )}
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
