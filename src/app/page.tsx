import Navbar from "@/components/shared/Navbar";
import HeroCarousel from "@/components/sections/HeroCarousel";
import CompetitiveEdge from "@/components/sections/CompetitiveEdge";
import BuiltForSchools from "@/components/sections/BuiltForSchools";
import DemoCallToAction from "@/components/sections/DemoCallToAction";
import Footer from "@/components/shared/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg-page)]">
      <Navbar />
      <HeroCarousel />
      <CompetitiveEdge />
      <BuiltForSchools />
      <DemoCallToAction />
      <Footer />
    </main>
  );
}
