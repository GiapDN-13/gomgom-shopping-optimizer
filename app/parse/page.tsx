import { TopNavBar } from "@/components/shared/TopNavBar";
import { Footer } from "@/components/shared/Footer";
import { ParsePreview } from "@/components/parse/ParsePreview";

// Parse Preview step — Stitch "parse_preview".
export default function ParsePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNavBar />
      <main className="flex-1">
        <ParsePreview />
      </main>
      <Footer />
    </div>
  );
}
