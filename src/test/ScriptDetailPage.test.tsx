import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ScriptDetailPage from "../pages/ScriptDetailPage";
import type { Script, Event } from "../types";

const mockGetScript = vi.fn();
const mockGetScriptVersions = vi.fn();
const mockGetEvents = vi.fn();

vi.mock("../api/scripts", () => ({
  getScript: (id: number) => mockGetScript(id),
  getScriptVersions: (id: number) => mockGetScriptVersions(id),
}));

vi.mock("../api/events", () => ({
  getEvents: (filters: any) => mockGetEvents(filters),
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

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 10,
    status: "recruiting",
    scheduled_at: "2026-05-20T19:00:00Z",
    location: "台北館",
    address: null,
    allow_cross_gender: true,
    offline_male: 0,
    offline_female: 0,
    confirmed_count: 3,
    slot_parts: "2男1女",
    host: { id: 1, nickname: "阿明" } as any,
    script: makeScript(),
    ...overrides,
  };
}

function renderPage(scriptId = "1") {
  return render(
    <MemoryRouter initialEntries={[`/scripts/${scriptId}`]}>
      <Routes>
        <Route path="/scripts/:id" element={<ScriptDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetScript.mockResolvedValue(makeScript());
  mockGetScriptVersions.mockResolvedValue([]);
  mockGetEvents.mockResolvedValue([]);
});

describe("ScriptDetailPage", () => {
  it("renders script detail content successfully", async () => {
    mockGetScript.mockResolvedValue(makeScript({ title: "神奇古宅", description: "驚悚密室劇本" }));
    renderPage();

    expect(await screen.findByText("神奇古宅")).toBeInTheDocument();
    expect(screen.getByText("驚悚密室劇本")).toBeInTheDocument();
  });

  it("renders active recruiting events as related跟團 tags/badges", async () => {
    const event = makeEvent({ location: "信義旗艦店", slot_parts: "3人" });
    mockGetEvents.mockResolvedValue([event]);

    renderPage();

    expect(await screen.findByText("可加入的活動（直接跟團）")).toBeInTheDocument();
    expect(screen.getByText("信義旗艦店")).toBeInTheDocument();
    expect(screen.getByText("主揪: 阿明")).toBeInTheDocument();
    expect(screen.getByText("詳細")).toBeInTheDocument();
  });
});
