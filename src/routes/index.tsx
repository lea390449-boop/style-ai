import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({ component: Splash });

function Splash() {
  return (
    <div className="min-h-dvh bg-gradient-blush md:bg-gradient-to-br md:from-petal/40 md:via-blush md:to-cream">
      <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-background shadow-soft md:my-6 md:min-h-[calc(100dvh-3rem)] md:rounded-[2.5rem] md:overflow-hidden md:border md:border-border">
        <div className="relative flex-1 overflow-hidden">
          <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background" />
          <div className="relative flex h-full flex-col justify-end p-7" style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.75rem)" }}>
            <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-background/90 px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] backdrop-blur">
              <Sparkles className="h-3 w-3 text-mauve" /> AI Stylist
            </span>
            <h1 className="font-display text-6xl leading-[0.92] text-balance">
              Your closet,<br />
              <em className="text-primary">reimagined.</em>
            </h1>
            <p className="mt-4 max-w-sm text-base text-foreground/80">
              Meet Alta — the AI stylist who knows your wardrobe and renders <em>you</em> in every look.
            </p>
          </div>
        </div>
        <div
          className="space-y-3 px-7 pt-5"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.75rem)" }}
        >
          <Link to="/app" className="block rounded-full bg-foreground py-4 text-center text-sm font-medium text-background shadow-soft">
            Open Alta
          </Link>
          <p className="text-center text-[11px] text-muted-foreground">No account, no fees. Your closet stays on your device.</p>
        </div>
      </div>
    </div>
  );
}
