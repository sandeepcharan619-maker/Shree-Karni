"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  Clock,
  CalendarCheck,
  Receipt,
  Users,
  Award,
  Plus,
  Send,
  X,
  Megaphone,
} from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string; // BOOKING, PAYMENT, ASSOCIATE, COMMISSION, SYSTEM
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

interface AdminNotificationsManagerProps {
  initialNotifications: NotificationItem[];
}

export default function AdminNotificationsManager({
  initialNotifications,
}: AdminNotificationsManagerProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [filter, setFilter] = useState("ALL");
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "SYSTEM",
  });

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  const handleMarkOneRead = async (id: string) => {
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {}
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to broadcast announcement");

      setNotifications([data.notification, ...notifications]);
      setIsBroadcastOpen(false);
      setForm({ title: "", message: "", type: "SYSTEM" });
      alert("Announcement broadcasted successfully!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === "ALL") return true;
    if (filter === "UNREAD") return !n.isRead;
    return n.type === filter;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "BOOKING":
        return <CalendarCheck size={18} className="text-amber-500" />;
      case "PAYMENT":
        return <Receipt size={18} className="text-emerald-500" />;
      case "ASSOCIATE":
        return <Users size={18} className="text-blue-500" />;
      case "COMMISSION":
        return <Award size={18} className="text-purple-500" />;
      default:
        return <Megaphone size={18} className="text-rose-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notification Center</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              Real-time Alerts
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            System activity alerts for bookings, payments, associate registrations, and broadcast announcements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            Mark All as Read
          </button>
          <button
            onClick={() => setIsBroadcastOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0d1b2a] hover:bg-slate-800 text-amber-400 font-bold text-xs transition cursor-pointer"
          >
            <Send size={14} />
            <span>Broadcast Announcement</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200">
        {["ALL", "UNREAD", "BOOKING", "PAYMENT", "ASSOCIATE", "COMMISSION", "SYSTEM"].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filter === t
                ? "bg-[#0d1b2a] text-amber-400"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            {t.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Notifications Feed */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-2xl border border-slate-200 text-slate-400 text-sm">
            No notifications in this view.
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              onClick={() => handleMarkOneRead(n.id)}
              className={`p-4 rounded-2xl border transition flex items-start gap-3.5 cursor-pointer ${
                n.isRead
                  ? "bg-white border-slate-200"
                  : "bg-amber-50/40 border-amber-300 shadow-xs"
              }`}
            >
              <div className="p-2.5 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                {getIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(n.createdAt).toLocaleDateString("en-IN")} •{" "}
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                {n.link && (
                  <Link
                    href={n.link}
                    className="inline-block mt-2 text-xs font-bold text-blue-700 hover:underline"
                  >
                    View Details →
                  </Link>
                )}
              </div>

              {!n.isRead && (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 mt-2" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Broadcast Modal */}
      {isBroadcastOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsBroadcastOpen(false)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1">Broadcast Announcement</h3>
            <p className="text-xs text-slate-500 mb-4">
              Send an official notice or incentive announcement to all associates and managers.
            </p>

            <form onSubmit={handleBroadcast} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Announcement Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali Dhamaka Incentive Scheme Announced!"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message Content *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="All associates booking 3 or more plots this month in Vatika Township will receive a special gold coin bonus..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBroadcastOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0d1b2a] hover:bg-slate-800 text-amber-400 transition cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Publish Announcement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
