import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { stylistChat } from "@/lib/ai.functions";
import { useLocalState, localKeys, type WardrobeItem, type ChatMsg } from "@/lib/local-store";

export const Route = createFileRoute("/app/")({ component: StylistChat });

const STARTERS = [
  "What should I wear to dinner tonight?",
  "Help me style my white tee 5 ways.",
  "Build me a capsule wardrobe for spring.",
  "What goes with high-waisted jeans?",
];

function StylistChat() {
  const chat = useServerFn(stylistChat);
  const [messages, setMessages] = useLocalState<ChatMsg[]>(localKeys.chat, []);
  const [wardrobe] = useLocalState<WardrobeItem[]>(localKeys.wardrobe, []);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    setBusy(true);
    const userMsg: ChatMsg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");

    const wardrobeContext = wardrobe.length
      ? wardrobe.map((i) => `- ${i.color ?? ""} ${i.name} (${i.category})`).join("\n")
      : undefined;

    try {
      const { reply, error } = await chat({ data: { messages: next, wardrobeContext } });
      if (error) toast.error(reply);
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="flex h-[calc(100dvh-13rem)] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto rounded-3xl bg-gradient-blush p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-mauve shadow-petal">
              <Sparkles className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <p className="font-display text-2xl text-plum">Hi, I'm Alta.</p>
              <p className="mt-1 px-4 text-sm text-plum/70">Tell me about an occasion, an outfit you love, or what you're feeling.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 px-2">
              {STARTERS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full bg-card/90 px-3 py-2 text-xs text-plum shadow-petal">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${m.role === "user" ? "rounded-br-md bg-foreground text-background" : "rounded-bl-md bg-card shadow-petal"}`}>
              <div className="prose prose-sm max-w-none prose-strong:text-current prose-p:my-1.5">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {busy && <div className="text-xs italic text-plum/70">Alta is thinking…</div>}
        <div ref={endRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="mt-3 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask your stylist…" className="flex-1 rounded-full border border-input bg-background px-5 py-3.5 text-sm outline-none focus:border-primary" />
        <button disabled={busy || !input.trim()} className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background disabled:opacity-40">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
