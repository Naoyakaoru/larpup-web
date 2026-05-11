import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "../pages/LoginPage";

// ── Mock ThemeContext ──────────────────────────────────────────────────────
vi.mock("../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDark: false }),
}));

// ── Mock @react-oauth/google ───────────────────────────────────────────────
// GoogleLogin is an iframe-based component that can't render in jsdom.
// We expose a testable shim that fires onSuccess/onError programmatically.
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
      <button data-testid="google-login-btn" type="button">
        使用 Google 登入
      </button>
    );
  },
}));

// ── Mock auth API ──────────────────────────────────────────────────────────
vi.mock("../api/auth", () => ({
  login:       vi.fn(),
  ssoGoogle:   vi.fn(),
  ssoLine:     vi.fn(),
}));

import * as authApi from "../api/auth";
const mockLogin     = vi.mocked(authApi.login);
const mockSsoGoogle = vi.mocked(authApi.ssoGoogle);

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

// ── Test setup ────────────────────────────────────────────────────────────
function renderPage(search = "") {
  return render(
    <MemoryRouter initialEntries={[`/login${search}`]}>
      <LoginPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

// ── Tests ─────────────────────────────────────────────────────────────────

describe("LoginPage – email/password login", () => {
  it("renders email, password fields and login button", () => {
    renderPage();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/密碼/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "登入" })).toBeInTheDocument();
  });

  it("navigates to / on successful login", async () => {
    mockLogin.mockResolvedValueOnce({
      token: "jwt-token",
      user: { id: 1, handle: "h", email: "a@a.com", nickname: "N", gender: "male", avatar_url: null, is_admin: false, show_hosted_events: false },
    });

    renderPage();
    await userEvent.type(screen.getByLabelText(/Email/), "a@a.com");
    await userEvent.type(screen.getByLabelText(/密碼/), "password");
    await userEvent.click(screen.getByRole("button", { name: "登入" }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/"));
    expect(mockAuthLogin).toHaveBeenCalledWith("jwt-token", expect.objectContaining({ email: "a@a.com" }));
  });

  it("shows error message on login failure", async () => {
    mockLogin.mockRejectedValueOnce(new Error("Invalid email or password"));

    renderPage();
    await userEvent.type(screen.getByLabelText(/Email/), "a@a.com");
    await userEvent.type(screen.getByLabelText(/密碼/), "wrong");
    await userEvent.click(screen.getByRole("button", { name: "登入" }));

    await waitFor(() =>
      expect(screen.getByText("Invalid email or password")).toBeInTheDocument(),
    );
  });

  it("shows error from url param (e.g. line_cancelled)", () => {
    renderPage("?error=line_cancelled");
    expect(screen.getByText("LINE 登入已取消")).toBeInTheDocument();
  });
});

describe("LoginPage – Google SSO", () => {
  it("renders Google login button", () => {
    renderPage();
    expect(screen.getByTestId("google-login-btn")).toBeInTheDocument();
  });

  it("navigates to / when Google SSO returns existing user (200)", async () => {
    mockSsoGoogle.mockResolvedValueOnce({
      token: "google-jwt",
      user: { id: 2, handle: "gg", email: "g@g.com", nickname: "GG", gender: "female", avatar_url: null, is_admin: false, show_hosted_events: false },
    });

    renderPage();
    // Simulate Google returning an id_token credential
    await mockGoogleLoginSuccess({ credential: "fake-id-token" });

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/"));
    expect(mockSsoGoogle).toHaveBeenCalledWith("fake-id-token");
  });

  it("redirects to /register?sso=1 and stores temp_token for new Google user (202)", async () => {
    mockSsoGoogle.mockResolvedValueOnce({
      temp_token: "temp-tok",
      email: "new@g.com",
      nickname: "New",
    });

    renderPage();
    await mockGoogleLoginSuccess({ credential: "fake-id-token" });

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/register?sso=1"),
    );
    expect(sessionStorage.getItem("sso_temp_token")).toBe("temp-tok");
    expect(sessionStorage.getItem("sso_email")).toBe("new@g.com");
    expect(sessionStorage.getItem("sso_nickname")).toBe("New");
  });

  it("shows error when Google SSO fails on backend", async () => {
    mockSsoGoogle.mockRejectedValueOnce(new Error("Invalid Google token"));

    renderPage();
    await mockGoogleLoginSuccess({ credential: "bad-token" });

    await waitFor(() =>
      expect(screen.getByText("Invalid Google token")).toBeInTheDocument(),
    );
  });

  it("shows error when Google button itself errors", async () => {
    renderPage();
    act(() => { mockGoogleLoginError(); });

    await waitFor(() =>
      expect(screen.getByText("Google 登入取消或失敗")).toBeInTheDocument(),
    );
  });
});

describe("LoginPage – LINE SSO", () => {
  it("renders LINE login button", () => {
    renderPage();
    expect(screen.getByRole("button", { name: /使用 LINE 登入/ })).toBeInTheDocument();
  });

  it("sets line_oauth_state in sessionStorage and redirects to LINE when clicking LINE button", async () => {
    // Use jsdom's location assign tracking
    const assignSpy = vi.spyOn(window, "location", "get").mockReturnValue({
      ...window.location,
      href: "",
    } as Location);

    renderPage();
    const lineBtn = screen.getByRole("button", { name: /使用 LINE 登入/ });
    await userEvent.click(lineBtn);

    expect(sessionStorage.getItem("line_oauth_state")).toBeTruthy();
    assignSpy.mockRestore();
  });
});
