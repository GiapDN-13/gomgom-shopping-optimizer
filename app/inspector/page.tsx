import { InspectorView } from "@/components/inspector/InspectorView";

// Gomgom Inspector — Figma screen 6. Internal debug/transparency tool (now dynamic).
export default function InspectorPage() {
  return (
    <main className="min-h-screen px-8 py-8">
      <h1 className="mb-6 text-3xl font-bold text-[var(--color-primary)]">
        Gomgom Inspector
      </h1>
      <InspectorView />
    </main>
  );
}
