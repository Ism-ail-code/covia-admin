/**
 * Covia Admin Table Helpers — table formatting and sorting utilities.
 */

export type SortDirection = "asc" | "desc";

/** Sort an array of objects by a key. */
export function sortBy<T>(
  items: T[],
  key: keyof T,
  direction: SortDirection = "asc",
): T[] {
  return [...items].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal === bVal) return 0;
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    const cmp = aVal < bVal ? -1 : 1;
    return direction === "asc" ? cmp : -cmp;
  });
}

/** Filter items by a search query across multiple fields. */
export function filterBySearch<T>(
  items: T[],
  query: string,
  fields: Array<keyof T>,
): T[] {
  if (!query.trim()) return items;
  const lower = query.toLowerCase();
  return items.filter((item) =>
    fields.some((field) => {
      const val = item[field];
      if (val === null || val === undefined) return false;
      return String(val).toLowerCase().includes(lower);
    }),
  );
}

/** Paginate an array of items. */
export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number,
): { items: T[]; total: number; totalPages: number; currentPage: number } {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  return {
    items: items.slice(start, end),
    total,
    totalPages,
    currentPage,
  };
}

/** Generate an array of page numbers for pagination display. */
export function getPageNumbers(currentPage: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | "...")[] = [];
  if (currentPage <= 3) {
    for (let i = 1; i <= 5; i++) pages.push(i);
    pages.push("...");
    pages.push(totalPages);
  } else if (currentPage >= totalPages - 2) {
    pages.push(1);
    pages.push("...");
    for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    pages.push("...");
    for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
    pages.push("...");
    pages.push(totalPages);
  }
  return pages;
}
