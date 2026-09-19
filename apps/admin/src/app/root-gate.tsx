import { LogOut } from "lucide-react";

import { AppShell } from "../components/layout/app-shell";
import { Button } from "../components/ui/button";
import { ErrorState, LoadingState } from "../components/data/states";
import { useSession } from "../features/session/use-session";
import { LoginPage } from "../routes/login-page";

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--bg-canvas)] px-4 text-[var(--text-primary)]">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}

/** Decides what the whole app shows: loading, sign-in, an error, or the console. */
export function RootGate() {
  const session = useSession();

  if (session.status === "loading") {
    return (
      <Centered>
        <LoadingState label="Checking your session…" />
      </Centered>
    );
  }
  if (session.status === "error") {
    return (
      <Centered>
        <ErrorState error={session.error} onRetry={session.retry} />
      </Centered>
    );
  }
  if (session.status === "anonymous") return <LoginPage />;

  if (session.memberships.length === 0) {
    return (
      <Centered>
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 text-center">
          <h1 className="text-base font-extrabold">No institution access</h1>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">
            {session.actor?.user.email} isn't an active member of any institution. Ask an
            administrator to add you.
          </p>
          <Button className="mt-4" variant="secondary" onClick={() => void session.logout()}>
            <LogOut className="size-4" aria-hidden /> Sign out
          </Button>
        </div>
      </Centered>
    );
  }
  return <AppShell />;
}
