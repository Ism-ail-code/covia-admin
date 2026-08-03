import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Pagination control. Server-driven pages all return `total_count`, so
 * the number of pages is derived client-side from `total / pageSize`.
 */
export function Pagination({
  page,
  pageSize,
  total,
  onChange,
  className,
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
  className?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);

  if (total <= 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-between gap-3 border-t px-4 py-3 sm:flex-row",
        className,
      )}
    >
      <p className="text-xs text-muted-foreground tabular-nums">
        {total.toLocaleString()} total · page {current} of {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          disabled={current <= 1}
          onClick={() => onChange(current - 1)}
        >
          <ChevronLeft className="size-3.5" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          disabled={current >= totalPages}
          onClick={() => onChange(current + 1)}
        >
          Next
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}