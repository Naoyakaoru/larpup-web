import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getStoreScriptVersions, updateStoreScriptVersion, deleteStoreScriptVersion } from "../api/stores";
import type { StoreScriptVersion } from "../api/stores";
import { getStoreAddresses } from "../api/addresses";
import type { Address } from "../types";
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS } from "../utils/labels";
import AddVersionForm from "../components/AddVersionForm";


interface EditDraft {
  price: string;
  duration_override: string;
  version_name: string;
  npc_count: string;
  gm_count: string;
  has_food: boolean;
  has_costume_change: boolean;
  address_ids: number[];
}

function versionToEditDraft(v: StoreScriptVersion): EditDraft {
  return {
    price: v.price != null ? String(v.price) : "",
    duration_override: v.duration_override != null ? String(v.duration_override) : "",
    version_name: v.version_name ?? "",
    npc_count: v.npc_count != null ? String(v.npc_count) : "",
    gm_count: v.gm_count != null ? String(v.gm_count) : "",
    has_food: v.has_food ?? false,
    has_costume_change: v.has_costume_change ?? false,
    address_ids: v.address_ids ?? [],
  };
}

export default function StoreScriptVersionsPage() {
  const { id } = useParams<{ id: string }>();
  const storeId = Number(id);
  const navigate = useNavigate();
  const [versions, setVersions] = useState<StoreScriptVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);

  useEffect(() => {
    getStoreScriptVersions(storeId)
      .then(setVersions)
      .finally(() => setLoading(false));
    
    getStoreAddresses(storeId).then(setAddresses).catch(() => {});
  }, [storeId]);

  async function toggleAvailable(v: StoreScriptVersion) {
    const updated = await updateStoreScriptVersion(storeId, v.id, {
      available: !v.available,
    });
    setVersions((vs) => vs.map((x) => (x.id === updated.id ? updated : x)));
  }

  function startEdit(v: StoreScriptVersion) {
    setEditingId(v.id);
    setEditDraft(versionToEditDraft(v));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft(null);
  }

  function toggleEditAddress(id: number) {
    if (!editDraft) return;
    setEditDraft((prev) => {
      if (!prev) return prev;
      const ids = prev.address_ids;
      return {
        ...prev,
        address_ids: ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
      };
    });
  }

  async function saveEdit(versionId: number) {
    if (!editDraft) return;
    setSaving(true);
    try {
      const updated = await updateStoreScriptVersion(storeId, versionId, {
        price: editDraft.price ? parseFloat(editDraft.price) : null,
        duration_override: editDraft.duration_override
          ? parseFloat(editDraft.duration_override)
          : null,
        version_name: editDraft.version_name || null,
        npc_count: editDraft.npc_count ? parseInt(editDraft.npc_count) : null,
        gm_count: editDraft.gm_count ? parseInt(editDraft.gm_count) : null,
        has_food: editDraft.has_food || null,
        has_costume_change: editDraft.has_costume_change || null,
        address_ids: editDraft.address_ids,
      });
      setVersions((vs) => vs.map((x) => (x.id === updated.id ? updated : x)));
      cancelEdit();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(versionId: number) {
    if (!confirm("確定要刪除此劇本版本？")) return;
    await deleteStoreScriptVersion(storeId, versionId);
    setVersions((vs) => vs.filter((x) => x.id !== versionId));
    if (editingId === versionId) cancelEdit();
  }

  function handleAdded(v: StoreScriptVersion) {
    setVersions((vs) => [...vs, v]);
    setShowAdd(false);
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">劇本版本</h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/stores/${id}/script_versions/import`)}
            className="text-sm border border-gray-300 text-gray-600 px-4 py-2 rounded-md hover:bg-gray-50"
          >
            批量匯入
          </button>
          <button
            onClick={() => setShowAdd((s) => !s)}
            className="text-sm bg-brand text-white px-4 py-2 rounded-md hover:bg-brand-hover"
          >
            {showAdd ? "取消" : "新增劇本"}
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="mb-6">
          <AddVersionForm storeId={storeId} onAdded={handleAdded} />
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-400 py-16">載入中...</div>
      ) : versions.length === 0 ? (
        <div className="text-center text-gray-400 py-16">尚未上架任何劇本</div>
      ) : (
        <div className="bg-surface border border-gray-200 rounded-lg divide-y divide-gray-100 overflow-hidden">
          {versions.map((v) => (
            <div key={v.id}>
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {v.script.title}
                    </p>
                    {v.version_name && (
                      <span className="text-xs text-gray-400">
                        （{v.version_name}）
                      </span>
                    )}
                    {v.script.status === "pending" && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                        待審核
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full font-medium mr-1.5 ${DIFFICULTY_COLORS[v.script.difficulty as keyof typeof DIFFICULTY_COLORS]}`}
                    >
                      {DIFFICULTY_LABELS[v.script.difficulty as keyof typeof DIFFICULTY_LABELS]}
                    </span>
                    {v.script.total_slots} 人
                    {v.price != null && ` · $${v.price}`}
                    {v.duration_override && ` · ${v.duration_override} 小時`}
                  </p>
                  {(v.npc_count || v.gm_count || v.has_food || v.has_costume_change) && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {v.npc_count ? <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">NPC ×{v.npc_count}</span> : null}
                      {v.gm_count ? <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">GM ×{v.gm_count}</span> : null}
                      {v.has_food && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">附餐飲</span>}
                      {v.has_costume_change && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">換裝</span>}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => editingId === v.id ? cancelEdit() : startEdit(v)}
                  className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
                >
                  {editingId === v.id ? "取消" : "編輯"}
                </button>
                <button
                  type="button"
                  onClick={() => toggleAvailable(v)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${v.available ? "bg-brand" : "bg-gray-200"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${v.available ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </div>

              {editingId === v.id && editDraft && (
                <div className="px-5 pb-4 border-t border-gray-100 pt-3 space-y-3 bg-gray-50">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-0.5 block">定價</label>
                      <input type="number" min={0} value={editDraft.price}
                        onChange={(e) => setEditDraft({ ...editDraft, price: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-0.5 block">時長（小時）</label>
                      <input type="number" min={1} value={editDraft.duration_override}
                        onChange={(e) => setEditDraft({ ...editDraft, duration_override: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-0.5 block">版本名稱</label>
                      <input type="text" value={editDraft.version_name}
                        onChange={(e) => setEditDraft({ ...editDraft, version_name: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500 mb-0.5 block">NPC 數</label>
                        <input type="number" min={0} value={editDraft.npc_count}
                          onChange={(e) => setEditDraft({ ...editDraft, npc_count: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-0.5 block">GM 數</label>
                        <input type="number" min={0} value={editDraft.gm_count}
                          onChange={(e) => setEditDraft({ ...editDraft, gm_count: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                      <input type="checkbox" checked={editDraft.has_food}
                        onChange={(e) => setEditDraft({ ...editDraft, has_food: e.target.checked })}
                        className="rounded" />
                      附餐飲
                    </label>
                    <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                      <input type="checkbox" checked={editDraft.has_costume_change}
                        onChange={(e) => setEditDraft({ ...editDraft, has_costume_change: e.target.checked })}
                        className="rounded" />
                      換裝
                    </label>
                  </div>
                  {addresses.length > 0 && (
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">可遊玩地點（選填）</label>
                      <div className="flex flex-wrap gap-1.5">
                        {addresses.map((a) => (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => toggleEditAddress(a.id)}
                            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                              editDraft.address_ids.includes(a.id)
                                ? "bg-brand text-white border-brand"
                                : "border-gray-300 text-gray-600 hover:border-gray-400"
                            }`}
                          >
                            {a.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => saveEdit(v.id)}
                      disabled={saving}
                      className="bg-brand text-white text-sm px-4 py-1.5 rounded-md hover:bg-brand-hover disabled:opacity-50"
                    >
                      {saving ? "儲存中..." : "儲存"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(v.id)}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      刪除此版本
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
