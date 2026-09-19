import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, getCapabilities, getSystemHealth, setActiveInstitution } from ".";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    setActiveInstitution(null);
  });

  it("validates the Django health response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ status: "ok", database: "ok" }));

    await expect(getSystemHealth()).resolves.toEqual({ status: "ok", database: "ok" });
  });

  it("sends request id, tenant header and credentials on versioned calls", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ data: { risk_explanations: "AVAILABLE" } }));
    setActiveInstitution("11111111-1111-1111-1111-111111111111");

    await expect(getCapabilities()).resolves.toEqual({ risk_explanations: "AVAILABLE" });

    const [url, init] = fetchSpy.mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    expect(url).toBe("/api/v1/capabilities/");
    expect(init?.credentials).toBe("include");
    expect(headers["X-Institution-ID"]).toBe("11111111-1111-1111-1111-111111111111");
    expect(headers["X-Request-ID"]).toMatch(/\S+/);
  });

  it("does not add a tenant header when none is active", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ data: {} }));

    await getCapabilities();

    const headers = fetchSpy.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers["X-Institution-ID"]).toBeUndefined();
  });

  it("maps the standard error envelope to ApiError", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(
        { error: { code: "not_authenticated", message: "Request failed", request_id: "req-1", details: {} } },
        401,
      ),
    );

    const error = await getCapabilities().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 401, code: "not_authenticated", requestId: "req-1" });
    expect((error as ApiError).isUnauthenticated).toBe(true);
  });

  it("rejects unavailable backends with a generic error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("Bad gateway", { status: 502 }));

    await expect(getSystemHealth()).rejects.toMatchObject({ status: 502, code: "http_error" });
  });
});
