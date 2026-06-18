import { Logo } from "@/components/shared/Logo";
import { SearchHero } from "@/components/home/SearchHero";

// Home / Input — Figma screen 1.
export default function HomePage() {
  return (
    <main className="min-h-screen">
      <header className="px-8 py-6">
        <Logo />
      </header>
      <SearchHero />
    </main>
  );
}
