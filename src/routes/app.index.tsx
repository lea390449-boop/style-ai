import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { stylistChat } from "@/lib/ai.functions";

export const Route = createFileRoute("/app/")({ component: StylistChat });

type Msg = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "What should I wear to dinner tonight?",
  "Help me style my white tee 5 ways.",
  "Build me a capsule wardrobe for spring.",
  "What goes with high-waisted jeans?",
];

function StylistChat() {
  const { user } = useAuth();
  const chat = useServerFn(stylistChat);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("chat_messages").select("*").eq("user_id", user.id).order("created_at").limit(50)
      .then(({ data }) => {
        if (data) setMessages(data.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })));
      });
  }, [user]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || busy || !user) return;
    setBusy(true);
    const userMsg: Msg = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    // Wardrobe context
    const { data: items } = await supabase.from("wardrobe_items").select("name,category,color").eq("user_id", user.id).limit(40);
    const wardrobeContext = items?.length ? items.map((i) => `- ${i.color ?? ""} ${i.name} (${i.category})`).join("\n") : undefined;

    await supabase.from("chat_messages").insert({ user_id: user.id, role: "user", content: text });

    try {
      const { reply, error } = await chat({ data: { messages: [...messages, userMsg], wardrobeContext } });
      if (error) toast.error(reply);
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      await supabase.from("chat_messages").insert({ user_id: user.id, role: "assistant", content: reply });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="flex h-[calc(100vh-180px)] flex-col">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Stylist</p>
        <h1 className="font-display text-4xl">Hi, I'm Alta.</h1>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto rounded-3xl bg-secondary/30 p-5">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-mauve">
              <Sparkles className="h-7 w-7 text-primary-foreground" />
            </div>
            <p className="max-w-sm text-muted-foreground">Tell me about an occasion, an outfit you love, or what you're feeling. Try one of these:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {STARTERS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground transition hover:bg-card hover:text-foreground">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${m.role === "user" ? "bg-foreground text-background" : "bg-card shadow-petal"}`}>
              <div className="prose prose-sm max-w-none prose-strong:text-current prose-p:my-1.5">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {busy && <div className="text-sm italic text-muted-foreground">Alta is thinking…</div>}
        <div ref={endRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="mt-4 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask your stylist…" className="flex-1 rounded-full border border-input bg-background px-5 py-3.5 text-sm outline-none focus:border-primary" />
        <button disabled={busy || !input.trim()} className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background disabled:opacity-40">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
