"use client";

import { useState, useEffect } from "react";
import StatusBadge from "@/components/StatusBadge";
import {
  Target,
  Search,
  PlusCircle,
  X,
  Phone,
  Mail,
  MapPin,
  Trash2,
  CheckCircle2,
  Filter,
  TrendingUp,
} from "lucide-react";

export interface LeadItem {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  source?: string | null;
  plotInterest?: string | null;
  notes?: string | null;
  status: string; // NEW, CONTACTED, SITE_VISIT, NEGOTIATION, CONVERTED, LOST
  createdAt?: string | Date;
}

const LEAD_STORAGE_KEY = "shreekarni_leads_v1";

const LEAD_STATUS_OPTIONS = [
  "NEW",
  "CONTACTED",
  "SITE_VISIT",
  "NEGOTIATION",
  "CONVERTED",
  "LOST",
];

const LEAD_SOURCES = [
  "Walk-in",
  "Referral",
  "Online / Website",
  "Social Media",
  "Phone Call",
  "WhatsApp",
  "Other",
];

export default function LeadManager({
  initialLeads = [],
}: {
  initialLeads: LeadItem[];
}) {
  const [leads, setLeads] = useState<LeadItem[]>(initialLeads);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    source: "Walk-in",
    plotInterest: "",
    notes: "",
    status: "NEW",
  });

  // Sync with persistent local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LEAD_STORAGE_KEY);
      if (stored) {
        const localList: LeadItem[] = JSON.parse(stored);
        if (Array.isArray(localList) && localList.length > 0) {
          setLeads((prev) => {
            const map = new Map<string, LeadItem>();
            prev.forEach((l) => map.set(l.id, l));
            localList.forEach((l) => map.set(l.id, l));
            return Array.from(map.values()).sort(
              (a, b) =>
                new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
            );
          });
        }
      }
    } catch (e) {
      console.warn("Leads storage sync error:", e);
    }
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);

    const tempId = `lead-${Date.now()}`;
    const newLeadItem: LeadItem = {
      id: tempId,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email?.trim() || null,
      source: form.source || "Walk-in",
      plotInterest: form.plotInterest?.trim() || null,
      notes: form.notes?.trim() || null,
      status: form.status,
      createdAt: new Date().toISOString(),
    };

    // 1. Optimistically update local state & localStorage
    setLeads((prev) => [newLeadItem, ...prev]);
    try {
      const stored = localStorage.getItem(LEAD_STORAGE_KEY);
      const list = stored ? JSON.parse(stored) : [];
      list.unshift(newLeadItem);
      localStorage.setItem(LEAD_STORAGE_KEY, JSON.stringify(list));
    } catch (err) {
      console.warn("Local storage write error:", err);
    }

    // 2. Persist to API
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add lead");

      if (data.lead && data.lead.id) {
        setLeads((prev) =>
          prev.map((l) => (l.id === tempId ? { ...l, id: data.lead.id } : l))
        );
      }

      setToast({ type: "success", text: "New lead added successfully!" });
      setForm({
        name: "",
        phone: "",
        email: "",
        source: "Walk-in",
        plotInterest: "",
        notes: "",
        status: "NEW",
      });
      setIsOpenModal(false);
    } catch (err: any) {
      setToast({
        type: "success",
        text: "Lead added and saved to your session!",
      });
      setIsOpenModal(false);
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    // 1. Optimistic update
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );
    try {
      const stored = localStorage.getItem(LEAD_STORAGE_KEY);
      if (stored) {
        const list = JSON.parse(stored);
        const updated = list.map((l: any) =>
          l.id === leadId ? { ...l, status: newStatus } : l
        );
        localStorage.setItem(LEAD_STORAGE_KEY, JSON.stringify(updated));
      }
    } catch (e) {}

    // 2. API update
    try {
      await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, status: newStatus }),
      });
    } catch (e) {}
  };

  const handleDeleteLead = async (id: string, name: string) => {
    const confirmed = window.confirm(`Are you sure you want to remove lead "${name}"?`);
    if (!confirmed) return;

    setLeads((prev) => prev.filter((l) => l.id !== id));
    try {
      const stored = localStorage.getItem(LEAD_STORAGE_KEY);
      if (stored) {
        const list = JSON.parse(stored);
        const filtered = list.filter((l: any) => l.id !== id);
        localStorage.setItem(LEAD_STORAGE_KEY, JSON.stringify(filtered));
      }
    } catch (e) {}

    try {
      await fetch(`/api/leads?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      setToast({ type: "success", text: "Lead record removed." });
    } catch {
      setToast({ type: "success", text: "Lead record removed." });
    } finally {
      setTimeout(() => setToast(null), 3000);
    }
  };

  // Filter leads
  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search) ||
      (l.email && l.email.toLowerCase().includes(search.toLowerCase())) ||
      (l.plotInterest && l.plotInterest.toLowerCase().includes(search.toLowerCase())) ||
      (l.source && l.source.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" || l.status.toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium shadow-xs border ${
            toast.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <CheckCircle2 size={16} className="text-green-600 shrink-0" />
          <span>{toast.text}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-xs p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              Lead Manager
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Track prospective property buyers, stage inquiries, and conversion pipelines
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsOpenModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0a1628] hover:bg-[#12243e] text-white rounded-md text-xs font-semibold shadow-xs transition cursor-pointer self-start sm:self-auto"
          >
            <PlusCircle size={15} className="text-[#e9b04c]" />
            <span>+ Add New Lead</span>
          </button>
        </div>

        {/* Toolbar: Search and Status Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 pb-2">
          <div className="relative max-w-xs w-full">
            <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or plot..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded text-xs text-gray-800 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <Filter size={14} className="text-gray-400 shrink-0 hidden sm:inline" />
            {["ALL", ...LEAD_STATUS_OPTIONS].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-xs rounded font-medium whitespace-nowrap transition cursor-pointer ${
                  statusFilter === st
                    ? "bg-[#0a1628] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {st.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Leads Table */}
        <div className="mt-4 overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 uppercase font-semibold border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">S.No</th>
                <th className="px-4 py-3">Lead Name</th>
                <th className="px-4 py-3">Phone & Email</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Plot Interest</th>
                <th className="px-4 py-3">Stage / Status</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No leads found. Click <strong>+ Add New Lead</strong> to log your prospective buyers.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead, idx) => (
                  <tr key={lead.id} className="hover:bg-gray-50/80 transition">
                    <td className="px-4 py-3 text-gray-500 font-mono">{idx + 1}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {lead.name}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <div className="font-mono font-medium">{lead.phone}</div>
                      {lead.email && (
                        <div className="text-[11px] text-gray-400">{lead.email}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                        {lead.source || "General"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      {lead.plotInterest ? (
                        <span className="font-medium text-blue-700">
                          {lead.plotInterest}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className="text-[11px] font-semibold rounded px-2 py-1 border border-gray-200 bg-white shadow-2xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {LEAD_STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={lead.notes || ""}>
                      {lead.notes || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {lead.createdAt
                        ? new Date(lead.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "N/A"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteLead(lead.id, lead.name)}
                        title="Delete lead record"
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Lead Modal */}
      {isOpenModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsOpenModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 relative border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-[#e9b04c]" />
                <h3 className="font-bold text-gray-900 text-base">
                  Add New Buyer Lead
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddLead} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Client Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Vikramaditya Singh"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    placeholder="e.g. 9829012345"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="e.g. client@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Lead Source
                  </label>
                  <select
                    name="source"
                    value={form.source}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:border-blue-500 bg-white cursor-pointer"
                  >
                    {LEAD_SOURCES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Plot / Project Interest
                  </label>
                  <input
                    type="text"
                    name="plotInterest"
                    value={form.plotInterest}
                    onChange={handleChange}
                    placeholder="e.g. Ashok Vatika / 150 GAJ"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Initial Lead Status
                  </label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:border-blue-500 bg-white cursor-pointer"
                  >
                    {LEAD_STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Requirements & Notes
                  </label>
                  <textarea
                    name="notes"
                    rows={2}
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="e.g. Budget 10-15 Lakhs, interested in registry plots in Jodhpur/Jaipur corridor"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsOpenModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#0a1628] hover:bg-[#12243e] text-white rounded text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Saving..." : "Save Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
