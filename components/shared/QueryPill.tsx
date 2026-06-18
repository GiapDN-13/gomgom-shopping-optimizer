// Read-only query pill shown atop the Results screens (Figma).
export function QueryPill({ text }: { text: string }) {
  return (
    <div className="mx-auto w-full max-w-2xl rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 text-center text-[var(--color-text-primary)] shadow-sm">
      {text}
    </div>
  );
}
