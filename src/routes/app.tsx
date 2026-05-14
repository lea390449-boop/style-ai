import { createFileRoute, Outlet, redirect, Link, useLocation } from "@tanstack/react-router";
import { Sparkles, Shirt, Camera, ShoppingBag, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/Logo";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/app")({ component: AppShell });

const tabs: { to: string; label: string; icon: typeof Sparkles; exact?: boolean }[] = [
  { to: "/app", label: "Stylist", icon: Sparkles, exact: true },
  { to: "/app/wardrobe", label: "Wardrobe", icon: Shirt },
  { to: "/app/try-on", label: "Try-on", icon: Camera },
  { to: "/app/shop", label: "Shop", icon: ShoppingBag },
];

function AppShell() {
  const { user, loading, signOut } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/80 px-5 py-4 backdrop-blur md:px-10">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {tabs.map((t) => {
            const active = t.exact ? loc.pathname === t.to : loc.pathname.startsWith(t.to);
            return (
              <Link key={t.to} to={t.to} className={`rounded-full px-4 py-2 text-sm transition ${active ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {t.label}
              </Link>
            );
          })}
        </nav>
        <button onClick={() => signOut().then(() => nav({ to: "/" }))} className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs hover:bg-secondary">
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 md:px-10">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-card/95 p-1.5 shadow-soft backdrop-blur md:hidden">
        {tabs.map((t) => {
          const active = t.exact ? loc.pathname === t.to : loc.pathname.startsWith(t.to);
          return (
            <Link key={t.to} to={t.to} className={`flex flex-col items-center gap-0.5 rounded-full px-4 py-2 text-[10px] ${active ? "bg-foreground text-background" : "text-muted-foreground"}`}>
              <t.icon className="h-4 w-4" />
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
