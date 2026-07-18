import type { Metadata } from "next";
import { TopNavBar } from "@/components/shared/TopNavBar";
import { Footer } from "@/components/shared/Footer";
import { MonitoringView } from "@/components/monitoring/MonitoringView";

export const metadata: Metadata = {
  title: "Monitoring — Gomgom",
  description:
    "Theo dõi model tự train và API fallback: gate score, nguồn trả lời, latency.",
};

// Same page shell as History/Parse so the top navigation is always available.
export default function MonitoringPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNavBar />
      <main className="flex-1">
        <MonitoringView />
      </main>
      <Footer />
    </div>
  );
}
