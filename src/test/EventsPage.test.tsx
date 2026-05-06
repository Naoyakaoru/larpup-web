import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import EventsPage from "../pages/EventsPage";
import type { Event } from "../types";

vi.mock("../api/events", () => ({
  getEvents: (filters: Record<string, string>) =>
    Promise.resolve(
      mockEventFilter
        ? mockEvents.filter(mockEventFilter(filters))
        : mockEvents,
    ),
}));

let mockEvents: Event[];
let mockEventFilter:
  | ((filters: Record<string, string>) => (e: Event) => boolean)
  | null;

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 1,
    script: {
      id: 5,
      title: "死亡列車",
      total_slots: 6,
      male_slots: 3,
      female_slots: 2,
      any_slots: 1,
      difficulty: "medium",
      difficulty_label: "進階",
      genres: ["推理"],
      duration: null,
      price: null,
      store: null,
      version_name: null,
    },
    host: { id: 10, handle: "host", nickname: "Host" },
    allow_cross_gender: false,
    offline_male: 0,
    offline_female: 0,
    scheduled_at: "2026-06-01T14:00:00Z",
    location: "台北",
    status: "recruiting",
    confirmed_count: 2,
    available_slots: 4,
    deleted_at: null,
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <EventsPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockEventFilter = null;
});

describe("EventsPage – rendering", () => {
  it("shows loading state initially", () => {
    mockEvents = [];
    renderPage();
    expect(screen.getByText("載入中...")).toBeInTheDocument();
  });

  it("shows empty state when no events", async () => {
    mockEvents = [];
    renderPage();
    expect(await screen.findByText("目前沒有活動")).toBeInTheDocument();
  });

  it("renders event title and host", async () => {
    mockEvents = [makeEvent()];
    renderPage();

    expect(await screen.findByText("死亡列車")).toBeInTheDocument();
    expect(screen.getByText("主辦：Host")).toBeInTheDocument();
  });

  it("renders confirmed count and total slots", async () => {
    mockEvents = [makeEvent({ confirmed_count: 3 })];
    renderPage();

    await screen.findByText("死亡列車");
    expect(screen.getByText("3 / 6")).toBeInTheDocument();
  });

  it("shows status badge", async () => {
    mockEvents = [makeEvent({ status: "recruiting" })];
    renderPage();

    await screen.findByText("死亡列車");
    expect(screen.getAllByText("招募中").length).toBeGreaterThan(0);
  });

  it("shows cross-gender badge when allow_cross_gender", async () => {
    mockEvents = [makeEvent({ allow_cross_gender: true })];
    renderPage();

    await screen.findByText("死亡列車");
    expect(screen.getByText("開放反串")).toBeInTheDocument();
  });

  it("shows compact store/version/duration info row", async () => {
    mockEvents = [
      makeEvent({
        script: {
          id: 5,
          title: "死亡列車",
          total_slots: 6,
          male_slots: 3,
          female_slots: 2,
          any_slots: 1,
          difficulty: "medium",
          difficulty_label: "進階",
          genres: ["推理"],
          duration: 3,
          price: null,
          store: { id: 1, name: "謎境劇本殺" },
          version_name: "標準版",
        },
      }),
    ];
    renderPage();

    await screen.findByText("死亡列車");
    expect(screen.getByText(/謎境劇本殺/)).toBeInTheDocument();
    expect(screen.getByText(/標準版/)).toBeInTheDocument();
    expect(screen.getByText(/3h/)).toBeInTheDocument();
  });

  it("renders multiple events", async () => {
    mockEvents = [
      makeEvent({ id: 1, script: { ...makeEvent().script, title: "劇本A" } }),
      makeEvent({ id: 2, script: { ...makeEvent().script, title: "劇本B" } }),
    ];
    renderPage();

    expect(await screen.findByText("劇本A")).toBeInTheDocument();
    expect(screen.getByText("劇本B")).toBeInTheDocument();
  });
});

describe("EventsPage – status filter", () => {
  it("renders filter buttons for all, recruiting, full", async () => {
    mockEvents = [];
    renderPage();

    await screen.findByText("目前沒有活動");
    expect(screen.getByRole("button", { name: "全部" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "招募中" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "已滿員" })).toBeInTheDocument();
  });

  it("highlights the active filter button", async () => {
    mockEvents = [];
    renderPage();

    await screen.findByText("目前沒有活動");
    const allButton = screen.getByRole("button", { name: "全部" });
    expect(allButton.className).toContain("bg-brand");
  });

  it("calls getEvents with status param when filter clicked", async () => {
    const user = userEvent.setup();
    mockEvents = [makeEvent({ status: "recruiting" })];
    renderPage();

    await screen.findByText("死亡列車");
    await user.click(screen.getByRole("button", { name: "招募中" }));

    expect(await screen.findByText("死亡列車")).toBeInTheDocument();
  });
});
