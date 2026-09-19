import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { baseRoutes, mockApi, renderApp } from "../test/utils";
import { CasesPage } from "./cases-page";
import { IntegrationsPage } from "./integrations-page";
import { OverviewPage } from "./overview-page";
import { RiskPage } from "./risk-page";
import { TeamPage } from "./team-page";

const page = <T,>(results: T[]) => ({ count: results.length, next: null, previous: null, results });
const catalog = (resource: string) => ({
  data: [
    {
      resource_type: resource,
      filters: [{ param: "decision", kind: "choice", choices: ["ALLOW", "CHALLENGE", "HOLD", "BLOCK"], description: "" }],
      search: [],
      ordering: ["evaluated_at", "score"],
      columns: [{ key: "decision", label: "Decision" }],
    },
  ],
});
const countMap = { ALLOW: 0, CHALLENGE: 0, HOLD: 0, BLOCK: 0 };
const overview = {
  data: {
    generated_at: "2026-09-18T10:00:00Z",
    window: { from: "2026-08-19T10:00:00Z", to: "2026-09-18T10:00:00Z", days: 30 },
    risk: { evaluations: 128, decisions: { ...countMap, ALLOW: 100, HOLD: 20, BLOCK: 8 }, average_score: "212.5", score_scale: "0-1000, higher = higher risk" },
    cases: { open: 7, by_status: { OPEN: 4, TRIAGED: 3 }, by_priority_open: {}, unresolved_high_severity: 2, unassigned_open: 5 },
    financial_confidence: { customers_scored: 40, average_score: "71.2", bands: { STRONG: 30 }, score_scale: "0-100, higher = stronger verified financial confidence" },
    connectors: { connections_by_status: { ACTIVE: 9 }, sync_runs_by_status: {} },
    consents: { by_status: { GRANTED: 12 }, active: 12, expiring_within_30_days: 1 },
    notifications: { total: 3, unread: 1, by_status: {} },
    passport: { active_shares: 2, shares_created: 1, accesses_by_outcome: {} },
    ledger: { postings: 500, debit_volume_by_currency: { GHS: "12345.50" } },
    credentials: { active: 2, used_in_window: 1 },
  },
};

