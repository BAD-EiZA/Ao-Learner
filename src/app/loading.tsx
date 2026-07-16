export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-3 py-10" role="status" aria-label="Loading page">
      <div className="h-6 w-28 animate-pulse rounded-full bg-neo-info" />
      <div className="h-10 w-2/3 animate-pulse rounded-xl bg-neo-info" />
      <div className="h-32 animate-pulse rounded-2xl bg-white/80" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}