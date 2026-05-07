import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getScripts, getScriptVersions, type ScriptVersion } from "../api/scripts";
import { createEvent } from "../api/events";
import { useAuth } from "../contexts/AuthContext";
import { calcNeeded, canAddOffline, formatNeeded } from "../utils/slotCalc";
import type { Script } from "../types";

export default function CreateEventPage() {
  const { user } = useAuth();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [searchParams] = useSearchParams();
  const scriptVersionId = searchParams.get("script_version_id") ?? "";
  const navigate = useNavigate();
  const location = useLocation();
  const versionState = location.state as {
    store_name: string;
    version_name: string | null;
    price: number | null;
    duration: number | null;
  } | null;

  // Script search
  const [scriptSearch, setScriptSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Version selection (only when accessing directly, not via scriptVersionId)
  const [versions, setVersions] = useState<ScriptVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<ScriptVersion | null>(null);

  const [form, setForm] = useState({
    location: "",
    host_in_game: true,
    host_cross_gender: false,
    allow_cross_gender: false,
    offline_male: 0,
    offline_female: 0,
  });
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getScripts().then(setScripts);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(scriptSearch), 500);
    return () => clearTimeout(t);
  }, [scriptSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredScripts = debouncedSearch
    ? scripts.filter((s) =>
        s.title.toLowerCase().includes(debouncedSearch.toLowerCase()),
      )
    : scripts;

  function selectScript(script: Script) {
    setSelectedScript(script);
    setScriptSearch(script.title);
    setDropdownOpen(false);
    setSelectedVersion(null);
    setVersions([]);
    setVersionsLoading(true);
    getScriptVersions(script.id)
      .then(setVersions)
      .finally(() => setVersionsLoading(false));
  }

  function clearScript() {
    setSelectedScript(null);
    setScriptSearch("");
    setVersions([]);
    setSelectedVersion(null);
  }

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({
        ...f,
        [field]:
          e.target.type === "checkbox"
            ? (e.target as HTMLInputElement).checked
            : e.target.value,
      }));
  }

  // The script object to use for slot config
  const script = selectedScript;

  // Effective duration to display
  const effectiveDuration = scriptVersionId
    ? versionState?.duration
    : selectedVersion?.duration ?? selectedScript?.duration;

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!scheduledAt) {
      setError("請選擇活動時間");
      return;
    }
    if (!scriptVersionId && !selectedScript) {
      setError("請選擇劇本");
      return;
    }
    setError("");
    setLoading(true);
    try {
      let versionParam: { script_version_id: number } | { script_id: number };
      if (scriptVersionId) {
        versionParam = { script_version_id: Number(scriptVersionId) };
      } else if (selectedVersion) {
        versionParam = { script_version_id: selectedVersion.id };
      } else {
        versionParam = { script_id: selectedScript!.id };
      }
      const event = await createEvent({
        ...versionParam,
        scheduled_at: scheduledAt.toISOString(),
        location: form.location,
        host_in_game: form.host_in_game,
        host_cross_gender: form.host_cross_gender,
        allow_cross_gender: form.allow_cross_gender,
        offline_male: form.offline_male,
        offline_female: form.offline_female,
      });
      navigate(`/events/${event.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "建立失敗");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">建立揪團</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-gray-200 rounded-lg p-6 space-y-4"
      >
        {/* ── 劇本選擇 ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            劇本
          </label>
          {scriptVersionId ? (
            // Locked to version selected on script detail page
            <div className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500">
              {versionState?.store_name
                ? `${versionState.store_name} 版本`
                : "已選擇版本"}
            </div>
          ) : (
            <div className="relative" ref={searchRef}>
              <div className="relative">
                <input
                  type="text"
                  value={scriptSearch}
                  onChange={(e) => {
                    setScriptSearch(e.target.value);
                    setDropdownOpen(true);
                    if (!e.target.value) clearScript();
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  placeholder="搜尋劇本名稱…"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
                {selectedScript && (
                  <button
                    type="button"
                    onClick={clearScript}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
                  >
                    ×
                  </button>
                )}
              </div>
              {dropdownOpen && filteredScripts.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-52 overflow-y-auto">
                  {filteredScripts.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectScript(s)}
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between gap-4 border-b border-gray-100 last:border-0"
                    >
                      <span className="font-medium text-gray-900">{s.title}</span>
                      <span className="text-xs text-gray-400 shrink-0">
                        {s.total_slots}人・{s.difficulty_label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {dropdownOpen && scriptSearch && filteredScripts.length === 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow mt-1 px-3 py-3 text-sm text-gray-400">
                  找不到符合的劇本
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 版本 / 資訊卡 ── */}
        {(scriptVersionId || selectedScript) && (
          <div className="bg-gray-50 rounded-md px-4 py-3 text-sm space-y-1">
            {scriptVersionId && versionState?.store_name && (
              <div className="flex justify-between">
                <span className="text-gray-500">店家</span>
                <span className="font-medium text-gray-900">
                  {versionState.store_name}
                </span>
              </div>
            )}
            {scriptVersionId && versionState?.version_name && (
              <div className="flex justify-between">
                <span className="text-gray-500">版本</span>
                <span className="font-medium text-gray-900">
                  {versionState.version_name}
                </span>
              </div>
            )}
            {scriptVersionId && versionState?.price != null && (
              <div className="flex justify-between">
                <span className="text-gray-500">定價</span>
                <span className="font-medium text-gray-900">
                  NT$ {versionState.price}
                </span>
              </div>
            )}
            {!scriptVersionId && selectedVersion && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500">店家</span>
                  <span className="font-medium text-gray-900">
                    {selectedVersion.store.name}
                  </span>
                </div>
                {selectedVersion.version_name && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">版本</span>
                    <span className="font-medium text-gray-900">
                      {selectedVersion.version_name}
                    </span>
                  </div>
                )}
                {selectedVersion.price != null && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">定價</span>
                    <span className="font-medium text-gray-900">
                      NT$ {selectedVersion.price}
                    </span>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">時長</span>
              <span className="font-medium text-gray-900">
                {effectiveDuration != null ? `${effectiveDuration} 小時` : "—"}
              </span>
            </div>
          </div>
        )}

        {/* ── 店家版本選擇（直接進頁面時才顯示）── */}
        {!scriptVersionId && selectedScript && (
          <div>
            {versionsLoading ? (
              <p className="text-xs text-gray-400">載入店家版本中…</p>
            ) : versions.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-xs text-gray-500 font-medium">
                  選擇店家版本（選填）
                </p>
                {versions.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() =>
                      setSelectedVersion(
                        selectedVersion?.id === v.id ? null : v,
                      )
                    }
                    className={`w-full text-left rounded-md border px-3 py-2 text-sm transition-colors ${
                      selectedVersion?.id === v.id
                        ? "border-brand bg-brand/5"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {v.store.name}
                      </span>
                      {v.version_name && (
                        <span className="text-xs text-gray-400 shrink-0">
                          {v.version_name}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {/* ── 人數設定 ── */}
        {script && (
          <div className="bg-gray-50 rounded-md p-3 space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              {[
                { label: "男", value: script.male_slots },
                { label: "女", value: script.female_slots },
                { label: "不限", value: script.any_slots },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="bg-surface rounded border border-gray-200 py-2"
                >
                  <div className="text-gray-400 mb-0.5">{label}</div>
                  <div className="font-semibold text-gray-900">{value}</div>
                </div>
              ))}
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.host_in_game}
                onChange={set("host_in_game")}
                className="w-4 h-4 accent-brand rounded"
              />
              <span className="text-sm text-gray-700">
                主揪也要上車（佔一個名額）
              </span>
            </label>
            {form.host_in_game &&
              (script.male_slots > 0 || script.female_slots > 0) && (
                <label className="flex items-center gap-2 cursor-pointer pl-6">
                  <input
                    type="checkbox"
                    checked={form.host_cross_gender}
                    onChange={set("host_cross_gender")}
                    className="w-4 h-4 accent-brand rounded"
                  />
                  <span className="text-sm text-gray-500">主揪反串</span>
                </label>
              )}
            {(script.male_slots > 0 || script.female_slots > 0) && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.allow_cross_gender}
                  onChange={set("allow_cross_gender")}
                  className="w-4 h-4 accent-brand rounded"
                />
                <span className="text-sm text-gray-700">開放反串</span>
              </label>
            )}
            <div className="space-y-1.5">
              <p className="text-xs text-gray-500 font-medium">線下已確定朋友</p>
              {(
                [
                  ["offline_male", "男"],
                  ["offline_female", "女"],
                ] as const
              ).map(([field, label]) => (
                <div key={field} className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{label}生</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          [field]: Math.max(0, f[field] - 1),
                        }))
                      }
                      className="w-6 h-6 rounded-full border border-gray-300 text-gray-600 text-sm flex items-center justify-center hover:border-brand hover:text-brand"
                    >
                      −
                    </button>
                    <span className="text-sm font-medium w-4 text-center">
                      {form[field]}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => {
                          const remainingAfterHost = calcNeeded(script, {
                            host_in_game: f.host_in_game,
                            host_cross_gender: f.host_cross_gender,
                            offline_male: 0,
                            offline_female: 0,
                            hostGender: user?.gender ?? "male",
                          });
                          const addingGender =
                            field === "offline_male" ? "male" : "female";
                          if (
                            !canAddOffline(
                              remainingAfterHost,
                              f.offline_male,
                              f.offline_female,
                              addingGender,
                              f.allow_cross_gender,
                            )
                          )
                            return f;
                          return { ...f, [field]: f[field] + 1 };
                        })
                      }
                      className="w-6 h-6 rounded-full border border-gray-300 text-gray-600 text-sm flex items-center justify-center hover:border-brand hover:text-brand"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400">
              實際還需要：
              {formatNeeded(
                calcNeeded(script, {
                  host_in_game: form.host_in_game,
                  host_cross_gender: form.host_cross_gender,
                  offline_male: form.offline_male,
                  offline_female: form.offline_female,
                  hostGender: user?.gender ?? "male",
                }),
              )}
            </p>
          </div>
        )}

        {/* ── 活動時間 ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            活動時間
          </label>
          <DatePicker
            selected={scheduledAt}
            onChange={setScheduledAt}
            showTimeSelect
            timeIntervals={30}
            dateFormat="yyyy/MM/dd HH:mm"
            timeFormat="HH:mm"
            placeholderText="選擇日期與時間"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            wrapperClassName="w-full"
            minDate={new Date()}
            onCalendarOpen={() => {
              setTimeout(() => {
                const list = document.querySelector(
                  ".react-datepicker__time-list",
                );
                const items = list?.querySelectorAll(
                  ".react-datepicker__time-list-item",
                );
                items?.[16]?.scrollIntoView({ block: "start" });
              }, 0);
            }}
          />
        </div>

        {/* ── 地點 ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            地點
          </label>
          <input
            type="text"
            value={form.location}
            onChange={set("location")}
            required
            placeholder="例：台北市信義區 / 謎境劇本殺台北店"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand text-white py-2 rounded-md text-sm font-medium hover:bg-brand-hover disabled:opacity-50"
        >
          {loading ? "建立中..." : "建立活動"}
        </button>
      </form>
    </div>
  );
}
