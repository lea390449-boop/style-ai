import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Camera, ChevronRight, RefreshCw, User, Ruler, Scale, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { analyzeUserPhoto } from "@/lib/ai.functions";
import { useLocalState, localKeys, fileToDataUrl, type ProfileLocal } from "@/lib/local-store";

export const Route = createFileRoute("/app/welcome")({ component: Welcome });

const EMPTY: ProfileLocal = {
  photo_url: null, skin_tone: null, undertone: null, body_notes: null,
  height_cm: null, weight_kg: null, body_shape: null, onboarded: false,
};

const SKIN_TONES = ["fair", "light", "light-medium", "medium", "tan", "deep", "rich"] as const;
const UNDERTONES = ["cool", "neutral", "warm"] as const;
const SHAPES = ["petite", "athletic", "curvy", "plus", "tall & slim", "broad", "soft", "hourglass", "apple", "pear"];

function Welcome() {
  const nav = useNavigate();
  const analyze = useServerFn(analyzeUserPhoto);
  const [profile, setProfile] = useLocalState<ProfileLocal>(localKeys.profile, EMPTY);
  const [step, setStep] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);

  const uploadPhoto = async (file: File) => {
    setAnalyzing(true);
    try {
      const photoUrl = await fileToDataUrl(file);
      const res = await analyze({ data: { photoUrl } });
      if (!res.ok) {
        setProfile({ ...profile, photo_url: photoUrl });
        toast.error(res.error);
      } else {
        setProfile({
          ...profile,
          photo_url: photoUrl,
          skin_tone: res.skin_tone,
          undertone: res.undertone,
          body_notes: `${res.hair}; ${res.build}`,
        });
        toast.success("Got your features.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const finish = () => {
    setProfile({ ...profile, onboarded: true });
    nav({ to: "/app" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-foreground" : "bg-border"}`} />
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-5">
          <div className="rounded-3xl bg-gradient-blush p-6 text-plum">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-card/70"><User className="h-5 w-5" /></div>
            <h2 className="font-display text-3xl leading-tight">Show Alta your face.</h2>
            <p className="mt-2 text-sm text-plum/80">A clear, front-facing photo lets Alta render <em>you</em> — keeping your face, hair, and skin tone exactly as they are.</p>
          </div>

          {profile.photo_url ? (
            <div className="overflow-hidden rounded-3xl bg-card shadow-petal">
              <img src={profile.photo_url} alt="" className="aspect-[3/4] w-full object-cover" />
              <label className="block cursor-pointer border-t border-border bg-card px-4 py-3 text-center text-xs">
                Use a different photo
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
              </label>
            </div>
          ) : (
            <label className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-border bg-card text-center">
              {analyzing ? (
                <><RefreshCw className="h-7 w-7 animate-spin text-mauve" /><p className="text-sm text-muted-foreground">Reading your features…</p></>
              ) : (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary"><Camera className="h-6 w-6 text-mauve" /></div>
                  <p className="text-sm font-medium">Upload a photo</p>
                  <p className="px-8 text-xs text-muted-foreground">Front-facing, good lighting.</p>
                </>
              )}
              <input type="file" accept="image/*" capture="user" className="hidden" disabled={analyzing} onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
            </label>
          )}

          {profile.photo_url && (
            <div className="rounded-2xl bg-secondary/50 p-4 text-xs text-muted-foreground">
              <p className="font-medium capitalize text-foreground">Detected: {profile.skin_tone ?? "—"} · {profile.undertone ?? "—"} undertone</p>
              <p className="mt-1">You can fine-tune this on the next step.</p>
            </div>
          )}

          <button onClick={() => setStep(1)} disabled={!profile.photo_url}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-4 text-sm font-medium text-background disabled:opacity-40">
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h2 className="font-display text-3xl">Your skin & tone.</h2>
            <p className="mt-2 text-sm text-muted-foreground">Confirm or adjust — this guides Alta's color choices.</p>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Skin tone</p>
            <div className="flex flex-wrap gap-2">
              {SKIN_TONES.map((s) => (
                <button key={s} onClick={() => setProfile({ ...profile, skin_tone: s })}
                  className={`rounded-full border px-3 py-1.5 text-xs capitalize transition ${profile.skin_tone === s ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Undertone</p>
            <div className="flex gap-2">
              {UNDERTONES.map((u) => (
                <button key={u} onClick={() => setProfile({ ...profile, undertone: u })}
                  className={`flex-1 rounded-full border px-3 py-2 text-xs capitalize transition ${profile.undertone === u ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground"}`}>
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(0)} className="flex-1 rounded-full border border-border py-4 text-sm">Back</button>
            <button onClick={() => setStep(2)} disabled={!profile.skin_tone || !profile.undertone}
              className="flex-1 rounded-full bg-foreground py-4 text-sm font-medium text-background disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h2 className="font-display text-3xl">Your proportions.</h2>
            <p className="mt-2 text-sm text-muted-foreground">So Alta renders your true body — every shape, every size.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="rounded-2xl border border-border bg-card p-4">
              <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground"><Ruler className="h-3 w-3" /> Height (cm)</span>
              <input type="number" min={120} max={230} placeholder="170" value={profile.height_cm ?? ""}
                onChange={(e) => setProfile({ ...profile, height_cm: e.target.value ? Number(e.target.value) : null })}
                className="mt-2 w-full bg-transparent text-2xl font-display outline-none" />
            </label>
            <label className="rounded-2xl border border-border bg-card p-4">
              <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground"><Scale className="h-3 w-3" /> Weight (kg)</span>
              <input type="number" min={30} max={250} placeholder="65" value={profile.weight_kg ?? ""}
                onChange={(e) => setProfile({ ...profile, weight_kg: e.target.value ? Number(e.target.value) : null })}
                className="mt-2 w-full bg-transparent text-2xl font-display outline-none" />
            </label>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Body shape</p>
            <div className="flex flex-wrap gap-2">
              {SHAPES.map((s) => (
                <button key={s} onClick={() => setProfile({ ...profile, body_shape: s })}
                  className={`rounded-full border px-3 py-1.5 text-xs capitalize transition ${profile.body_shape === s ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="flex-1 rounded-full border border-border py-4 text-sm">Back</button>
            <button onClick={finish}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-foreground py-4 text-sm font-medium text-background">
              <Sparkles className="h-4 w-4" /> Enter Alta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
