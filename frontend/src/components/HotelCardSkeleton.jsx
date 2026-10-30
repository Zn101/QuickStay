/** Skeleton cùng kích thước với HotelCard (ảnh h-48) để tránh layout shift. */
export function HotelCardSkeleton() {
  return (
    <div aria-hidden="true" className="flex animate-pulse flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="h-48 bg-slate-200" />
      <div className="flex flex-1 flex-col p-4">
        <div className="h-5 w-3/4 rounded bg-slate-200" />
        <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
        <div className="mt-3 h-3 w-2/3 rounded bg-slate-100" />
        <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-3">
          <div className="space-y-1.5">
            <div className="h-3 w-10 rounded bg-slate-100" />
            <div className="h-5 w-24 rounded bg-slate-200" />
          </div>
          <div className="h-7 w-16 rounded-lg bg-slate-100" />
        </div>
      </div>
    </div>
  )
}

export function HotelGridSkeleton({ count = 8 }) {
  return (
    <div role="status" aria-live="polite" aria-label="Đang tải danh sách khách sạn" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => <HotelCardSkeleton key={i} />)}
    </div>
  )
}
