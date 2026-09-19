import type { ReactNode } from "react";

import { useCapabilityState } from "../../features/capabilities/use-capabilities";
import { useSession } from "../../features/session/use-session";
import { StatusBadge } from "../feedback/status-badge";
import { LoadingState, UnauthorizedState, UnavailableState } from "./states";

/** Hides UI the actor cannot use. The backend still enforces every request. */
export function PermissionGate({
  permission,
  what,
  children,
}: {
  permission: string | null;
  what?: string;
  children: ReactNode;
}) {
  const { can } = useSession();
  if (permission && !can(permission)) return <UnauthorizedState what={what} />;
  return <>{children}</>;
}

/**
 * AVAILABLE renders children. PARTIAL renders them with an explicit note about
 * what is missing. NOT_AVAILABLE / DISABLED render an unavailable state instead
 * of mocked content.
 */
export function CapabilityGate({
  code,
  title,
  partialNote,
  children,
  unavailable,
}: {
  code: string;
  title: string;
  partialNote?: string;
  children: ReactNode;
  unavailable?: ReactNode;
}) {
  const { state, isLoading } = useCapabilityState(code);
  if (isLoading) return <LoadingState />;
  if (state === "NOT_AVAILABLE" || state === "DISABLED") {
    return <UnavailableState title={title} state={state}>{unavailable}</UnavailableState>;
  }
  return (
    <>
      {state === "PARTIAL" && partialNote ? (
        <div className="mb-3">
          <StatusBadge tone="warning" size="sm">
            Partial: {partialNote}
          </StatusBadge>
        </div>
      ) : null}
      {children}
    </>
  );
}
