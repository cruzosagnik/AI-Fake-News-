export default function Loader() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-[420px] w-full animate-pulse rounded-2xl border border-white/5 bg-white/5 p-5 flex flex-col justify-between">
          <div className="h-48 w-full rounded-xl bg-white/10 mb-4" />
          <div className="space-y-3 flex-1">
            <div className="h-4 w-1/4 rounded bg-white/10" />
            <div className="h-6 w-full rounded bg-white/10" />
            <div className="h-6 w-5/6 rounded bg-white/10" />
            <div className="h-4 w-full rounded bg-white/10 mt-4" />
            <div className="h-4 w-2/3 rounded bg-white/10" />
          </div>
          <div className="h-10 w-full rounded-xl bg-white/10 mt-6" />
        </div>
      ))}
    </div>
  );
}
