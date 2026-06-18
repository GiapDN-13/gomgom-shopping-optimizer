import { Logo } from "@/components/shared/Logo";
import { ResultsView } from "@/components/results/ResultsView";
import { MOCK_QUERY } from "@/lib/shared/mockData";

// Results — Figma screens 2, 3, 4, 5.
export default async function ResultsPage({
  searchParams,
}: {
  params: Promise<{ planId: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() || MOCK_QUERY;

  return (
    <main className="min-h-screen">
      <header className="px-8 py-6">
        <Logo />
      </header>
      <ResultsView query={query} />
    </main>
  );
}
