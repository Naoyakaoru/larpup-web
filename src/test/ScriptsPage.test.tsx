import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ScriptsPage from "../pages/ScriptsPage";
import type { Script } from "../types";

vi.mock("../api/scripts", () => ({
  getScripts: () => Promise.resolve(mockScripts),
}));

let mockScripts: Script[];

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

function renderPage() {
  return render(
    <MemoryRouter>
      <ScriptsPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ScriptsPage – slot format", () => {
  it('renders slots as "3男・2女・1不限" joined by "・"', async () => {
    mockScripts = [
      makeScript({
        male_slots: 3,
        female_slots: 2,
        any_slots: 1,
        total_slots: 6,
      }),
    ];
    renderPage();

    expect(await screen.findByText(/3男・2女・1不限/)).toBeInTheDocument();
  });

  it("omits zero-value slot types", async () => {
    mockScripts = [
      makeScript({
        male_slots: 4,
        female_slots: 2,
        any_slots: 0,
        total_slots: 6,
      }),
    ];
    renderPage();

    const slotText = await screen.findByText(/4男・2女/);
    expect(slotText).toBeInTheDocument();
    expect(slotText.textContent).not.toContain("不限");
  });

  it("shows total player count", async () => {
    mockScripts = [
      makeScript({
        male_slots: 3,
        female_slots: 2,
        any_slots: 1,
        total_slots: 6,
      }),
    ];
    renderPage();

    expect(await screen.findByText(/共 6 人/)).toBeInTheDocument();
  });

  it('renders "男 3" format nowhere – uses "3男" not "男 3"', async () => {
    mockScripts = [
      makeScript({
        male_slots: 3,
        female_slots: 2,
        any_slots: 1,
        total_slots: 6,
      }),
    ];
    renderPage();

    await screen.findByText(/3男/);
    expect(screen.queryByText(/男 3/)).not.toBeInTheDocument();
    expect(screen.queryByText(/女 2/)).not.toBeInTheDocument();
  });

  it("renders script title and difficulty label", async () => {
    mockScripts = [makeScript({ title: "死亡列車" })];
    renderPage();

    expect(await screen.findByText("死亡列車")).toBeInTheDocument();
    // "進階" appears in both the difficulty filter button and the script badge
    expect(screen.getAllByText("進階").length).toBeGreaterThan(0);
  });

  it("renders genre tags", async () => {
    mockScripts = [makeScript({ genres: [0, 2] })];
    renderPage();

    await screen.findByText("推理");
    expect(screen.getByText("恐怖")).toBeInTheDocument();
  });

  it("renders multiple scripts", async () => {
    mockScripts = [
      makeScript({
        id: 1,
        title: "劇本A",
        male_slots: 2,
        female_slots: 2,
        any_slots: 0,
        total_slots: 4,
      }),
      makeScript({
        id: 2,
        title: "劇本B",
        male_slots: 1,
        female_slots: 1,
        any_slots: 2,
        total_slots: 4,
      }),
    ];
    renderPage();

    expect(await screen.findByText("劇本A")).toBeInTheDocument();
    expect(screen.getByText("劇本B")).toBeInTheDocument();
    expect(screen.getByText(/2男・2女/)).toBeInTheDocument();
    expect(screen.getByText(/1男・1女・2不限/)).toBeInTheDocument();
  });
});
