import { Logo } from "@/components/shared/Logo";
import { MOCK_INSPECTOR } from "@/lib/shared/mockData";

// Gomgom Inspector — Figma screen 6. Internal debug/transparency tool.
export default function InspectorPage() {
  const { userQuery, executionTimeMs, entityExtraction, roadMap } = MOCK_INSPECTOR;

  return (
    <main className="min-h-screen px-8 py-8">
      <h1 className="mb-6 text-3xl font-bold text-[var(--color-primary)]">
        Gomgom Inspector
      </h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT column */}
        <div className="flex flex-col gap-6">
          <Panel title="1. User Query">
            <p className="font-medium">{userQuery}</p>
          </Panel>

          <div className="flex items-center justify-between rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 shadow-sm">
            <span className="font-semibold">Execution Time</span>
            <span className="font-bold tabular-nums">{executionTimeMs} ms</span>
          </div>

          <Panel title="3. Road map">
            <JsonBlock data={roadMap} />
          </Panel>
        </div>

        {/* RIGHT column */}
        <div className="flex flex-col gap-6">
          <Panel title="2. Entity Extraction">
            <JsonBlock data={entityExtraction} />
          </Panel>
        </div>
      </div>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="max-h-[460px] overflow-y-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function JsonBlock({ data }: { data: unknown }) {
  return (
    <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-[var(--color-text-primary)]">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
