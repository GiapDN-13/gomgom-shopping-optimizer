import { TopNavBar } from "@/components/shared/TopNavBar";
import { Footer } from "@/components/shared/Footer";
import { SettingsView } from "@/components/settings/SettingsView";

// Settings — Stitch "c_i_t".
export default function SettingsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNavBar />
      <main className="flex-1">
        <SettingsView />
      </main>
      <Footer />
    </div>
  );
}
