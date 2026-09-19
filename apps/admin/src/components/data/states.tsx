import type { UseQueryResult } from "@tanstack/react-query";
import { AlertTriangle, Inbox, Loader2, Lock, RefreshCw, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { ApiError } from "../../lib/api";
import { cn } from "../../lib/utils/cn";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

function Panel({
  icon,
  title,
  children,
  tone = "neutral",
  role,
  className,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  tone?: "neutral" | "danger";
  role?: "status" | "alert";
  className?: string;
}) {
  return (
    <Card role={role} className={cn("flex flex-col items-center gap-2 px-6 py-10 text-center", className)}>
      <div
        aria-hidden
        className={cn(
          "grid size-11 place-items-center rounded-xl border",
          tone === "danger"
            ? "border-[var(--risk-high-border)] bg-[var(--risk-high-bg)] text-[var(--risk-high-text)]"
            : "border-[var(--border-default)] bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)]",
        )}
      >
        {icon}
      </div>
      <h3 className="text-sm font-bold text-[var(--text-primary)]">{title}</h3>
      {children ? (
        <div className="max-w-md text-xs text-[var(--text-secondary)]">{children}</div>
      ) : null}
    </Card>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 py-16 text-xs font-semibold text-[var(--text-secondary)]"
    >
      <Loader2 className="size-4 animate-spin" aria-hidden />
      {label}
    </div>
  );
}

export function EmptyState({
  title = "Nothing to show",
  children,
  action,
}: {
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Panel icon={<Inbox className="size-5" aria-hidden />} title={title} role="status">
      {children}
      {action ? <div className="mt-3">{action}</div> : null}
    </Panel>
  );
}

export function UnauthorizedState({ what }: { what?: string }) {
  return (
    <Panel icon={<Lock className="size-5" aria-hidden />} title="You don't have access to this" role="alert">
      {what ? `${what} requires a permission your role does not include. ` : null}
      Ask an institution administrator to review your access in Team &amp; Access.
    </Panel>
  );
}

/** A professional "not yet" state for capabilities the backend reports as unavailable. */
export function UnavailableState({
  title,
  state = "NOT_AVAILABLE",
  children,
}: {
  title: string;
  state?: string;
  children?: ReactNode;
}) {
  return (
    <Panel
      icon={<Sparkles className="size-5" aria-hidden />}
      title={title}
      role="status"
    >
      <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
        {state === "DISABLED" ? "Disabled" : "Not available yet"}
      </p>
      {children}
    </Panel>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  if (error instanceof ApiError && error.isForbidden) return <UnauthorizedState />;
  const message =
    error instanceof ApiError
      ? error.status >= 500
        ? "The server had a problem handling this request."
        : error.message
      : "We couldn't reach the TAMVA API.";
  const requestId = error instanceof ApiError ? error.requestId : null;
  return (
    <Panel icon={<AlertTriangle className="size-5" aria-hidden />} title="Couldn't load this" tone="danger" role="alert">
      <p>{message}</p>
      {requestId ? (
        <p className="mt-1 font-mono text-[10px] text-[var(--text-muted)]">Request ID: {requestId}</p>
      ) : null}
      {onRetry ? (
        <Button size="sm" variant="secondary" className="mt-3" onClick={onRetry}>
          <RefreshCw className="size-3.5" aria-hidden /> Try again
        </Button>
      ) : null}
    </Panel>
  );
}

/** Renders loading / error / empty for a query, and `children(data)` otherwise. */
export function QueryBoundary<T>({
  query,
  isEmpty,
  empty,
  children,
}: {
  query: UseQueryResult<T>;
  isEmpty?: (data: T) => boolean;
  empty?: ReactNode;
  children: (data: T) => ReactNode;
}) {
  if (query.isPending) return <LoadingState />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (isEmpty?.(query.data)) return <>{empty ?? <EmptyState />}</>;
  return <>{children(query.data)}</>;
}
