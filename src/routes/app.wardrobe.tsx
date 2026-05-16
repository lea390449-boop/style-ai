import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useLocalState, localKeys, fileToDataUrl, type WardrobeItem } from "@/lib/local-store";

export const Route = createFileRoute("/app/wardrobe")({ component: Wardrobe });

const CATEGORIES = ["tops", "bottoms", "dresses", "outerwear", "shoes", "accessories", "bags", "jewelry", "other"];

function guessCategory(name: string): string {
  const n = name.toLowerCase();
  if (/(shoe|sneaker|boot|heel|sandal|loafer)/.test(n)) return "shoes";
  if (/(bag|tote|purse|clutch|backpack)/.test(n)) return "bags";
  if (/(ring|necklace|earring|bracelet|chain|jewel)/.test(n)) return "jewelry";
  if (/(coat|jacket|blazer|parka|trench)/.test(n)) return "outerwear";
  if (/(dress|gown)/.test(n)) return "dresses";
  if (/(pant|jean|trouser|skirt|short)/.test(n)) return "bottoms";
  if (/(belt|hat|scarf|sunglass|watch)/.test(n)) return "accessories";
  return "tops";
}

type Draft = { id: string; file: File; preview: string; name: string; category: string; color: string };

function Wardrobe() {
  const [items, setItems] = useLocalState<WardrobeItem[]>(localKeys.wardrobe, []);
  const [drafts, setDrafts] = useState<Draft[]>([]);

  const remove = (id: string) => setItems((s) => s.filter((i) => i.id !== id));

  const onFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const arr: Draft[] = [];
    for (const file of Array.from(files)) {
      const preview = await fileToDataUrl(file);
      const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
      arr.push({
        id: crypto.randomUUID(),
        file,
        preview,
        name: baseName || "New piece",
        category: guessCategory(baseName),
        color: "",
      });
    }
    setDrafts((d) => [...d, ...arr]);
  };

  const updateDraft = (id: string, patch: Partial<Draft>) =>
    setDrafts((d) => d.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const removeDraft = (id: string) => setDrafts((d) => d.filter((x) => x.id !== id));

  const saveAll = () => {
    if (!drafts.length) return;
    const newItems: WardrobeItem[] = drafts.map((d) => ({
      id: crypto.randomUUID(),
      name: d.name.trim() || "Untitled",
      category: d.category,
      color: d.color.trim() || null,
      image_url: d.preview,
    }));
    setItems((s) => [...newItems, ...s]);
    toast.success(`Added ${newItems.length} ${newItems.length === 1 ? "piece" : "pieces"}.`);
    setDrafts([]);
  };

  return (
    <div className="relative pb-4">
      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-gradient-blush py-16 text-center">
          <p className="font-display text-2xl text-plum">Your closet is empty.</p>
          <p className="mt-2 px-6 text-sm text-plum/70">Tap + to add one piece, or a whole stack at once.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map((i) => (
            <div key={i.id} className="group relative overflow-hidden rounded-3xl bg-card shadow-petal">
              <div className="aspect-square overflow-hidden bg-secondary">
                {i.image_url ? <img src={i.image_url} alt={i.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>}
              </div>
              <div className="p-2.5">
                <p className="truncate text-sm font-medium">{i.name}</p>
                <p className="text-[11px] text-muted-foreground capitalize">{i.color ? `${i.color} · ` : ""}{i.category}</p>
              </div>
              <button onClick={() => remove(i.id)} className="absolute top-2 right-2 rounded-full bg-background/90 p-2 opacity-0 transition group-hover:opacity-100 active:opacity-100">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <label
        className="fixed bottom-24 right-[calc(50vw-220px)] z-30 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-foreground text-background shadow-soft active:scale-95 md:right-[calc(50vw-216px)]"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 5.5rem)" }}
      >
        <Plus className="h-6 w-6" />
        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
      </label>

      {drafts.length > 0 && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-foreground/40 px-3 sm:items-center" onClick={() => setDrafts([])}>
          <div onClick={(e) => e.stopPropagation()} className="flex max-h-[88dvh] w-full max-w-md flex-col rounded-3xl bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="font-display text-2xl leading-none">Add {drafts.length} {drafts.length === 1 ? "piece" : "pieces"}</h2>
                <p className="mt-1 text-xs text-muted-foreground">Mix tops, bottoms, accessories — any combo.</p>
              </div>
              <button onClick={() => setDrafts([])} className="rounded-full p-2 hover:bg-secondary"><X className="h-4 w-4" /></button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {drafts.map((d) => (
                <div key={d.id} className="flex gap-3 rounded-2xl border border-border bg-background p-3">
                  <img src={d.preview} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <input value={d.name} onChange={(e) => updateDraft(d.id, { name: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs" placeholder="Name" />
                    <div className="flex gap-1.5">
                      <select value={d.category} onChange={(e) => updateDraft(d.id, { category: e.target.value })}
                        className="flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-xs capitalize">
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input value={d.color} onChange={(e) => updateDraft(d.id, { color: e.target.value })}
                        className="flex-1 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs" placeholder="Color" />
                    </div>
                  </div>
                  <button onClick={() => removeDraft(d.id)} className="self-start rounded-full p-1.5 text-muted-foreground hover:bg-secondary">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-secondary/30 py-4 text-xs text-muted-foreground">
                <Upload className="h-3.5 w-3.5" /> Add more photos
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
              </label>
            </div>

            <div className="border-t border-border px-5 py-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}>
              <button onClick={saveAll} className="w-full rounded-full bg-foreground py-3.5 text-sm font-medium text-background">
                Save all to closet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
