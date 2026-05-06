import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import EventDetailPage from "../pages/EventDetailPage";
import type { Event, EventMember, User } from "../types";

// --- module mocks ---

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => mockAuthReturn,
}));

vi.mock("../api/events", () => ({
  getEvent: () => Promise.resolve(mockEvent),
  joinEvent: vi.fn(),
  leaveEvent: vi.fn(),
  updateMember: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
  restoreEvent: vi.fn(),
  cancelEvent: vi.fn(),
}));

// mutable values swapped per test
let mockAuthReturn: { user: User | null };
let mockEvent: Event;

// --- helpers ---

const HOST: User = {
  id: 10,
  handle: "host",
  email: "host@x.com",
  nickname: "Host",
  gender: "male",
  avatar_url: null,
  is_admin: false,
  show_hosted_events: false,
};
const MEMBER_A: User = {
  id: 20,
  handle: "alice",
  email: "a@x.com",
  nickname: "Alice",
  gender: "female",
  avatar_url: null,
  is_admin: false,
  show_hosted_events: false,
};
const MEMBER_B: User = {
  id: 30,
  handle: "bob",
  email: "b@x.com",
  nickname: "Bob",
  gender: "male",
  avatar_url: null,
  is_admin: false,
  show_hosted_events: false,
};

function makeMember(
  user: User,
  status: EventMember["status"],
  appliedAt = "2025-01-15T10:00:00Z",
): EventMember {
  return {
    id: user.id * 100,
    user: {
      id: user.id,
      handle: user.handle,
      nickname: user.nickname,
      gender: user.gender,
    },
    status,
    cross_gender: false,
    applied_at: appliedAt,
    confirmed_at: null,
    rejected_at: null,
    leave_requested_at: null,
    cancelled_at: null,
  };
}

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
    host: { id: HOST.id, handle: HOST.handle, nickname: HOST.nickname },
    allow_cross_gender: false,
    offline_male: 0,
    offline_female: 0,
    scheduled_at: "2025-06-01T14:00:00Z",
    location: "台北",
    status: "recruiting",
    confirmed_count: 0,
    available_slots: 6,
    members: [],
    audit_logs: [],
    deleted_at: null,
    ...overrides,
  };
}

function renderPage(asUser: User | null) {
  mockAuthReturn = { user: asUser };
  return render(
    <MemoryRouter initialEntries={["/events/1"]}>
      <Routes>
        <Route path="/events/:id" element={<EventDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

// --- applied_at visibility ---

describe("EventDetailPage – applied_at visibility", () => {
  it("host sees applied_at for other members", async () => {
    mockEvent = makeEvent({
      members: [makeMember(MEMBER_A, "pending", "2025-01-15T10:30:00Z")],
    });
    renderPage(HOST);

    // wait for async load
    expect(await screen.findByText("死亡列車")).toBeInTheDocument();
    // applied_at rendered as "申請 MM/DD HH:mm"
    expect(screen.getByText(/申請/)).toBeInTheDocument();
  });

  it("host does NOT see their own applied_at when they are in the member list", async () => {
    const hostMember = makeMember(HOST, "confirmed", "2025-01-10T08:00:00Z");
    const otherMember = makeMember(MEMBER_A, "pending", "2025-01-15T10:30:00Z");
    mockEvent = makeEvent({ members: [hostMember, otherMember] });

    renderPage(HOST);
    await screen.findByText("死亡列車");

    // There should be exactly one "申請" timestamp: Alice's, not the host's own
    const appliedLabels = screen.getAllByText(/申請/);
    expect(appliedLabels).toHaveLength(1);
  });

  it("member sees their own applied_at", async () => {
    mockEvent = makeEvent({
      members: [makeMember(MEMBER_A, "pending", "2025-01-15T10:30:00Z")],
    });
    renderPage(MEMBER_A);

    await screen.findByText("死亡列車");
    expect(screen.getByText(/申請/)).toBeInTheDocument();
  });

  it("member does NOT see another member's applied_at", async () => {
    // Bob is confirmed (name visible), but Alice (pending) is the current user
    const bobMember = makeMember(MEMBER_B, "confirmed", "2025-01-12T09:00:00Z");
    const aliceMember = makeMember(MEMBER_A, "pending", "2025-01-15T10:30:00Z");
    mockEvent = makeEvent({ members: [bobMember, aliceMember] });

    renderPage(MEMBER_A);
    await screen.findByText("死亡列車");

    // Only Alice's own applied_at should appear (one "申請" label)
    const appliedLabels = screen.getAllByText(/申請/);
    expect(appliedLabels).toHaveLength(1);
  });
});

// --- rejected member ---

describe("EventDetailPage – rejected member", () => {
  it("shows rejection status label", async () => {
    mockEvent = makeEvent({
      members: [
        {
          ...makeMember(MEMBER_A, "rejected"),
          rejected_at: "2025-01-16T12:00:00Z",
        },
      ],
    });
    renderPage(MEMBER_A);

    await screen.findByText("死亡列車");
    // "已拒絕" appears in both the my-status section and the member status badge
    expect(screen.getAllByText("已拒絕").length).toBeGreaterThan(0);
  });

  it("does NOT show apply button for rejected member", async () => {
    mockEvent = makeEvent({
      members: [
        {
          ...makeMember(MEMBER_A, "rejected"),
          rejected_at: "2025-01-16T12:00:00Z",
        },
      ],
    });
    renderPage(MEMBER_A);

    await screen.findByText("死亡列車");
    expect(
      screen.queryByRole("button", { name: "申請加入" }),
    ).not.toBeInTheDocument();
  });
});

// --- cancelled member ---

describe("EventDetailPage – cancelled member", () => {
  it("shows re-apply button for cancelled member", async () => {
    mockEvent = makeEvent({
      members: [
        {
          ...makeMember(MEMBER_A, "cancelled"),
          cancelled_at: "2025-01-17T15:00:00Z",
        },
      ],
    });
    renderPage(MEMBER_A);

    await screen.findByText("死亡列車");
    expect(
      screen.getByRole("button", { name: "申請加入" }),
    ).toBeInTheDocument();
  });

  it("shows re-apply hint text for cancelled member", async () => {
    mockEvent = makeEvent({
      members: [
        {
          ...makeMember(MEMBER_A, "cancelled"),
          cancelled_at: "2025-01-17T15:00:00Z",
        },
      ],
    });
    renderPage(MEMBER_A);

    await screen.findByText("死亡列車");
    expect(screen.getByText("你曾取消報名，可以重新申請")).toBeInTheDocument();
  });
});
