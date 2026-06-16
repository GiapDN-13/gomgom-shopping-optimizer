// Plan Detail — FR-25. Read-only saved plan with re-run. Built in Sprint 6.
export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Chi tiết kế hoạch đã lưu</h1>
      <p className="mt-2 text-[var(--color-text-secondary)]">
        Plan ID: <code>{planId}</code> — chế độ xem chỉ đọc kèm nút “Chạy lại với
        giá mới” sẽ có ở Sprint 6.
      </p>
    </main>
  );
}
