import { useEffect, useState } from "react";
import {
  getAdminAddresses,
  updateAddress,
  adminDeleteAddress,
  createAddress,
} from "../../api/addresses";
import type { Address } from "../../types";
import { REGION_OPTIONS, REGION_LABELS } from "../../utils/labels";

export default function AdminAddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<{ name: string; address: string; map_url: string; region: string }>({ name: "", address: "", map_url: "", region: REGION_OPTIONS[0].value });
  const [editForm, setEditForm] = useState({ name: "", address: "", map_url: "", region: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminAddresses()
      .then(setAddresses)
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.SyntheticEvent) {
    e.preventDefault();
    setError("");
    try {
      const created = await createAddress({
        name: form.name,
        address: form.address || null,
        map_url: form.map_url || null,
        region: form.region,
      });
      setAddresses((prev) => [created, ...prev]);
      setForm({ name: "", address: "", map_url: "", region: REGION_OPTIONS[0].value });
      setCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "建立失敗");
    }
  }

  function startEdit(a: Address) {
    setEditId(a.id);
    setEditForm({ name: a.name, address: a.address ?? "", map_url: a.map_url ?? "", region: a.region });
  }

  async function handleUpdate(id: number) {
    setError("");
    try {
      const updated = await updateAddress(id, {
        name: editForm.name,
        address: editForm.address || null,
        map_url: editForm.map_url || null,
        region: editForm.region,
      });
      setAddresses((prev) => prev.map((a) => (a.id === id ? updated : a)));
      setEditId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    }
  }

  async function handleDelete(a: Address) {
    if (!window.confirm(`確定要刪除「${a.name}」？`)) return;
    try {
      await adminDeleteAddress(a.id);
      setAddresses((prev) =>
        prev.map((x) => (x.id === a.id ? { ...x, deleted_at: new Date().toISOString() } : x))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "刪除失敗");
    }
  }

  const active = addresses.filter((a) => !a.deleted_at);
  const deleted = addresses.filter((a) => a.deleted_at);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">地址管理</h1>
        <button
          onClick={() => setCreating((v) => !v)}
          className="text-sm bg-brand text-white px-4 py-2 rounded-md hover:bg-brand-hover"
        >
          {creating ? "取消" : "新增地址"}
        </button>
      </div>

      {creating && (
        <form
          onSubmit={handleCreate}
          className="mb-6 bg-surface border border-gray-200 rounded-lg p-4 space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">場館名稱 *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">地區 *</label>
              <select
                value={form.region}
                onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              >
                {REGION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">地址</label>
            <input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Google Maps 可搜尋的完整地址"
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Google Maps 連結</label>
            <input
              value={form.map_url}
              onChange={(e) => setForm((f) => ({ ...f, map_url: e.target.value }))}
              placeholder="https://maps.google.com/..."
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="bg-brand text-white text-sm px-4 py-1.5 rounded-md hover:bg-brand-hover"
          >
            建立
          </button>
        </form>
      )}

      {error && !creating && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-400">載入中...</p>
      ) : (
        <div className="space-y-6">
          <AddressTable
            addresses={active}
            editId={editId}
            editForm={editForm}
            setEditForm={setEditForm}
            onStartEdit={startEdit}
            onUpdate={handleUpdate}
            onCancelEdit={() => setEditId(null)}
            onDelete={handleDelete}
          />
          {deleted.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">已刪除 ({deleted.length})</p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden opacity-60">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-100">
                    {deleted.map((a) => (
                      <tr key={a.id}>
                        <td className="px-4 py-2 text-gray-400 line-through">{a.name}</td>
                        <td className="px-4 py-2 text-gray-400 text-xs">{REGION_LABELS[a.region as keyof typeof REGION_LABELS] ?? a.region}</td>
                        <td className="px-4 py-2 text-gray-400 text-xs">{a.address}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AddressTable({
  addresses,
  editId,
  editForm,
  setEditForm,
  onStartEdit,
  onUpdate,
  onCancelEdit,
  onDelete,
}: {
  addresses: Address[];
  editId: number | null;
  editForm: { name: string; address: string; map_url: string; region: string };
  setEditForm: React.Dispatch<React.SetStateAction<{ name: string; address: string; map_url: string; region: string }>>;
  onStartEdit: (a: Address) => void;
  onUpdate: (id: number) => void;
  onCancelEdit: () => void;
  onDelete: (a: Address) => void;
}) {
  if (addresses.length === 0) return <p className="text-sm text-gray-400">尚無地址</p>;

  return (
    <div className="bg-surface border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600">場館名稱</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600 w-24">地區</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">地址</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell w-16">地圖</th>
            <th className="text-right px-4 py-3 w-24"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {addresses.map((a) =>
            editId === a.id ? (
              <tr key={a.id} className="bg-brand/5">
                <td className="px-4 py-2">
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </td>
                <td className="px-4 py-2">
                  <select
                    value={editForm.region}
                    onChange={(e) => setEditForm((f) => ({ ...f, region: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                  >
                    {REGION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </td>
                <td className="px-4 py-2 hidden md:table-cell">
                  <input
                    value={editForm.address}
                    onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </td>
                <td className="px-4 py-2 hidden md:table-cell">
                  <input
                    value={editForm.map_url}
                    onChange={(e) => setEditForm((f) => ({ ...f, map_url: e.target.value }))}
                    placeholder="https://..."
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onUpdate(a.id)}
                      className="text-xs text-brand hover:text-brand-hover font-medium"
                    >
                      儲存
                    </button>
                    <button
                      onClick={onCancelEdit}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      取消
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{a.name}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{REGION_LABELS[a.region as keyof typeof REGION_LABELS] ?? a.region}</td>
                <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">{a.address ?? "—"}</td>
                <td className="px-4 py-3 hidden md:table-cell">
                  {a.map_url ? (
                    <a
                      href={a.map_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand hover:underline"
                    >
                      地圖
                    </a>
                  ) : (
                    <span className="text-gray-300 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => onStartEdit(a)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      編輯
                    </button>
                    <button
                      onClick={() => onDelete(a)}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      刪除
                    </button>
                  </div>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
