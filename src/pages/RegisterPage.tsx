import { useRef, useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { GoogleLogin } from "@react-oauth/google";
import * as authApi from "../api/auth";
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
      className={`w-full flex items-center justify-center gap-2.5 rounded-md py-2.5 text-sm font-medium disabled:opacity-50 transition-colors ${className}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function LineIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
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
  const [tempToken, setTempToken] = useState("");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const { login }                 = useAuth();
  const { isDark }                = useTheme();
  const navigate                  = useNavigate();
  const googleBtnRef              = useRef<HTMLDivElement>(null);

  // Pre-fill SSO data from sessionStorage
  useEffect(() => {
    if (!isSso) return;
    const token    = sessionStorage.getItem("sso_temp_token") ?? "";
    const email    = sessionStorage.getItem("sso_email") ?? "";
    const nickname = sessionStorage.getItem("sso_nickname") ?? "";
    if (!token) { navigate("/login"); return; }
    setTempToken(token);
    setForm(f => ({ ...f, email, nickname }));
  }, [isSso, navigate]);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSso) {
        const res = await authApi.ssoRegister(tempToken, form.gender, form.nickname);
        sessionStorage.removeItem("sso_temp_token");
        sessionStorage.removeItem("sso_email");
        sessionStorage.removeItem("sso_nickname");
        login(res.token, res.user);
      } else {
        const res = await authApi.register(
          form.email, form.password, form.passwordConfirmation, form.nickname, form.gender,
        );
        login(res.token, res.user);
      }
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "註冊失敗");
    } finally {
      setLoading(false);
    }
  }

  function handleSsoResponse(res: AuthResponse | SsoPendingResponse) {
    if ("token" in res) {
      login(res.token, res.user);
      navigate("/");
    } else {
      sessionStorage.setItem("sso_temp_token", res.temp_token);
      sessionStorage.setItem("sso_email", res.email);
      sessionStorage.setItem("sso_nickname", res.nickname);
      navigate("/register?sso=1");
    }
  }

  function triggerGoogleLogin() {
    const inner = googleBtnRef.current?.querySelector<HTMLElement>('[role="button"],button,div[tabindex]');
    inner?.click();
  }

  return (
    <div className="max-w-sm mx-auto mt-16">
      <h1 className={`text-2xl font-bold text-gray-900 ${isSso ? "mb-2" : "mb-6"}`}>
        {isSso ? "完成帳號設定" : "註冊"}
      </h1>
      {isSso && (
        <p className="text-sm text-gray-500 mb-6">
          請補充以下資訊以完成帳號建立
        </p>
      )}

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {/* ── SSO buttons — only in normal register mode, shown at TOP ─── */}
      {!isSso && (
        <>
          <div className="space-y-3 mb-5">
            {/* LINE */}
            <SsoButton
              id="line-register-btn"
              icon={<LineIcon />}
              label="使用 LINE 建立帳號"
              onClick={() => { window.location.href = buildLineLoginUrl(); }}
              disabled={loading}
              className="bg-[#06C755] text-white hover:bg-[#05B34C] active:bg-[#049B42] hover:shadow-md active:shadow-sm transition-all duration-200"
            />

            {/* Google — custom button triggers hidden <GoogleLogin> */}
            <SsoButton
              id="google-register-btn"
              icon={<GoogleIcon />}
              label="使用 Google 帳戶建立"
              onClick={triggerGoogleLogin}
              disabled={loading}
              className="bg-white border border-[#dadce0] text-[#3c4043] hover:bg-[#f8f9fa] active:bg-[#f1f3f4] hover:shadow-md active:shadow-sm transition-all duration-200"
            />
            {/* Hidden GoogleLogin — preserves id_token flow */}
            <div
              ref={googleBtnRef}
              className="absolute opacity-0 pointer-events-none h-0 overflow-hidden"
              aria-hidden="true"
              data-testid="google-login-hidden"
            >
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  const idToken = credentialResponse.credential;
                  if (!idToken) { setError("Google 登入失敗"); return; }
                  setLoading(true); setError("");
                  try {
                    const res: AuthResponse | SsoPendingResponse = await authApi.ssoGoogle(idToken);
                    handleSsoResponse(res);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Google 登入失敗");
                  } finally { setLoading(false); }
                }}
                onError={() => setError("Google 登入取消或失敗")}
                width={400}
                text="signup_with"
                locale="zh-TW"
                theme={isDark ? "filled_black" : "outline"}
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

        <button
          type="submit"
          disabled={loading}
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
