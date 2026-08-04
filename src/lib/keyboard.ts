/**
 * Covia Admin Keyboard — keyboard shortcut definitions and utilities.
 */

/** Keyboard shortcut definitions for common admin actions. */
export const SHORTCUTS = {
  SEARCH: { key: "k", meta: true, description: "Search" },
  REFRESH: { key: "r", meta: true, description: "Refresh data" },
  EXPORT: { key: "e", meta: true, description: "Export data" },
  ESCAPE: { key: "Escape", description: "Close dialog / Cancel" },
  ENTER: { key: "Enter", description: "Confirm action" },
  DELETE: { key: "Delete", meta: true, description: "Delete selected" },
  SELECT_ALL: { key: "a", meta: true, description: "Select all" },
  NEXT_PAGE: { key: "ArrowRight", meta: true, description: "Next page" },
  PREV_PAGE: { key: "ArrowLeft", meta: true, description: "Previous page" },
} as const;

/** Format a keyboard shortcut for display. */
export function formatShortcut(shortcut: { key: string; meta?: boolean; shift?: boolean; alt?: boolean }): string {
  const parts: string[] = [];
  if (shortcut.meta) parts.push(navigator?.platform?.includes("Mac") ? "Cmd" : "Ctrl");
  if (shortcut.shift) parts.push("Shift");
  if (shortcut.alt) parts.push("Alt");
  parts.push(shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key);
  return parts.join(" + ");
}

/** Check if a keyboard event matches a shortcut. */
export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: { key: string; meta?: boolean; shift?: boolean; alt?: boolean },
): boolean {
  if (event.key !== shortcut.key) return false;
  if (shortcut.meta && !event.metaKey && !event.ctrlKey) return false;
  if (shortcut.shift && !event.shiftKey) return false;
  if (shortcut.alt && !event.altKey) return false;
  return true;
}
