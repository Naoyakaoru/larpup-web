import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAdminScripts,
  approveScript,
  rejectScript,
} from "../../api/scripts";
import type { Script } from "../../types";
import { DIFFICULTY_LABELS as DIFFICULTY_LABEL } from "../../utils/labels";

const STATUS_LABEL: Record<Script["status"], string> = {
  pending: "待審核",
  approved: "已上架",
  rejected: "已拒絕",
};

const STATUS_CLASS: Record<Script["status"], string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function AdminScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1); // Reset to page 1 when search changes
    }, 500);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    setLoading(true);
    getAdminScripts({ page, q: debouncedQ })
      .then((res) => {
        setScripts(res.scripts);
        setTotalPages(res.total_pages);
        setPendingCount(res.pending_count);
      })
      .finally(() => setLoading(false));
  }, [page, debouncedQ]);

  async function handleApprove(id: number) {
    setActionId(id);
    try {
      const updated = await approveScript(id);
      setScripts((s) => s.map((x) => (x.id === id ? updated : x)));
    } finally {
      setActionId(null);
    }
  }

  async function handleReject(id: number) {
    setActionId(id);
    try {
      const updated = await rejectScript(id);
      setScripts((s) => s.map((x) => (x.id === id ? updated : x)));
    } finally {
      setActionId(null);
    }
  }



  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">劇本管理</h1>
          {pendingCount > 0 && (
            <span className="text-sm bg-yellow-100 text-yellow-800 px-2.5 py-0.5 rounded-full font-medium">
              {pendingCount} 筆待審核
            </span>
          )}
        </div>
        <div className="flex-1 max-w-sm mx-4">
          <input
            type="text"
            placeholder="搜尋劇本名稱..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-brand focus:border-brand"
          />
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/scripts/import"
            className="text-sm border border-gray-300 text-gray-600 px-4 py-2 rounded-md hover:bg-gray-50"
          >
            批量匯入
          </Link>
          <Link
            to="/admin/scripts/new"
            className="text-sm bg-brand text-white px-4 py-2 rounded-md hover:bg-brand-hover"
          >
            新增劇本
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">載入中...</p>
      ) : scripts.length === 0 ? (
        <p className="text-sm text-gray-500">尚無劇本</p>
      ) : (
        <div className="bg-surface border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  劇本名稱
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">
                  難度
                </th>
                <th className="text-center px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">
                  人數
                </th>
                <th className="text-center px-4 py-3 font-medium text-gray-400 text-xs w-8 hidden sm:table-cell">
                  圖
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  狀態
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {scripts.map((script) => (
                <tr key={script.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      to={`/scripts/${script.id}`}
                      className="font-medium text-gray-900 hover:text-brand"
                    >
                      {script.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                    {DIFFICULTY_LABEL[script.difficulty]}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500 hidden sm:table-cell">
                    {script.total_slots} 人
                  </td>
                  <td className="px-4 py-3 text-center text-green-500 text-xs hidden sm:table-cell">
                    {script.cover_image_url ? "✓" : ""}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_CLASS[script.status]}`}
                    >
                      {STATUS_LABEL[script.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {script.status === "pending" ? (
                        <>
                          <button
                            onClick={() => handleApprove(script.id)}
                            disabled={actionId === script.id}
                            className="text-xs px-3 py-1 rounded border border-green-500 text-green-600 hover:bg-green-50 disabled:opacity-50"
                          >
                            核准
                          </button>
                          <button
                            onClick={() => handleReject(script.id)}
                            disabled={actionId === script.id}
                            className="text-xs px-3 py-1 rounded border border-red-400 text-red-500 hover:bg-red-50 disabled:opacity-50"
                          >
                            拒絕
                          </button>
                        </>
                      ) : (
                        <Link
                          to={`/admin/scripts/${script.id}/edit`}
                          className="text-xs px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
                        >
                          編輯
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <span className="text-sm text-gray-500">
                第 {page} 頁，共 {totalPages} 頁
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded text-gray-600 hover:bg-white disabled:opacity-50"
                >
                  上一頁
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded text-gray-600 hover:bg-white disabled:opacity-50"
                >
                  下一頁
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
