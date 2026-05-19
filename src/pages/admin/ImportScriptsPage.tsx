import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { bulkImportScripts, type BulkImportRow } from "../../api/scripts";
import { DIFFICULTY_OPTIONS, GENRE_LABELS, GENRES } from "../../utils/labels";

// ── CSV parsing ────────────────────────────────────────────────────────────────

function parseCSV(text: string): Record<string, string>[] {
  const allRows = parseCSVRows(text);
  if (allRows.length < 2) return [];
  const headers = allRows[0];
  return allRows.slice(1).map((vals) => {
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = vals[j] ?? "";
    });
    return row;
  });
}

function parseCSVRows(text: string): string[][] {
  const rows: string[][] = [];
  let fields: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuote) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuote = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') {
        inQuote = true;
      } else if (ch === ",") {
        fields.push(cur);
        cur = "";
      } else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        fields.push(cur);
        cur = "";
        if (fields.some((f) => f !== "") || rows.length > 0) rows.push(fields);
        fields = [];
      } else {
        cur += ch;
      }
    }
  }
  fields.push(cur);
  if (fields.some((f) => f !== "")) rows.push(fields);
  return rows;
}

// ── Genre picker ───────────────────────────────────────────────────────────────

function GenrePicker({
  ids,
  onChange,
}: {
  ids: number[];
  onChange: (ids: number[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function toggle(id: number) {
    onChange(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  }

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => setOpen((v) => !v)}
        className="min-h-[28px] flex flex-wrap gap-1 cursor-pointer rounded px-1 py-1 hover:ring-1 hover:ring-brand"
      >
        {ids.length === 0 ? (
          <span className="text-gray-400 text-xs">選擇類型</span>
        ) : (
          ids.map((id) => (
            <span
              key={id}
              className="inline-flex items-center bg-brand/10 text-brand text-xs px-1.5 rounded"
            >
              {GENRE_LABELS[id]}
            </span>
          ))
        )}
      </div>
      {open && (
        <div className="absolute z-20 top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 grid grid-cols-3 gap-x-3 gap-y-1 min-w-[200px]">
          {GENRES.map(([id, label]) => (
            <label
              key={id}
              className="flex items-center gap-1 text-xs cursor-pointer"
            >
              <input
                type="checkbox"
                checked={ids.includes(id)}
                onChange={() => toggle(id)}
                className="rounded"
              />
              {label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Data mapping ───────────────────────────────────────────────────────────────

interface Row extends BulkImportRow {
  _key: number;
  _include: boolean;
  _rating: string;
  _wish_count: string;
  _has_cover: boolean;
}

function csvRowToRow(raw: Record<string, string>, key: number): Row {
  const diff =
    (raw["difficulty_norm"] as BulkImportRow["difficulty"]) || "medium";
  const genreIds = (raw["genres_norm"] || "")
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));
  return {
    _key: key,
    _include: true,
    _rating: raw["rating"] && raw["rating"] !== "None" ? raw["rating"] : "",
    _wish_count:
      raw["wish_count"] && raw["wish_count"] !== "None"
        ? raw["wish_count"]
        : "",
    qiandao_id: raw["id"] || null,
    rating:
      raw["rating"] && raw["rating"] !== "None" ? raw["rating"] : null,
    title: raw["title"] || "",
    difficulty: diff,
    genres: genreIds,
    male_slots: parseInt(raw["male_slots"] || "0", 10),
    female_slots: parseInt(raw["female_slots"] || "0", 10),
    any_slots: parseInt(raw["any_slots"] || "0", 10),
    duration: raw["duration_hours"]
      ? parseInt(raw["duration_hours"], 10) || null
      : null,
    description: (raw["description"] || "").replace(/\\n/g, "\n"),
    publisher: raw["publisher"] || null,
    cover_image_id: raw["cover_image_id"] || null,
    _has_cover: !!raw["cover_image_id"],
  };
}


// ── Component ──────────────────────────────────────────────────────────────────

export default function ImportScriptsPage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    created: number;
    skipped: number;
    errors: { index: number; title: string; messages: string[] }[];
  } | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      setRows(parsed.map((r, i) => csvRowToRow(r, i)));
      setResult(null);
    };
    reader.readAsText(file, "utf-8");
  }

  function update(key: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r._key === key ? { ...r, ...patch } : r)));
  }

  function toggleAll(checked: boolean) {
    setRows((rs) => rs.map((r) => ({ ...r, _include: checked })));
  }

  const included = rows.filter((r) => r._include);

  async function handleImport() {
    if (included.length === 0) return;
    setImporting(true);
    try {
      const payload = included.map((r) => ({
        qiandao_id: r.qiandao_id,
        rating: r.rating,
        wish_count: r._wish_count ? parseInt(r._wish_count, 10) : 0,
        cover_image_id: r.cover_image_id,
        title: r.title,
        difficulty: r.difficulty,
        genres: r.genres,
        male_slots: r.male_slots,
        female_slots: r.female_slots,
        any_slots: r.any_slots,
        duration: r.duration,
        description: r.description,
        publisher: r.publisher,
      }));
      const res = await bulkImportScripts(payload);
      setResult(res);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">批量匯入劇本</h1>
          <p className="text-sm text-gray-500 mt-1">
            上傳 qiandao_scripts.csv，確認後匯入
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/scripts")}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← 返回
        </button>
      </div>

      {/* File upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          選擇 CSV 檔案
        </label>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={handleFile}
          className="block text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-brand file:text-white hover:file:bg-brand-hover"
        />
      </div>

      {/* Result banner */}
      {result && (
        <div
          className={`mb-6 p-4 rounded-lg text-sm ${result.errors.length === 0 ? "bg-green-50 text-green-800" : "bg-yellow-50 text-yellow-800"}`}
        >
          <p className="font-medium">
            匯入完成：{result.created} 筆成功建立
            {result.skipped > 0 && `，${result.skipped} 筆已存在略過`}
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 list-disc list-inside space-y-1">
              {result.errors.map((e) => (
                <li key={e.index}>
                  {e.title || `第 ${e.index + 1} 筆`}：{e.messages.join("、")}
                </li>
              ))}
            </ul>
          )}
          {result.errors.length === 0 && (
            <button
              onClick={() => navigate("/admin/scripts")}
              className="mt-2 underline"
            >
              前往劇本管理
            </button>
          )}
        </div>
      )}

      {rows.length === 0 && (
        <p className="text-sm text-gray-400">尚未上傳檔案</p>
      )}

      {rows.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rows.every((r) => r._include)}
                  onChange={(e) => toggleAll(e.target.checked)}
                  className="rounded"
                />
                全選
              </label>
              <span>
                {included.length} / {rows.length} 筆已選取
              </span>
            </div>
            <button
              onClick={handleImport}
              disabled={importing || included.length === 0}
              className="bg-brand text-white text-sm px-5 py-2 rounded-md hover:bg-brand-hover disabled:opacity-50"
            >
              {importing ? "匯入中..." : `匯入 ${included.length} 筆`}
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 w-8"></th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 min-w-[180px]">
                    劇本名稱
                  </th>
                  <th className="px-3 py-2 text-center font-medium text-gray-400 w-16 text-xs">
                    評分
                  </th>
                  <th className="px-3 py-2 text-center font-medium text-gray-400 w-16 text-xs">
                    收藏
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-400 w-28 text-xs">
                    發行商
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 w-24">
                    難度
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 min-w-[180px]">
                    類型
                  </th>
                  <th className="px-3 py-2 text-center font-medium text-gray-400 w-16 text-xs">
                    男
                  </th>
                  <th className="px-3 py-2 text-center font-medium text-gray-400 w-16 text-xs">
                    女
                  </th>
                  <th className="px-3 py-2 text-center font-medium text-gray-400 w-16 text-xs">
                    任意
                  </th>
                  <th className="px-3 py-2 text-center font-medium text-gray-400 w-20 text-xs">
                    時長(h)
                  </th>
                  <th className="px-3 py-2 text-center font-medium text-gray-400 w-10 text-xs">
                    圖
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr
                    key={row._key}
                    className={row._include ? "" : "opacity-40"}
                  >
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={row._include}
                        onChange={(e) =>
                          update(row._key, { _include: e.target.checked })
                        }
                        className="rounded"
                      />
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <input
                        type="text"
                        value={row.title}
                        onChange={(e) => update(row._key, { title: e.target.value })}
                        className="w-full border border-transparent focus:border-brand focus:ring-1 focus:ring-brand rounded px-1 py-0.5 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 text-center text-xs text-gray-400">
                      {row._rating || "—"}
                    </td>
                    <td className="px-3 py-2 text-center text-xs text-gray-400">
                      {row._wish_count || "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-400">
                      {row.publisher || "—"}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={row.difficulty}
                        onChange={(e) =>
                          update(row._key, {
                            difficulty: e.target
                              .value as BulkImportRow["difficulty"],
                          })
                        }
                        className="w-full border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-brand rounded px-1 py-0.5"
                      >
                        {DIFFICULTY_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <GenrePicker
                        ids={row.genres}
                        onChange={(ids) => update(row._key, { genres: ids })}
                      />
                    </td>
                    <td className="px-3 py-2 text-center text-xs text-gray-400">
                      {row.male_slots || "—"}
                    </td>
                    <td className="px-3 py-2 text-center text-xs text-gray-400">
                      {row.female_slots || "—"}
                    </td>
                    <td className="px-3 py-2 text-center text-xs text-gray-400">
                      {row.any_slots || "—"}
                    </td>
                    <td className="px-3 py-2 text-center text-xs text-gray-400">
                      {row.duration ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-center text-green-500 text-xs">
                      {row._has_cover ? "✓" : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
