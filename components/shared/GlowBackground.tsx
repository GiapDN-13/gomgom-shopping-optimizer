// Soft teal radial glow behind hero content (Figma Home screen).
export function GlowBackground({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 -z-10 ${className}`}
      style={{
        background:
          "radial-gradient(60% 50% at 50% 45%, rgba(22,163,106,0.10) 0%, rgba(22,163,106,0.04) 40%, transparent 70%)",
      }}
    />
  );
}
