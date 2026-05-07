import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { bulkImportScripts, type BulkImportRow } from "../../api/scripts";
import {
  DIFFICULTY_OPTIONS,
  GENRE_LABELS,
  GENRE_BY_LABEL,
} from "../../utils/labels";

// ── CSV parsing ────────────────────────────────────────────────────────────────

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = splitCSVRow(lines[0]);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const vals = splitCSVRow(line);
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = vals[j] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function splitCSVRow(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQuote = !inQuote;
    } else if (ch === "," && !inQuote) {
      result.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

// ── Data mapping ───────────────────────────────────────────────────────────────

function parseGenresNorm(raw: string): number[] {
  return raw
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));
}

function genresToDisplay(ids: number[]): string {
  return ids
    .map((id) => GENRE_LABELS[id] ?? "")
    .filter(Boolean)
    .join("、");
}

function displayToGenres(text: string): number[] {
  return text
    .split(/[、,，\s]+/)
    .map((s) => GENRE_BY_LABEL[s.trim()])
    .filter((n) => n !== undefined);
}

interface Row extends BulkImportRow {
  _key: number;
  _include: boolean;
  _genreText: string; // display string for editing
}

function csvRowToRow(raw: Record<string, string>, key: number): Row {
  const diff =
    (raw["difficulty_norm"] as BulkImportRow["difficulty"]) || "medium";
  const genreIds = parseGenresNorm(raw["genres_norm"] || "");
  return {
    _key: key,
    _include: true,
    _genreText: genresToDisplay(genreIds),
    title: raw["title"] || "",
    difficulty: diff,
    genres: genreIds,
    male_slots: parseInt(raw["male_slots"] || "0", 10),
    female_slots: parseInt(raw["female_slots"] || "0", 10),
    any_slots: parseInt(raw["any_slots"] || "0", 10),
    duration: raw["duration_hours"]
      ? parseInt(raw["duration_hours"], 10) || null
      : null,
    description: raw["description"] || "",
    publisher: raw["publisher"] || null,
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

  function updateGenreText(key: number, text: string) {
    const ids = displayToGenres(text);
    setRows((rs) =>
      rs.map((r) =>
        r._key === key ? { ...r, _genreText: text, genres: ids } : r,
      ),
    );
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
                  <th className="px-3 py-2 text-left font-medium text-gray-600 w-28">
                    發行商
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 w-28">
                    難度
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 min-w-[160px]">
                    類型
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 w-20">
                    男
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 w-20">
                    女
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 w-20">
                    任意
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 w-20">
                    時長(h)
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 min-w-[200px]">
                    介紹
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
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={row.title}
                        onChange={(e) =>
                          update(row._key, { title: e.target.value })
                        }
                        className="w-full border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-brand rounded px-1 py-0.5"
                      />
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
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
                      <input
                        type="text"
                        value={row._genreText}
                        onChange={(e) =>
                          updateGenreText(row._key, e.target.value)
                        }
                        placeholder="推理、情感…"
                        className="w-full border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-brand rounded px-1 py-0.5"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={row.male_slots}
                        min={0}
                        onChange={(e) =>
                          update(row._key, {
                            male_slots: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="w-full border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-brand rounded px-1 py-0.5"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={row.female_slots}
                        min={0}
                        onChange={(e) =>
                          update(row._key, {
                            female_slots: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="w-full border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-brand rounded px-1 py-0.5"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={row.any_slots}
                        min={0}
                        onChange={(e) =>
                          update(row._key, {
                            any_slots: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="w-full border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-brand rounded px-1 py-0.5"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={row.duration ?? ""}
                        min={1}
                        onChange={(e) =>
                          update(row._key, {
                            duration: e.target.value
                              ? parseInt(e.target.value, 10)
                              : null,
                          })
                        }
                        className="w-full border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-brand rounded px-1 py-0.5"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <textarea
                        value={row.description}
                        rows={2}
                        onChange={(e) =>
                          update(row._key, { description: e.target.value })
                        }
                        className="w-full border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-brand rounded px-1 py-0.5 resize-none text-xs"
                      />
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
