// Results — FR-16 to FR-22. Built in Sprint 5.
export default async function ResultsPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Kết quả kế hoạch</h1>
      <p className="mt-2 text-[var(--color-text-secondary)]">
        Plan ID: <code>{planId}</code> — danh sách mua, thẻ cửa hàng, bản đồ và
        bảng chi phí sẽ có ở Sprint 5.
      </p>
    </main>
  );
}
