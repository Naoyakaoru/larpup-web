import { useEffect, useState, useRef, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

import { Link, useNavigate } from "react-router-dom";
import { getMyEvents, getMyStores, updateMe } from "../api/users";
import { ssoGoogle, logout as logoutApi } from "../api/auth";
import { useAuth } from "../contexts/AuthContext";
import { GoogleLogin } from "@react-oauth/google";
import type { Event } from "../types";
import { EVENT_STATUS_LABELS as STATUS_LABELS, REGION_LABELS } from "../utils/labels";

function LineIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 10.06C22 5.5 17.52 1.82 12 1.82S2 5.5 2 10.06c0 4.1 3.64 7.53 8.56 8.18.33.07.78.22.9.5.1.26.07.66.03.92l-.14.86c-.04.26-.2 1.02.9.55 1.1-.46 5.9-3.48 8.05-5.96C21.27 13.31 22 11.76 22 10.06z" />
    </svg>
  );
}

function GoogleIcon({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

const LINE_CHANNEL_ID = import.meta.env.VITE_LINE_CHANNEL_ID as string;
const LINE_REDIRECT_URI = import.meta.env.VITE_LINE_REDIRECT_URI as string;

function buildLineLoginUrl(): string {
  const state = crypto.randomUUID();
  sessionStorage.setItem("line_oauth_state", state);
  sessionStorage.setItem('line_return_to', '/profile');
  const params = new URLSearchParams({
    response_type: "code",
    client_id: LINE_CHANNEL_ID,
    redirect_uri: LINE_REDIRECT_URI,
    state,
    scope: "profile openid email",
  });
  return `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
}

import { formatDateShort as formatDate } from "../utils/formatDate";

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
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
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
  const [bindMsg, setBindMsg] = useState("");
  const [bindError, setBindError] = useState("");
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // ── Cropper state ──────────────────────────────────────────────────────────
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleLogout() {
    await logoutApi().catch(() => {});
    logout();
    navigate("/");
  }

  async function getCroppedImg(src: string, pixels: Area): Promise<File> {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = src;
    });
    const canvas = document.createElement("canvas");
    canvas.width = pixels.width;
    canvas.height = pixels.height;
    canvas.getContext("2d")!.drawImage(
      img, pixels.x, pixels.y, pixels.width, pixels.height,
      0, 0, pixels.width, pixels.height,
    );
    return new Promise((resolve) =>
      canvas.toBlob(
        (blob) => resolve(new File([blob!], "avatar.jpg", { type: "image/jpeg" })),
        "image/jpeg", 0.92,
      ),
    );
  }

  async function confirmCrop() {
    if (!cropSrc || !croppedAreaPixels) return;
    const croppedFile = await getCroppedImg(cropSrc, croppedAreaPixels);
    if (croppedFile.size > 1 * 1024 * 1024) {
      setSaveMsg("裁切後圖片仍超過 1MB，請選擇更小的原圖");
      setCropSrc(null);
      return;
    }
    setAvatarFile(croppedFile);
    setAvatarPreview(URL.createObjectURL(croppedFile));
    setCropSrc(null);
    setSaveMsg("");
  }

  function triggerGoogleLogin() {
    setBindError("");
    setBindMsg("");
    const btn = googleBtnRef.current?.querySelector<HTMLElement>('[role="button"],button,div[tabindex]');
    if (btn) {
      btn.click();
      return;
    }
    ;(window as Window & { google?: { accounts?: { id?: { prompt?: () => void } } } })
      .google?.accounts?.id?.prompt?.();
  }

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
    if (file) {
      if (!file.type.startsWith("image/")) {
        setSaveMsg("請上傳圖片檔案（JPG、PNG、WebP 等）");
        return;
      }
      // Open cropper — size check is done after cropping
      setSaveMsg("");
      setCropSrc(URL.createObjectURL(file));
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      return;
    }
    setSaveMsg("");
    setAvatarFile(null);
    setAvatarPreview(null);
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
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.showHostedEvents ? "bg-brand" : "bg-gray-200"
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.showHostedEvents ? "translate-x-6" : "translate-x-1"
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

            <div className="pt-4 border-t border-gray-100">
              <label className="block text-xs text-gray-500 mb-2">社群帳號綁定</label>
              <div className="flex gap-3">
                {user?.has_google ? (
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 px-3 py-1.5 border border-gray-200 rounded-md bg-gray-50">
                    <GoogleIcon className="w-4 h-4" />
                    已綁定 Google
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={triggerGoogleLogin}
                    className="flex items-center gap-1.5 text-sm text-[#3c4043] px-3 py-1.5 border border-[#dadce0] rounded-md bg-white hover:bg-[#f8f9fa] active:bg-[#f1f3f4] transition-colors"
                  >
                    <GoogleIcon className="w-4 h-4" />
                    綁定 Google
                  </button>
                )}
                {user?.has_line ? (
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 px-3 py-1.5 border border-gray-200 rounded-md bg-gray-50">
                    <LineIcon className="w-4 h-4" />
                    已綁定 LINE
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => { window.location.href = buildLineLoginUrl(); }}
                    className="flex items-center gap-1.5 text-sm text-white px-3 py-1.5 border border-transparent rounded-md bg-[#06C755] hover:bg-[#05B34C] active:bg-[#049B42] transition-colors"
                  >
                    <LineIcon className="w-4 h-4" />
                    綁定 LINE
                  </button>
                )}
              </div>
              {bindMsg && <p className="text-xs text-green-600 mt-2">{bindMsg}</p>}
              {bindError && <p className="text-xs text-red-500 mt-2">{bindError}</p>}
            </div>

            {/* Hidden GoogleLogin button */}
            <div
              ref={googleBtnRef}
              style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '400px' }}
              aria-hidden="true"
            >
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  const idToken = credentialResponse.credential;
                  if (!idToken) { setBindError("Google 授權失敗"); return; }
                  try {
                    const res = await ssoGoogle(idToken);
                    if ('token' in res && res.token && res.user) {
                      localStorage.setItem('larpup_token', res.token);
                      login(res.token, res.user);
                      setBindMsg("成功綁定 Google 帳號！");
                    }
                  } catch (err) {
                    setBindError(err instanceof Error ? err.message : "綁定失敗");
                  }
                }}
                onError={() => {
                  setBindError("Google 登入發生錯誤");
                }}
                useOneTap={false}
              />
            </div>

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
                <div className="flex gap-2 mt-2">
                  {user?.has_google && <GoogleIcon className="w-5 h-5 opacity-70" />}
                  {user?.has_line && <LineIcon className="w-5 h-5 text-[#06C755] opacity-80" />}
                </div>
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

      {/* ── Logout ── */}
      <div className="mt-6 mb-2 sm:hidden text-center">
        <button
          onClick={handleLogout}
          className="text-xs text-gray-400 hover:text-gray-500 transition-colors"
        >
          登出
        </button>
      </div>

      {/* ── Crop Modal ──────────────────────────────────────────────────────── */}
      {cropSrc && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/90">
          <div className="flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-sm">
            <span className="text-white font-medium">裁切頭貼</span>
            <button onClick={() => setCropSrc(null)} className="text-gray-400 hover:text-white text-sm">
              取消
            </button>
          </div>
          <div className="relative flex-1">
            <Cropper
              image={cropSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="px-6 py-3 bg-black/60 backdrop-blur-sm">
            <input
              type="range" min={1} max={3} step={0.05} value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-white"
            />
            <p className="text-xs text-gray-400 text-center mt-1">捏合或拖曳滑桿縮放</p>
          </div>
          <div className="px-4 py-3 bg-black/60 backdrop-blur-sm">
            <button
              onClick={confirmCrop}
              className="w-full py-2.5 rounded-lg bg-brand text-white font-medium hover:bg-brand-hover transition-colors"
            >
              確認裁切
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
