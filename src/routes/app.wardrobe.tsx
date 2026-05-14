import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/app/wardrobe")({ component: Wardrobe });

type Item = { id: string; name: string; category: string; color: string | null; image_url: string | null };

const CATEGORIES = ["tops", "bottoms", "dresses", "outerwear", "shoes", "accessories"];

function Wardrobe() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("wardrobe_items").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setItems((data as Item[]) ?? []);
  };
  useEffect(() => { load(); }, [user]);

  const remove = async (id: string) => {
    await supabase.from("wardrobe_items").delete().eq("id", id);
    setItems((s) => s.filter((i) => i.id !== id));
  };

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Closet</p>
          <h1 className="font-display text-4xl">Your wardrobe</h1>
        </div>
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm text-background">
          <Plus className="h-4 w-4" /> Add item
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-secondary/30 py-20 text-center">
          <p className="font-display text-2xl">Your closet is empty.</p>
          <p className="mt-2 text-sm text-muted-foreground">Add a piece to start building outfits.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((i) => (
            <div key={i.id} className="group relative overflow-hidden rounded-2xl bg-card shadow-petal">
              <div className="aspect-[3/4] overflow-hidden bg-secondary">
                {i.image_url ? <img src={i.image_url} alt={i.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>}
              </div>
              <div className="p-3">
                <p className="truncate font-medium">{i.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{i.color} · {i.category}</p>
              </div>
              <button onClick={() => remove(i.id)} className="absolute top-2 right-2 hidden rounded-full bg-background/90 p-2 group-hover:block">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {open && <AddItem onClose={() => setOpen(false)} onAdded={() => { setOpen(false); load(); }} />}
    </div>
  );
}

function AddItem({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("tops");
  const [color, setColor] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      let image_url: string | null = null;
      if (file) {
        const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, "_")}`;
        const { error: upErr } = await supabase.storage.from("wardrobe").upload(path, file);
        if (upErr) throw upErr;
        image_url = supabase.storage.from("wardrobe").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from("wardrobe_items").insert({ user_id: user.id, name, category, color: color || null, image_url });
      if (error) throw error;
      toast.success("Added to your closet");
      onAdded();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed"); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-foreground/40 px-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-md rounded-3xl bg-card p-7">
        <h2 className="font-display text-2xl">Add a piece</h2>
        <div className="mt-5 space-y-3">
          <input required placeholder="e.g. Cream cashmere sweater" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-full border border-input bg-background px-4 py-3 text-sm" />
          <div className="flex gap-2">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="flex-1 rounded-full border border-input bg-background px-4 py-3 text-sm capitalize">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input placeholder="Color" value={color} onChange={(e) => setColor(e.target.value)} className="flex-1 rounded-full border border-input bg-background px-4 py-3 text-sm" />
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-border bg-secondary/40 p-4 text-sm">
            <Upload className="h-4 w-4" />
            {file ? file.name : "Upload a photo"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
        </div>
        <div className="mt-6 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-full border border-border py-3 text-sm">Cancel</button>
          <button disabled={busy} className="flex-1 rounded-full bg-foreground py-3 text-sm text-background disabled:opacity-50">{busy ? "Adding…" : "Add to closet"}</button>
        </div>
      </form>
    </div>
  );
}
