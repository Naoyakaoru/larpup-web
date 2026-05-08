import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getStoreScriptVersions, updateStoreScriptVersion } from "../api/stores";
import type { StoreScriptVersion } from "../api/stores";
import { DIFFICULTY_LABELS, REGION_OPTIONS, REGION_LABELS } from "../utils/labels";
import AddVersionForm from "../components/AddVersionForm";
import AddressPicker from "../components/AddressPicker";
import {
  getStoreAddresses,
  createAddress,
  updateAddress,
  linkAddressToStore,
  unlinkAddressFromStore,
} from "../api/addresses";
import type { Address } from "../types";

function ComingSoonSection({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="bg-gray-50 border border-gray-200 rounded-lg p-5 opacity-60">
      <h2 className="font-semibold text-gray-500 mb-1">{title}</h2>
      <p className="text-sm text-gray-400">{description}</p>
    </section>
  );
}

export default function StoreManagePage() {
  const { id } = useParams<{ id: string }>();
  const storeId = Number(id);
  const [versions, setVersions] = useState<StoreScriptVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  // Addresses
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showLinkPicker, setShowLinkPicker] = useState(false);
  const [linkCandidate, setLinkCandidate] = useState<Address | null>(null);
  const [showCreateAddress, setShowCreateAddress] = useState(false);
  const [newAddr, setNewAddr] = useState<{ name: string; address: string; map_url: string; region: string }>({ name: "", address: "", map_url: "", region: REGION_OPTIONS[0].value });
  const [addrError, setAddrError] = useState("");
  const [editAddrId, setEditAddrId] = useState<number | null>(null);
  const [editAddrForm, setEditAddrForm] = useState<{ name: string; address: string; map_url: string; region: string }>({ name: "", address: "", map_url: "", region: "" });

  useEffect(() => {
    getStoreScriptVersions(storeId)
      .then(setVersions)
      .finally(() => setLoadingVersions(false));
  }, [storeId]);

  useEffect(() => {
    getStoreAddresses(storeId).then(setAddresses);
  }, [storeId]);

  async function handleLinkAddress() {
    if (!linkCandidate) return;
    try {
      await linkAddressToStore(storeId, linkCandidate.id);
      setAddresses((prev) =>
        prev.some((a) => a.id === linkCandidate.id) ? prev : [...prev, linkCandidate]
      );
      setLinkCandidate(null);
      setShowLinkPicker(false);
    } catch (err) {
      setAddrError(err instanceof Error ? err.message : "連結失敗");
    }
  }

  async function handleUpdateAddress(id: number) {
    setAddrError("");
    try {
      const updated = await updateAddress(id, { name: editAddrForm.name });
      setAddresses((prev) => prev.map((a) => (a.id === id ? updated : a)));
      setEditAddrId(null);
    } catch (err) {
      setAddrError(err instanceof Error ? err.message : "儲存失敗");
    }
  }

  async function handleUnlinkAddress(addressId: number) {
    if (!window.confirm("確定要移除此場館與店家的關聯？")) return;
    try {
      await unlinkAddressFromStore(storeId, addressId);
      setAddresses((prev) => prev.filter((a) => a.id !== addressId));
    } catch (err) {
      setAddrError(err instanceof Error ? err.message : "移除失敗");
    }
  }

  async function handleCreateAddress(e: React.SyntheticEvent) {
    e.preventDefault();
    setAddrError("");
    try {
      const created = await createAddress({
        name: newAddr.name,
        address: newAddr.address || null,
        map_url: newAddr.map_url || null,
        region: newAddr.region,
        store_id: storeId,
      });
      setAddresses((prev) => [...prev, created]);
      setNewAddr({ name: "", address: "", map_url: "", region: REGION_OPTIONS[0].value });
      setShowCreateAddress(false);
    } catch (err) {
      setAddrError(err instanceof Error ? err.message : "建立失敗");
    }
  }

  async function toggleAvailable(v: StoreScriptVersion) {
    const updated = await updateStoreScriptVersion(storeId, v.id, {
      available: !v.available,
    });
    setVersions((vs) => vs.map((x) => (x.id === updated.id ? updated : x)));
  }

  function handleAdded(v: StoreScriptVersion) {
    setVersions((vs) => [...vs, v]);
    setShowAdd(false);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">店家管理</h1>

      <div className="space-y-4">
        {/* 劇本版本 */}
        <section className="bg-surface border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">劇本版本</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAdd((s) => !s)}
                className="text-sm bg-brand text-white px-3 py-1 rounded-md hover:bg-brand-hover"
              >
                {showAdd ? "取消" : "新增劇本"}
              </button>
              <Link
                to={`/stores/${id}/script_versions`}
                className="text-sm text-gray-400 hover:text-brand"
              >
                查看全部 →
              </Link>
            </div>
          </div>

          {showAdd && (
            <div className="mb-4">
              <AddVersionForm
                storeId={storeId}
                onAdded={handleAdded}
                onCancel={() => setShowAdd(false)}
              />
            </div>
          )}

          {loadingVersions ? (
            <p className="text-sm text-gray-400">載入中...</p>
          ) : versions.length === 0 ? (
            <p className="text-sm text-gray-400">尚未上架任何劇本</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {versions.slice(0, 3).map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {v.script.title}
                      {v.version_name && (
                        <span className="ml-1.5 text-xs text-gray-400">
                          （{v.version_name}）
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {DIFFICULTY_LABELS[v.script.difficulty as keyof typeof DIFFICULTY_LABELS]}
                      ・{v.script.total_slots} 人
                      {v.price != null && ` · $${v.price}`}
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
                    onClick={() => toggleAvailable(v)}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ml-4 ${v.available ? "bg-brand" : "bg-gray-200"}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${v.available ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>
                </li>
              ))}
              {versions.length > 5 && (
                <li className="pt-3">
                  <Link
                    to={`/stores/${id}/script_versions`}
                    className="text-sm text-gray-400 hover:text-brand"
                  >
                    查看全部 {versions.length} 筆 →
                  </Link>
                </li>
              )}
            </ul>
          )}
        </section>

        <ComingSoonSection
          title="活動"
          description="查看與管理此店家的揪團活動"
        />
        {/* 場館地址 */}
        <section className="bg-surface border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">場館地址</h2>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowCreateAddress((v) => !v); setShowLinkPicker(false); }}
                className="text-sm border border-gray-300 text-gray-600 px-3 py-1 rounded-md hover:bg-gray-50"
              >
                {showCreateAddress ? "取消" : "新增地址"}
              </button>
              <button
                onClick={() => { setShowLinkPicker((v) => !v); setShowCreateAddress(false); }}
                className="text-sm bg-brand text-white px-3 py-1 rounded-md hover:bg-brand-hover"
              >
                {showLinkPicker ? "取消" : "連結現有"}
              </button>
            </div>
          </div>

          {showCreateAddress && (
            <form onSubmit={handleCreateAddress} className="mb-4 space-y-3 bg-gray-50 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">場館名稱 *</label>
                  <input
                    value={newAddr.name}
                    onChange={(e) => setNewAddr((f) => ({ ...f, name: e.target.value }))}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">地區 *</label>
                  <select
                    value={newAddr.region}
                    onChange={(e) => setNewAddr((f) => ({ ...f, region: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    {REGION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">地址</label>
                <input
                  value={newAddr.address}
                  onChange={(e) => setNewAddr((f) => ({ ...f, address: e.target.value }))}
                  placeholder="完整地址（Google Maps 可搜尋）"
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Google Maps 連結</label>
                <input
                  value={newAddr.map_url}
                  onChange={(e) => setNewAddr((f) => ({ ...f, map_url: e.target.value }))}
                  placeholder="https://maps.google.com/..."
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              {addrError && <p className="text-xs text-red-600">{addrError}</p>}
              <button type="submit" className="bg-brand text-white text-sm px-4 py-1.5 rounded-md hover:bg-brand-hover">
                建立並加入
              </button>
            </form>
          )}

          {showLinkPicker && (
            <div className="mb-4 flex gap-2 items-start">
              <div className="flex-1">
                <AddressPicker value={linkCandidate} onChange={setLinkCandidate} placeholder="搜尋已建立場館…" />
              </div>
              <button
                onClick={handleLinkAddress}
                disabled={!linkCandidate}
                className="text-sm bg-brand text-white px-3 py-2 rounded-md hover:bg-brand-hover disabled:opacity-40 whitespace-nowrap"
              >
                加入
              </button>
            </div>
          )}

          {addresses.length === 0 ? (
            <p className="text-sm text-gray-400">尚未設定場館地址</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {addresses.map((a) =>
                editAddrId === a.id ? (
                  <li key={a.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-2 bg-brand/5 px-2 rounded">
                    <input
                      value={editAddrForm.name}
                      onChange={(e) => setEditAddrForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="場館名稱"
                      className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                    <button onClick={() => handleUpdateAddress(a.id)} className="text-xs text-brand hover:text-brand-hover font-medium whitespace-nowrap">儲存</button>
                    <button onClick={() => setEditAddrId(null)} className="text-xs text-gray-400 hover:text-gray-600">取消</button>
                  </li>
                ) : (
                  <li key={a.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{a.name}</p>
                      <p className="text-xs text-gray-400">{REGION_LABELS[a.region as keyof typeof REGION_LABELS] ?? a.region}{a.address ? `・${a.address}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {a.map_url && (
                        <a href={a.map_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand hover:underline">
                          地圖
                        </a>
                      )}
                      <button
                        onClick={() => { setEditAddrId(a.id); setEditAddrForm({ name: a.name, address: a.address ?? "", map_url: a.map_url ?? "", region: a.region }); }}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        編輯
                      </button>
                      <button onClick={() => handleUnlinkAddress(a.id)} className="text-xs text-gray-400 hover:text-red-500">
                        移除
                      </button>
                    </div>
                  </li>
                )
              )}
            </ul>
          )}
        </section>
        <ComingSoonSection
          title="成員與權限"
          description="管理可操作此店家的帳號與角色"
        />
      </div>
    </div>
  );
}
