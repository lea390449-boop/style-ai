# Plan: App-like Alta + Personalized AI Try-On

## 1. App-like shell (replaces website chrome)

- Drop the marketing landing on `/` for authenticated users — redirect straight into the app.
  - `src/routes/index.tsx`: if session exists → redirect to `/app`; if not → compact mobile splash with "Sign in" / "Create account" (full-bleed hero, single CTA, no website nav).
- Rework `src/routes/app.tsx` into a mobile app frame:
  - Fixed top bar: page title (contextual) + avatar.
  - Fixed bottom tab bar (iOS-style) with 4 tabs: **Stylist** (`/app`), **Closet** (`/app/wardrobe`), **Try-On** (`/app/try-on`), **Shop** (`/app/shop`). Active tab uses the blush accent + label, inactive is muted.
  - Safe-area padding (`env(safe-area-inset-bottom)`), `max-w-[480px]` centered frame on desktop so it always feels like an app.
  - Remove the sidebar / website-style top nav.
- Tighten each route for touch:
  - Stylist: full-height chat, sticky composer above tab bar, message bubbles.
  - Closet: 2-column grid of square tiles, FAB ("+") for upload.
  - Shop: edge-to-edge cards, horizontal category chips.
  - Try-On: redesigned around the new flow below.
- Set preview viewport to mobile so the user sees the app framing immediately.

## 2. Personalized try-on (face + skin tone aware)

### Profile additions
- Add a one-time "Your photo" step: user uploads a clear front-facing photo stored in the existing `wardrobe` bucket under `{userId}/profile/`.
- Store reference on `profiles`: `photo_url text`, `skin_tone text` (auto-detected label like "warm-medium"), `body_notes text` (optional).
- Migration: `alter table profiles add column photo_url text, skin_tone text, body_notes text;`

### Skin-tone detection
- New server function `analyzeUserPhoto` (in `src/lib/ai.functions.ts`):
  - Calls `google/gemini-2.5-flash` (vision) with the user photo.
  - Tool-call schema returns `{ skin_tone: enum(fair, light, light-medium, medium, tan, deep, rich), undertone: enum(cool, neutral, warm), hair: string, build: string }`.
  - Persists results back to `profiles`.

### Try-on generation (the "3D model")
- Replace current `tryOnImage` with `generateLook`:
  - Inputs: user photo URL + array of selected `wardrobe_items` image URLs + occasion text.
  - Model: `google/gemini-3.1-flash-image-preview` (Nano Banana 2 — best for identity-preserving image edits).
  - Prompt template instructs the model to:
    - Preserve the user's **face, hairstyle, and exact skin tone/undertone** from the reference photo.
    - Render a full-body, studio-lit, photoreal 3/4 portrait ("3D model" look — soft gradient backdrop, subtle shadow).
    - Dress the subject in the supplied garments, matching color/fabric/silhouette of each reference image; layer correctly (top → bottom → outerwear → shoes).
    - Forbid altering skin color, ethnicity, or body proportions.
  - Saves PNG to `try_on_results` + a new public-read `looks` bucket (so renders are shareable).
- New try-on UI:
  - Top: large rendered look card (with skeleton + regenerate button).
  - Below: horizontal scroller of closet items with tap-to-toggle inclusion (chip count badge).
  - Occasion chips ("Brunch", "Office", "Date", "Travel", custom).
  - "Generate look" sticky CTA.
  - History strip of past renders (tap to reopen).

### Closet upgrades to support the model
- Auto-tag uploaded items via Gemini vision (category, color, dominant fabric) on insert so the try-on prompt can describe each piece accurately if the image alone is ambiguous.

## 3. Visual polish (still Blush Minimal)
- Slightly more app-feeling tokens: increase border radius for tiles (`--radius-lg: 1.25rem`), elevate active tab with soft blush glow, motion on tab switch (Framer Motion fade/slide).
- Cormorant kept for headlines inside cards; Inter everywhere in chrome.

## Technical summary

- Migration: add `photo_url`, `skin_tone`, `undertone`, `body_notes` to `profiles`; create `looks` storage bucket (public read, owner write) for shareable renders.
- New server fns in `src/lib/ai.functions.ts`: `analyzeUserPhoto`, `generateLook`, `autoTagWardrobeItem`. Remove old `tryOnImage`.
- Frontend changes:
  - `src/routes/index.tsx` — auth-aware redirect + mobile splash.
  - `src/routes/app.tsx` — bottom-tab mobile shell, max-width frame, safe-area.
  - `src/routes/app.try-on.tsx` — new flow (profile photo gate → item picker → generate → history).
  - `src/routes/app.wardrobe.tsx` — tile grid + FAB + auto-tag on upload.
  - `src/routes/app.index.tsx`, `src/routes/app.shop.tsx` — restyle for mobile frame.
  - New `src/components/BottomTabs.tsx`, `src/components/AppHeader.tsx`, `src/components/ProfilePhotoSetup.tsx`.
- Set preview to mobile viewport.

## Out of scope (confirm if desired)
- True 3D (Three.js avatar) — current plan delivers a photoreal 2.5D "model" render, which is what apps like Alta actually ship. Real-time 3D mesh from a single photo isn't reliably doable client-side; happy to add a Ready Player Me-style avatar later if you want.
- Native packaging (Capacitor) — UI will *feel* native in the browser; wrapping for the App Store can be a follow-up.
