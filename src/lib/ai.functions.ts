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

/**
 * Analyze a user's reference photo to extract skin tone, undertone, hair, build.
 * Persists results to the profiles row.
 */
export const analyzeUserPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ photoUrl: z.string().url() }).parse(d))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");
    const { supabase, userId } = context;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: "Analyze this person's appearance for fashion try-on rendering. Return only via the tool call." },
            { type: "image_url", image_url: { url: data.photoUrl } },
          ],
        }],
        tools: [{
          type: "function",
          function: {
            name: "describe_person",
            description: "Describe the person for accurate styling renders.",
            parameters: {
              type: "object",
              properties: {
                skin_tone: { type: "string", enum: ["fair", "light", "light-medium", "medium", "tan", "deep", "rich"] },
                undertone: { type: "string", enum: ["cool", "neutral", "warm"] },
                hair: { type: "string", description: "Short description of hair color, length, texture." },
                build: { type: "string", description: "Body build (e.g., petite, athletic, curvy, tall and slim)." },
              },
              required: ["skin_tone", "undertone", "hair", "build"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "describe_person" } },
      }),
    });

    if (!res.ok) {
      console.error("analyze error", res.status, await res.text());
      return { ok: false as const, error: "Could not analyze photo." };
    }
    const json = await res.json();
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return { ok: false as const, error: "No analysis returned." };
    const parsed = JSON.parse(args);

    await supabase.from("profiles").update({
      photo_url: data.photoUrl,
      skin_tone: parsed.skin_tone,
      undertone: parsed.undertone,
      body_notes: `${parsed.hair}; ${parsed.build}`,
    }).eq("id", userId);

    return { ok: true as const, ...parsed };
  });

/**
 * Generate a personalized "model" render of the user wearing selected wardrobe items.
 * Preserves face, hair, and skin tone from the reference photo.
 */
export const generateLook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    garmentUrls: z.array(z.string().url()).min(1).max(6),
    occasion: z.string().max(120).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("photo_url,skin_tone,undertone,body_notes")
      .eq("id", userId)
      .maybeSingle();

    if (!profile?.photo_url) {
      return { imageUrl: null, error: "Add a reference photo first so we can render you accurately." };
    }

    const skin = profile.skin_tone ?? "as shown in reference";
    const undertone = profile.undertone ?? "neutral";
    const notes = profile.body_notes ?? "";
    const occasion = data.occasion?.trim();

    const promptText = [
      `Photoreal full-body studio portrait of the SAME person from the first reference image.`,
      `CRITICAL — preserve identity exactly: same face, same facial features, same hairstyle, same ${skin} skin tone with ${undertone} undertone, same body proportions (${notes}). Do NOT lighten, darken, or alter skin color or ethnicity.`,
      `Dress the person in the garments shown in the following reference images, one item per image. Match each garment's exact color, fabric, print, and silhouette. Layer correctly: tops over bottoms, outerwear on top, shoes on feet.`,
      `Pose: confident relaxed 3/4 stance, hands natural, looking slightly off-camera.`,
      `Background: soft seamless gradient backdrop in warm cream / blush, subtle floor shadow, even soft studio lighting like a high-end lookbook.`,
      occasion ? `Occasion / mood: ${occasion}.` : ``,
      `Output: single clean photoreal image, magazine quality.`,
    ].filter(Boolean).join(" ");

    const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: "text", text: promptText },
      { type: "image_url", image_url: { url: profile.photo_url } },
      ...data.garmentUrls.map((url) => ({ type: "image_url" as const, image_url: { url } })),
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        modalities: ["image", "text"],
        messages: [{ role: "user", content }],
      }),
    });

    if (res.status === 429) return { imageUrl: null, error: "Too many requests, try again soon." };
    if (res.status === 402) return { imageUrl: null, error: "AI credits exhausted." };
    if (!res.ok) {
      console.error("generateLook error", res.status, await res.text());
      return { imageUrl: null, error: "Look generation failed." };
    }
    const json = await res.json();
    const dataUrl: string | null = json.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? null;
    if (!dataUrl) return { imageUrl: null, error: "No image returned." };

    // Persist the data URL into the looks bucket so it has a stable public URL.
    try {
      const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!match) return { imageUrl: dataUrl, error: null };
      const [, mime, b64] = match;
      const ext = mime.split("/")[1] ?? "png";
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("looks").upload(path, bytes, { contentType: mime, upsert: false });
      if (upErr) {
        console.error("looks upload error", upErr);
        return { imageUrl: dataUrl, error: null };
      }
      const publicUrl = supabase.storage.from("looks").getPublicUrl(path).data.publicUrl;
      await supabase.from("try_on_results").insert({
        user_id: userId,
        result_url: publicUrl,
        prompt: occasion ?? null,
      });
      return { imageUrl: publicUrl, error: null };
    } catch (e) {
      console.error("persist look error", e);
      return { imageUrl: dataUrl, error: null };
    }
  });
