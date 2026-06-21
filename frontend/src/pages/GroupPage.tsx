import GroupsSection from "@/components/GroupsSection";
import SEO from "@/components/SEO";

const GroupPage = () => (
  <main className="min-h-[calc(100vh-4rem)]">
    <SEO title="Groups" description="BNI Cricket Tournament Groups — 5 groups with 4 teams each competing in round-robin format." />
    <GroupsSection />
  </main>
);
export default GroupPage;
