import { TopNavBar } from "@/components/shared/TopNavBar";
import { Footer } from "@/components/shared/Footer";
import { PlanDetailView } from "@/components/history/PlanDetailView";

// Saved plan detail — Stitch "chi_ti_t_k_ho_ch_l_u".
export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  return (
    <div className="flex min-h-screen flex-col">
      <TopNavBar />
      <main className="flex-1">
        <PlanDetailView planId={planId} />
      </main>
      <Footer />
    </div>
  );
}
