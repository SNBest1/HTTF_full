import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CallCard({ payload }: { payload: Record<string, unknown> }) {
  const telUri = payload.tel_uri as string;
  const contactName = payload.contact_name as string;
  const phoneNumber = payload.phone_number as string;
  return (
    <div className="mt-2 bg-background rounded-xl p-3 border border-border flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Phone size={12} />
        <span>{contactName || "Contact"}{phoneNumber ? ` · ${phoneNumber}` : ""}</span>
      </div>
      {telUri && telUri !== "tel:" ? (
        <a href={telUri}>
          <Button size="sm" className="w-full gap-2">
            <Phone size={14} />
            Call Now
          </Button>
        </a>
      ) : (
        <span className="text-xs text-muted-foreground">No phone number found.</span>
      )}
    </div>
  );
}
