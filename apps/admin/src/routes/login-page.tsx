import { Loader2 } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";

import { TamvaLogo } from "../components/brand/tamva-logo";
import { StatusBadge } from "../components/feedback/status-badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useSession } from "../features/session/use-session";
import { ApiError } from "../lib/api";

function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) return "Too many attempts. Wait a minute and try again.";
    if (error.status === 400) return "That email/username and password don't match an active account.";
    if (error.status >= 500) return "TAMVA had a problem signing you in. Try again shortly.";
    return error.message;
  }
  return "We couldn't reach TAMVA. Check your connection and try again.";
}

export function LoginPage() {
  const { login, version } = useSession();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(identifier.trim(), password);
    } catch (caught) {
      setError(caught);
      setSubmitting(false);
    }
  };

  const field =
    "mt-1 h-10 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]";

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--bg-canvas)] px-4 text-[var(--text-primary)]">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-5 flex items-center justify-between">
          <TamvaLogo className="h-8" />
          {version ? (
            <StatusBadge tone={version.environment === "production" ? "success" : "info"} size="sm">
              {version.environment}
            </StatusBadge>
          ) : null}
        </div>
        <h1 className="text-lg font-extrabold">Sign in to TAMVA</h1>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Institutional operations console. Use your institution account.
        </p>
        <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
          <div>
            <label htmlFor="identifier" className="text-xs font-bold">
              Email or username
            </label>
            <input
              id="identifier"
              autoComplete="username"
              required
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className={field}
            />
          </div>
          <div>
            <label htmlFor="password" className="text-xs font-bold">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={field}
            />
          </div>
          {error ? (
            <p role="alert" className="rounded-lg border border-[var(--risk-high-border)] bg-[var(--risk-high-bg)] px-3 py-2 text-xs text-[var(--risk-high-text)]">
              {loginErrorMessage(error)}
              {error instanceof ApiError && error.requestId ? (
                <span className="mt-0.5 block font-mono text-[10px] opacity-80">Request ID: {error.requestId}</span>
              ) : null}
            </p>
          ) : null}
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={submitting || !identifier || !password}>
            {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Sign in
          </Button>
        </form>
      </Card>
    </main>
  );
}
