import Navbar from "@/components/shared/Navbar";
import HomeHeroBanner from "@/components/sections/HomeHeroBanner";
import CompetitiveEdge from "@/components/sections/CompetitiveEdge";
import BuiltForSchools from "@/components/sections/BuiltForSchools";
import DemoCallToAction from "@/components/sections/DemoCallToAction";
import Footer from "@/components/shared/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg-page)]">
      <Navbar />
      <HomeHeroBanner />
      <CompetitiveEdge />
      <BuiltForSchools />
      <DemoCallToAction />
      <Footer />
    </main>
  );
}
