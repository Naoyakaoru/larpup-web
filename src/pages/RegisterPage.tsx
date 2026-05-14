import { useRef, useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { GoogleLogin } from "@react-oauth/google";
import * as authApi from "../api/auth";
import { recordConsent } from "../api/consents";
import type { AuthResponse, SsoPendingResponse } from "../types";

// ── Shared SSO button (icon + text both centred) ────────────────────────────
function SsoButton({
  id,
  icon,
  label,
  onClick,
  disabled,
  className,
}: {
  id?: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className: string;
}) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{ fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}
      className={`w-full flex items-center justify-center h-[40px] rounded-[4px] text-[14px] font-medium tracking-[0.25px] disabled:opacity-50 transition-colors overflow-hidden ${className}`}
    >
      {/* Inner wrapper — 對應 Google 的 nsm7Bb div，左右各 13px padding */}
      <div className="flex items-center gap-2 flex-1 px-[13px]">
        {/* Icon 置左，18×18px */}
        <div className="w-[18px] h-[18px] flex items-center justify-center shrink-0">
          {icon}
        </div>
        {/* 文字佔滿剩餘空間，在剩餘寬度內置中 */}
        <span className="flex-1 text-center leading-none">{label}</span>
      </div>
    </button>
  );
}

function LineIcon() {
  return (
    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 10.06C22 5.5 17.52 1.82 12 1.82S2 5.5 2 10.06c0 4.1 3.64 7.53 8.56 8.18.33.07.78.22.9.5.1.26.07.66.03.92l-.14.86c-.04.26-.2 1.02.9.55 1.1-.46 5.9-3.48 8.05-5.96C21.27 13.31 22 11.76 22 10.06z"/>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function ScaleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="M7 21h10" />
      <path d="M12 3v18" />
      <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
    </svg>
  );
}

const LINE_CHANNEL_ID   = import.meta.env.VITE_LINE_CHANNEL_ID as string;
const LINE_REDIRECT_URI = import.meta.env.VITE_LINE_REDIRECT_URI as string;

