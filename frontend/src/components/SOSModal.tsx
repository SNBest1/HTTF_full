import { Phone, Users, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SOSModalProps {
  open: boolean;
  onClose: () => void;
}

const SOSModal = ({ open, onClose }: SOSModalProps) => {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-sm border-2 border-destructive bg-background"
        style={{ borderColor: "hsl(0 72% 55%)" }}
      >
        {/* pr-10 clears the X close button injected by DialogContent */}
        <DialogHeader className="text-center space-y-2 pr-10">
          <DialogTitle className="text-3xl font-extrabold text-destructive tracking-wide">
            🚨 Emergency
          </DialogTitle>
          <DialogDescription className="text-base text-foreground font-medium">
            Choose an action below. Stay calm — help is available.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-2">
          <a href="tel:911" className="w-full">
            <Button
              variant="destructive"
              size="lg"
              className="w-full text-base font-bold gap-2 py-6"
            >
              <Phone size={22} className="shrink-0" />
              Call Emergency Services
            </Button>
          </a>

          <Button
            variant="outline"
            size="lg"
            className="w-full text-base font-bold gap-2 py-6 border-muted text-muted-foreground"
            disabled
          >
            <Users size={22} className="shrink-0" />
            Notify Contacts (Coming Soon)
          </Button>

          <Button
            variant="ghost"
            size="lg"
            className="w-full gap-2 mt-1 text-muted-foreground"
            onClick={onClose}
          >
            <X size={18} className="shrink-0" />
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SOSModal;
