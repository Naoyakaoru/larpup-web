import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import RegisterPage from "../pages/RegisterPage";

// ── Mock @react-oauth/google ───────────────────────────────────────────────
const mockGoogleLoginSuccess = vi.fn();
const mockGoogleLoginError   = vi.fn();

vi.mock("@react-oauth/google", () => ({
  GoogleLogin: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (res: { credential: string }) => void;
    onError: () => void;
  }) => {
    mockGoogleLoginSuccess.mockImplementation(onSuccess);
    mockGoogleLoginError.mockImplementation(onError);
    return (
      <button data-testid="google-register-btn" type="button">
        使用 Google 帳戶註冊
      </button>
    );
  },
}));

// ── Mock ThemeContext ──────────────────────────────────────────────────────
vi.mock("../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDark: false }),
}));

// ── Mock auth API ──────────────────────────────────────────────────────────
vi.mock("../api/auth", () => ({
  register:    vi.fn(),
  ssoGoogle:   vi.fn(),
  ssoRegister: vi.fn(),
}));

import * as authApi from "../api/auth";
const mockRegister    = vi.mocked(authApi.register);
const mockSsoGoogle   = vi.mocked(authApi.ssoGoogle);
const mockSsoRegister = vi.mocked(authApi.ssoRegister);

// ── Mock AuthContext ───────────────────────────────────────────────────────
const mockAuthLogin = vi.fn();
vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({ login: mockAuthLogin, user: null, token: null }),
}));

// ── Mock react-router-dom navigate ────────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

// ── Helpers ───────────────────────────────────────────────────────────────
function renderPage(search = "") {
  return render(
    <MemoryRouter initialEntries={[`/register${search}`]}>
      <RegisterPage />
    </MemoryRouter>,
  );
}

const MOCK_USER = {
  id: 1, handle: "u000001", email: "new@example.com",
  nickname: "NewUser", gender: "female" as const,
  avatar_url: null, is_admin: false, show_hosted_events: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

// ── Normal registration ────────────────────────────────────────────────────

describe("RegisterPage – normal mode", () => {
  it("renders all form fields and SSO buttons", () => {
    renderPage();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^暱稱/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^密碼/)).toBeInTheDocument();
    expect(screen.getByLabelText(/確認密碼/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /LINE/ })).toBeInTheDocument();
    expect(screen.getByTestId("google-register-btn")).toBeInTheDocument();
  });

  it("submits and navigates to / on success", async () => {
    mockRegister.mockResolvedValueOnce({ token: "jwt", user: MOCK_USER });

    renderPage();
    await userEvent.type(screen.getByLabelText(/Email/), "new@example.com");
    await userEvent.type(screen.getByLabelText(/^暱稱/), "NewUser");
    await userEvent.selectOptions(screen.getByLabelText(/性別/), "female");
    await userEvent.type(screen.getByLabelText(/^密碼/), "password123");
    await userEvent.type(screen.getByLabelText(/確認密碼/), "password123");
    await userEvent.click(screen.getByRole("button", { name: "建立帳號" }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/"));
    expect(mockAuthLogin).toHaveBeenCalledWith("jwt", expect.objectContaining({ email: "new@example.com" }));
  });

  it("shows error on registration failure", async () => {
    mockRegister.mockRejectedValueOnce(new Error("Email 已被使用"));

    renderPage();
    await userEvent.type(screen.getByLabelText(/Email/), "taken@example.com");
    await userEvent.type(screen.getByLabelText(/^暱稱/), "User");
    await userEvent.selectOptions(screen.getByLabelText(/性別/), "male");
    await userEvent.type(screen.getByLabelText(/^密碼/), "pass1234");
    await userEvent.type(screen.getByLabelText(/確認密碼/), "pass1234");
    await userEvent.click(screen.getByRole("button", { name: "建立帳號" }));

    await waitFor(() =>
      expect(screen.getByText("Email 已被使用")).toBeInTheDocument(),
    );
  });
});

// ── SSO buttons on normal register page ───────────────────────────────────

describe("RegisterPage – Google SSO button (normal mode)", () => {
  it("navigates to / when Google SSO returns existing user (200)", async () => {
    mockSsoGoogle.mockResolvedValueOnce({ token: "g-jwt", user: MOCK_USER });

    renderPage();
    await mockGoogleLoginSuccess({ credential: "fake-id-token" });

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/"));
    expect(mockSsoGoogle).toHaveBeenCalledWith("fake-id-token");
  });

  it("redirects to /register?sso=1 for new Google user (202)", async () => {
    mockSsoGoogle.mockResolvedValueOnce({
      temp_token: "temp-tok",
      email: "new@g.com",
      nickname: "GUser",
    });

    renderPage();
    await mockGoogleLoginSuccess({ credential: "fake-id-token" });

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/register?sso=1"),
    );
    expect(sessionStorage.getItem("sso_temp_token")).toBe("temp-tok");
  });

  it("shows error when Google SSO fails", async () => {
    mockSsoGoogle.mockRejectedValueOnce(new Error("Google 登入失敗"));

    renderPage();
    await mockGoogleLoginSuccess({ credential: "bad-token" });

    await waitFor(() =>
      expect(screen.getByText("Google 登入失敗")).toBeInTheDocument(),
    );
  });
});

// ── SSO mode (gender fill-in) ──────────────────────────────────────────────

describe("RegisterPage – SSO mode (?sso=1)", () => {
  beforeEach(() => {
    sessionStorage.setItem("sso_temp_token", "temp-tok-abc");
    sessionStorage.setItem("sso_email", "sso@example.com");
    sessionStorage.setItem("sso_nickname", "SsoUser");
  });

  it("pre-fills email and nickname, hides password fields", () => {
    renderPage("?sso=1");

    expect(screen.getByDisplayValue("sso@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("SsoUser")).toBeInTheDocument();
    expect(screen.queryByLabelText(/^密碼/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/確認密碼/)).not.toBeInTheDocument();
    // SSO buttons should not appear in SSO mode
    expect(screen.queryByTestId("google-register-btn")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /LINE/ })).not.toBeInTheDocument();
  });

  it("submits and navigates to / on success", async () => {
    mockSsoRegister.mockResolvedValueOnce({ token: "sso-jwt", user: MOCK_USER });

    renderPage("?sso=1");
    await userEvent.selectOptions(screen.getByLabelText(/性別/), "female");
    await userEvent.click(screen.getByRole("button", { name: "完成建立帳號" }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/"));
    // ssoRegister signature: (tempToken, gender, nickname)
    expect(mockSsoRegister).toHaveBeenCalledWith(
      "temp-tok-abc",
      "female",
      "SsoUser",
    );
  });

  it("shows error when ssoRegister fails", async () => {
    mockSsoRegister.mockRejectedValueOnce(new Error("Token 已過期"));

    renderPage("?sso=1");
    await userEvent.selectOptions(screen.getByLabelText(/性別/), "male");
    await userEvent.click(screen.getByRole("button", { name: "完成建立帳號" }));

    await waitFor(() =>
      expect(screen.getByText("Token 已過期")).toBeInTheDocument(),
    );
  });
});
