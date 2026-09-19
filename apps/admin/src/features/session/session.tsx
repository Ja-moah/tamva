import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  ApiError,
  getMe,
  getVersion,
  login as apiLogin,
  logout as apiLogout,
  setActiveInstitution,
  setUnauthenticatedHandler,
} from "../../lib/api";
import { SessionContext, type Session, type SessionStatus } from "./use-session";

const STORAGE_KEY = "tamva.admin.institution";

function readStoredInstitution(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeInstitution(institutionId: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, institutionId);
  } catch {
    // Persistence is a convenience; the session works without it.
  }
}

// Session and version data are the only caches that survive a tenant switch.
const isTenantData = (key: readonly unknown[]) => key[0] !== "session" && key[0] !== "version";

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [chosen, setChosen] = useState<string | null>(readStoredInstitution);

  const identity = useQuery({
    queryKey: ["session", "identity"],
    queryFn: async ({ signal }) => {
      try {
        return await getMe(signal);
      } catch (error) {
        if (error instanceof ApiError && (error.isUnauthenticated || error.isForbidden)) return null;
        throw error;
      }
    },
    retry: false,
    staleTime: 60_000,
  });
  const version = useQuery({
    queryKey: ["version"],
    queryFn: ({ signal }) => getVersion(signal),
    staleTime: 10 * 60_000,
    retry: false,
  });

  const memberships = useMemo(() => identity.data?.memberships ?? [], [identity.data]);
  const institutionId = useMemo(() => {
    if (memberships.length === 0) return null;
    return memberships.some((m) => m.institution_id === chosen)
      ? chosen
      : memberships[0].institution_id;
  }, [memberships, chosen]);

  // Set before children render so their first requests already carry the tenant header.
  setActiveInstitution(institutionId);

  const context = useQuery({
    queryKey: ["session", "context", institutionId],
    queryFn: ({ signal }) => getMe(signal),
    enabled: institutionId !== null,
    retry: false,
    staleTime: 60_000,
  });

  useEffect(() => {
    setUnauthenticatedHandler(() => {
      void queryClient.invalidateQueries({ queryKey: ["session"] });
    });
    return () => setUnauthenticatedHandler(null);
  }, [queryClient]);

  const status: SessionStatus = (() => {
    if (identity.isError) return "error";
    if (identity.isPending) return "loading";
    if (identity.data === null) return "anonymous";
    if (institutionId === null) return "authenticated";
    if (context.isError) {
      const error = context.error;
      return error instanceof ApiError && error.isUnauthenticated ? "anonymous" : "error";
    }
    return context.isPending ? "loading" : "authenticated";
  })();

  const actor = context.data ?? (institutionId === null ? (identity.data ?? null) : null);
  const permissions = useMemo(() => actor?.permissions ?? [], [actor]);
  const institutionName =
    memberships.find((m) => m.institution_id === institutionId)?.institution_name ?? null;

  const selectInstitution = useCallback(
    (next: string) => {
      storeInstitution(next);
      setActiveInstitution(next);
      queryClient.removeQueries({ predicate: (query) => isTenantData(query.queryKey) });
      setChosen(next);
    },
    [queryClient],
  );

  const login = useCallback(
    async (identifier: string, password: string) => {
      await apiLogin({ identifier, password });
      await queryClient.invalidateQueries({ queryKey: ["session"] });
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setActiveInstitution(null);
      queryClient.clear();
      await queryClient.invalidateQueries({ queryKey: ["session"] });
    }
  }, [queryClient]);

  const value = useMemo<Session>(
    () => ({
      status,
      error: (identity.error ?? context.error) as Error | null,
      actor,
      version: version.data,
      institutionId,
      institutionName,
      memberships,
      permissions,
      can: (permission) => permissions.includes(permission),
      selectInstitution,
      login,
      logout,
      retry: () => {
        void identity.refetch();
        void context.refetch();
      },
    }),
    [
      status,
      identity,
      context,
      actor,
      version.data,
      institutionId,
      institutionName,
      memberships,
      permissions,
      selectInstitution,
      login,
      logout,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
