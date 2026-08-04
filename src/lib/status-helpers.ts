/**
 * Covia Admin Status Helpers — status display and color utilities.
 */

/** Get a label for a user status. */
export function getUserStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: "Active",
    inactive: "Inactive",
    suspended: "Suspended",
    banned: "Banned",
    pending_verification: "Pending Verification",
  };
  return labels[status] ?? status;
}

/** Get a label for a ride status. */
export function getRideStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "Draft",
    open: "Open",
    full: "Full",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return labels[status] ?? status;
}

/** Get a label for a verification status. */
export function getVerificationStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    under_review: "Under Review",
    needs_info: "Needs Info",
  };
  return labels[status] ?? status;
}

/** Get a label for a report status. */
export function getReportStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    dismissed: "Dismissed",
    under_review: "Under Review",
  };
  return labels[status] ?? status;
}

/** Get a label for an appeal status. */
export function getAppealStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
  };
  return labels[status] ?? status;
}

/** Get a Tailwind color class for a status. */
export function getStatusColorClass(status: string): string {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-800",
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    suspended: "bg-orange-100 text-orange-800",
    banned: "bg-red-100 text-red-800",
    completed: "bg-blue-100 text-blue-800",
    cancelled: "bg-gray-100 text-gray-800",
    in_progress: "bg-blue-100 text-blue-800",
    confirmed: "bg-green-100 text-green-800",
    dismissed: "bg-gray-100 text-gray-800",
    needs_info: "bg-yellow-100 text-yellow-800",
    under_review: "bg-blue-100 text-blue-800",
    full: "bg-orange-100 text-orange-800",
    draft: "bg-gray-100 text-gray-800",
  };
  return colors[status] ?? "bg-gray-100 text-gray-800";
}
