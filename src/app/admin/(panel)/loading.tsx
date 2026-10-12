export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-white/[0.07]" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/[0.04]" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-2xl bg-white/[0.04]" />
    </div>
  );
}
