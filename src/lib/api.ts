import { admins, appeals, auditLog, cities, drivers, reports, rides, safetyPolicies, standbyPool, tickets, users, verifications, weeklyRides } from "@/data/mock";
import type { AdminUser, Appeal, AuditEvent, CheckpointCandidate, CityMarket, DriverBrief, Report, Ride, SafetyPolicy, SupportTicket, User, VerificationRequest } from "@/lib/types";

const delay = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms));

export const api = {
  async getUsers(): Promise<User[]> {
    await delay();
    return users;
  },

  async getUser(id: string): Promise<User | undefined> {
    await delay(80);
    return users.find((u) => u.id === id);
  },

  async getVerifications(): Promise<VerificationRequest[]> {
    await delay();
    return verifications;
  },

  async getVerification(id: string): Promise<VerificationRequest | undefined> {
    await delay(80);
    return verifications.find((v) => v.id === id);
  },

  async getRides(): Promise<Ride[]> {
    await delay();
    return rides;
  },

  async getReports(): Promise<Report[]> {
    await delay();
    return reports;
  },

  async getAppeals(): Promise<Appeal[]> {
    await delay();
    return appeals;
  },

  async getSafetyPolicies(): Promise<SafetyPolicy[]> {
    await delay();
    return safetyPolicies;
  },

  async getStandbyPool(): Promise<CheckpointCandidate[]> {
    await delay();
    return standbyPool;
  },

  async getCities(): Promise<CityMarket[]> {
    await delay();
    return cities;
  },

  async getAdmins(): Promise<AdminUser[]> {
    await delay();
    return admins;
  },

  async getAuditLog(): Promise<AuditEvent[]> {
    await delay();
    return auditLog;
  },

  async getTickets(): Promise<SupportTicket[]> {
    await delay();
    return tickets;
  },

  async getDrivers(): Promise<DriverBrief[]> {
    await delay();
    return drivers;
  },

  async getWeeklyRides(): Promise<typeof weeklyRides> {
    await delay();
    return weeklyRides;
  },
};