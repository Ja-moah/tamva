import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { vi } from "vitest";

import { RootGate } from "../app/root-gate";
import { ToastProvider } from "../components/ui/toast";
import { SessionProvider } from "../features/session/session";
import { setActiveInstitution } from "../lib/api";
import { ThemeProvider } from "../lib/theme";

export const INSTITUTION_A = "11111111-1111-1111-1111-111111111111";
export const INSTITUTION_B = "22222222-2222-2222-2222-222222222222";

export interface ApiCall {
  method: string;
  path: string;
  search: string;
  headers: Record<string, string>;
  body: unknown;
}

type Handler = (call: ApiCall) => unknown | Response;
export type ApiRoutes = Record<string, Handler | unknown>;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export const apiError = (status: number, code: string, message = "Request failed") =>
  json({ error: { code, message, request_id: "req-test", details: {} } }, status);

/** Stub fetch. Keys are "METHOD /path"; a value is a body, a Response, or a function of the call. */
export function mockApi(routes: ApiRoutes) {
  const calls: ApiCall[] = [];
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = new URL(String(input), "http://localhost");
    const method = (init?.method ?? "GET").toUpperCase();
    const call: ApiCall = {
      method,
      path: url.pathname,
      search: url.search,
      headers: (init?.headers ?? {}) as Record<string, string>,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    };
    calls.push(call);
    const handler = routes[`${method} ${url.pathname}`];
    if (handler === undefined) return apiError(404, "not_found", `No mock for ${method} ${url.pathname}`);
    const result = typeof handler === "function" ? (handler as Handler)(call) : handler;
    return result instanceof Response ? result : json(result);
  });
  return calls;
}

export const actor = (permissions: string[], overrides: Record<string, unknown> = {}) => ({
  user: { id: "u-1", email: "analyst@bank.test", actor_type: "PARTNER_USER", status: "ACTIVE" },
  tenant: { institution_id: INSTITUTION_A, institution_name: "Apex Bank" },
  memberships: [{ institution_id: INSTITUTION_A, institution_name: "Apex Bank" }],
  roles: ["RISK_ANALYST"],
  permissions,
  ...overrides,
});

export const baseRoutes = (permissions: string[], extra: ApiRoutes = {}): ApiRoutes => ({
  "GET /api/v1/me/": { data: actor(permissions) },
  "GET /api/v1/meta/version/": { data: { api_version: "v1", application_version: "0.1.0", environment: "staging", release: "" } },
  "GET /api/v1/capabilities/": { data: {} },
  "GET /api/v1/institution/locale/": { data: { country_code: "GH", default_currency: "GHS", timezone: "Africa/Accra", locale: "en-GH", is_default: true } },
  "GET /api/v1/notifications/": { count: 0, next: null, previous: null, results: [] },
  "GET /health/": { status: "ok", database: "ok" },
  ...extra,
});

export function newClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
}

/** Providers without a router, for components that don't navigate. */
export function renderWithProviders(ui: ReactElement, client = newClient()) {
  return { client, ...render(
    <ThemeProvider>
      <QueryClientProvider client={client}>
        <ToastProvider>
          <SessionProvider>{ui}</SessionProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>,
  ) };
}

/** The whole app gate (login / shell) with a page rendered at "/". */
export function renderApp(page: ReactElement, path = "/") {
  setActiveInstitution(null);
  const root = createRootRoute({ component: RootGate });
  const index = createRoute({ getParentRoute: () => root, path: "/", component: () => page });
  const other = createRoute({ getParentRoute: () => root, path: "$", component: () => page });
  const router = createRouter({
    routeTree: root.addChildren([index, other]),
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  const client = newClient();
  return { client, ...render(
    <ThemeProvider>
      <QueryClientProvider client={client}>
        <ToastProvider>
          <SessionProvider>
            <RouterProvider router={router} />
          </SessionProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>,
  ) };
}
