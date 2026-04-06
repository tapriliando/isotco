import type { ReactNode } from "react";

type MarketingShellProps = {
  children: ReactNode;
};

/** Centered layout for Index / Login with soft depth behind the glass card. */
export function MarketingShell({ children }: MarketingShellProps) {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center px-6 py-16">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      </div>
      <div className="relative z-10 w-full max-w-lg">{children}</div>
    </main>
  );
}
