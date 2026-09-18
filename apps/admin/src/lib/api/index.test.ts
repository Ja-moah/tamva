import { afterEach, describe, expect, it, vi } from "vitest";

import { getSystemHealth } from ".";

describe("getSystemHealth", () => {
  afterEach(() => vi.restoreAllMocks());

  it("validates the Django health response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "ok", database: "ok" }), { status: 200 }),
    );

    await expect(getSystemHealth()).resolves.toEqual({ status: "ok", database: "ok" });
  });

  it("rejects unavailable backends", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 503 }));

    await expect(getSystemHealth()).rejects.toThrow("status 503");
  });
});
