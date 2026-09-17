import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { lazy } from "react";

import { AppShell } from "../components/layout/app-shell";

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

const rootRoute = createRootRoute({ component: AppShell });

const overviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: OverviewPage,
});

const riskRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/risk-events",
  component: RiskPage,
});

const caseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cases",
  component: CasesPage,
});

const customerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/customers",
  component: CustomersPage,
});

const networkRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/network",
  component: NetworkPage,
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
