export function PostSkeleton() {
  return (
    <div className="px-4 py-4 border-b border-sky-border flex gap-3">
      <div className="w-10 h-10 rounded-full bg-sky-elevated shimmer-loading flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <div className="h-3.5 w-24 bg-sky-elevated shimmer-loading rounded-full" />
          <div className="h-3.5 w-16 bg-sky-elevated shimmer-loading rounded-full" />
        </div>
        <div className="h-3.5 w-full bg-sky-elevated shimmer-loading rounded-full" />
        <div className="h-3.5 w-4/5 bg-sky-elevated shimmer-loading rounded-full" />
        <div className="h-3.5 w-3/5 bg-sky-elevated shimmer-loading rounded-full" />
        <div className="flex gap-6 pt-2">
          <div className="h-3 w-8 bg-sky-elevated shimmer-loading rounded-full" />
          <div className="h-3 w-8 bg-sky-elevated shimmer-loading rounded-full" />
          <div className="h-3 w-8 bg-sky-elevated shimmer-loading rounded-full" />
        </div>
      </div>
    </div>
  )
}
