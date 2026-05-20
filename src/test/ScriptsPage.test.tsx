import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ScriptsPage from "../pages/ScriptsPage";
import type { Script } from "../types";

const mockGetScripts = vi.fn();

vi.mock("../api/scripts", () => ({
  getScripts: (...args: Parameters<typeof mockGetScripts>) =>
    mockGetScripts(...args),
}));

vi.mock("../api/stores", () => ({
  getStores: () => Promise.resolve([]),
}));

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({ user: null, token: null, login: vi.fn(), logout: vi.fn(), isLoading: false }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function makeScript(overrides: Partial<Script> = {}): Script {
  return {
    id: 1,
    title: "月夜謀殺案",
    genres: [0],
    difficulty: "medium",
    male_slots: 3,
    female_slots: 2,
    any_slots: 1,
    total_slots: 6,
    description: "一個黑暗的夜晚…",
    status: "approved",
    duration: null,
    publisher: null,
    cover_image_url: null,
    ...overrides,
  };
}

function renderPage(initialUrl = "/") {
  return render(
    <MemoryRouter initialEntries={[initialUrl]}>
      <ScriptsPage />
    </MemoryRouter>
  );
}

// 等 loading 結束的 helper
async function waitForLoaded() {
  await waitFor(() =>
    expect(screen.queryByText("載入中...")).not.toBeInTheDocument()
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetScripts.mockResolvedValue({ scripts: [], has_more: false });
});

// ─── rendering ────────────────────────────────────────────────────────────────

describe("ScriptsPage – rendering", () => {
  it("shows loading state initially", () => {
    renderPage();
    expect(screen.getByText("載入中...")).toBeInTheDocument();
  });

  it("renders script cards after loading", async () => {
    mockGetScripts.mockResolvedValue({
      scripts: [makeScript({ title: "謎月列車", total_slots: 5 })],
      has_more: false,
    });
    renderPage();

    expect(await screen.findByText("謎月列車")).toBeInTheDocument();
    expect(screen.getByText(/5人/)).toBeInTheDocument();
  });

  it("shows empty state when no scripts match", async () => {
    renderPage();
    expect(
      await screen.findByText("沒有符合條件的劇本")
    ).toBeInTheDocument();
  });

  it("shows error state when API fails", async () => {
    mockGetScripts.mockRejectedValue(new Error("Network error"));
    renderPage();
    expect(
      await screen.findByText("載入失敗，請重新整理")
    ).toBeInTheDocument();
  });
});

// ─── difficulty filter ─────────────────────────────────────────────────────────

describe("ScriptsPage – difficulty filter", () => {
  it("renders all difficulty pills", async () => {
    renderPage();
    await waitForLoaded();

    expect(screen.getByRole("button", { name: "全部" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "入門" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重度" })).toBeInTheDocument();
  });

  it("calls getScripts with difficulty when pill clicked", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitForLoaded();

    await user.click(screen.getByRole("button", { name: "入門" }));

    await waitFor(() =>
      expect(mockGetScripts).toHaveBeenCalledWith(
        expect.objectContaining({ difficulty: "easy" })
      )
    );
  });

  it("clears difficulty when 全部 clicked", async () => {
    const user = userEvent.setup();
    renderPage("/?difficulty=hard");
    await waitForLoaded();

    await user.click(screen.getByRole("button", { name: "全部" }));

    await waitFor(() => {
      const lastCall = mockGetScripts.mock.calls.at(-1)![0];
      expect(lastCall.difficulty).toBeUndefined();
    });
  });

  it("reads difficulty from URL on mount", async () => {
    renderPage("/?difficulty=hard");
    await waitForLoaded();

    expect(mockGetScripts).toHaveBeenCalledWith(
      expect.objectContaining({ difficulty: "hard" })
    );
  });

  it("highlights the active difficulty pill", async () => {
    renderPage("/?difficulty=easy");
    await waitForLoaded();

    const pill = screen.getByRole("button", { name: "入門" });
    expect(pill.className).toContain("bg-brand");
  });
});

// ─── genre quick filter ────────────────────────────────────────────────────────

describe("ScriptsPage – genre quick filter", () => {
  it("renders quick genre pills", async () => {
    renderPage();
    await waitForLoaded();

    expect(screen.getByRole("button", { name: "情感" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "推理" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "演繹" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "機制" })).toBeInTheDocument();
  });

  it("calls getScripts with genre when pill clicked", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitForLoaded();

    await user.click(screen.getByRole("button", { name: "情感" }));

    await waitFor(() =>
      expect(mockGetScripts).toHaveBeenCalledWith(
        expect.objectContaining({ genres: [3] }) // 情感 = 3
      )
    );
  });

  it("supports multi-select genres", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitForLoaded();

    await user.click(screen.getByRole("button", { name: "情感" }));
    await user.click(screen.getByRole("button", { name: "推理" }));

    await waitFor(() => {
      const lastCall = mockGetScripts.mock.calls.at(-1)![0];
      expect(lastCall.genres).toContain(3); // 情感
      expect(lastCall.genres).toContain(0); // 推理
    });
  });

  it("toggles genre off when clicked again", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitForLoaded();

    await user.click(screen.getByRole("button", { name: "情感" }));
    await user.click(screen.getByRole("button", { name: "情感" }));

    await waitFor(() => {
      const lastCall = mockGetScripts.mock.calls.at(-1)![0];
      expect(lastCall.genres).toBeUndefined();
    });
  });

  it("reads genres from URL on mount", async () => {
    renderPage("/?genres=3,0");
    await waitForLoaded();

    expect(mockGetScripts).toHaveBeenCalledWith(
      expect.objectContaining({ genres: [3, 0] })
    );
  });

  it("highlights active genre pills from URL", async () => {
    renderPage("/?genres=3");
    await waitForLoaded();

    const pill = screen.getByRole("button", { name: "情感" });
    expect(pill.className).toContain("bg-brand");
  });
});

