import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) nav({ to: "/app" }); }, [user, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "sign-up") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/app` },
        });
        if (error) throw error;
        toast.success("Welcome to Alta — check your inbox to confirm.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally { setBusy(false); }
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/app` });
    if (r.error) toast.error(r.error.message);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-blush px-6">
      <div className="w-full max-w-md rounded-3xl bg-card p-10 shadow-soft">
        <div className="mb-8 text-center">
          <Logo className="text-3xl" />
          <h1 className="mt-6 font-display text-3xl">{mode === "sign-in" ? "Welcome back" : "Create your studio"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your stylist is ready when you are.</p>
        </div>

        <button onClick={google} className="mb-5 flex w-full items-center justify-center gap-3 rounded-full border border-border bg-background py-3 text-sm font-medium transition hover:bg-secondary">
          <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h5.9c-.3 1.4-1 2.6-2.2 3.4v2.8h3.6c2.1-1.9 3.2-4.8 3.2-8.3z"/><path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.6-2.8c-1 .7-2.3 1.1-3.6 1.1-2.8 0-5.1-1.9-6-4.4H2.4v2.8C4.2 20.6 7.8 23 12 23z"/><path fill="#FBBC05" d="M6 14.3c-.2-.7-.4-1.4-.4-2.3s.1-1.6.4-2.3V6.9H2.4C1.5 8.4 1 10.1 1 12s.5 3.6 1.4 5.1L6 14.3z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3 .5 4.1 1.6l3.1-3.1C17.4 2.1 14.9 1 12 1 7.8 1 4.2 3.4 2.4 6.9L6 9.7c.9-2.5 3.2-4.3 6-4.3z"/></svg>
          Continue with Google
        </button>

        <div className="relative my-5 text-center text-xs text-muted-foreground">
          <span className="relative z-10 bg-card px-3">or</span>
          <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="Email" className="w-full rounded-full border border-input bg-background px-5 py-3 text-sm outline-none focus:border-primary" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={6} placeholder="Password" className="w-full rounded-full border border-input bg-background px-5 py-3 text-sm outline-none focus:border-primary" />
          <button disabled={busy} className="w-full rounded-full bg-foreground py-3 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50">
            {busy ? "..." : mode === "sign-in" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "sign-in" ? "New here?" : "Already have an account?"}{" "}
          <button onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")} className="font-medium text-primary underline-offset-4 hover:underline">
            {mode === "sign-in" ? "Create account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
