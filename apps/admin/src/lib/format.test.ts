import { describe, expect, it } from "vitest";

import { decisionTone, humanize, makeFormatters, toNumber } from "./format";

describe("format", () => {
  it("converts DRF decimal strings at the edge and rejects junk", () => {
    expect(toNumber("12.50")).toBe(12.5);
    expect(toNumber(3)).toBe(3);
    expect(toNumber(null)).toBeNull();
    expect(toNumber("")).toBeNull();
    expect(toNumber("abc")).toBeNull();
  });

  it("makes machine codes readable", () => {
    expect(humanize("UNUSUAL_LOCATION")).toBe("Unusual location");
    expect(humanize("risk:read")).toBe("Risk read");
  });

  it("formats dates in the institution's time zone, not the browser's", () => {
    const iso = "2026-09-01T23:30:00Z";
    expect(makeFormatters("en-GB", "Africa/Accra").dateTime(iso)).toContain("1 Sept");
    expect(makeFormatters("en-GB", "Africa/Lagos").dateTime(iso)).toContain("2 Sept");
    expect(makeFormatters("en", "UTC").dateTime(null)).toBe("—");
  });

  it("formats money in its own currency and never converts", () => {
    const fmt = makeFormatters("en-GH", "Africa/Accra");
    expect(fmt.money("1500", "GHS")).toMatch(/1,500/);
    expect(fmt.money("1500", "USD")).toMatch(/US\$|\$/);
    expect(fmt.money(null, "GHS")).toBe("—");
  });

  it("survives an invalid locale or time zone rather than crashing the page", () => {
    const fmt = makeFormatters("not a locale", "Mars/Olympus");
    expect(() => fmt.dateTime("2026-09-01T00:00:00Z")).not.toThrow();
    expect(fmt.number("5")).toBe("5");
  });

  it("maps decisions to tones", () => {
    expect(decisionTone("BLOCK")).toBe("danger");
    expect(decisionTone("HOLD")).toBe("warning");
    expect(decisionTone("ALLOW")).toBe("success");
    expect(decisionTone(null)).toBe("neutral");
  });
});
