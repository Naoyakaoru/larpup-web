import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import type { User } from "../types";

const TEST_USER: User = {
  id: 1,
  email: "test@example.com",
  nickname: "Tester",
  gender: "male",
  avatar_url: null,
  is_admin: false,
};

function AuthConsumer() {
  const { user, token, login, logout, isLoading } = useAuth();
  if (isLoading) return <div>loading</div>;
  return (
    <div>
      <div data-testid="token">{token ?? "none"}</div>
      <div data-testid="nickname">{user?.nickname ?? "none"}</div>
      <button onClick={() => login("tok-123", TEST_USER)}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe("AuthContext – initial state", () => {
  it("starts with no token and no user when localStorage is empty", async () => {
    renderWithProvider();
    expect(await screen.findByTestId("token")).toHaveTextContent("none");
    expect(screen.getByTestId("nickname")).toHaveTextContent("none");
  });

  it("restores token and user from localStorage on mount", async () => {
    localStorage.setItem("larpup_token", "saved-tok");
    localStorage.setItem("larpup_user", JSON.stringify(TEST_USER));

    renderWithProvider();

    expect(await screen.findByTestId("token")).toHaveTextContent("saved-tok");
    expect(screen.getByTestId("nickname")).toHaveTextContent("Tester");
  });
});

describe("AuthContext – login", () => {
  it("sets token and user in state after login", async () => {
    renderWithProvider();
    const btn = await screen.findByRole("button", { name: "login" });

    act(() => btn.click());

    expect(screen.getByTestId("token")).toHaveTextContent("tok-123");
    expect(screen.getByTestId("nickname")).toHaveTextContent("Tester");
  });

  it("persists token to localStorage key larpup_token", async () => {
    renderWithProvider();
    const btn = await screen.findByRole("button", { name: "login" });

    act(() => btn.click());

    expect(localStorage.getItem("larpup_token")).toBe("tok-123");
  });

  it("persists user to localStorage key larpup_user", async () => {
    renderWithProvider();
    const btn = await screen.findByRole("button", { name: "login" });

    act(() => btn.click());

    expect(JSON.parse(localStorage.getItem("larpup_user")!)).toMatchObject({
      id: 1,
      nickname: "Tester",
    });
  });
});

describe("AuthContext – logout", () => {
  it("clears token and user from state after logout", async () => {
    localStorage.setItem("larpup_token", "saved-tok");
    localStorage.setItem("larpup_user", JSON.stringify(TEST_USER));

    renderWithProvider();
    const btn = await screen.findByRole("button", { name: "logout" });

    act(() => btn.click());

    expect(screen.getByTestId("token")).toHaveTextContent("none");
    expect(screen.getByTestId("nickname")).toHaveTextContent("none");
  });

  it("removes larpup_token and larpup_user from localStorage", async () => {
    localStorage.setItem("larpup_token", "saved-tok");
    localStorage.setItem("larpup_user", JSON.stringify(TEST_USER));

    renderWithProvider();
    const btn = await screen.findByRole("button", { name: "logout" });

    act(() => btn.click());

    expect(localStorage.getItem("larpup_token")).toBeNull();
    expect(localStorage.getItem("larpup_user")).toBeNull();
  });
});