describe("Overview", () => {
  it("shows the backend's real numbers and marks unsupported capability as unavailable", async () => {
    mockApi(baseRoutes(["overview:read"], { "GET /api/v1/overview/": overview }));
    renderApp(<OverviewPage />);
    expect(await screen.findByText("128")).toBeInTheDocument();
    expect(screen.getByText("Average risk score 212.5 / 1000")).toBeInTheDocument();
    expect(screen.getByText("5 unassigned")).toBeInTheDocument();
    expect(screen.getByText(/never converted between currencies/i)).toBeInTheDocument();
    // Capability {} => FX is unavailable, not silently mocked.
    expect(await screen.findByText("Cross-border conversion")).toBeInTheDocument();
    expect(screen.queryByText(/simulate/i)).not.toBeInTheDocument();
  });

  it("changes the window through the API, not client-side", async () => {
    const calls = mockApi(baseRoutes(["overview:read"], { "GET /api/v1/overview/": overview }));
    renderApp(<OverviewPage />);
    await screen.findByText("128");
    await userEvent.setup().click(screen.getByRole("button", { name: "90 days" }));
    await waitFor(() => expect(calls.some((c) => c.path === "/api/v1/overview/" && c.search.includes("days=90"))).toBe(true));
  });

  it("reports a failing API with the request id instead of empty charts", async () => {
    mockApi(baseRoutes(["overview:read"], { "GET /api/v1/overview/": new Response(JSON.stringify({ error: { code: "x", message: "boom", request_id: "req-42", details: {} } }), { status: 500 }) }));
    renderApp(<OverviewPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("req-42");
  });
});

const event = { id: "e1", customer_id: "c1111111-0000-0000-0000-000000000000", score: "812.0000", decision: "BLOCK", confidence: "0.9000", reason_codes: ["DEVICE_NEW", "COUNTERPARTY_FIRST_SEEN"], ruleset_version: "r:1", model_version: null, policy_version: "p:1", evaluated_at: "2026-09-18T09:00:00Z" };

describe("Risk events", () => {
  const routes = (permissions: string[]) =>
    baseRoutes(permissions, {
      "GET /api/v1/risk/events/": page([event]),
      "GET /api/v1/resources/": catalog("RISK_EVENTS"),
      "GET /api/v1/saved-views/": page([]),
      "GET /api/v1/risk/events/e1/": { ...event, reasons: [{ code: "DEVICE_NEW", source: "RULE", severity: "HIGH" }] },
    });

  it("filters and sorts on the server", async () => {
    const calls = mockApi(routes(["risk:read"]));
    renderApp(<RiskPage />);
    const user = userEvent.setup();
    await screen.findByText("812");
    await user.click(screen.getByRole("button", { name: /filters/i }));
    await user.selectOptions(await screen.findByLabelText("decision"), "BLOCK");
    await waitFor(() => expect(calls.some((c) => c.path === "/api/v1/risk/events/" && c.search.includes("decision=BLOCK"))).toBe(true));
    await user.click(screen.getByRole("button", { name: /^risk score/i }));
    await waitFor(() => expect(calls.some((c) => c.path === "/api/v1/risk/events/" && c.search.includes("ordering=score"))).toBe(true));
    expect(calls.filter((c) => c.path === "/api/v1/risk/events/").every((c) => c.search.includes("page_size=25"))).toBe(true);
  });

  it("explains a decision with human reason text and the raw code", async () => {
    mockApi(routes(["risk:read"]));
    renderApp(<RiskPage />);
    await userEvent.setup().click(await screen.findByRole("row", { name: /block/i }));
    expect(await screen.findByText("Activity from a device not seen before for this customer")).toBeInTheDocument();
    expect(screen.getByText(/DEVICE_NEW · Rule/)).toBeInTheDocument();
    expect(screen.getByText(/0–1000, higher = riskier/)).toBeInTheDocument();
  });

  it("offers export only to actors who may export", async () => {
    mockApi(routes(["risk:read"]));
    const first = renderApp(<RiskPage />);
    await screen.findByText("812");
    expect(screen.queryByRole("button", { name: /export/i })).not.toBeInTheDocument();
    first.unmount();
    mockApi(routes(["risk:read", "export:manage"]));
    renderApp(<RiskPage />);
    expect(await screen.findByRole("button", { name: /export/i })).toBeInTheDocument();
  });
});

const caseRow = { id: "k1", reference: "CAS-100", customer_id: "c1", case_type: "risk_review", priority: "HIGH", status: "OPEN", source: "AUTOMATIC", current_assignee_id: null, opened_at: "2026-09-17T08:00:00Z", closed_at: null };
const caseDetail = { ...caseRow, status_events: [], assignments: [], notes: [], actions: [], resolution: null };

describe("Cases", () => {
  const routes = (permissions: string[], extra = {}) =>
    baseRoutes(permissions, {
      "GET /api/v1/cases/": page([caseRow]),
      "GET /api/v1/resources/": catalog("CASES"),
      "GET /api/v1/saved-views/": page([]),
      "GET /api/v1/cases/k1/": { data: caseDetail },
      ...extra,
    });

  it("advances a case one backend step at a time, after confirmation", async () => {
    const calls = mockApi(routes(["case:read", "case:manage"], { "POST /api/v1/cases/k1/transition/": { data: { ...caseDetail, status: "TRIAGED" } } }));
    renderApp(<CasesPage />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("row", { name: /CAS-100/ }));
    await user.click(await screen.findByRole("button", { name: /move to triaged/i }));
    const dialog = await screen.findByRole("dialog", { name: /move to triaged/i });
    await user.click(within(dialog).getByRole("button", { name: /confirm/i }));
    await waitFor(() => expect(calls.some((c) => c.method === "POST" && c.path === "/api/v1/cases/k1/transition/")).toBe(true));
    expect(calls.find((c) => c.path === "/api/v1/cases/k1/transition/")!.body).toMatchObject({ new_status: "TRIAGED" });
  });

  it("never shows workflow actions to a read-only actor", async () => {
    mockApi(routes(["case:read"]));
    renderApp(<CasesPage />);
    await userEvent.setup().click(await screen.findByRole("row", { name: /CAS-100/ }));
    await screen.findByRole("list", { name: /workflow/i });
    expect(screen.queryByRole("button", { name: /move to/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /assign to me/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/add a note/i)).not.toBeInTheDocument();
  });

  it("bulk-triages the selection with an idempotency key and reports per-item failures", async () => {
    const calls = mockApi(routes(["case:read", "case:manage"], {
      "POST /api/v1/cases/bulk-triage/": { data: { summary: { requested: 1, succeeded: 0, failed: 1 }, results: [{ id: "k1", outcome: "FAILED", code: "invalid_transition", message: "no" }] } },
    }));
    renderApp(<CasesPage />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("checkbox", { name: "Select row k1" }));
    await user.click(screen.getByRole("button", { name: /triage selected/i }));
    const dialog = await screen.findByRole("dialog", { name: /triage 1 cases/i });
    await user.click(within(dialog).getByRole("button", { name: /^triage$/i }));
    await waitFor(() => expect(calls.some((c) => c.path === "/api/v1/cases/bulk-triage/")).toBe(true));
    const call = calls.find((c) => c.path === "/api/v1/cases/bulk-triage/")!;
    expect(call.headers["Idempotency-Key"]).toMatch(/\S+/);
    expect(call.body).toEqual({ case_ids: ["k1"], note: "" });
    expect(await screen.findByText(/1 could not be changed/i)).toBeInTheDocument();
  });
});

describe("Team & access", () => {
  const member = (id: string, userId: string, email: string) => ({ id, user_id: userId, email, name: email, actor_type: "PARTNER_USER", status: "ACTIVE", roles: ["VIEWER"], last_login: null, created_at: "2026-01-01T00:00:00Z" });
  const routes = (permissions: string[]) =>
    baseRoutes(permissions, {
      "GET /api/v1/team/members/": page([member("m1", "u-1", "analyst@bank.test"), member("m2", "u-2", "other@bank.test")]),
      "GET /api/v1/team/roles/": { data: [{ code: "VIEWER", name: "Viewer", description: "", permissions: ["risk:read"] }] },
      "GET /api/v1/team/permissions/": { data: [{ code: "risk:read", name: "View risk events", description: "" }] },
    });

  it("lets a manager change others' access but never their own", async () => {
    mockApi(routes(["team:read", "team:manage"]));
    renderApp(<TeamPage />);
    expect(await screen.findByRole("button", { name: "Change roles for other@bank.test" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Change roles for analyst@bank.test" })).not.toBeInTheDocument();
    expect(screen.getByText("You")).toBeInTheDocument();
  });

  it("shows the permission matrix from the backend and marks invitations unavailable", async () => {
    mockApi(routes(["team:read"]));
    renderApp(<TeamPage />);
    expect(await screen.findByRole("table", { name: /role permission matrix/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /change roles/i })).not.toBeInTheDocument();
    expect(screen.getByText("Invite team members")).toBeInTheDocument();
  });
});

describe("API & integrations", () => {
  const app = { id: "a1", name: "Core banking", slug: "core", description: "", status: "ACTIVE", created_at: "2026-01-01T00:00:00Z", environments: [{ id: "env1", kind: "SANDBOX", status: "ACTIVE", credentials: [], webhooks: [] }] };
  it("shows a new secret exactly once and never lists it afterwards", async () => {
    let issued = false;
    mockApi(baseRoutes(["partner:read", "partner:manage"], {
      "GET /api/v1/integrations/applications/": () => page([{ ...app, environments: [{ ...app.environments[0], credentials: issued ? [{ id: "c1", name: "primary", client_id: "tamva_sandbox_x", status: "ACTIVE", scopes: ["risk:evaluate"], expires_at: null, revoked_at: null, last_used_at: null, created_at: "2026-01-01T00:00:00Z" }] : [] }] }]),
      "GET /api/v1/integrations/scopes/": { data: [{ code: "risk:evaluate", name: "Evaluate risk", description: "" }] },
      "GET /api/v1/integrations/connections/": page([]),
      "POST /api/v1/integrations/environments/env1/credentials/": () => {
        issued = true;
        return { data: { credential: { id: "c1", name: "primary", client_id: "tamva_sandbox_x", status: "ACTIVE", scopes: ["risk:evaluate"], expires_at: null, revoked_at: null, last_used_at: null, created_at: "2026-01-01T00:00:00Z" }, secret: "tamva_secret_ABC123", secret_notice: "once" } };
      },
    }));
    renderApp(<IntegrationsPage />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /issue credential/i }));
    const form = await screen.findByRole("dialog", { name: /issue api credential/i });
    await user.type(within(form).getByLabelText("Name"), "primary");
    await user.click(await within(form).findByRole("checkbox", { name: /risk:evaluate/i }));
    await user.click(within(form).getByRole("button", { name: "Save" }));

    const reveal = await screen.findByRole("dialog", { name: /copy your secret now/i });
    expect(within(reveal).getByLabelText("Secret")).toHaveValue("tamva_secret_ABC123");
    await user.click(within(reveal).getByRole("button", { name: /saved it/i }));
    await waitFor(() => expect(screen.queryByDisplayValue("tamva_secret_ABC123")).not.toBeInTheDocument());
    expect(document.body.textContent).not.toContain("tamva_secret_ABC123");
    expect(await screen.findByText("tamva_sandbox_x")).toBeInTheDocument();
  });

  it("hides every write action from a read-only actor and gates usage metrics", async () => {
    mockApi(baseRoutes(["partner:read"], {
      "GET /api/v1/integrations/applications/": page([app]),
      "GET /api/v1/integrations/connections/": page([]),
    }));
    renderApp(<IntegrationsPage />);
    await screen.findByText("Core banking");
    for (const name of [/new application/i, /issue credential/i, /add webhook/i, /add environment/i]) {
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    }
    expect(screen.getByText("API usage & request logs")).toBeInTheDocument();
  });
});
