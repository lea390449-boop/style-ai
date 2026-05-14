import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Upload, Check, Camera, RefreshCw, User } from "lucide-react";
import { toast } from "sonner";
import { generateLook, analyzeUserPhoto } from "@/lib/ai.functions";
import { useLocalState, localKeys, fileToDataUrl, type WardrobeItem, type ProfileLocal, type LookLocal } from "@/lib/local-store";

export const Route = createFileRoute("/app/try-on")({ component: TryOn });

const OCCASIONS = ["Brunch", "Office", "Date night", "Travel", "Weekend", "Evening"];

const EMPTY_PROFILE: ProfileLocal = { photo_url: null, skin_tone: null, undertone: null, body_notes: null };

function TryOn() {
  const generate = useServerFn(generateLook);
  const analyze = useServerFn(analyzeUserPhoto);

  const [profile, setProfile] = useLocalState<ProfileLocal>(localKeys.profile, EMPTY_PROFILE);
  const [wardrobe] = useLocalState<WardrobeItem[]>(localKeys.wardrobe, []);
  const [history, setHistory] = useLocalState<LookLocal[]>(localKeys.looks, []);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [occasion, setOccasion] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const uploadPhoto = async (file: File) => {
    setAnalyzing(true);
    try {
      const photoUrl = await fileToDataUrl(file);
      const res = await analyze({ data: { photoUrl } });
      if (!res.ok) {
        toast.error(res.error);
        setProfile({ ...EMPTY_PROFILE, photo_url: photoUrl });
      } else {
        setProfile({
          photo_url: photoUrl,
          skin_tone: res.skin_tone,
          undertone: res.undertone,
          body_notes: `${res.hair}; ${res.build}`,
        });
        toast.success(`You're set — ${res.skin_tone} ${res.undertone}.`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const toggle = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const wardrobeWithImages = wardrobe.filter((w) => w.image_url);

  const run = async () => {
    if (!profile.photo_url) return toast.error("Add your reference photo first.");
    if (selected.size === 0) return toast.error("Pick at least one piece from your closet.");
    const garmentUrls = wardrobeWithImages.filter((w) => selected.has(w.id)).map((w) => w.image_url!).slice(0, 6);
    setBusy(true);
    setResult(null);
    try {
      const { imageUrl, error } = await generate({
        data: {
          photoUrl: profile.photo_url,
          skinTone: profile.skin_tone ?? undefined,
          undertone: profile.undertone ?? undefined,
          bodyNotes: profile.body_notes ?? undefined,
          garmentUrls,
          occasion: occasion || undefined,
        },
      });
      if (error || !imageUrl) return toast.error(error ?? "Failed");
      setResult(imageUrl);
      setHistory((h) => [{ id: crypto.randomUUID(), result_url: imageUrl }, ...h].slice(0, 8));
    } finally {
      setBusy(false);
    }
  };

  if (!profile.photo_url) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl bg-gradient-blush p-6 text-plum">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-card/70">
            <User className="h-5 w-5" />
          </div>
          <h2 className="font-display text-3xl leading-tight">Let's get a photo of you.</h2>
          <p className="mt-2 text-sm text-plum/80">A clear, front-facing photo helps Alta render <em>you</em> — your face, hair, and skin tone — wearing pieces from your closet.</p>
        </div>

        <label className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-border bg-card text-center">
          {analyzing ? (
            <>
              <RefreshCw className="h-7 w-7 animate-spin text-mauve" />
              <p className="text-sm text-muted-foreground">Reading your features…</p>
            </>
          ) : (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                <Camera className="h-6 w-6 text-mauve" />
              </div>
              <p className="text-sm font-medium">Upload a photo</p>
              <p className="px-8 text-xs text-muted-foreground">Front-facing, good lighting, full upper body works best.</p>
            </>
          )}
          <input type="file" accept="image/*" capture="user" className="hidden" disabled={analyzing}
            onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
        </label>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl bg-gradient-mauve">
        <div className="relative aspect-[3/4] w-full bg-black/5">
          {busy ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-primary-foreground">
              <RefreshCw className="h-7 w-7 animate-spin" />
              <p className="text-sm italic">Rendering your look…</p>
            </div>
          ) : result ? (
            <img src={result} alt="Your look" className="h-full w-full object-cover" />
          ) : history[0] ? (
            <img src={history[0].result_url} alt="Latest look" className="h-full w-full object-cover opacity-90" />
          ) : (
            <div className="flex h-full items-center justify-center px-8 text-center text-sm text-primary-foreground/90">
              Pick pieces below to see yourself styled in them.
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 bg-card/95 px-4 py-3">
          <img src={profile.photo_url} alt="" className="h-10 w-10 rounded-full object-cover" />
          <div className="flex-1 text-xs">
            <p className="font-medium capitalize">{profile.skin_tone ?? "you"} · {profile.undertone ?? ""}</p>
            <p className="text-muted-foreground">Identity locked for accurate rendering</p>
          </div>
          <label className="cursor-pointer rounded-full border border-border px-3 py-1.5 text-[11px]">
            Change
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
          </label>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Occasion</p>
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
          {OCCASIONS.map((o) => (
            <button key={o} onClick={() => setOccasion(occasion === o ? "" : o)}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs transition ${occasion === o ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground"}`}>
              {o}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Pick from your closet</p>
          {selected.size > 0 && <span className="text-xs text-mauve">{selected.size} selected</span>}
        </div>
        {wardrobeWithImages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/60 p-6 text-center text-sm text-muted-foreground">
            Add pieces (with photos) to your closet first.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {wardrobeWithImages.map((w) => {
              const on = selected.has(w.id);
              return (
                <button key={w.id} onClick={() => toggle(w.id)}
                  className={`relative aspect-square overflow-hidden rounded-2xl border-2 transition ${on ? "border-primary" : "border-transparent"}`}>
                  <img src={w.image_url ?? ""} alt={w.name} className="h-full w-full object-cover" />
                  {on && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/30">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-4 w-4" />
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Recent looks</p>
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5">
            {history.map((h) => (
              <button key={h.id} onClick={() => setResult(h.result_url)}
                className="h-24 w-20 shrink-0 overflow-hidden rounded-xl border border-border">
                <img src={h.result_url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      <button onClick={run} disabled={busy || selected.size === 0}
        className="sticky bottom-2 flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-4 text-sm font-medium text-background shadow-soft disabled:opacity-40">
        <Sparkles className="h-4 w-4" /> {busy ? "Styling you…" : "Generate look"}
      </button>

      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <Upload className="h-3 w-3" /> Renders preserve your face, hair, and skin tone.
      </div>
    </div>
  );
}
