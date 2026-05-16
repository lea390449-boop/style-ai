import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({ component: Splash });

function Splash() {
  return (
    <div className="min-h-dvh bg-gradient-blush md:bg-gradient-to-br md:from-petal/40 md:via-blush md:to-cream">
      <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-background shadow-soft md:my-6 md:min-h-[calc(100dvh-3rem)] md:rounded-[2.5rem] md:overflow-hidden md:border md:border-border">
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center" style={{ paddingTop: "calc(env(safe-area-inset-top) + 2rem)" }}>
          <div className="mb-10 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-mauve shadow-petal">
            <Sparkles className="h-9 w-9 text-primary-foreground" />
          </div>
          <h1 className="font-display text-6xl leading-[0.95] tracking-tight">
            Alta
          </h1>
          <p className="mt-5 max-w-[18rem] text-base text-foreground/70">
            Your AI stylist. Your closet, reimagined.
          </p>
        </div>

        <div
          className="space-y-4 px-8 pt-6"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 2rem)" }}
        >
          <Link to="/app" className="block rounded-full bg-foreground py-4 text-center text-sm font-medium text-background shadow-soft">
            Get started
          </Link>
          <p className="text-center text-[11px] text-muted-foreground">No account. No fees. Stays on your device.</p>
        </div>
      </div>
    </div>
  );
}
