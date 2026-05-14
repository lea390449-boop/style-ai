import { createFileRoute, Outlet, Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Sparkles, Shirt, Camera, ShoppingBag, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";

export const Route = createFileRoute("/app")({ component: AppShell });

const TITLES: Record<string, string> = {
  "/app": "Stylist",
  "/app/wardrobe": "Closet",
  "/app/try-on": "Try-on",
  "/app/shop": "Shop",
};

const tabs = [
  { to: "/app", label: "Stylist", icon: Sparkles, exact: true },
  { to: "/app/wardrobe", label: "Closet", icon: Shirt },
  { to: "/app/try-on", label: "Try-on", icon: Camera },
  { to: "/app/shop", label: "Shop", icon: ShoppingBag },
] as const;

function AppShell() {
  const { user, loading, signOut } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);

  if (loading || !user) {
    return <div className="flex min-h-dvh items-center justify-center text-muted-foreground">Loading…</div>;
  }

  const title = TITLES[loc.pathname] ?? "Alta";

  return (
    <div className="min-h-dvh bg-gradient-blush md:bg-gradient-to-br md:from-petal/40 md:via-blush md:to-cream">
      {/* Phone-shaped frame */}
      <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-background shadow-soft md:my-6 md:min-h-[calc(100dvh-3rem)] md:rounded-[2.5rem] md:overflow-hidden md:border md:border-border">
        {/* Top app bar */}
        <header
          className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-background/85 px-5 backdrop-blur-xl"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.875rem)", paddingBottom: "0.875rem" }}
        >
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Alta</p>
            <h1 className="font-display text-2xl leading-none">{title}</h1>
          </div>
          <button
            onClick={() => signOut().then(() => nav({ to: "/" }))}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-secondary"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-5 pt-5" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 6rem)" }}>
          <Outlet />
        </main>

        {/* Bottom tab bar */}
        <nav
          className="sticky bottom-0 z-30 border-t border-border/60 bg-background/95 px-3 pt-2 backdrop-blur-xl"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
        >
          <div className="flex items-center justify-around">
            {tabs.map((t) => {
              const active = t.exact ? loc.pathname === t.to : loc.pathname.startsWith(t.to);
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-medium tracking-wide transition ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <span className={`flex h-10 w-10 items-center justify-center rounded-2xl transition ${active ? "bg-gradient-blush shadow-petal" : ""}`}>
                    <t.icon className={`h-[18px] w-[18px] ${active ? "text-plum" : ""}`} />
                  </span>
                  {t.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
