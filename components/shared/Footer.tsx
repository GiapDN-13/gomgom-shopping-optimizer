// Standard footer with the price disclaimer (NFR-31).
export function Footer() {
  return (
    <footer className="border-t border-[var(--color-outline-variant)]/60 bg-[var(--color-surface)]">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-1 px-6 py-6 text-center">
        <p className="text-sm font-semibold text-[var(--color-primary)]">Gomgom</p>
        <p className="text-xs text-[var(--color-on-surface-variant)]">
          Giá hiển thị mang tính tham khảo, có thể thay đổi tại cửa hàng.
        </p>
      </div>
    </footer>
  );
}
