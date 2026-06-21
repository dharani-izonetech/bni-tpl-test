import { useEffect } from "react";
import { useParams } from "react-router-dom";
import SponsorPortfolio from "@/components/SponsorPortfolios";
import { getSponsorSlug, sponsors } from "@/data/sponsors";
import NotFound from "./NotFound";

const SponsorPage = () => {
  const { sponsorSlug } = useParams();

  // Always open sponsor page from top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [sponsorSlug]);

  const sponsor = sponsors.find(
    (item) => getSponsorSlug(item.name) === sponsorSlug,
  );

  if (!sponsor) {
    return <NotFound />;
  }

  return (
    <main>
      <div className="relative min-h-[calc(100vh-4rem)] bg-gradient-card">
        <SponsorPortfolio sponsor={sponsor} />
      </div>
    </main>
  );
};

export default SponsorPage;
