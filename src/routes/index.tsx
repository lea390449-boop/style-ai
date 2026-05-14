import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Shirt, Camera, ShoppingBag } from "lucide-react";
import { Logo } from "@/components/Logo";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="absolute top-0 z-10 flex w-full items-center justify-between px-6 py-6 md:px-12">
        <Logo />
        <Link to="/auth" className="rounded-full border border-foreground/20 px-5 py-2 text-sm font-medium backdrop-blur transition hover:bg-foreground hover:text-background">
          Sign in
        </Link>
      </header>

      {/* Hero */}
      <section className="relative grid min-h-screen md:grid-cols-2">
        <div className="flex flex-col justify-center px-6 pt-28 pb-16 md:px-16 md:pt-0">
          <span className="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-secondary-foreground">
            <Sparkles className="h-3 w-3" /> AI Stylist
          </span>
          <h1 className="font-display text-5xl leading-[0.95] text-balance md:text-7xl lg:text-8xl">
            Your closet,<br/>
            <em className="text-primary">reimagined.</em>
          </h1>
          <p className="mt-6 max-w-md text-lg text-muted-foreground text-balance">
            Meet Alta — the AI stylist who knows your wardrobe, builds outfits for any occasion, and lets you try on looks before you wear them.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/auth" className="rounded-full bg-foreground px-7 py-3.5 text-sm font-medium text-background shadow-soft transition hover:opacity-90">
              Start styling
            </Link>
            <Link to="/auth" className="rounded-full border border-foreground/20 px-7 py-3.5 text-sm font-medium transition hover:bg-secondary">
              Explore the shop
            </Link>
          </div>
        </div>
        <div className="relative hidden overflow-hidden md:block">
          <img src={hero} alt="Alta editorial" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-tr from-background/40 via-transparent to-transparent" />
        </div>
        <div className="relative h-[60vh] overflow-hidden md:hidden">
          <img src={hero} alt="" className="h-full w-full object-cover" />
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-secondary/30 px-6 py-24 md:px-16">
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">Four ways to wear it</p>
          <h2 className="font-display text-4xl md:text-5xl text-balance">A complete styling studio in your pocket.</h2>
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Sparkles, title: "AI Stylist Chat", body: "Ask anything — what to wear to brunch, how to layer, what to pair with denim. Alta replies like a friend who reads Vogue." },
              { icon: Shirt, title: "Digital Wardrobe", body: "Snap your closet. Tag pieces by color and category. Alta builds outfits from what you already own." },
              { icon: Camera, title: "Virtual Try-On", body: "Upload a photo of yourself, pick an item, and see how it looks on you in seconds." },
              { icon: ShoppingBag, title: "Curated Shop", body: "Editorial picks chosen to play nicely with what's already in your closet." },
            ].map((f) => (
              <div key={f.title} className="group rounded-3xl bg-card p-7 transition hover:shadow-petal">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-blush">
                  <f.icon className="h-5 w-5 text-plum" />
                </div>
                <h3 className="font-display text-2xl">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-28 md:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-5xl md:text-6xl text-balance">
            Get dressed, <em className="text-primary">effortlessly.</em>
          </h2>
          <p className="mt-5 text-muted-foreground">Free to start. No credit card. Just better outfits.</p>
          <Link to="/auth" className="mt-8 inline-block rounded-full bg-foreground px-8 py-4 text-sm font-medium text-background shadow-soft">
            Create your account
          </Link>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-10 md:px-16">
        <div className="mx-auto flex max-w-6xl items-center justify-between text-xs text-muted-foreground">
          <Logo className="text-lg" />
          <p>© 2026 Alta</p>
        </div>
      </footer>
    </div>
  );
}
