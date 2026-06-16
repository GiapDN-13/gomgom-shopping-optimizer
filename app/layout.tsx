import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gomgom — Shopping Optimizer",
  description:
    "Mô tả bằng lời — Gomgom lo phần còn lại. Lập kế hoạch đi chợ tối ưu chi phí cho người Việt.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Vietnamese is the primary UI language (NFR-20).
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
