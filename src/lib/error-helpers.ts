/**
 * Covia Admin Error Helpers — error handling utilities for the admin console.
 */

/** Extract a readable error message from any error type. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "An unexpected error occurred.";
}

/** Get a user-friendly error message for admin operations. */
export function getAdminFriendlyMessage(error: unknown): string {
  const msg = getErrorMessage(error);

  if (msg.includes("permission denied")) return "You don't have permission for this action.";
  if (msg.includes("not found")) return "The requested resource was not found.";
  if (msg.includes("already exists")) return "This item already exists.";
  if (msg.includes("rate limit")) return "Too many requests. Please wait a moment.";
  if (msg.includes("Network request failed")) return "Network error. Check your connection.";
  if (msg.includes("timeout")) return "Request timed out. Please try again.";
  if (msg.includes("session")) return "Your session has expired. Please log in again.";

  return msg || "An error occurred. Please try again.";
}

/** Check if an error is a network error. */
export function isNetworkError(error: unknown): boolean {
  const msg = getErrorMessage(error).toLowerCase();
  return msg.includes("network") || msg.includes("fetch") || msg.includes("connection");
}

/** Check if an error is an auth error. */
export function isAuthError(error: unknown): boolean {
  const msg = getErrorMessage(error).toLowerCase();
  return msg.includes("unauthorized") || msg.includes("session") || msg.includes("auth");
}

/** Format an error for logging. */
export function formatErrorForLog(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return { message: String(error) };
}
