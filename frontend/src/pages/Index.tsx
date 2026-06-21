import HeroSection from "@/components/HeroSection";
import TeamsSection from "@/components/TeamsSection";
import NewsBlogsSection from "@/components/NewsBlogsSection";
import SponsorsSection from "@/components/SponsorsSection";
import SEO from "@/components/SEO";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import NewsAnnouncementBar from "@/components/NewsAnnouncementBar";

const Index = () => {
  const location = useLocation();

  useEffect(() => {
    const target = (location.state as { scrollTarget?: string } | null)?.scrollTarget;
    if (target) {
      window.setTimeout(() => {
        document.getElementById(target)?.scrollIntoView({ behavior: "smooth" });
      }, 50);
      return;
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.key, location.state]);

  return (
    <>
      <SEO
        title="Home"
        description="BNI Cricket Tournament — 20 teams, 5 groups, live scores, ball-by-ball scoring, and player stats."
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "SportsEvent",
          "name": "BNI Cricket Tournament",
          "sport": "Cricket",
          "description": "BNI Corporate Cricket Tournament with 20 teams across 5 groups.",
          "organizer": { "@type": "Organization", "name": "BNI Cricket" },
          "eventStatus": "https://schema.org/EventScheduled",
        }}
      />
      <HeroSection />      
      <NewsAnnouncementBar />
      <SponsorsSection />
      <TeamsSection />
      <NewsBlogsSection />
    </>
  );
};

export default Index;
