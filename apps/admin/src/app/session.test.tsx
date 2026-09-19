import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { PermissionGate } from "../components/data/gates";
import { INSTITUTION_A, INSTITUTION_B, actor, apiError, baseRoutes, mockApi, renderApp } from "../test/utils";

const Page = () => <PermissionGate permission="risk:read" what="Risk events"><p>risk-secret-content</p></PermissionGate>;

describe("session shell", () => {
  it("shows the sign-in screen, not the console, when there is no session", async () => {
    mockApi(baseRoutes([], { "GET /api/v1/me/": apiError(401, "not_authenticated") }));
    renderApp(<Page />);
    expect(await screen.findByRole("heading", { name: /sign in to tamva/i })).toBeInTheDocument();
    expect(screen.queryByText("risk-secret-content")).not.toBeInTheDocument();
    // The backend's environment is shown on the login screen, not a local toggle.
    expect(await screen.findByText("staging")).toBeInTheDocument();
  });

  it("signs in with identifier + password and then loads the console", async () => {
    let signedIn = false;
    const calls = mockApi(
      baseRoutes(["risk:read"], {
        "GET /api/v1/me/": () => (signedIn ? { data: actor(["risk:read"]) } : apiError(401, "not_authenticated")),
        "POST /api/v1/auth/login/": () => {
          signedIn = true;
          return { data: actor(["risk:read"]) };
        },
      }),
    );
    renderApp(<Page />);
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/email or username/i), "analyst@bank.test");
    await user.type(screen.getByLabelText(/password/i), "hunter2");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("risk-secret-content")).toBeInTheDocument();
    const login = calls.find((c) => c.path === "/api/v1/auth/login/")!;
    expect(login.body).toEqual({ identifier: "analyst@bank.test", password: "hunter2" });
  });

  it("explains a failed login without revealing which field was wrong", async () => {
    mockApi(baseRoutes([], {
      "GET /api/v1/me/": apiError(401, "not_authenticated"),
      "POST /api/v1/auth/login/": apiError(400, "invalid", "Request validation failed"),
    }));
    renderApp(<Page />);
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/email or username/i), "x@y.z");
    await user.type(screen.getByLabelText(/password/i), "nope");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/don't match an active account/i);
  });

  it("sends the tenant header on every institution-scoped request", async () => {
    const calls = mockApi(baseRoutes(["risk:read"]));
    renderApp(<Page />);
    await screen.findByText("risk-secret-content");
    const scoped = calls.filter((c) => c.path.startsWith("/api/v1/") && c.path !== "/api/v1/meta/version/");
    const withTenant = scoped.filter((c) => c.headers["X-Institution-ID"] === INSTITUTION_A);
    expect(withTenant.length).toBeGreaterThan(0);
    expect(calls.every((c) => c.path === "/api/v1/meta/version/" || c.path === "/health/" || c.path === "/api/v1/me/" || c.headers["X-Institution-ID"] === INSTITUTION_A)).toBe(true);
    expect(scoped.every((c) => Boolean(c.headers["X-Request-ID"]))).toBe(true);
  });

  it("only offers navigation the actor's permissions allow, and blocks the rest", async () => {
    mockApi(baseRoutes(["case:read"]));
    renderApp(<Page />);
    const nav = await screen.findByRole("navigation", { name: /primary/i });
    expect(within(nav).getByRole("link", { name: /cases/i })).toBeInTheDocument();
    expect(within(nav).queryByRole("link", { name: /risk events/i })).not.toBeInTheDocument();
    expect(within(nav).queryByRole("link", { name: /team/i })).not.toBeInTheDocument();
    // The page itself refuses to render protected content.
    expect(await screen.findByText(/don't have access/i)).toBeInTheDocument();
    expect(screen.queryByText("risk-secret-content")).not.toBeInTheDocument();
  });

  it("shows the real operator, roles and environment (no hard-coded identity)", async () => {
    mockApi(baseRoutes(["risk:read"]));
    renderApp(<Page />);
    expect(await screen.findByText("analyst@bank.test")).toBeInTheDocument();
    expect(screen.getByText("RISK_ANALYST")).toBeInTheDocument();
    expect(screen.getAllByText("staging").length).toBeGreaterThan(0);
    expect(screen.queryByText("Partner Bank Ghana")).not.toBeInTheDocument();
    expect(screen.queryByText(/global platform scope/i)).not.toBeInTheDocument();
  });

  it("offers an institution picker only when the actor has several memberships", async () => {
    const two = { ...actor(["risk:read"]), memberships: [
      { institution_id: INSTITUTION_A, institution_name: "Apex Bank" },
      { institution_id: INSTITUTION_B, institution_name: "Zenith Trust" },
    ] };
    const calls = mockApi(baseRoutes(["risk:read"], { "GET /api/v1/me/": () => ({ data: two }) }));
    renderApp(<Page />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /apex bank/i }));
    await user.click(await screen.findByRole("option", { name: "Zenith Trust" }));
    await waitFor(() => expect(calls.some((c) => c.headers["X-Institution-ID"] === INSTITUTION_B)).toBe(true));
    expect(window.localStorage.getItem("tamva.admin.institution")).toBe(INSTITUTION_B);
  });

  it("returns to sign-in when an API call reports an expired session", async () => {
    let expired = false;
    mockApi(baseRoutes(["risk:read"], {
      "GET /api/v1/me/": () => (expired ? apiError(401, "not_authenticated") : { data: actor(["risk:read"]) }),
      "GET /api/v1/notifications/": () => {
        expired = true;
        return apiError(401, "not_authenticated");
      },
    }));
    renderApp(<Page />);
    expect(await screen.findByRole("heading", { name: /sign in to tamva/i })).toBeInTheDocument();
  });

  it("explains an actor with no institution membership", async () => {
    mockApi(baseRoutes([], { "GET /api/v1/me/": { data: { ...actor([]), memberships: [], tenant: null } } }));
    renderApp(<Page />);
    expect(await screen.findByRole("heading", { name: /no institution access/i })).toBeInTheDocument();
  });

  it("surfaces backend outages instead of pretending to be signed out", async () => {
    mockApi(baseRoutes([], { "GET /api/v1/me/": apiError(503, "unavailable") }));
    renderApp(<Page />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/server had a problem/i);
  });
});
