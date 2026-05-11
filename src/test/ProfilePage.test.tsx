import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ProfilePage from "../pages/ProfilePage";
import * as usersApi from "../api/users";
import * as authApi from "../api/auth";

// ── Mock AuthContext ───────────────────────────────────────────────────────
const mockUser = {
  id: 1,
  email: "test@example.com",
  handle: "testuser",
  nickname: "Test User",
  gender: "male" as const,
  is_admin: false,
  avatar_url: null,
  show_hosted_events: false,
  google_uid: null,
  line_uid: null,
};

const mockAuthLogin = vi.fn();
vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
    login: mockAuthLogin,
  }),
}));

// ── Mock ThemeContext ──────────────────────────────────────────────────────
vi.mock("../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDark: false }),
}));

// ── Mock GoogleLogin ───────────────────────────────────────────────────────
const mockGoogleLoginSuccess = vi.fn();
const mockGoogleLoginError = vi.fn();

vi.mock("@react-oauth/google", () => ({
  GoogleLogin: ({ onSuccess, onError }: { onSuccess: (r: { credential?: string }) => void; onError: () => void }) => {
    mockGoogleLoginSuccess.mockImplementation(onSuccess);
    mockGoogleLoginError.mockImplementation(onError);
    return <button data-testid="google-login-btn">使用 Google 綁定</button>;
  },
}));

// ── Mock APIs ──────────────────────────────────────────────────────────────
vi.mock("../api/users", () => ({
  getMyEvents: vi.fn(),
  getMyStores: vi.fn(),
  updateMe: vi.fn(),
}));

vi.mock("../api/auth", () => ({
  ssoGoogle: vi.fn(),
}));

const mockGetMyEvents = vi.mocked(usersApi.getMyEvents);
const mockGetMyStores = vi.mocked(usersApi.getMyStores);
const mockSsoGoogle = vi.mocked(authApi.ssoGoogle);

// ── Test Setup ─────────────────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
  mockGetMyEvents.mockResolvedValue({ hosted: [], joined: [] });
  mockGetMyStores.mockResolvedValue([]);
  // Reset window alert mock
  window.alert = vi.fn();
});

function renderPage() {
  return render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe("ProfilePage - SSO Binding", () => {
  it("shows binding buttons when not bound", async () => {
    await act(async () => {
      renderPage();
    });

    // Enter edit mode
    await userEvent.click(screen.getByText("編輯"));

    expect(screen.getByText("綁定 Google")).toBeInTheDocument();
    expect(screen.getByText("綁定 LINE")).toBeInTheDocument();
  });

  it("handles successful Google binding", async () => {
    const updatedUser = { ...mockUser, google_uid: "google-123" };
    mockSsoGoogle.mockResolvedValueOnce({
      token: "new-jwt-token",
      user: updatedUser,
    });

    await act(async () => {
      renderPage();
    });

    // Enter edit mode
    await userEvent.click(screen.getByText("編輯"));

    // Simulate Google SSO success
    await act(async () => {
      mockGoogleLoginSuccess({ credential: "fake-google-token" });
    });

    expect(mockSsoGoogle).toHaveBeenCalledWith("fake-google-token");
    await waitFor(() => {
      expect(mockAuthLogin).toHaveBeenCalledWith("new-jwt-token", updatedUser);
      expect(screen.getByText("成功綁定 Google 帳號！")).toBeInTheDocument();
    });
  });

  it("handles Google binding conflict", async () => {
    mockSsoGoogle.mockRejectedValueOnce(new Error("此社群帳號已經被其他會員綁定過了"));

    await act(async () => {
      renderPage();
    });

    // Enter edit mode
    await userEvent.click(screen.getByText("編輯"));

    await act(async () => {
      mockGoogleLoginSuccess({ credential: "fake-google-token" });
    });

    await waitFor(() => {
      expect(screen.getByText("此社群帳號已經被其他會員綁定過了")).toBeInTheDocument();
      expect(mockAuthLogin).not.toHaveBeenCalled();
    });
  });
});
