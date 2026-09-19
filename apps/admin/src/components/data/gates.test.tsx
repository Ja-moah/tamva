import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { baseRoutes, mockApi, renderApp } from "../../test/utils";
import { CapabilityGate } from "./gates";

const gate = (code: string) => (
  <CapabilityGate code={code} title="Fancy thing" partialNote="only half works" unavailable={<>Because reasons.</>}>
    <p>real-content</p>
  </CapabilityGate>
);

describe("CapabilityGate", () => {
  it("renders the content when AVAILABLE", async () => {
    mockApi(baseRoutes([], { "GET /api/v1/capabilities/": { data: { thing: "AVAILABLE" } } }));
    renderApp(gate("thing"));
    expect(await screen.findByText("real-content")).toBeInTheDocument();
  });

  it("renders the content with an explicit partial note when PARTIAL", async () => {
    mockApi(baseRoutes([], { "GET /api/v1/capabilities/": { data: { thing: "PARTIAL" } } }));
    renderApp(gate("thing"));
    expect(await screen.findByText("real-content")).toBeInTheDocument();
    expect(screen.getByText(/partial: only half works/i)).toBeInTheDocument();
  });

  it.each(["NOT_AVAILABLE", "DISABLED"])("shows an unavailable state, not content, when %s", async (state) => {
    mockApi(baseRoutes([], { "GET /api/v1/capabilities/": { data: { thing: state } } }));
    renderApp(gate("thing"));
    expect(await screen.findByText("Fancy thing")).toBeInTheDocument();
    expect(screen.getByText("Because reasons.")).toBeInTheDocument();
    expect(screen.queryByText("real-content")).not.toBeInTheDocument();
  });

  it("treats a capability the backend doesn't mention as unavailable", async () => {
    mockApi(baseRoutes([]));
    renderApp(gate("never-heard-of-it"));
    expect(await screen.findByText("Fancy thing")).toBeInTheDocument();
    expect(screen.queryByText("real-content")).not.toBeInTheDocument();
  });
});
