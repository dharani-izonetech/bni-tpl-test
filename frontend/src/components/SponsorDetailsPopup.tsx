import { useEffect } from "react";
import { X } from "lucide-react";
import type { Sponsor } from "@/data/sponsors";
import SponsorPortfolios from "./SponsorPortfolios";

type SponsorDetailsPopupProps = {
  sponsor: Sponsor | null;
  onClose: () => void;
};

const SponsorDetailsPopup = ({ sponsor, onClose }: SponsorDetailsPopupProps) => {
  useEffect(() => {
    if (!sponsor) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [sponsor, onClose]);

  if (!sponsor) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(var(--dark-surface-rgb),0.62)] px-3 py-4 backdrop-blur-sm sm:px-5 sm:py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sponsor-details-title"
      onClick={onClose}
    >
      <div
        className="gold-panel relative flex max-h-[88vh] w-full max-w-6xl flex-col overflow-hidden text-left shadow-[0_24px_70px_rgba(var(--dark-surface-rgb),0.38)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="absolute z-10 p-2 transition rounded-md shadow-sm right-4 top-4 bg-white/60 text-muted-foreground hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={onClose}
          aria-label="Close sponsor details"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        <SponsorPortfolios sponsor={sponsor} />
      </div>
    </div>
  );
};

export default SponsorDetailsPopup;
