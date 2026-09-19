import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { lazy } from "react";

import { PermissionGate } from "../components/data/gates";
import { RootGate } from "./root-gate";

const OverviewPage = lazy(() =>
  import("../routes/overview-page").then((module) => ({ default: module.OverviewPage })),
);
const RiskPage = lazy(() =>
  import("../routes/risk-page").then((module) => ({ default: module.RiskPage })),
);
const CasesPage = lazy(() =>
  import("../routes/cases-page").then((module) => ({ default: module.CasesPage })),
);
const CustomersPage = lazy(() =>
  import("../routes/customers-page").then((module) => ({ default: module.CustomersPage })),
);
const NetworkPage = lazy(() =>
  import("../routes/network-page").then((module) => ({ default: module.NetworkPage })),
);
const AnalyticsPage = lazy(() =>
  import("../routes/analytics-page").then((module) => ({ default: module.AnalyticsPage })),
);
const TeamPage = lazy(() =>
  import("../routes/team-page").then((module) => ({ default: module.TeamPage })),
);
const SecurityPage = lazy(() =>
  import("../routes/security-page").then((module) => ({ default: module.SecurityPage })),
);
const NotificationsPage = lazy(() =>
  import("../routes/notifications-page").then((module) => ({ default: module.NotificationsPage })),
);
const SettingsPage = lazy(() =>
  import("../routes/settings-page").then((module) => ({ default: module.SettingsPage })),
);
const IntegrationsPage = lazy(() =>
  import("../routes/integrations-page").then((module) => ({ default: module.IntegrationsPage })),
);

const rootRoute = createRootRoute({ component: RootGate });

/** Wraps a page so an actor without the permission sees an unauthorized state. */
function guarded(Page: React.ComponentType, permission: string | null, what: string) {
  return function GuardedPage() {
    return (
      <PermissionGate permission={permission} what={what}>
        <Page />
      </PermissionGate>
    );
  };
}

const overviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: guarded(OverviewPage, "overview:read", "The overview"),
});

const riskRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/risk-events",
  component: guarded(RiskPage, "risk:read", "Risk events"),
});

const caseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cases",
  component: guarded(CasesPage, "case:read", "Cases"),
});

const customerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/customers",
  component: guarded(CustomersPage, "customer:read", "Customers"),
});

const networkRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/network",
  component: guarded(NetworkPage, "network:read", "The trust network"),
});

const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/analytics",
  component: guarded(AnalyticsPage, "analytics:read", "Analytics"),
});

const teamRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/team",
  component: guarded(TeamPage, "team:read", "Team & access"),
});

const securityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/security",
  component: guarded(SecurityPage, "security:read", "Security"),
});

const notificationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/notifications",
  component: NotificationsPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
});

const integrationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/integrations",
  component: guarded(IntegrationsPage, "partner:read", "Integrations"),
});

const routeTree = rootRoute.addChildren([
  overviewRoute,
  riskRoute,
  caseRoute,
  customerRoute,
  networkRoute,
  analyticsRoute,
  teamRoute,
  securityRoute,
  notificationsRoute,
  settingsRoute,
  integrationsRoute,
]);

export const router = createRouter({ routeTree, defaultPreload: "intent" });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
