import { useState, useEffect, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getScript, updateScript, adminDeleteScript, adminDeleteScriptCover } from "../../api/scripts";
import type { Script } from "../../types";
import { GENRES, DIFFICULTY_OPTIONS } from "../../utils/labels";

export default function EditScriptPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [script, setScript] = useState<Script | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    difficulty: "easy",
    duration: "",
    male_slots: "0",
    female_slots: "0",
    any_slots: "0",
  });
  const [genres, setGenres] = useState<number[]>([]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingCover, setDeletingCover] = useState(false);

  async function handleDeleteCover() {
    if (!window.confirm("確定要刪除封面圖片？")) return;
    setDeletingCover(true);
    try {
      const updated = await adminDeleteScriptCover(Number(id));
      setScript(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "刪除失敗");
    } finally {
      setDeletingCover(false);
    }
  }

  useEffect(() => {
    if (!id) return;
    getScript(Number(id)).then((s) => {
      setScript(s);
      setForm({
        title: s.title,
        description: s.description ?? "",
        difficulty: s.difficulty,
        duration: s.duration != null ? String(s.duration) : "",
        male_slots: String(s.male_slots),
        female_slots: String(s.female_slots),
        any_slots: String(s.any_slots),
      });
      setGenres(s.genres);
    });
  }, [id]);

  function set(field: keyof typeof form) {
    return (
      e: ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) =>
      setForm((f) => ({
        ...f,
        [field]: e.target.value,
      }));
  }

  function toggleGenre(value: number) {
    setGenres((g) =>
      g.includes(value) ? g.filter((v) => v !== value) : [...g, value],
    );
  }

  async function handleDelete() {
    if (!window.confirm(`確定要刪除「${script!.title}」？此操作不可復原。`)) return;
    try {
      await adminDeleteScript(Number(id));
      navigate("/admin/scripts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "刪除失敗");
    }
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (genres.length === 0) {
      setError("請至少選一個類型");
      return;
    }
    setError("");
    setLoading(true);

    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v !== "") data.append(k, String(v));
    });
    genres.forEach((g) => data.append("genres[]", String(g)));
    if (coverImage) data.append("cover_image", coverImage);

    try {
      await updateScript(Number(id), data);
      navigate("/admin/scripts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setLoading(false);
    }
  }

  if (!script) return <p className="text-sm text-gray-400">載入中...</p>;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">編輯劇本</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-gray-200 rounded-lg p-6 space-y-5"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            劇本名稱
          </label>
          <input
            type="text"
            value={form.title}
            onChange={set("title")}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            難度
          </label>
          <select
            value={form.difficulty}
            onChange={set("difficulty")}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          >
            {DIFFICULTY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            類型
          </label>
          <div className="flex flex-wrap gap-2">
            {GENRES.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => toggleGenre(value)}
                className={`text-sm px-3 py-1 rounded-full border transition-colors ${genres.includes(value)
                  ? "bg-brand text-white border-brand"
                  : "border-gray-300 text-gray-600 hover:border-gray-400"
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            遊玩時長（小時）
          </label>
          <input
            type="number"
            min={0}
            step={0.5}
            value={form.duration}
            onChange={set("duration")}
            placeholder="例：3"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {(["male_slots", "female_slots", "any_slots"] as const).map(
            (field) => (
              <div key={field}>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {field === "male_slots"
                    ? "男生名額"
                    : field === "female_slots"
                      ? "女生名額"
                      : "不限名額"}
                </label>
                <input
                  type="number"
                  min={0}
                  value={form[field]}
                  onChange={set(field)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            ),
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            簡介
          </label>
          <textarea
            value={form.description}
            onChange={set("description")}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            封面圖片
          </label>
          {script.cover_image_url && (
            <div className="flex items-start gap-3 mb-2">
              <img
                src={script.cover_image_url}
                className="w-24 h-24 object-cover rounded border border-gray-200"
              />
              <button
                type="button"
                onClick={handleDeleteCover}
                disabled={deletingCover}
                className="text-xs text-red-500 hover:text-red-700 border border-red-300 rounded px-2 py-1 hover:bg-red-50 disabled:opacity-50"
              >
                {deletingCover ? "刪除中..." : "🗑 刪除封面"}
              </button>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverImage(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-brand file:text-white hover:file:bg-brand-hover"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-brand text-white py-2 rounded-md text-sm font-medium hover:bg-brand-hover disabled:opacity-50"
          >
            {loading ? "儲存中..." : "儲存"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/scripts")}
            className="px-4 py-2 rounded-md text-sm text-gray-500 border border-gray-300 hover:bg-gray-50"
          >
            取消
          </button>
        </div>
        <div className="pt-2 border-t border-gray-100">
          {!script.deleted_at && (
            <button
              type="button"
              onClick={handleDelete}
              className="text-sm text-red-500 hover:text-red-700"
            >
              刪除此劇本
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
