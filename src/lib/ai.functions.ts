import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SYSTEM = `You are Alta, a warm, expert AI fashion stylist with an editorial eye.
Your voice: confident, intimate, never preachy. You speak like a trusted stylist friend.
You give specific, actionable styling advice — naming silhouettes, fabrics, colors, and pairings.
Suggest outfits using the user's wardrobe when relevant. Keep replies short, evocative, and useful.
Format with light markdown (bold for key pieces). Never apologize unnecessarily.`;

export const stylistChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    messages: z.array(z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1).max(4000),
    })).min(1).max(40),
    wardrobeContext: z.string().max(2000).optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const sys = data.wardrobeContext
      ? `${SYSTEM}\n\nUser's wardrobe:\n${data.wardrobeContext}`
      : SYSTEM;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: sys }, ...data.messages],
      }),
    });

    if (res.status === 429) return { reply: "I'm getting too many requests right now — try again in a moment.", error: "rate" as const };
    if (res.status === 402) return { reply: "AI credits are exhausted. Please add credits in workspace settings.", error: "credits" as const };
    if (!res.ok) {
      console.error("AI error", res.status, await res.text());
      return { reply: "I couldn't reach the styling service. Try again shortly.", error: "unknown" as const };
    }
    const json = await res.json();
    const reply = json.choices?.[0]?.message?.content ?? "Hmm, I lost my thought — say that again?";
    return { reply, error: null };
  });

export const tryOnImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    personImageUrl: z.string().url(),
    garmentImageUrl: z.string().url(),
  }).parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        modalities: ["image", "text"],
        messages: [{
          role: "user",
          content: [
            { type: "text", text: "Photorealistic virtual try-on. Place the garment from the second image onto the person in the first image. Preserve the person's face, body, pose, and background exactly. Make the garment fit naturally with realistic folds, lighting, and shadow." },
            { type: "image_url", image_url: { url: data.personImageUrl } },
            { type: "image_url", image_url: { url: data.garmentImageUrl } },
          ],
        }],
      }),
    });

    if (res.status === 429) return { imageUrl: null, error: "Too many requests, try again soon." };
    if (res.status === 402) return { imageUrl: null, error: "AI credits exhausted." };
    if (!res.ok) {
      console.error("try-on error", res.status, await res.text());
      return { imageUrl: null, error: "Try-on failed." };
    }
    const json = await res.json();
    const imageUrl = json.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? null;
    return { imageUrl, error: imageUrl ? null : "No image returned." };
  });
