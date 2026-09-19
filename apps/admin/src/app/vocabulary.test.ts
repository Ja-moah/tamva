import { CASE_STATUSES } from "@tamva/client-contracts";
import { describe, expect, it } from "vitest";

// Every non-test source file, as text. Guards the canonical vocabulary and the
// "no fabricated data" rule against regressions.
const sources = import.meta.glob(["../**/*.ts", "../**/*.tsx", "!../**/*.test.ts", "!../**/*.test.tsx", "!../test/**"], {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const find = (pattern: RegExp) =>
  Object.entries(sources)
    .filter(([, text]) => pattern.test(text))
    .map(([path]) => path);

describe("canonical vocabulary and honesty rules", () => {
  it("uses the backend's case workflow, in order", () => {
    expect(CASE_STATUSES).toEqual(["OPEN", "TRIAGED", "INVESTIGATING", "ACTIONED", "RESOLVED"]);
  });

  it("never uses the retired case states", () => {
    expect(find(/\bUNDER_REVIEW\b|"NEW"|"ESCALATED"/)).toEqual([]);
  });

  it("calls the 0–100 indicator Financial Confidence, never Trust Score", () => {
    expect(find(/trust score/i)).toEqual([]);
  });

  it("contains no randomness that could fabricate data", () => {
    expect(find(/Math\.random/).filter((p) => !p.endsWith("toast.tsx") && !p.endsWith("client.ts"))).toEqual([]);
  });

  it("has no hard-coded exchange rates or a fixed currency symbol", () => {
    expect(find(/baseRateToGHS|GH₵|exchangeRate/)).toEqual([]);
  });

  it("does not present third-party brand marks or mock institutions", () => {
    expect(find(/MTN|Telecel|AirtelTigo|Ecobank|Zenith|Apex Bank PLC|GhIPSS/)).toEqual([]);
  });

  it("has no local-state production/sandbox toggle", () => {
    expect(find(/setEnvironment|handleToggleEnvironment/)).toEqual([]);
  });

  it("never claims prevented fraud value", () => {
    expect(find(/fraud prevented.*GH|prevented.*GH[C₵¢]/i)).toEqual([]);
  });
});
