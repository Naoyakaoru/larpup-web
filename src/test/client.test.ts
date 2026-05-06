import { describe, it, expect, beforeEach, vi } from "vitest";
import { request, ApiError } from "../api/client";

const BASE = "/api/v1";

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("request – Authorization header", () => {
  it("omits Authorization header when no token in localStorage", async () => {
    const fetch = mockFetch(200, { data: 1 });
    vi.stubGlobal("fetch", fetch);

    await request("/test");

    const [, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(
      (init.headers as Record<string, string>)["Authorization"],
    ).toBeUndefined();
  });

  it("sends Bearer token when token present in localStorage", async () => {
    localStorage.setItem("larpup_token", "tok-abc");
    const fetch = mockFetch(200, { data: 1 });
    vi.stubGlobal("fetch", fetch);

    await request("/test");

    const [, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["Authorization"]).toBe(
      "Bearer tok-abc",
    );
  });

  it("calls the correct URL", async () => {
    const fetch = mockFetch(200, {});
    vi.stubGlobal("fetch", fetch);

    await request("/events/1");

    expect(fetch.mock.calls[0][0]).toBe(`${BASE}/events/1`);
  });
});

describe("request – error handling", () => {
  it("throws ApiError with status and message on non-ok response", async () => {
    vi.stubGlobal("fetch", mockFetch(422, { error: "Validation failed" }));

    await expect(request("/bad")).rejects.toMatchObject({
      status: 422,
      message: "Validation failed",
    });
  });

  it("throws ApiError with joined errors array when errors key present", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(422, { errors: ["Name is blank", "Email is invalid"] }),
    );

    await expect(request("/bad")).rejects.toMatchObject({
      status: 422,
      message: "Name is blank, Email is invalid",
    });
  });

  it("falls back to generic message when body has no error field", async () => {
    vi.stubGlobal("fetch", mockFetch(500, {}));

    await expect(request("/bad")).rejects.toMatchObject({
      status: 500,
      message: "Something went wrong",
    });
  });

  it("instance is ApiError", async () => {
    vi.stubGlobal("fetch", mockFetch(401, { error: "Unauthorized" }));

    await expect(request("/secure")).rejects.toBeInstanceOf(ApiError);
  });

  it("returns parsed JSON on success", async () => {
    vi.stubGlobal("fetch", mockFetch(200, { id: 42 }));

    const result = await request<{ id: number }>("/ok");

    expect(result).toEqual({ id: 42 });
  });
});

describe("request – Content-Type header", () => {
  it("sets Content-Type to application/json for regular requests", async () => {
    const fetch = mockFetch(200, {});
    vi.stubGlobal("fetch", fetch);

    await request("/test", { method: "POST", body: JSON.stringify({ a: 1 }) });

    const [, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/json",
    );
  });

  it("omits Content-Type when body is FormData", async () => {
    const fetch = mockFetch(200, {});
    vi.stubGlobal("fetch", fetch);

    await request("/upload", { method: "POST", body: new FormData() });

    const [, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(
      (init.headers as Record<string, string>)["Content-Type"],
    ).toBeUndefined();
  });
});