// ─── filter drawer ─────────────────────────────────────────────────────────────

describe("ScriptsPage – filter drawer", () => {
  it("opens drawer when 篩選 clicked", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitForLoaded();

    await user.click(screen.getByRole("button", { name: /篩選/ }));

    expect(screen.getByRole("button", { name: "完成" })).toBeInTheDocument();
  });

  it("closes drawer when 完成 clicked", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitForLoaded();

    await user.click(screen.getByRole("button", { name: /篩選/ }));
    await user.click(screen.getByRole("button", { name: "完成" }));

    expect(screen.queryByRole("button", { name: "完成" })).not.toBeInTheDocument();
  });

  it("clears all filters when 清除 clicked", async () => {
    const user = userEvent.setup();
    renderPage("/?difficulty=easy&genres=3");
    await waitForLoaded();

    await user.click(screen.getByRole("button", { name: /篩選/ }));
    await user.click(screen.getByRole("button", { name: "清除" }));

    await waitFor(() => {
      const lastCall = mockGetScripts.mock.calls.at(-1)![0];
      expect(lastCall.difficulty).toBeUndefined();
      expect(lastCall.genres).toBeUndefined();
    });
  });

  it("shows active filter count on 篩選 button", async () => {
    renderPage("/?difficulty=easy&genres=3,0");
    await waitForLoaded();

    // difficulty=1 + genres=2 → 3
    expect(
      screen.getByRole("button", { name: "篩選 (3)" })
    ).toBeInTheDocument();
  });

  it("drawer shows all 17 genres", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitForLoaded();

    await user.click(screen.getByRole("button", { name: /篩選/ }));

    // spot-check a few genres not in the quick bar
    expect(screen.getByRole("button", { name: "恐怖" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "陣營" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "城限" })).toBeInTheDocument();
  });
});

// ─── tab navigation ────────────────────────────────────────────────────────────

describe("ScriptsPage – tab navigation", () => {
  it("renders 劇本 and 店家 tab buttons", () => {
    renderPage();
    expect(screen.getByRole("button", { name: "劇本" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "店家" })).toBeInTheDocument();
  });

  it("default tab shows scripts content", async () => {
    renderPage();
    expect(await screen.findByText("沒有符合條件的劇本")).toBeInTheDocument();
  });

  it("?tab=stores shows stores tab on load", async () => {
    renderPage("/?tab=stores");
    expect(await screen.findByText("目前沒有店家資料")).toBeInTheDocument();
  });

  it("switching to 店家 tab does not call getScripts again", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitForLoaded();

    const callsBefore = mockGetScripts.mock.calls.length;
    await user.click(screen.getByRole("button", { name: "店家" }));

    await screen.findByText("目前沒有店家資料");
    expect(mockGetScripts.mock.calls.length).toBe(callsBefore);
  });
});

// ─── search input ─────────────────────────────────────────────────────────────

describe("ScriptsPage – search input", () => {
  it("renders search placeholder and updates on text change", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitForLoaded();

    const input = screen.getByPlaceholderText("搜尋劇本名稱...");
    expect(input).toBeInTheDocument();

    await user.type(input, "謀殺");
    expect(input).toHaveValue("謀殺");

    await waitFor(() => {
      expect(mockGetScripts).toHaveBeenCalledWith(
        expect.objectContaining({ q: "謀殺" })
      );
    });
  });
});