function buildLineLoginUrl(): string {
  const state = crypto.randomUUID();
  sessionStorage.setItem("line_oauth_state", state);
  const params = new URLSearchParams({
    response_type: "code",
    client_id: LINE_CHANNEL_ID,
    redirect_uri: LINE_REDIRECT_URI,
    state,
    scope: "profile openid email",
  });
  return `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
}

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const isSso = searchParams.get("sso") === "1";

  const [form, setForm] = useState({
    email: "",
    password: "",
    passwordConfirmation: "",
    nickname: "",
    gender: "",
  });
  const [tempToken, setTempToken]       = useState("");
  const [consentChecked, setConsent]    = useState(false);
  const [consentSource, setConsentSrc]  = useState<string>("web_signup");
  const [showTerms, setShowTerms]       = useState(false);
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);
  const { login }                       = useAuth();
  const { isDark }                      = useTheme();
  const navigate                        = useNavigate();
  const googleBtnRef                    = useRef<HTMLDivElement>(null);

  // Helper: fire consent records after a token is available.
  // login() already stored the token in localStorage, so recordConsent() will pick it up automatically.
  async function recordRegistrationConsents(_token: string, source: string) {
    const version = "2026-05";
    await Promise.allSettled([
      recordConsent({ consent_type: "privacy_policy",   consent_version: version, accepted: true, source }),
      recordConsent({ consent_type: "terms_of_service", consent_version: version, accepted: true, source }),
    ]);
  }

  // Pre-fill SSO data from sessionStorage
  useEffect(() => {
    if (!isSso) return;
    const token    = sessionStorage.getItem("sso_temp_token") ?? "";
    const email    = sessionStorage.getItem("sso_email") ?? "";
    const nickname = sessionStorage.getItem("sso_nickname") ?? "";
    const source   = sessionStorage.getItem("sso_source") ?? "web_signup";
    if (!token) { navigate("/login"); return; }
    setTempToken(token);
    setConsentSrc(source);
    setForm(f => ({ ...f, email, nickname }));
  }, [isSso, navigate]);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!consentChecked) {
      setError("請先同意隱私政策與服務條款");
      return;
    }
    setError("");
    setLoading(true);
    try {
      if (isSso) {
        const res = await authApi.ssoRegister(tempToken, form.gender, form.nickname);
        sessionStorage.removeItem("sso_temp_token");
        sessionStorage.removeItem("sso_email");
        sessionStorage.removeItem("sso_nickname");
        sessionStorage.removeItem("sso_source");
        login(res.token, res.user);
        await recordRegistrationConsents(res.token, consentSource);
      } else {
        const res = await authApi.register(
          form.email, form.password, form.passwordConfirmation, form.nickname, form.gender,
        );
        login(res.token, res.user);
        await recordRegistrationConsents(res.token, "web_signup");
      }
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "註冊失敗");
    } finally {
      setLoading(false);
    }
  }

  function handleSsoResponse(res: AuthResponse | SsoPendingResponse, source: string) {
    if ("token" in res) {
      // Existing SSO user logging in — no new consent needed
      login(res.token, res.user);
      navigate("/");
    } else {
      // New SSO user — needs to complete profile; remember source for consent
      sessionStorage.setItem("sso_temp_token", res.temp_token);
      sessionStorage.setItem("sso_email", res.email);
      sessionStorage.setItem("sso_nickname", res.nickname);
      sessionStorage.setItem("sso_source", source);
      navigate("/register?sso=1");
    }
  }

  return (
    <div className="w-[300px] mx-auto mt-16">
      <h1 className={`text-2xl font-bold text-gray-900 ${isSso ? "mb-2" : "mb-6"}`}>
        {isSso ? "完成帳號設定" : "註冊"}
      </h1>
      {isSso && (
        <p className="text-sm text-gray-500 mb-6">
          請補充以下資訊以完成帳號建立
        </p>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md mb-5 text-balance text-center leading-relaxed">
          {error}
        </div>
      )}

      {/* ── SSO buttons — only in normal register mode, shown at TOP ─── */}
      {!isSso && (
        <>
          <div className="space-y-3 mb-5">
            {/* LINE */}
            <SsoButton
              id="line-register-btn"
              icon={<LineIcon />}
              label="使用 LINE 帳戶註冊"
              onClick={() => { window.location.href = buildLineLoginUrl(); }}
              disabled={loading}
              className="bg-[#06C755] text-white hover:bg-[#05B34C] active:bg-[#049B42] hover:shadow-md active:shadow-sm transition-all duration-200"
            />

            {/* Google 官方按鈕 */}
            <div className="flex justify-center w-full [&>div]:w-full">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  const idToken = credentialResponse.credential;
                  if (!idToken) { setError("Google 登入失敗"); return; }
                  setLoading(true); setError("");
                  try {
                    const res: AuthResponse | SsoPendingResponse = await authApi.ssoGoogle(idToken);
                    handleSsoResponse(res, "oauth_google");
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Google 登入失敗");
                  } finally { setLoading(false); }
                }}
                onError={() => setError("Google 登入取消或失敗")}
                text="signup_with"
                theme="outline"
                size="large"
                width="300"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs text-gray-500">
              <span className="bg-gray-50 px-2">或使用 Email 建立</span>
            </div>
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nickname */}
        <div>
          <label htmlFor="reg-nickname" className="block text-sm font-medium text-gray-700 mb-1">
            暱稱
          </label>
          <input
            id="reg-nickname"
            type="text"
            value={form.nickname}
            onChange={set("nickname")}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        {/* Gender */}
        <div>
          <label htmlFor="reg-gender" className="block text-sm font-medium text-gray-700 mb-1">
            性別
          </label>
          <select
            id="reg-gender"
            value={form.gender}
            onChange={set("gender")}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="">請選擇</option>
            <option value="male">男</option>
            <option value="female">女</option>
          </select>
        </div>

        {/* Email — readonly in SSO mode */}
        <div>
          <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="reg-email"
            type="email"
            value={form.email}
            onChange={set("email")}
            required
            readOnly={isSso}
            className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand ${isSso ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}`}
          />
        </div>

        {/* Password fields — hidden in SSO mode */}
        {!isSso && (
          <>
            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1">
                密碼
              </label>
              <input
                id="reg-password"
                type="password"
                value={form.password}
                onChange={set("password")}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label htmlFor="reg-password-confirm" className="block text-sm font-medium text-gray-700 mb-1">
                確認密碼
              </label>
              <input
                id="reg-password-confirm"
                type="password"
                value={form.passwordConfirmation}
                onChange={set("passwordConfirmation")}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          </>
        )}

        {/* Consent accordion + checkbox */}
        <div className="rounded-lg border border-gray-200 overflow-hidden bg-surface shadow-sm">
          {/* Header: toggle button */}
          <button
            type="button"
            id="reg-terms-toggle"
            onClick={() => setShowTerms(v => !v)}
            className="w-full flex items-center justify-between px-3.5 py-3 hover:bg-surface-2 transition-colors text-left"
          >
            <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <DocumentIcon className="w-4 h-4 text-brand" /> 閱讀隱私政策與服務條款
            </span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${showTerms ? "rotate-180" : ""}`}
              viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
            >
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Expandable content */}
          {showTerms && (
            <div className="px-4 py-4 text-xs text-gray-600 leading-relaxed space-y-5 border-t border-gray-100 max-h-64 overflow-y-auto bg-surface-2">
              <section>
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                  <ShieldCheckIcon className="w-4 h-4 text-brand" /> 隱私政策摘要
                </h3>
                <ul className="space-y-1.5 list-disc list-inside text-gray-500 marker:text-gray-400">
                  <li>我們蒐集您的 Email、暱稱及性別，用於帳號管理與服務提供。</li>
                  <li>您的個人資料不會在未經同意的情況下出售或分享給第三方。</li>
                  <li>我們使用 Cookie 改善使用體驗，您可隨時在瀏覽器設定中關閉。</li>
                  <li>您有權要求查閱、更正或刪除您的個人資料，請聯繫客服。</li>
                  <li>資料存放於具備安全措施的伺服器，並依法規保存必要記錄。</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                  <ScaleIcon className="w-4 h-4 text-brand" /> 服務條款摘要
                </h3>
                <ul className="space-y-1.5 list-disc list-inside text-gray-500 marker:text-gray-400">
                  <li>Larpup 為桌上 LARP 活動媒合平台，帳號限個人使用，禁止冒用他人身分。</li>
                  <li>您對所上傳的內容擁有著作權；平台展示之劇本圖文素材版權皆歸原發行商所有。</li>
                  <li>禁止發布違法、騷擾或歧視性內容，違者將停權處理。</li>
                  <li>平台保留隨時修改功能與條款的權利，修改後將以公告或 Email 通知。</li>
                  <li>因不可抗力或第三方服務問題造成的損失，平台不負賠償責任。</li>
                </ul>
              </section>

              <div className="pt-2">
                <p className="text-gray-400 text-[11px] bg-surface p-2 rounded border border-gray-100 text-center">
                  完整版本請參閱{" "}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline font-medium">隱私政策</a>
                  {" "}與{" "}
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline font-medium">服務條款</a>。
                </p>
              </div>
            </div>
          )}

          {/* Checkbox row */}
          <label className="flex items-center gap-3 cursor-pointer select-none px-3.5 py-3 border-t border-gray-200 bg-surface hover:bg-surface-2 transition-colors">
            <input
              id="reg-consent"
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => { setConsent(e.target.checked); if (e.target.checked) setError(""); }}
              className="w-4 h-4 accent-brand rounded shrink-0 border-gray-300 focus:ring-brand"
            />
            <span className="text-sm font-medium text-gray-700">
              我已閱讀並同意上述條款
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || !consentChecked}
          className="w-full bg-brand text-white py-2 rounded-md text-sm font-medium hover:bg-brand-hover disabled:opacity-50"
        >
          {loading ? "處理中..." : isSso ? "完成建立帳號" : "建立帳號"}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-500 text-center">
        已有帳號？
        <Link to="/login" className="text-brand hover:underline">
          登入
        </Link>
      </p>
    </div>
  );
}
