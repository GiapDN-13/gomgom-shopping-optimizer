import { TopNavBar } from "@/components/shared/TopNavBar";
import { Footer } from "@/components/shared/Footer";
import { SearchHero } from "@/components/home/SearchHero";

// Home / Input — Stitch "home_smart_suggestions".
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNavBar />
      <main className="flex-1">
        <SearchHero />
      </main>
      <Footer />
    </div>
  );
}
