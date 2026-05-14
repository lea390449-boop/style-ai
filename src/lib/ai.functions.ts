import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SYSTEM = `You are Alta, a warm, expert AI fashion stylist with an editorial eye.
Your voice: confident, intimate, never preachy. You speak like a trusted stylist friend.
You give specific, actionable styling advice — naming silhouettes, fabrics, colors, and pairings.
Suggest outfits using the user's wardrobe when relevant. Keep replies short, evocative, and useful.
Format with light markdown (bold for key pieces). Never apologize unnecessarily.`;

export const stylistChat = createServerFn({ method: "POST" })
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
 * Pure: returns the parsed analysis, no persistence.
 */
export const analyzeUserPhoto = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ photoUrl: z.string().min(1).max(8_000_000) }).parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

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
    return { ok: true as const, ...parsed };
  });

/**
 * Generate a personalized "model" render of the user wearing selected wardrobe items.
 * Pure: caller passes the reference photo + descriptors, gets back an image data URL.
 */
export const generateLook = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    photoUrl: z.string().min(1).max(8_000_000),
    skinTone: z.string().max(40).optional(),
    undertone: z.string().max(40).optional(),
    bodyNotes: z.string().max(400).optional(),
    garmentUrls: z.array(z.string().min(1).max(8_000_000)).min(1).max(6),
    occasion: z.string().max(120).optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const skin = data.skinTone ?? "as shown in reference";
    const undertone = data.undertone ?? "neutral";
    const notes = data.bodyNotes ?? "";
    const occasion = data.occasion?.trim();

    const promptText = [
      `Photoreal full-body studio portrait of the EXACT SAME person from the first reference image, isolated as a clean cut-out subject.`,
      `ABSOLUTE IDENTITY LOCK — the face must be indistinguishable from the reference: preserve exact face shape, jawline, cheekbones, nose shape and width, lip shape, eye shape, eye color, eyebrow shape, forehead, hairline, every freckle, mole, scar, or distinguishing mark. Match the hairstyle, hair color, hair length, and hair texture precisely. Keep the ${skin} skin tone with ${undertone} undertone exactly as in the reference — do NOT lighten, darken, smooth, retouch, beautify, slim, or alter the face or ethnicity in any way. The rendered face should pass a side-by-side identity check with the reference photo.`,
      `BODY INCLUSIVITY — render the body at the SAME true size, shape, height, and proportions as the reference person (${notes}). Do NOT slim, stretch, idealize, or push toward a "model" body type. Honor every body: petite, tall, plus-size, curvy, straight, athletic, apple, pear, hourglass, broad-shouldered, narrow, soft, muscular — all rendered with dignity, accurate volume, and natural posture. Garments should drape realistically over the actual body, not a thinner stand-in.`,
      `Dress the person in the garments shown in the following reference images, one item per image. Match each garment's exact color, fabric, print, pattern, and silhouette. Fit the clothing to the person's true body — show realistic stretch, drape, and fabric tension where appropriate. Layer correctly: tops over bottoms, outerwear on top, shoes on feet.`,
      `Pose: standing perfectly straight, squared to camera, FACING FORWARD directly at the viewer, head level, eyes looking straight at the camera, arms relaxed at sides. No 3/4 turn, no profile, no looking away.`,
      `Background: pure solid white (#FFFFFF) seamless backdrop, no floor line, no horizon, no props, no backdrop shadow. Only a soft contact shadow directly beneath the feet. Even, soft, neutral studio lighting like a high-end e-commerce shoot — sharp focus on the face, no motion blur.`,
      `Frame the full body head-to-toe, centered, with generous white margin around the subject.`,
      occasion ? `Occasion / mood for the styling: ${occasion}.` : ``,
      `Output: a single photoreal image, magazine quality, subject crisply isolated on white, with the face rendered at maximum fidelity to the reference.`,
    ].filter(Boolean).join(" ");

    const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: "text", text: promptText },
      { type: "image_url", image_url: { url: data.photoUrl } },
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
    return { imageUrl: dataUrl, error: null };
  });
