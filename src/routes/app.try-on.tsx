import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { tryOnImage } from "@/lib/ai.functions";

export const Route = createFileRoute("/app/try-on")({ component: TryOn });

type Item = { id: string; name: string; image_url: string | null };
type ShopItem = { id: string; name: string; image_url: string };

function TryOn() {
  const { user } = useAuth();
  const run = useServerFn(tryOnImage);
  const [personUrl, setPersonUrl] = useState<string | null>(null);
  const [garmentUrl, setGarmentUrl] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wardrobe, setWardrobe] = useState<Item[]>([]);
  const [shop, setShop] = useState<ShopItem[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("wardrobe_items").select("id,name,image_url").eq("user_id", user.id).not("image_url", "is", null)
      .then(({ data }) => setWardrobe((data as Item[]) ?? []));
    supabase.from("shop_items").select("id,name,image_url").limit(12)
      .then(({ data }) => setShop((data as ShopItem[]) ?? []));
  }, [user]);

  const uploadPerson = async (file: File) => {
    if (!user) return;
    const path = `${user.id}/person-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("wardrobe").upload(path, file, { upsert: true });
    if (error) return toast.error(error.message);
    setPersonUrl(supabase.storage.from("wardrobe").getPublicUrl(path).data.publicUrl);
  };

  const generate = async () => {
    if (!personUrl || !garmentUrl) return toast.error("Pick a photo and a garment first.");
    setBusy(true); setResult(null);
    try {
      const { imageUrl, error } = await run({ data: { personImageUrl: personUrl, garmentImageUrl: garmentUrl } });
      if (error || !imageUrl) return toast.error(error ?? "Failed");
      setResult(imageUrl);
      if (user) await supabase.from("try_on_results").insert({ user_id: user.id, result_url: imageUrl });
    } finally { setBusy(false); }
  };

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Virtual try-on</p>
      <h1 className="mb-8 font-display text-4xl">See it on you.</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Inputs */}
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium">1. Your photo</p>
            <label className="flex aspect-[3/4] cursor-pointer items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-border bg-secondary/30">
              {personUrl ? <img src={personUrl} alt="" className="h-full w-full object-cover" /> : (
                <div className="text-center text-muted-foreground">
                  <Upload className="mx-auto mb-2 h-6 w-6" />
                  <p className="text-sm">Upload a full-body photo</p>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadPerson(e.target.files[0])} />
            </label>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">2. Pick a garment</p>
            <div className="grid grid-cols-4 gap-2">
              {[...wardrobe, ...shop.map(s => ({ id: s.id, name: s.name, image_url: s.image_url }))].slice(0, 16).map((g) => (
                <button key={g.id} onClick={() => setGarmentUrl(g.image_url)} className={`overflow-hidden rounded-xl border-2 transition ${garmentUrl === g.image_url ? "border-primary" : "border-transparent"}`}>
                  <img src={g.image_url ?? ""} alt={g.name} className="aspect-square w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <button onClick={generate} disabled={busy || !personUrl || !garmentUrl} className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-4 text-sm font-medium text-background disabled:opacity-40">
            <Sparkles className="h-4 w-4" /> {busy ? "Styling you…" : "Generate try-on"}
          </button>
        </div>

        {/* Result */}
        <div className="rounded-3xl bg-gradient-blush p-6">
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-plum">Result</p>
          <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-2xl bg-card">
            {busy ? <div className="text-sm italic text-muted-foreground">Generating…</div> :
              result ? <img src={result} alt="Try-on" className="h-full w-full object-cover" /> :
              <div className="px-6 text-center text-sm text-muted-foreground">Your try-on appears here.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
