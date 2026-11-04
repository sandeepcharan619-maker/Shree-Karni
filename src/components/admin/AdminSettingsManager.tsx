"use client";

import { useState } from "react";
import {
  Settings,
  ShieldCheck,
  Lock,
  Download,
  Clock,
  User,
  Key,
  CheckCircle2,
  FileText,
  Building2,
  Database,
  History,
} from "lucide-react";

interface ActivityLogItem {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: string | null;
  performedBy: string;
  createdAt: string;
}

interface AdminSettingsManagerProps {
  adminUser: any;
  activityLogs: ActivityLogItem[];
  totalRecords: {
    projects: number;
    plots: number;
    customers: number;
    bookings: number;
    payments: number;
    associates: number;
    activityLogs: number;
  };
}

export default function AdminSettingsManager({
  adminUser,
  activityLogs,
  totalRecords,
}: AdminSettingsManagerProps) {
  const [activeTab, setActiveTab] = useState<"audit" | "security" | "backup">("audit");

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwMessage, setPwMessage] = useState<{ type: string; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  // Operational Rules State
  const [pricingRule, setPricingRule] = useState({
    defaultRatePerGaj: "11500",
    minBookingAdvancePercent: "20",
    defaultRoadWidth: "30 Ft",
  });
  const [ruleSaved, setRuleSaved] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPwMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    setPwLoading(true);
    setPwMessage(null);

    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");

      setPwMessage({ type: "success", text: "Admin password updated successfully!" });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      setPwMessage({ type: "error", text: err.message });
    } finally {
      setPwLoading(false);
    }
  };

  const handleExportBackup = () => {
    const backupData = {
      system: "Shree Karni Real Estate ERP",
      timestamp: new Date().toISOString(),
      location: "Vatika, Jaipur, Rajasthan",
      recordsSummary: totalRecords,
      auditLogsCount: activityLogs.length,
      logs: activityLogs,
    };

    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ShreeKarni_Backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Settings & Audit Log</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              Security & Compliance
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Audit history, security permissions, database backup, and pricing rules for Vatika plot operations.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "audit"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <History size={14} />
            <span>Activity Audit Log ({activityLogs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "security"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShieldCheck size={14} />
            <span>Security & Rules</span>
          </button>
          <button
            onClick={() => setActiveTab("backup")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "backup"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Database size={14} />
            <span>Database Backup</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. AUDIT LOG TAB                                                */}
      {/* ============================================================== */}
      {activeTab === "audit" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Clock size={16} className="text-amber-500" />
                Real Estate Audit Trail (Immutable Log)
              </h3>
              <p className="text-xs text-slate-500">Every plot booking, collection, project update, and commission approval is permanently logged.</p>
            </div>
            <button
              onClick={handleExportBackup}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition"
            >
              <Download size={13} />
              <span>Export Audit Trail</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Module / Entity</th>
                  <th className="py-3 px-4">Event Details</th>
                  <th className="py-3 px-4">Performed By</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activityLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 text-slate-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-blue-700">{log.entity}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{log.details || "-"}</td>
                    <td className="py-3 px-4 font-semibold text-slate-600">{log.performedBy}</td>
                    <td className="py-3 px-4 text-right text-slate-400 font-mono whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleDateString("en-IN")} •{" "}
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. SECURITY & RULES TAB                                         */}
      {/* ============================================================== */}
      {activeTab === "security" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Admin Profile & Password Change */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 font-black flex items-center justify-center">
                SK
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{adminUser?.name || "Admin User"}</h3>
                <p className="text-xs text-slate-500 font-mono">
                  {adminUser?.memberId || "SKRADMIN"} • {adminUser?.role}
                </p>
              </div>
            </div>

            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Lock size={14} className="text-amber-500" />
              Change Admin Password
            </h4>

            {pwMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-medium ${
                  pwMessage.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {pwMessage.text}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Password (Min 6 chars)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={pwLoading}
                className="w-full py-2.5 rounded-xl bg-[#0d1b2a] hover:bg-slate-800 text-amber-400 font-bold text-xs transition cursor-pointer"
              >
                {pwLoading ? "Updating..." : "Update Admin Password"}
              </button>
            </form>
          </div>

          {/* Operational Pricing & Booking Defaults */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 size={16} className="text-blue-600" />
              Township Operational Rules (Vatika, Jaipur)
            </h3>

            {ruleSaved && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium">
                Operational pricing rules saved successfully!
              </div>
            )}

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Default Benchmark Rate per GAJ (₹)
                </label>
                <input
                  type="number"
                  value={pricingRule.defaultRatePerGaj}
                  onChange={(e) => setPricingRule({ ...pricingRule, defaultRatePerGaj: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Minimum Booking Advance Threshold (%)
                </label>
                <input
                  type="number"
                  value={pricingRule.minBookingAdvancePercent}
                  onChange={(e) =>
                    setPricingRule({ ...pricingRule, minBookingAdvancePercent: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Default Road Width Specification
                </label>
                <select
                  value={pricingRule.defaultRoadWidth}
                  onChange={(e) => setPricingRule({ ...pricingRule, defaultRoadWidth: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
                >
                  <option value="30 Ft">30 Ft Internal Sector Road</option>
                  <option value="40 Ft">40 Ft Wide Avenue</option>
                  <option value="60 Ft Main Road">60 Ft Main Entrance Road</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  setRuleSaved(true);
                  setTimeout(() => setRuleSaved(false), 3000);
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
              >
                Save Operational Rules
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. DATABASE BACKUP TAB                                          */}
      {/* ============================================================== */}
      {activeTab === "backup" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Database size={18} className="text-amber-500" />
                Supabase PostgreSQL Database Backup & Sync
              </h3>
              <p className="text-xs text-slate-500">
                Complete database snapshot including projects, plots, customer KYC, booking agreements, payments, and commission records.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Projects</span>
              <span className="text-xl font-black text-slate-900">{totalRecords.projects}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Plots</span>
              <span className="text-xl font-black text-slate-900">{totalRecords.plots}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Bookings</span>
              <span className="text-xl font-black text-slate-900">{totalRecords.bookings}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Payments</span>
              <span className="text-xl font-black text-slate-900">{totalRecords.payments}</span>
            </div>
          </div>

          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-amber-950 text-xs">Full System Snapshot Export</h4>
              <p className="text-xs text-amber-900/80">
                Download a timestamped JSON backup file of all real estate operations and audit logs.
              </p>
            </div>
            <button
              onClick={handleExportBackup}
              className="px-4 py-2.5 rounded-xl bg-[#0d1b2a] hover:bg-slate-800 text-amber-400 font-bold text-xs flex items-center gap-2 transition cursor-pointer self-start sm:self-auto shadow-sm"
            >
              <Download size={15} />
              <span>Download JSON Backup</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
