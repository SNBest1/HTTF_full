import { ShoppingBag, Clock } from "lucide-react";

export function FoodCard({ payload }: { payload: Record<string, unknown> }) {
  const items = payload.items as Array<{ name: string; price: string }>;
  const total = payload.total as string;
  const eta = payload.eta as string;
  return (
    <div className="mt-2 bg-background rounded-xl p-3 border border-border space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
        <ShoppingBag size={12} />
        <span>Order Summary</span>
      </div>
      <div className="space-y-1">
        {items?.map((item, idx) => (
          <div key={idx} className="flex justify-between text-xs text-foreground">
            <span>{item.name}</span>
            <span className="text-muted-foreground">{item.price}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs font-semibold text-foreground border-t border-border pt-2">
        <span>Total</span>
        <span>{total}</span>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock size={10} />
        <span>ETA: {eta}</span>
      </div>
    </div>
  );
}
