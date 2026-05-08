import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  bulkImportStoreScriptVersions,
  type BulkImportVersionRow,
} from "../api/stores";

// ── CSV parsing ────────────────────────────────────────────────────────────────

function parseCSVRows(text: string): string[][] {
  const rows: string[][] = [];
  let fields: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuote) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = false;
      } else { cur += ch; }
    } else {
      if (ch === '"') { inQuote = true; }
      else if (ch === ",") { fields.push(cur); cur = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        fields.push(cur); cur = "";
        if (fields.some((f) => f !== "") || rows.length > 0) rows.push(fields);
        fields = [];
      } else { cur += ch; }
    }
  }
  fields.push(cur);
  if (fields.some((f) => f !== "")) rows.push(fields);
  return rows;
}

function parseCSV(text: string): Record<string, string>[] {
  const allRows = parseCSVRows(text);
  if (allRows.length < 2) return [];
  const headers = allRows[0];
  return allRows
    .slice(1)
    .filter((vals) => !vals[0]?.startsWith("#"))
    .map((vals) => {
      const row: Record<string, string> = {};
      headers.forEach((h, j) => { row[h] = vals[j] ?? ""; });
      return row;
    });
}

// ── Data mapping ───────────────────────────────────────────────────────────────

interface Row extends BulkImportVersionRow {
  _key: number;
  _include: boolean;
}

function parseBool(val: string): boolean | null {
  if (!val) return null;
  return val.trim().toLowerCase() === "true" || val.trim() === "1";
}

function csvRowToRow(raw: Record<string, string>, key: number): Row {
  return {
    _key: key,
    _include: true,
    title: raw["title"] || "",
    price: raw["price"] ? parseFloat(raw["price"]) || null : null,
    duration_override: raw["duration_override"] ? parseInt(raw["duration_override"], 10) || null : null,
    version_name: raw["version_name"] || null,
    npc_count: raw["npc_count"] ? parseInt(raw["npc_count"], 10) || null : null,
    gm_count: raw["gm_count"] ? parseInt(raw["gm_count"], 10) || null : null,
    has_food: raw["has_food"] ? parseBool(raw["has_food"]) : null,
    has_costume_change: raw["has_costume_change"] ? parseBool(raw["has_costume_change"]) : null,
  };
}

// ── Template ───────────────────────────────────────────────────────────────────

const TEMPLATE_CSV = [
  "title,price,duration_override,version_name,npc_count,gm_count,has_food,has_costume_change",
  "#必填,選填（定價整數）,選填（時長小時整數）,選填（版本名稱）,選填（NPC數整數）,選填（GM數整數）,選填（true/false）,選填（true/false）",
  "謎境奇旅,800,3,標準版,2,1,true,false",
  "消失的夜晚,600,,,,,, ",
].join("\n");


// ── Component ──────────────────────────────────────────────────────────────────

export default function StoreImportScriptVersionsPage() {
  const { id } = useParams<{ id: string }>();
  const storeId = Number(id);
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    created: number;
    errors: { index: number; title: string; messages: string[] }[];
  } | null>(null);

  function downloadTemplate() {
    const blob = new Blob(["﻿" + TEMPLATE_CSV], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "script_versions_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

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

  function toggleAll(checked: boolean) {
    setRows((rs) => rs.map((r) => ({ ...r, _include: checked })));
  }

  function toggle(key: number, checked: boolean) {
    setRows((rs) => rs.map((r) => (r._key === key ? { ...r, _include: checked } : r)));
  }

  const included = rows.filter((r) => r._include);

  async function handleImport() {
    if (included.length === 0) return;
    setImporting(true);
    try {
      const res = await bulkImportStoreScriptVersions(storeId, included.map((r) => ({
        title: r.title,
        price: r.price,
        duration_override: r.duration_override,
        version_name: r.version_name,
        npc_count: r.npc_count,
        gm_count: r.gm_count,
        has_food: r.has_food,
        has_costume_change: r.has_costume_change,
      })));
      setResult(res);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">批量匯入劇本版本</h1>
        <button onClick={() => navigate(`/stores/${id}/script_versions`)} className="text-sm text-gray-500 hover:text-gray-700">
          ← 返回
        </button>
      </div>

      {/* Upload + template */}
      <div className="mb-6 flex items-center gap-4">
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={handleFile}
          className="block text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-brand file:text-white hover:file:bg-brand-hover"
        />
        <button
          type="button"
          onClick={downloadTemplate}
          className="text-sm text-gray-500 hover:text-brand underline whitespace-nowrap"
        >
          下載範本
        </button>
      </div>

      {result && (
        <div className={`mb-6 p-4 rounded-lg text-sm ${result.errors.length === 0 ? "bg-green-50 text-green-800" : "bg-yellow-50 text-yellow-800"}`}>
          <p className="font-medium">
            匯入完成：{result.created} 筆成功
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 list-disc list-inside space-y-1">
              {result.errors.map((e) => (
                <li key={e.index}>{e.title || `第 ${e.index + 1} 筆`}：{e.messages.join("、")}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {rows.length === 0 && <p className="text-sm text-gray-400">尚未上傳檔案</p>}

      {rows.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={rows.every((r) => r._include)} onChange={(e) => toggleAll(e.target.checked)} className="rounded" />
                全選
              </label>
              <span>{included.length} / {rows.length} 筆已選取</span>
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
                  <th className="px-3 py-2 text-left font-medium text-gray-600 min-w-[180px]">劇本名稱</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 w-20">定價</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 w-20">時長(h)</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 w-28">版本名稱</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 w-16">NPC</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 w-16">GM</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 w-16">餐飲</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 w-16">換裝</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row._key} className={row._include ? "" : "opacity-40"}>
                    <td className="px-3 py-2 text-center">
                      <input type="checkbox" checked={row._include} onChange={(e) => toggle(row._key, e.target.checked)} className="rounded" />
                    </td>
                    <td className="px-3 py-2">{row.title}</td>
                    <td className="px-3 py-2 text-gray-500">{row.price ?? "—"}</td>
                    <td className="px-3 py-2 text-gray-500">{row.duration_override ?? "—"}</td>
                    <td className="px-3 py-2 text-gray-500">{row.version_name || "—"}</td>
                    <td className="px-3 py-2 text-gray-500">{row.npc_count ?? "—"}</td>
                    <td className="px-3 py-2 text-gray-500">{row.gm_count ?? "—"}</td>
                    <td className="px-3 py-2 text-gray-500">{row.has_food == null ? "—" : row.has_food ? "是" : "否"}</td>
                    <td className="px-3 py-2 text-gray-500">{row.has_costume_change == null ? "—" : row.has_costume_change ? "是" : "否"}</td>
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
