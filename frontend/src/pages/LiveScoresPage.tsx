/**
 * LiveScoresPage — Public "Live Video" page.
 *
 * Uses the existing MatchCenter component which pulls real match data
 * from the scoring engine (live scores, ball-by-ball, scorecards).
 * The VideoPlayer inside MatchCenter uses the YouTube/video URL attached
 * via the admin Live Video page.
 */
import { MatchCenter } from "@/components/match-center/match-center";
import SEO from "@/components/SEO";

const LiveScoresPage = () => (
  <main>
    <SEO
      title="Live Video"
      description="Watch BNI Cricket matches live — video stream, real-time scores, and ball-by-ball updates."
      ogType="video.other"
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "SportsEvent",
        "name": "BNI Cricket — Live Match",
        "sport": "Cricket",
        "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
        "eventStatus": "https://schema.org/EventScheduled",
        "organizer": { "@type": "Organization", "name": "BNI Cricket" },
        "description": "Live streaming of BNI Cricket tournament matches with real-time scoring.",
      }}
    />
    <MatchCenter />
  </main>
);

export default LiveScoresPage;
