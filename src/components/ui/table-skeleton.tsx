import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton rows for tables while a page is fetching its first page. */
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="border-b px-4 py-3">
        <Skeleton className="h-4 w-1/3" />
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 px-4 py-3.5">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="h-4 flex-1" style={c === 0 ? { maxWidth: "18%" } : undefined} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}