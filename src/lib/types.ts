export type UserRole = "rider" | "driver" | "admin" | "super_admin";
export type AccountStatus = "active" | "pending" | "suspended" | "banned" | "invited";

export interface Profile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
}

export interface User extends Profile {
  role: UserRole;
  status: AccountStatus;
  city: string;
  joinedAt: string;
  lastActive: string;
  verified: boolean;
  rating?: number;
  trips: number;
  walletBalance: string;
}

export type VerificationType = "cnic" | "license" | "vehicle" | "document";
export type VerificationStatus = "pending" | "approved" | "rejected" | "needs_review";

export interface VerificationRequest {
  id: string;
  type: VerificationType;
  status: VerificationStatus;
  applicant: Profile;
  submittedAt: string;
  expiresAt?: string;
  notes?: string;
  confidence: number;
}

export type RideStatus = "searching" | "confirmed" | "in_progress" | "completed" | "cancelled";

export interface Ride {
  id: string;
  status: RideStatus;
  rider: Profile;
  driver?: Profile;
  origin: string;
  destination: string;
  fare: string;
  distanceKm: number;
  startedAt: string;
  completedAt?: string;
  paymentMethod: "wallet" | "card" | "cash";
  rating?: number;
}

export type ReportSeverity = "low" | "medium" | "high" | "critical";
export type ReportCategory = "safety" | "scam" | "harassment" | "fare" | "vehicle" | "other";
export type ReportStatus = "open" | "in_review" | "resolved";

export interface Report {
  id: string;
  category: ReportCategory;
  severity: ReportSeverity;
  status: ReportStatus;
  reporter: Profile;
  subject: Profile;
  summary: string;
  reportedAt: string;
  assignee?: string;
}

export type AppealStatus = "open" | "reviewed" | "resolved";

export interface Appeal {
  id: string;
  status: AppealStatus;
  appealer: Profile;
  caseId: string;
  reason: string;
  submittedAt: string;
  decidedBy?: string;
}

export type SafetyAreaStatus = "normal" | "caution" | "restricted";

export interface SafetyPolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  updatedAt: string;
  rules: number;
}

export type StationStatus = "active" | "rehearsal" | "disabled";

export interface CheckpointCandidate {
  id: string;
  name: string;
  station: string;
  status: StationStatus;
  pingsSaved: number;
  lastContact: string;
}

export interface CityMarket {
  city: string;
  riders: number;
  drivers: number;
  ridesToday: number;
  fillRate: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "super_admin";
  permissions: string[];
  lastActive: string;
}

export interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  target: string;
  category: string;
  at: string;
  ip?: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  from: Profile;
  channel: "app" | "email" | "phone";
  status: "open" | "unassigned" | "resolved";
  priority: "low" | "medium" | "high";
  createdAt: string;
  assignee?: string;
}

export interface DriverBrief {
  user: Profile;
  rating: number;
  trips: number;
  acceptanceRate: number;
  cancellationRate: number;
  status: "online" | "offline" | "on_trip" | "standby";
  vehicle: string;
  earningsToday: string;
  hoursOnline: number;
}