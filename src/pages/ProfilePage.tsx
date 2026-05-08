import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyEvents, getMyStores, updateMe } from "../api/users";
import { useAuth } from "../contexts/AuthContext";
import type { Event } from "../types";
import { EVENT_STATUS_LABELS as STATUS_LABELS, REGION_LABELS } from "../utils/labels";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function EventList({ events }: { events: Event[] }) {
  if (events.length === 0)
    return <p className="text-sm text-gray-400">沒有活動</p>;
  return (
    <div className="space-y-2">
      {events.map((e) => (
        <Link
          key={e.id}
          to={`/events/${e.id}`}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
        >
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 truncate">
              {e.script.title}
            </div>
            <div className="text-xs text-gray-400 truncate">
              {formatDate(e.scheduled_at)}・{e.address ? `${REGION_LABELS[e.address.region as keyof typeof REGION_LABELS] ?? e.address.region}·${e.address.name}` : e.location}
            </div>
          </div>
          <span className="text-xs text-gray-500 ml-2 shrink-0">
            {STATUS_LABELS[e.status]}
          </span>
        </Link>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const { user, login } = useAuth();
  const [hosted, setHosted] = useState<Event[]>([]);
  const [joined, setJoined] = useState<Event[]>([]);
  const [myStores, setMyStores] = useState<
    { id: number; name: string; status: string; role: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    nickname: "",
    handle: "",
    password: "",
    passwordConfirmation: "",
    showHostedEvents: false,
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    Promise.all([getMyEvents(), getMyStores()])
      .then(([events, stores]) => {
        setHosted(events.hosted);
        setJoined(events.joined);
        setMyStores(stores);
      })
      .finally(() => setLoading(false));
  }, []);

  function startEdit() {
    setForm({
      nickname: user?.nickname ?? "",
      handle: user?.handle ?? "",
      password: "",
      passwordConfirmation: "",
      showHostedEvents: user?.show_hosted_events ?? false,
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setEditing(true);
    setSaveMsg("");
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setAvatarFile(file);
    setAvatarPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSave() {
    try {
      let updated;
      if (avatarFile) {
        const fd = new FormData();
        fd.append("nickname", form.nickname);
        fd.append("handle", form.handle);
        fd.append("show_hosted_events", String(form.showHostedEvents));
        fd.append("avatar", avatarFile);
        if (form.password) {
          fd.append("password", form.password);
          fd.append("password_confirmation", form.passwordConfirmation);
        }
        updated = await updateMe(fd);
      } else {
        const data: Parameters<typeof updateMe>[0] = {
          nickname: form.nickname,
          handle: form.handle,
          show_hosted_events: form.showHostedEvents,
        };
        if (form.password) {
          data.password = form.password;
          data.password_confirmation = form.passwordConfirmation;
        }
        updated = await updateMe(data);
      }
      const token = localStorage.getItem("larpup_token");
      if (token) login(token, updated);
      setEditing(false);
      setSaveMsg("已儲存");
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : "儲存失敗");
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="bg-surface border border-gray-200 rounded-lg p-6 mb-6">
        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">頭貼</label>
              <div className="flex items-center gap-3">
                <img
                  src={
                    avatarPreview ??
                    user?.avatar_url ??
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.nickname ?? "")}&background=random`
                  }
                  className="w-14 h-14 rounded-full object-cover border border-gray-200"
                />
                <label className="cursor-pointer text-sm text-brand hover:text-brand-hover">
                  選擇圖片
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">暱稱</label>
              <input
                value={form.nickname}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nickname: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                個人頁網址{" "}
                <span className="text-gray-400 font-normal">
                  （小寫英數字和底線，3–30字）
                </span>
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-gray-400">/users/</span>
                <input
                  value={form.handle}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, handle: e.target.value }))
                  }
                  placeholder="your_handle"
                  className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm text-gray-700">公開顯示主辦的活動</p>
                <p className="text-xs text-gray-400">
                  開啟後，個人頁會顯示你主辦的招募中 / 已滿員活動
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    showHostedEvents: !f.showHostedEvents,
                  }))
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  form.showHostedEvents ? "bg-brand" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    form.showHostedEvents ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                新密碼（不改請留空）
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            {form.password && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  確認新密碼
                </label>
                <input
                  type="password"
                  value={form.passwordConfirmation}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      passwordConfirmation: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            )}
            {saveMsg && <p className="text-sm text-red-500">{saveMsg}</p>}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                className="text-sm bg-brand text-white px-3 py-1.5 rounded-md hover:bg-brand-hover"
              >
                儲存
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <img
                src={
                  user?.avatar_url ??
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.nickname ?? "")}&background=random`
                }
                className="w-14 h-14 rounded-full object-cover border border-gray-200"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-0.5">
                  {user?.nickname}
                </h1>
                <p className="text-sm text-gray-400">@{user?.handle}</p>
                <p className="text-sm text-gray-400">{user?.email}</p>
                {saveMsg && (
                  <p className="text-xs text-green-600 mt-1">{saveMsg}</p>
                )}
              </div>
            </div>
            <button
              onClick={startEdit}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              編輯
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-8">載入中...</div>
      ) : (
        <div className="space-y-6">
          <section>
            <h2 className="font-semibold text-gray-700 mb-3">我主辦的活動</h2>
            <EventList events={hosted} />
          </section>
          <section>
            <h2 className="font-semibold text-gray-700 mb-3">我參加的活動</h2>
            <EventList events={joined} />
          </section>
          {myStores.length > 0 && (
            <section>
              <h2 className="font-semibold text-gray-700 mb-3">我的店家</h2>
              <div className="space-y-2">
                {myStores.map((store) => (
                  <Link
                    key={store.id}
                    to={`/stores/${store.id}/manage`}
                    className="flex items-center justify-between p-3 bg-surface border border-gray-200 rounded-md hover:border-brand-light hover:shadow-sm transition-all"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {store.name}
                      </p>
                      <p className="text-xs text-gray-400">{store.role}</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </section>
          )}
          {user?.is_admin && (
            <section>
              <h2 className="font-semibold text-gray-700 mb-3">管理員</h2>
              <div className="space-y-2">
                <Link
                  to="/admin/scripts"
                  className="flex items-center gap-3 p-3 bg-surface border border-gray-200 rounded-md hover:border-brand-light hover:shadow-sm transition-all"
                >
                  <span className="w-8 h-8 bg-brand/10 rounded-full flex items-center justify-center shrink-0">
                    <svg
                      className="w-4 h-4 text-brand"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    劇本管理
                  </span>
                </Link>
                <Link
                  to="/admin/stores"
                  className="flex items-center gap-3 p-3 bg-surface border border-gray-200 rounded-md hover:border-brand-light hover:shadow-sm transition-all"
                >
                  <span className="w-8 h-8 bg-brand/10 rounded-full flex items-center justify-center shrink-0">
                    <svg
                      className="w-4 h-4 text-brand"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                      />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    店家管理
                  </span>
                </Link>
                <Link
                  to="/admin/addresses"
                  className="flex items-center gap-3 p-3 bg-surface border border-gray-200 rounded-md hover:border-brand-light hover:shadow-sm transition-all"
                >
                  <span className="w-8 h-8 bg-brand/10 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </span>
                  <span className="text-sm font-medium text-gray-900">地址管理</span>
                </Link>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
