import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Bookmark, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useLocalState, localKeys, type BoardLocal, type LookLocal } from "@/lib/local-store";

export const Route = createFileRoute("/app/boards")({ component: BoardsPage });

function BoardsPage() {
  const [boards, setBoards] = useLocalState<BoardLocal[]>(localKeys.boards, []);
  const [looks] = useLocalState<LookLocal[]>(localKeys.looks, []);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  const open = boards.find((b) => b.id === openId) ?? null;

  const createBoard = () => {
    if (!name.trim()) return;
    const b: BoardLocal = { id: crypto.randomUUID(), name: name.trim(), looks: [], createdAt: Date.now() };
    setBoards([b, ...boards]);
    setName("");
    setCreating(false);
    toast.success("Board created");
  };

  const remove = (id: string) => {
    setBoards(boards.filter((b) => b.id !== id));
    if (openId === id) setOpenId(null);
  };

  const addLook = (boardId: string, look: LookLocal) => {
    setBoards(boards.map((b) => b.id === boardId
      ? { ...b, looks: b.looks.some((l) => l.id === look.id) ? b.looks : [look, ...b.looks], cover: b.cover ?? look.result_url }
      : b));
    toast.success("Saved to board");
  };

  const removeLook = (boardId: string, lookId: string) => {
    setBoards(boards.map((b) => b.id === boardId ? { ...b, looks: b.looks.filter((l) => l.id !== lookId) } : b));
  };

  if (open) {
    const unsaved = looks.filter((l) => !open.looks.some((x) => x.id === l.id));
    return (
      <div className="space-y-5">
        <button onClick={() => setOpenId(null)} className="text-xs text-muted-foreground">← Back to boards</button>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">{open.name}</h2>
          <button onClick={() => remove(open.id)} className="rounded-full p-2 text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {open.looks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No looks saved yet. Add some from your try-ons below.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {open.looks.map((l) => (
              <div key={l.id} className="group relative overflow-hidden rounded-2xl bg-card shadow-petal">
                <img src={l.result_url} alt="" className="aspect-[3/4] w-full object-cover" />
                <button onClick={() => removeLook(open.id, l.id)} className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 opacity-0 transition group-hover:opacity-100">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {unsaved.length > 0 && (
          <div className="space-y-2 pt-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Add from try-ons</p>
            <div className="grid grid-cols-3 gap-2">
              {unsaved.map((l) => (
                <button key={l.id} onClick={() => addLook(open.id, l)} className="relative overflow-hidden rounded-xl">
                  <img src={l.result_url} alt="" className="aspect-[3/4] w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition hover:bg-foreground/40">
                    <Plus className="h-5 w-5 text-background opacity-0 transition hover:opacity-100" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Save and plan outfits.</p>
        <button onClick={() => setCreating(true)} className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs text-background">
          <Plus className="h-3.5 w-3.5" /> New
        </button>
      </div>

      {creating && (
        <div className="flex gap-2 rounded-2xl bg-card p-3 shadow-petal">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createBoard()}
            placeholder="e.g. Spring capsule, Italy trip…"
            className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm outline-none focus:border-primary"
          />
          <button onClick={createBoard} className="rounded-full bg-foreground px-4 py-2 text-xs text-background">Create</button>
          <button onClick={() => { setCreating(false); setName(""); }} className="rounded-full px-3 text-xs text-muted-foreground">Cancel</button>
        </div>
      )}

      {boards.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-gradient-blush py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background/80">
            <Bookmark className="h-6 w-6 text-plum" />
          </div>
          <p className="font-display text-xl text-plum">No boards yet</p>
          <p className="max-w-[16rem] text-sm text-plum/70">Create a board to collect outfits for a trip, season, or vibe.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {boards.map((b) => (
            <button key={b.id} onClick={() => setOpenId(b.id)} className="group overflow-hidden rounded-2xl bg-card text-left shadow-petal">
              <div className="aspect-square w-full overflow-hidden bg-gradient-blush">
                {b.cover ? <img src={b.cover} alt="" className="h-full w-full object-cover transition group-hover:scale-105" /> : (
                  <div className="flex h-full items-center justify-center"><Bookmark className="h-6 w-6 text-plum/40" /></div>
                )}
              </div>
              <div className="px-3 py-2.5">
                <p className="truncate font-medium">{b.name}</p>
                <p className="text-[11px] text-muted-foreground">{b.looks.length} {b.looks.length === 1 ? "look" : "looks"}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
