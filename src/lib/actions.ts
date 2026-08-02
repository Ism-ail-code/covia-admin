import { appeals, auditLog, reports, users, verifications } from "@/data/mock";
import type { AccountStatus, AppealStatus, ReportStatus, VerificationStatus } from "@/lib/types";

/**
 * In-memory mutation layer that writes to the shared mock arrays and keeps an
 * audit trail. Clean integration point: each action becomes a Supabase RPC /
 * REST call when a backend lands — the signatures below are already shaped
 * like mutating API endpoints.
 */

function wait(ms = 320) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function recordAudit(action: string, target: string, category: string): void {
  auditLog.unshift({
    id: `a_${Date.now()}`,
    actor: "Me",
    action,
    target,
    category,
    at: new Date().toISOString().slice(0, 16).replace("T", " "),
  });
}

export const actions = {
  /** Decide on a verification request (CNIC / licence / vehicle / document). */
  async decideVerification(id: string, decision: "approved" | "rejected"): Promise<void> {
    await wait();
    const v = verifications.find((x) => x.id === id);
    if (!v) throw new Error("Verification not found");
    v.status = decision as VerificationStatus;
    recordAudit(`verification_${decision}`, id, "verification");
  },

  /** Change a user's account status (suspend / reactivate / ban). */
  async setUserStatus(id: string, status: AccountStatus): Promise<void> {
    await wait();
    const user = users.find((u) => u.id === id);
    if (!user) throw new Error("User not found");
    user.status = status;
    recordAudit(`user_status_${status}`, id, "enforcement");
  },

  /** Resolve a safety report. */
  async setReportStatus(id: string, status: ReportStatus): Promise<void> {
    await wait();
    const r = reports.find((x) => x.id === id);
    if (r) r.status = status;
    recordAudit(`report_${status}`, id, "reports");
  },

  async setAppealStatus(id: string, status: AppealStatus): Promise<void> {
    await wait();
    const a = appeals.find((x) => x.id === id);
    if (a) a.status = status;
    recordAudit(`appeal_${status}`, id, "appeals");
  },
};