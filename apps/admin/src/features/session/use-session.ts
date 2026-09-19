import type { ActorContext, VersionInfo } from "@tamva/client-contracts";
import { createContext, useContext } from "react";

export type SessionStatus = "loading" | "anonymous" | "authenticated" | "error";

export interface Session {
  status: SessionStatus;
  error: Error | null;
  actor: ActorContext | null;
  version: VersionInfo | undefined;
  institutionId: string | null;
  institutionName: string | null;
  memberships: ActorContext["memberships"];
  permissions: readonly string[];
  /** UI hint only: the backend re-checks every request. */
  can: (permission: string) => boolean;
  selectInstitution: (institutionId: string) => void;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  retry: () => void;
}

export const SessionContext = createContext<Session | null>(null);

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession must be used inside <SessionProvider>");
  return session;
}
