import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { Sparkles, Shirt, Camera, Bookmark } from "lucide-react";

export const Route = createFileRoute("/app")({ component: AppShell });

const TITLES: Record<string, string> = {
  "/app": "Stylist",
  "/app/wardrobe": "Closet",
  "/app/try-on": "Try-on",
  "/app/boards": "Boards",
  "/app/welcome": "Welcome",
};

const tabs: ReadonlyArray<{ to: "/app" | "/app/wardrobe" | "/app/try-on" | "/app/boards"; label: string; icon: typeof Sparkles; exact?: boolean }> = [
  { to: "/app", label: "Stylist", icon: Sparkles, exact: true },
  { to: "/app/wardrobe", label: "Closet", icon: Shirt },
  { to: "/app/try-on", label: "Try-on", icon: Camera },
  { to: "/app/boards", label: "Boards", icon: Bookmark },
];

function AppShell() {
  const loc = useLocation();
  const title = TITLES[loc.pathname] ?? "Alta";

  return (
    <div className="min-h-dvh bg-gradient-blush md:bg-gradient-to-br md:from-petal/40 md:via-blush md:to-cream">
      <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-background shadow-soft md:my-6 md:min-h-[calc(100dvh-3rem)] md:rounded-[2.5rem] md:overflow-hidden md:border md:border-border">
        <header
          className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-background/85 px-5 backdrop-blur-xl"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.875rem)", paddingBottom: "0.875rem" }}
        >
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Alta</p>
            <h1 className="font-display text-2xl leading-none">{title}</h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-5 pt-5" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 6rem)" }}>
          <Outlet />
        </main>

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
