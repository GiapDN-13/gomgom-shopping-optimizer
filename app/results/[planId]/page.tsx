import { Logo } from "@/components/shared/Logo";
import { ResultsView } from "@/components/results/ResultsView";

// Results — Figma screens 2–5 (plan-first).
export default async function ResultsPage({
  searchParams,
}: {
  params: Promise<{ planId: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const fallbackQuery = q?.trim() || "Tôi muốn nấu bún bò Huế cho 4 người";

  return (
    <main className="min-h-screen">
      <header className="px-8 py-6">
        <Logo />
      </header>
      <ResultsView fallbackQuery={fallbackQuery} />
    </main>
  );
}
