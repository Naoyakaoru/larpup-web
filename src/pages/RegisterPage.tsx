import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import * as authApi from "../api/auth";

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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Pre-fill SSO data from sessionStorage
  useEffect(() => {
    if (!isSso) return;
    const token    = sessionStorage.getItem("sso_temp_token") ?? "";
    const email    = sessionStorage.getItem("sso_email") ?? "";
    const nickname = sessionStorage.getItem("sso_nickname") ?? "";
    if (!token) {
      navigate("/login");
      return;
    }
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
          form.email,
          form.password,
          form.passwordConfirmation,
          form.nickname,
          form.gender,
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

  return (
    <div className="max-w-sm mx-auto mt-16">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {isSso ? "完成帳號設定" : "註冊"}
      </h1>
      {isSso && (
        <p className="text-sm text-gray-500 mb-6">
          請補充以下資訊以完成帳號建立
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        {/* Nickname */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            暱稱
          </label>
          <input
            type="text"
            value={form.nickname}
            onChange={set("nickname")}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            性別
          </label>
          <select
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                密碼
              </label>
              <input
                type="password"
                value={form.password}
                onChange={set("password")}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                確認密碼
              </label>
              <input
                type="password"
                value={form.passwordConfirmation}
                onChange={set("passwordConfirmation")}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          </>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

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
