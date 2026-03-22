import type { ReactNode } from "react";
import { requireAuth } from "@/lib/auth";
import Link from "next/link";

// Simple server component logout button - uses form action
function LogoutButton() {
  return (
    <form action="/api/auth/logout" method="post">
      <button className="text-zinc-300 hover:text-white" type="submit">
        Logout
      </button>
    </form>
  );
}

export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireAuth();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800 bg-zinc-950/60 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-600" />
            <div>
              <div className="font-semibold leading-tight">Command Center</div>
              <div className="text-xs text-zinc-400 leading-tight">OpenClaw overview</div>
            </div>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link className="text-zinc-200 hover:text-white" href="/dashboard">
              Dashboard
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

      <footer className="mx-auto max-w-6xl px-4 py-10 text-xs text-zinc-500">
        Built for OpenClaw • add tools via /api/* endpoints
      </footer>
    </div>
  );
}
