import { TopNavBar } from "@/components/shared/TopNavBar";
import { Footer } from "@/components/shared/Footer";
import { HistoryView } from "@/components/history/HistoryView";

// History — Stitch "l_ch_s_k_ho_ch".
export default function HistoryPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNavBar />
      <main className="flex-1">
        <HistoryView />
      </main>
      <Footer />
    </div>
  );
}
