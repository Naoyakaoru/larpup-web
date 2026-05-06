import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getScripts } from "../api/scripts";
import { createEvent } from "../api/events";
import { useAuth } from "../contexts/AuthContext";
import { calcNeeded, canAddOffline, formatNeeded } from "../utils/slotCalc";
import type { Script } from "../types";

export default function CreateEventPage() {
  const { user } = useAuth();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    script_id: searchParams.get("script_id") ?? "",
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
  const navigate = useNavigate();

  useEffect(() => {
    getScripts().then(setScripts);
  }, []);

  const selectedScript =
    scripts.find((s) => String(s.id) === form.script_id) ?? null;

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!scheduledAt) {
      setError("請選擇活動時間");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const event = await createEvent({
        script_id: Number(form.script_id),
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            劇本
          </label>
          <select
            value={form.script_id}
            onChange={set("script_id")}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="">請選擇劇本</option>
            {scripts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}（{s.total_slots} 人）
              </option>
            ))}
          </select>
        </div>

        {selectedScript && (
          <div className="bg-gray-50 rounded-md p-3 space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              {[
                { label: "男", value: selectedScript.male_slots },
                { label: "女", value: selectedScript.female_slots },
                { label: "不限", value: selectedScript.any_slots },
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
              (selectedScript.male_slots > 0 ||
                selectedScript.female_slots > 0) && (
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
            {(selectedScript.male_slots > 0 ||
              selectedScript.female_slots > 0) && (
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
              <p className="text-xs text-gray-500 font-medium">
                線下已確定朋友
              </p>
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
                          const remainingAfterHost = calcNeeded(
                            selectedScript,
                            {
                              host_in_game: f.host_in_game,
                              host_cross_gender: f.host_cross_gender,
                              offline_male: 0,
                              offline_female: 0,
                              hostGender: user?.gender ?? "male",
                            },
                          );
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
                calcNeeded(selectedScript, {
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
                // 08:00 is item index 16 (8h × 2 items/h)
                items?.[16]?.scrollIntoView({ block: "start" });
              }, 0);
            }}
          />
        </div>

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
