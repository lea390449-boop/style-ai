import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/shop")({ component: Shop });

type Item = { id: string; name: string; brand: string | null; price: number | null; category: string | null; image_url: string | null; tags: string[] };

const CATS = ["all", "dresses", "tops", "bottoms", "outerwear", "shoes", "accessories"];

function Shop() {
  const [items, setItems] = useState<Item[]>([]);
  const [cat, setCat] = useState("all");

  useEffect(() => {
    supabase.from("shop_items").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setItems((data as Item[]) ?? []));
  }, []);

  const filtered = cat === "all" ? items : items.filter((i) => i.category === cat);

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">The Edit</p>
      <h1 className="font-display text-4xl">Curated for you.</h1>

      <div className="mt-6 mb-8 flex flex-wrap gap-2">
        {CATS.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`rounded-full px-4 py-2 text-xs uppercase tracking-wider transition ${cat === c ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
        {filtered.map((i) => (
          <div key={i.id} className="group">
            <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-secondary">
              {i.image_url && <img src={i.image_url} alt={i.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />}
            </div>
            <div className="mt-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{i.brand}</p>
              <p className="mt-0.5 text-sm leading-tight">{i.name}</p>
              <p className="mt-1 font-display text-lg">${i.price}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
