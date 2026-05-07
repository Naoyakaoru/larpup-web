import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getScript, getScriptVersions } from "../api/scripts";
import type { ScriptVersion } from "../api/scripts";
import type { Script } from "../types";

import { DIFFICULTY_COLORS, DIFFICULTY_LABELS } from "../utils/labels";

export default function ScriptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [script, setScript] = useState<Script | null>(null);
  const [versions, setVersions] = useState<ScriptVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const scriptId = Number(id);
    Promise.all([getScript(scriptId), getScriptVersions(scriptId)])
      .then(([s, v]) => {
        setScript(s);
        setVersions(v);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return <div className="text-center text-gray-400 py-16">載入中...</div>;
  if (!script)
    return <div className="text-center text-gray-400 py-16">找不到劇本</div>;

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-400 hover:text-gray-600 mb-4"
      >
        ← 返回
      </button>

      <div className="bg-surface rounded-lg border border-gray-200 overflow-hidden mb-4">
        {script.cover_image_url && (
          <img
            src={script.cover_image_url}
            alt={script.title}
            className="w-full h-48 object-cover"
          />
        )}
        <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h1 className="text-xl font-bold text-gray-900">{script.title}</h1>
            <span
              className={`shrink-0 text-xs px-2 py-1 rounded-full font-medium ${DIFFICULTY_COLORS[script.difficulty]}`}
            >
              {DIFFICULTY_LABELS[script.difficulty]}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {script.genres.map((g) => (
              <span
                key={g}
                className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full"
              >
                {g}
              </span>
            ))}
          </div>

          <dl
            className={`grid gap-3 text-sm mb-4 ${script.duration != null ? "grid-cols-3 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-4"}`}
          >
            <div className="text-center bg-gray-50 rounded-md py-2">
              <dt className="text-xs text-gray-400 mb-0.5">男生</dt>
              <dd className="font-semibold text-gray-900">
                {script.male_slots}
              </dd>
            </div>
            <div className="text-center bg-gray-50 rounded-md py-2">
              <dt className="text-xs text-gray-400 mb-0.5">女生</dt>
              <dd className="font-semibold text-gray-900">
                {script.female_slots}
              </dd>
            </div>
            <div className="text-center bg-gray-50 rounded-md py-2">
              <dt className="text-xs text-gray-400 mb-0.5">不限</dt>
              <dd className="font-semibold text-gray-900">
                {script.any_slots}
              </dd>
            </div>
            <div className="text-center bg-brand/10 rounded-md py-2">
              <dt className="text-xs text-brand-hover mb-0.5">共</dt>
              <dd className="font-semibold text-brand-hover">
                {script.total_slots} 人
              </dd>
            </div>
            {script.duration != null && (
              <div className="text-center bg-gray-50 rounded-md py-2">
                <dt className="text-xs text-gray-400 mb-0.5">時長</dt>
                <dd className="font-semibold text-gray-900">
                  {script.duration}h
                </dd>
              </div>
            )}
          </dl>

          {script.description && (
            <p className="text-sm text-gray-600 leading-relaxed">
              {script.description}
            </p>
          )}
        </div>
      </div>

      {versions.length > 0 && (
        <div className="bg-surface border border-gray-200 rounded-lg overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-700">可玩店家</p>
          </div>
          <ul className="divide-y divide-gray-100">
            {versions.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <span className="text-sm text-gray-900">{v.store.name}</span>
                  {v.version_name && (
                    <span className="ml-2 text-xs text-gray-400">
                      {v.version_name}
                    </span>
                  )}
                </div>
                <Link
                  to={`/events/new?script_version_id=${v.id}&script_id=${script.id}`}
                  state={{
                    store_name: v.store.name,
                    version_name: v.version_name,
                    price: v.price,
                    duration: v.duration,
                  }}
                  className="text-xs px-3 py-1.5 bg-brand text-white rounded-md hover:bg-brand-hover transition-colors"
                >
                  揪團
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        to={`/events/new?script_id=${script.id}`}
        className={`block w-full text-center py-2.5 rounded-md text-sm font-medium transition-colors ${
          versions.length > 0
            ? "border border-gray-300 text-gray-600 hover:bg-gray-50"
            : "bg-brand text-white hover:bg-brand-hover"
        }`}
      >
        {versions.length > 0 ? "不指定店家，直接揪團" : "用這個劇本揪團"}
      </Link>
    </div>
  );
}
