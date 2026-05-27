import { useEffect, useState } from "react";

export type WardrobeItem = {
  id: string;
  name: string;
  category: string;
  color: string | null;
  brand?: string | null;
  price?: number | null;
  currency?: string | null;
  link?: string | null;
  image_url: string | null; // data URL
};

export type ProfileLocal = {
  photo_url: string | null;
  skin_tone: string | null;
  undertone: string | null;
  body_notes: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  body_shape?: string | null;
  onboarded?: boolean;
};

export type LookLocal = { id: string; result_url: string; note?: string; createdAt?: number };

export type BoardLocal = {
  id: string;
  name: string;
  cover?: string | null;
  looks: LookLocal[];
  createdAt: number;
};

export type ChatMsg = { role: "user" | "assistant"; content: string };

const KEYS = {
  wardrobe: "alta:wardrobe",
  profile: "alta:profile",
  looks: "alta:looks",
  chat: "alta:chat",
  boards: "alta:boards",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded — silently ignore */
  }
}

export function useLocalState<T>(key: string, fallback: T) {
  const [state, setState] = useState<T>(fallback);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setState(read<T>(key, fallback));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => {
    if (hydrated) write(key, state);
  }, [key, state, hydrated]);
  return [state, setState, hydrated] as const;
}

export const localKeys = KEYS;

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}
