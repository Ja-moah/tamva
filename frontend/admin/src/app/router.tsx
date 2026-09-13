import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { Activity, BriefcaseBusiness, Network, Users } from "lucide-react";
import { lazy } from "react";

import { AppShell } from "../components/layout/app-shell";

const OverviewPage = lazy(() =>
  import("../routes/overview-page").then((module) => ({ default: module.OverviewPage })),
);
const DomainPage = lazy(() =>
  import("../routes/domain-page").then((module) => ({ default: module.DomainPage })),
);

const rootRoute = createRootRoute({ component: AppShell });

const overviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: OverviewPage,
});

const riskRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/risk-events",
  component: () => (
    <DomainPage
      title="Risk events"
      description="Review risk decisions and reason codes produced by the backend risk domain."
      icon={Activity}
    />
  ),
});

const caseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cases",
  component: () => (
    <DomainPage
      title="Cases"
      description="Investigate alerts through backend-controlled case states, assignments, and evidence."
      icon={BriefcaseBusiness}
    />
  ),
});

const customerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/customers",
  component: () => (
    <DomainPage
      title="Customers"
      description="Access institution-authorized customer identity and financial profile views."
      icon={Users}
    />
  ),
});

const networkRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/network",
  component: () => (
    <DomainPage
      title="Trust network"
      description="Explore reviewed entity relationships when the graph domain publishes its API."
      icon={Network}
    />
  ),
});

const routeTree = rootRoute.addChildren([
  overviewRoute,
  riskRoute,
  caseRoute,
  customerRoute,
  networkRoute,
]);

export const router = createRouter({ routeTree, defaultPreload: "intent" });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
