import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { Bell, Fingerprint, Landmark, Settings, ShieldCheck, Stamp, UserRound } from "lucide-react";
import { lazy } from "react";

import { CustomerShell } from "./components/customer-shell";

const HomePage = lazy(() =>
  import("./pages/home-page").then((module) => ({ default: module.HomePage })),
);
const CustomerSectionPage = lazy(() =>
  import("./pages/customer-section-page").then((module) => ({ default: module.CustomerSectionPage })),
);

const rootRoute = createRootRoute({ component: CustomerShell });
const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: HomePage });

const sections = [
  { path: "/activity", title: "Financial activity", description: "View normalized activity delivered by the backend ledger API.", icon: Landmark },
  { path: "/profile", title: "Financial profile", description: "Review backend-calculated financial identity and profile information.", icon: UserRound },
  { path: "/consent", title: "Consent", description: "Manage valid purposes and institution access through the consent service.", icon: Fingerprint },
  { path: "/passport", title: "TAMVA Passport", description: "Access portable, permission-controlled financial identity capabilities.", icon: Stamp },
  { path: "/protection", title: "Protection", description: "Review protection status and backend-generated security guidance.", icon: ShieldCheck },
  { path: "/notifications", title: "Notifications", description: "Receive important consent, account, passport, and protection updates.", icon: Bell },
  { path: "/settings", title: "Settings", description: "Manage customer preferences without duplicating backend identity rules.", icon: Settings },
] as const;

const sectionRoutes = sections.map(({ path, title, description, icon }) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path,
    component: () => <CustomerSectionPage title={title} description={description} icon={icon} />,
  }),
);

const routeTree = rootRoute.addChildren([homeRoute, ...sectionRoutes]);

export const router = createRouter({ routeTree, defaultPreload: "intent" });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
