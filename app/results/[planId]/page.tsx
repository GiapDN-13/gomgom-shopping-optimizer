import { TopNavBar } from "@/components/shared/TopNavBar";
import { Footer } from "@/components/shared/Footer";
import { ResultsView } from "@/components/results/ResultsView";

// Results — Stitch "k_t_qu_t_i_u" (plan-first).
export default async function ResultsPage({
  searchParams,
}: {
  params: Promise<{ planId: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const fallbackQuery = q?.trim() || "Tôi muốn nấu bún bò Huế cho 4 người";

  return (
    <div className="flex min-h-screen flex-col">
      <TopNavBar />
      <main className="flex-1">
        <ResultsView fallbackQuery={fallbackQuery} />
      </main>
      <Footer />
    </div>
  );
}
