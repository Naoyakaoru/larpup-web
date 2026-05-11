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
    // data-testid differs from the visible SsoButton's id so selectors don't collide.
    // onClick enables testing the triggerGoogleLogin() click-chain.
    return (
      <button
        data-testid="google-login-inner"
        type="button"
        onClick={() => onSuccess({ credential: "inner-click-credential" })}
      >
        Google OAuth (hidden)
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
  it("renders both the visible Google button and the hidden inner OAuth button", () => {
    renderPage();
    // Visible custom SsoButton
    expect(screen.getByRole("button", { name: "使用 Google 登入" })).toBeInTheDocument();
    // Hidden inner GoogleLogin shim
    expect(screen.getByTestId("google-login-inner")).toBeInTheDocument();
  });

  it("navigates to / when Google SSO returns existing user (200)", async () => {
    mockSsoGoogle.mockResolvedValueOnce({
      token: "google-jwt",
      user: { id: 2, handle: "gg", email: "g@g.com", nickname: "GG", gender: "female" as const, avatar_url: null, is_admin: false, show_hosted_events: false },
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

// ── Button click mechanism ─────────────────────────────────────────────────
// Tests that clicking the VISIBLE custom Google SsoButton actually triggers
// the hidden inner GoogleLogin button (triggerGoogleLogin) and ultimately
// calls ssoGoogle with the credential.

describe("LoginPage – Google button click mechanism", () => {
  it("clicking the visible 使用 Google 登入 button triggers the inner OAuth button and calls ssoGoogle", async () => {
    mockSsoGoogle.mockResolvedValueOnce({
      token: "chain-jwt",
      user: { id: 3, handle: "h3", email: "c@c.com", nickname: "C", gender: "male" as const, avatar_url: null, is_admin: false, show_hosted_events: false },
    });

    renderPage();

    // Click the VISIBLE SsoButton (not the hidden inner button)
    const visibleBtn = screen.getByRole("button", { name: "使用 Google 登入" });
    await userEvent.click(visibleBtn);

    // triggerGoogleLogin() should have found + clicked the inner button,
    // which fires onSuccess({ credential: "inner-click-credential" }) → ssoGoogle
    await waitFor(() =>
      expect(mockSsoGoogle).toHaveBeenCalledWith("inner-click-credential"),
    );
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/"));
  });

  it("handles credential missing from inner button click gracefully", async () => {
    renderPage();
    await act(async () => {
      mockGoogleLoginSuccess({ credential: undefined as unknown as string });
    });

    await waitFor(() =>
      expect(screen.getByText("Google 登入失敗，請再試一次")).toBeInTheDocument(),
    );
    expect(mockSsoGoogle).not.toHaveBeenCalled();
  });
});
