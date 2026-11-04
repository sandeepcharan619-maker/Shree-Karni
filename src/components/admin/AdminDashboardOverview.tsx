"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  MapPin,
  CheckCircle2,
  Clock,
  TrendingUp,
  Receipt,
  Users,
  Award,
  Plus,
  ArrowRight,
  Search,
  ExternalLink,
  ShieldCheck,
  CalendarCheck,
  Sparkles,
  RefreshCw,
  Bell,
  FileText,
  FileCheck,
  AlertCircle,
} from "lucide-react";

interface AdminDashboardOverviewProps {
  stats: {
    totalProjects: number;
    totalPlots: number;
    availablePlots: number;
    bookedPlots: number;
    soldPlots: number;
    totalSalesValue: number;
    totalCollected: number;
    pendingPayments: number;
    totalAssociates: number;
    totalCommission: number;
  };
  recentBookings: any[];
  recentPayments: any[];
  projects: any[];
  recentNotifications?: any[];
  pendingKycCount?: number;
}

export default function AdminDashboardOverview({
  stats,
  recentBookings,
  recentPayments,
  projects,
  recentNotifications = [],
  pendingKycCount = 0,
}: AdminDashboardOverviewProps) {
  const [activeTab, setActiveTab] = useState<"bookings" | "payments" | "notifications">("bookings");
  const [notifications, setNotifications] = useState<any[]>(recentNotifications);
  const [kycCount, setKycCount] = useState<number>(pendingKycCount);

  // Sync state if server props change
  useEffect(() => {
    setNotifications(recentNotifications);
  }, [recentNotifications]);

  useEffect(() => {
    setKycCount(pendingKycCount);
  }, [pendingKycCount]);

  // Real-time SSE listener for instant document upload notifications in Admin Dashboard
  useEffect(() => {
    let sse: EventSource | null = null;
    try {
      sse = new EventSource("/api/admin/events");
      sse.addEventListener("document_uploaded", (e: any) => {
        try {
          const data = JSON.parse(e.data);
          setKycCount((prev) => prev + 1);
          setNotifications((prev) => [
            {
              id: data.notificationId || "temp-" + Date.now(),
              title: `📄 KYC Document Uploaded: ${data.name} (${data.memberId})`,
              message: `Associate ${data.name} (${data.memberId}) has uploaded ${(data.docs || []).join(", ")}.`,
              type: "KYC",
              link: `/admin/associates?openKyc=${data.associateId}`,
              isRead: false,
              createdAt: data.createdAt || new Date().toISOString(),
            },
            ...prev,
          ]);
        } catch {}
      });

      sse.addEventListener("notification_received", (e: any) => {
        try {
          const data = JSON.parse(e.data);
          setNotifications((prev) => {
            if (prev.some((n) => n.id === data.id)) return prev;
            return [data, ...prev];
          });
        } catch {}
      });

      sse.onerror = () => {
        if (sse) {
          sse.close();
          sse = null;
        }
      };
    } catch {}

    return () => {
      if (sse) {
        sse.close();
        sse = null;
      }
    };
  }, []);

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  const soldPercent = stats.totalPlots > 0 ? Math.round((stats.soldPlots / stats.totalPlots) * 100) : 0;
  const bookedPercent = stats.totalPlots > 0 ? Math.round((stats.bookedPlots / stats.totalPlots) * 100) : 0;
  const availablePercent = Math.max(0, 100 - soldPercent - bookedPercent);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* ============================================================== */}
      {/* 1. WELCOME BANNER & QUICK ACTION BAR                            */}
      {/* ============================================================== */}
      <div className="bg-gradient-to-r from-[#0d1b2a] via-[#1b263b] to-[#0d1b2a] rounded-2xl p-6 text-white shadow-md border border-white/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="mb-3">
              <Image
                src="/logo.png"
                alt="Shree Karni Real Estate"
                width={360}
                height={80}
                className="h-12 w-auto object-contain brightness-125 drop-shadow-md"
                priority
              />
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-slate-900 tracking-wide uppercase">
                Vatika, Jaipur Headquarters
              </span>
              <span className="text-xs text-slate-300 font-medium">Shree Karni Real Estate</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Admin Operations Center</span>
              <ShieldCheck size={24} className="text-amber-400" />
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl font-normal">
              Complete centralized management of residential plot inventory, customer bookings, collections, associate downlines, and commission disbursements in Vatika, Jaipur.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/admin/bookings"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#e9b04c] hover:bg-amber-500 text-[#0d1b2a] font-bold text-xs sm:text-sm shadow-sm transition hover:shadow-md cursor-pointer"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>New Plot Booking</span>
            </Link>
            <Link
              href="/admin/payments"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/15 transition cursor-pointer"
            >
              <Receipt size={16} />
              <span>Collect Payment</span>
            </Link>
            <Link
              href="/admin/plots"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/15 transition cursor-pointer"
            >
              <MapPin size={16} />
              <span>Plot Map</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Real-time KYC Document Verification Banner */}
      {kycCount > 0 && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <FileCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                  KYC Action Required
                </span>
                <span className="text-xs sm:text-sm font-black text-slate-900">
                  {kycCount} Associate{kycCount > 1 ? "s Have" : " Has"} Uploaded Documents Awaiting Verification
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Associates have uploaded Aadhaar Card, PAN Card, Photo, Address, or Bank Proof. Review and approve/reject directly.
              </p>
            </div>
          </div>
          <Link
            href="/admin/associates"
            className="px-4 py-2.5 rounded-xl bg-[#0d1b2a] hover:bg-slate-800 text-amber-400 font-bold text-xs flex items-center gap-2 self-start sm:self-auto transition shadow-xs shrink-0 cursor-pointer"
          >
            <ShieldCheck size={16} />
            <span>Review KYC Documents</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. TOP 10 SUMMARY KPI CARDS                                     */}
      {/* ============================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            Executive Business Summary
          </h2>
          <span className="text-xs text-slate-500 font-medium">Live Database Metrics</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {/* 1. Total Projects */}
          <Link
            href="/admin/projects"
            className="group bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-amber-400 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Projects</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-110 transition">
                <Building2 size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900">{stats.totalProjects}</div>
              <p className="text-[11px] text-blue-600 font-medium mt-0.5">Vatika & Tonk Road</p>
            </div>
          </Link>

          {/* 2. Total Plots */}
          <Link
            href="/admin/plots"
            className="group bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-amber-400 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Plots</span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-110 transition">
                <MapPin size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900">{stats.totalPlots}</div>
              <p className="text-[11px] text-purple-600 font-medium mt-0.5">Across all townships</p>
            </div>
          </Link>

          {/* 3. Available Plots */}
          <Link
            href="/admin/plots?status=AVAILABLE"
            className="group bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-400 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Available</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-emerald-700">{stats.availablePlots}</div>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">{availablePercent}% ready to book</p>
            </div>
          </Link>

          {/* 4. Booked Plots */}
          <Link
            href="/admin/bookings"
            className="group bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-amber-400 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Booked Plots</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-110 transition">
                <Clock size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-amber-700">{stats.bookedPlots}</div>
              <p className="text-[11px] text-amber-600 font-medium mt-0.5">{bookedPercent}% in payment cycle</p>
            </div>
          </Link>

          {/* 5. Sold Plots */}
          <Link
            href="/admin/plots?status=SOLD"
            className="group bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-rose-400 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Sold Plots</span>
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center group-hover:scale-110 transition">
                <Award size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-rose-700">{stats.soldPlots}</div>
              <p className="text-[11px] text-rose-600 font-medium mt-0.5">{soldPercent}% registries executed</p>
            </div>
          </Link>

          {/* 6. Total Sales Value */}
          <div className="bg-gradient-to-br from-[#0d1b2a] to-[#1e293b] rounded-2xl p-4 text-white shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Total Sales Value</span>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl font-black text-amber-400">
                ₹ {(stats.totalSalesValue / 100000).toFixed(1)} <span className="text-xs font-normal text-slate-300">Lakhs</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 font-medium">₹ {stats.totalSalesValue.toLocaleString("en-IN")}</p>
            </div>
          </div>

          {/* 7. Total Amount Collected */}
          <Link
            href="/admin/payments"
            className="group bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-2xl p-4 text-white shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">Collected</span>
              <Receipt size={18} className="text-emerald-300" />
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl font-black text-white">
                ₹ {(stats.totalCollected / 100000).toFixed(1)} <span className="text-xs font-normal text-emerald-200">Lakhs</span>
              </div>
              <p className="text-[11px] text-emerald-300 mt-0.5 font-medium">₹ {stats.totalCollected.toLocaleString("en-IN")}</p>
            </div>
          </Link>

          {/* 8. Pending Payments */}
          <Link
            href="/admin/customers"
            className="group bg-gradient-to-br from-amber-700 to-amber-900 rounded-2xl p-4 text-white shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-200 uppercase tracking-wider">Pending Balances</span>
              <Clock size={18} className="text-amber-300" />
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl font-black text-white">
                ₹ {(stats.pendingPayments / 100000).toFixed(1)} <span className="text-xs font-normal text-amber-200">Lakhs</span>
              </div>
              <p className="text-[11px] text-amber-300 mt-0.5 font-medium">Outstanding payments</p>
            </div>
          </Link>

          {/* 9. Total Associates */}
          <Link
            href="/admin/associates"
            className="group bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-amber-400 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Associates</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:scale-110 transition">
                <Users size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900">{stats.totalAssociates}</div>
              <p className="text-[11px] text-indigo-600 font-medium mt-0.5">Sales network</p>
            </div>
          </Link>

          {/* 10. Total Commission */}
          <Link
            href="/admin/incentives"
            className="group bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-amber-400 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Commission</span>
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center group-hover:scale-110 transition">
                <Award size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900">
                ₹ {(stats.totalCommission / 1000).toFixed(0)}k
              </div>
              <p className="text-[11px] text-orange-600 font-medium mt-0.5">Earned & disbursed</p>
            </div>
          </Link>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. MIDDLE SECTION: INVENTORY HEALTH & PROJECT BREAKDOWN         */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Inventory Distribution & Progress Bar (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Township Inventory Health</h3>
                <p className="text-xs text-slate-500">Residential plots in Vatika, Tonk Road</p>
              </div>
              <Link
                href="/admin/plots"
                className="text-xs font-bold text-[#e9b04c] hover:underline flex items-center gap-1"
              >
                <span>Visual Map</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* Segmented Progress Bar */}
            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner mb-4">
              <div
                style={{ width: `${availablePercent}%` }}
                className="bg-emerald-500 h-full transition-all"
                title={`Available: ${stats.availablePlots} plots (${availablePercent}%)`}
              />
              <div
                style={{ width: `${bookedPercent}%` }}
                className="bg-amber-500 h-full transition-all"
                title={`Booked: ${stats.bookedPlots} plots (${bookedPercent}%)`}
              />
              <div
                style={{ width: `${soldPercent}%` }}
                className="bg-rose-500 h-full transition-all"
                title={`Sold: ${stats.soldPlots} plots (${soldPercent}%)`}
              />
            </div>

            {/* Status Breakdown Legend */}
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block mb-1" />
                <p className="text-xs font-bold text-emerald-800">Available</p>
                <p className="text-lg font-black text-emerald-700">{stats.availablePlots}</p>
                <p className="text-[10px] text-emerald-600">{availablePercent}%</p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-center">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block mb-1" />
                <p className="text-xs font-bold text-amber-800">Booked</p>
                <p className="text-lg font-black text-amber-700">{stats.bookedPlots}</p>
                <p className="text-[10px] text-amber-600">{bookedPercent}%</p>
              </div>

              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-center">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block mb-1" />
                <p className="text-xs font-bold text-rose-800">Sold</p>
                <p className="text-lg font-black text-rose-700">{stats.soldPlots}</p>
                <p className="text-[10px] text-rose-600">{soldPercent}%</p>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Location: <strong>Vatika, Jaipur</strong></span>
            <span>Currency: <strong>INR (₹)</strong></span>
          </div>
        </div>

        {/* Right: Active Projects Overview (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Residential Projects in Vatika</h3>
              <p className="text-xs text-slate-500">Live development projects and inventory status</p>
            </div>
            <Link
              href="/admin/projects"
              className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
            >
              <span>Manage Projects</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="space-y-3">
            {projects.slice(0, 3).map((proj) => (
              <div
                key={proj.id}
                className="p-3.5 rounded-xl border border-slate-200/80 hover:border-amber-400 bg-slate-50/50 hover:bg-amber-50/20 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{proj.name}</h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        proj.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {proj.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={12} className="text-slate-400" />
                    {proj.location}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs shrink-0">
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">Acreage</span>
                    <span className="font-bold text-slate-800">{proj.totalAcreage || 20} Acres</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">Plots</span>
                    <span className="font-bold text-slate-800">{proj.plotsCount || proj.totalPlotsCount || 50}</span>
                  </div>
                  <Link
                    href={`/admin/plots?projectId=${proj.id}`}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-blue-700 hover:border-blue-300 transition"
                    title="View plots"
                  >
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. RECENT ACTIVITY: RECENT BOOKINGS & PAYMENTS                   */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Tab Header */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => setActiveTab("bookings")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === "bookings"
                  ? "bg-[#0d1b2a] text-amber-400 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              Recent Plot Bookings ({recentBookings.length})
            </button>
            <button
              onClick={() => setActiveTab("payments")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === "payments"
                  ? "bg-[#0d1b2a] text-amber-400 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              Recent Payments Collected ({recentPayments.length})
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "notifications"
                  ? "bg-[#0d1b2a] text-amber-400 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Bell size={13} />
              <span>Notifications & KYC ({notifications.length})</span>
              {unreadNotifsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>
          </div>

          <Link
            href={
              activeTab === "bookings"
                ? "/admin/bookings"
                : activeTab === "payments"
                ? "/admin/payments"
                : "/admin/notifications"
            }
            className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1 self-end sm:self-auto"
          >
            <span>
              {activeTab === "bookings"
                ? "View All Bookings"
                : activeTab === "payments"
                ? "View All Payments"
                : "Notification Center"}
            </span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Tab Content */}
        <div className="overflow-x-auto">
          {activeTab === "bookings" ? (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/60 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-100 font-semibold">
                <tr>
                  <th className="py-3 px-4">Booking #</th>
                  <th className="py-3 px-4">Plot</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Total Price</th>
                  <th className="py-3 px-4">Advance Paid</th>
                  <th className="py-3 px-4">Balance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-sm">
                      No plot bookings recorded yet. Click &quot;New Plot Booking&quot; above to book.
                    </td>
                  </tr>
                ) : (
                  recentBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{b.bookingNumber}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-blue-700">{b.plot?.plotNumber}</span>
                        <span className="text-[10px] text-slate-400 block">{b.plot?.sizeGaj} Gaj</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900">{b.customerName}</span>
                        <span className="text-[10px] text-slate-400 block">{b.customerPhone}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        ₹ {b.totalPlotAmount?.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-700">
                        ₹ {b.bookingAmount?.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 font-bold text-amber-700">
                        ₹ {b.balanceAmount?.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === "CONFIRMED"
                              ? "bg-emerald-100 text-emerald-800"
                              : b.status === "CANCELLED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(b.bookingDate).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : activeTab === "payments" ? (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/60 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-100 font-semibold">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Plot</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Transaction Ref</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-sm">
                      No payments recorded yet. Click &quot;Collect Payment&quot; above to record.
                    </td>
                  </tr>
                ) : (
                  recentPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.receiptNumber}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {p.customer?.name || "Customer"}
                      </td>
                      <td className="py-3 px-4 text-blue-700 font-semibold">
                        {p.plot?.plotNumber || "-"}
                      </td>
                      <td className="py-3 px-4 font-black text-emerald-700">
                        ₹ {p.amount?.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                          {p.paymentMode}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {p.transactionRef || "-"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(p.receiptDate).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No notifications recorded yet. Any new document upload or booking will appear here.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 ${
                      !n.isRead ? "bg-amber-50/40" : "bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="p-2.5 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                        {n.type === "KYC" ? (
                          <FileCheck size={18} className="text-amber-600" />
                        ) : n.type === "BOOKING" ? (
                          <CalendarCheck size={18} className="text-amber-500" />
                        ) : n.type === "PAYMENT" ? (
                          <Receipt size={18} className="text-emerald-500" />
                        ) : n.type === "ASSOCIATE" ? (
                          <Users size={18} className="text-blue-500" />
                        ) : (
                          <Bell size={18} className="text-slate-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                            {n.title}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                              n.type === "KYC"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : n.type === "PAYMENT"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {n.type === "KYC" ? "KYC Document Upload" : n.type}
                          </span>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1.5 block">
                          {new Date(n.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          •{" "}
                          {new Date(n.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    {n.link && (
                      <Link
                        href={n.link}
                        className="px-3.5 py-1.5 rounded-xl bg-[#0d1b2a] hover:bg-slate-800 text-amber-400 font-bold text-xs flex items-center gap-1.5 shrink-0 transition shadow-xs self-start sm:self-center cursor-pointer"
                      >
                        <ShieldCheck size={14} />
                        <span>{n.type === "KYC" ? "Review & Verify" : "View Details"}</span>
                        <ArrowRight size={13} />
                      </Link>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
