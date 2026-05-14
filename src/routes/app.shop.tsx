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
      <div className="-mx-5 mb-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {CATS.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`shrink-0 rounded-full px-4 py-2 text-[11px] uppercase tracking-wider transition ${cat === c ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {filtered.map((i) => (
          <div key={i.id} className="group">
            <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-secondary">
              {i.image_url && <img src={i.image_url} alt={i.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />}
            </div>
            <div className="mt-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{i.brand}</p>
              <p className="text-xs leading-tight">{i.name}</p>
              <p className="mt-0.5 font-display text-base">${i.price}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
