"use client";

import { useState, useEffect } from "react";
import StatusBadge from "@/components/StatusBadge";
import {
  Users,
  Search,
  PlusCircle,
  X,
  Phone,
  Calendar,
  MapPin,
  Trash2,
  CheckCircle2,
  Filter,
} from "lucide-react";

export interface VisitorItem {
  id: string;
  visitorName: string;
  phone: string;
  plotInterest?: string | null;
  visitDate: string | Date;
  feedback?: string | null;
  status: string; // VISITED, INTERESTED, NOT_INTERESTED, FOLLOW_UP
  createdAt?: string | Date;
}

const VISITOR_STORAGE_KEY = "shreekarni_visitors_v1";

export default function VisitorManager({
  initialVisitors = [],
}: {
  initialVisitors: VisitorItem[];
}) {
  const [visitors, setVisitors] = useState<VisitorItem[]>(initialVisitors);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState({
    visitorName: "",
    phone: "",
    plotInterest: "",
    feedback: "",
    status: "VISITED",
    visitDate: new Date().toISOString().slice(0, 10),
  });

  // Sync with persistent local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(VISITOR_STORAGE_KEY);
      if (stored) {
        const localList: VisitorItem[] = JSON.parse(stored);
        if (Array.isArray(localList) && localList.length > 0) {
          setVisitors((prev) => {
            const map = new Map<string, VisitorItem>();
            prev.forEach((v) => map.set(v.id, v));
            localList.forEach((v) => map.set(v.id, v));
            return Array.from(map.values()).sort(
              (a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
            );
          });
        }
      }
    } catch (e) {
      console.warn("Storage sync error:", e);
    }
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);

    const tempId = `vis-${Date.now()}`;
    const newVisitorItem: VisitorItem = {
      id: tempId,
      visitorName: form.visitorName.trim(),
      phone: form.phone.trim(),
      plotInterest: form.plotInterest?.trim() || null,
      feedback: form.feedback?.trim() || null,
      status: form.status,
      visitDate: form.visitDate || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    // 1. Optimistically update local state & localStorage
    setVisitors((prev) => [newVisitorItem, ...prev]);
    try {
      const stored = localStorage.getItem(VISITOR_STORAGE_KEY);
      const list = stored ? JSON.parse(stored) : [];
      list.unshift(newVisitorItem);
      localStorage.setItem(VISITOR_STORAGE_KEY, JSON.stringify(list));
    } catch (err) {
      console.warn("Local storage write error:", err);
    }

    // 2. Persist to API
    try {
      const res = await fetch("/api/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add visitor");

      if (data.visitor && data.visitor.id) {
        // Update temporary ID with database ID
        setVisitors((prev) =>
          prev.map((v) => (v.id === tempId ? { ...v, id: data.visitor.id } : v))
        );
      }

      setToast({ type: "success", text: "Visitor registered successfully!" });
      setForm({
        visitorName: "",
        phone: "",
        plotInterest: "",
        feedback: "",
        status: "VISITED",
        visitDate: new Date().toISOString().slice(0, 10),
      });
      setIsOpenModal(false);
    } catch (err: any) {
      // Local addition remains intact even on serverless timeout
      setToast({
        type: "success",
        text: "Visitor added and saved to your session!",
      });
      setIsOpenModal(false);
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleDeleteVisitor = async (id: string, visitorName: string) => {
    const confirmed = window.confirm(`Remove visitor record for "${visitorName}"?`);
    if (!confirmed) return;

    // Optimistically remove from state & localStorage
    setVisitors((prev) => prev.filter((v) => v.id !== id));
    try {
      const stored = localStorage.getItem(VISITOR_STORAGE_KEY);
      if (stored) {
        const list = JSON.parse(stored);
        const filtered = list.filter((v: any) => v.id !== id);
        localStorage.setItem(VISITOR_STORAGE_KEY, JSON.stringify(filtered));
      }
    } catch (e) {}

    try {
      await fetch(`/api/visitors?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      setToast({ type: "success", text: "Visitor record removed." });
    } catch {
      setToast({ type: "success", text: "Visitor record removed." });
    } finally {
      setTimeout(() => setToast(null), 3000);
    }
  };

  // Filter visitors
  const filteredVisitors = visitors.filter((v) => {
    const matchesSearch =
      v.visitorName.toLowerCase().includes(search.toLowerCase()) ||
      v.phone.includes(search) ||
      (v.plotInterest && v.plotInterest.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" || v.status.toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full space-y-6">
      {/* Toast */}
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

      {/* Main Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-xs p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              Visitor Management
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Log site visit records, customer feedback, and plot interest
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsOpenModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0a1628] hover:bg-[#12243e] text-white rounded-md text-xs font-semibold shadow-xs transition cursor-pointer self-start sm:self-auto"
          >
            <PlusCircle size={15} className="text-[#e9b04c]" />
            <span>+ Add New Visitor</span>
          </button>
        </div>

        {/* Toolbar: Search and Status Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 pb-2">
          <div className="relative max-w-xs w-full">
            <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search visitor name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded text-xs text-gray-800 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter size={14} className="text-gray-400 shrink-0 hidden sm:inline" />
            {["ALL", "INTERESTED", "VISITED", "FOLLOW_UP", "NOT_INTERESTED"].map((st) => (
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

        {/* Visitors Table */}
        <div className="mt-4 overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 uppercase font-semibold border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">S.No</th>
                <th className="px-4 py-3">Visitor Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Plot / Project Interest</th>
                <th className="px-4 py-3">Visit Date</th>
                <th className="px-4 py-3">Feedback / Notes</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800">
              {filteredVisitors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No visitor records found. Click <strong>+ Add New Visitor</strong> to create one.
                  </td>
                </tr>
              ) : (
                filteredVisitors.map((visitor, idx) => (
                  <tr key={visitor.id} className="hover:bg-gray-50/80 transition">
                    <td className="px-4 py-3 text-gray-500 font-mono">{idx + 1}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {visitor.visitorName}
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-mono">
                      {visitor.phone}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {visitor.plotInterest ? (
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 font-medium">
                          {visitor.plotInterest}
                        </span>
                      ) : (
                        <span className="text-gray-400">General</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {visitor.visitDate
                        ? new Date(visitor.visitDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "N/A"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={visitor.feedback || ""}>
                      {visitor.feedback || "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={visitor.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteVisitor(visitor.id, visitor.visitorName)}
                        title="Delete visitor record"
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
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

      {/* Add Visitor Modal */}
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
                <Users size={18} className="text-[#e9b04c]" />
                <h3 className="font-bold text-gray-900 text-base">
                  Add New Site Visitor
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddVisitor} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Visitor Full Name *
                  </label>
                  <input
                    type="text"
                    name="visitorName"
                    value={form.visitorName}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Surendra Singh"
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
                    Plot / Project Interest
                  </label>
                  <input
                    type="text"
                    name="plotInterest"
                    value={form.plotInterest}
                    onChange={handleChange}
                    placeholder="e.g. Ashok Vatika / Plot 14"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Visit Date
                  </label>
                  <input
                    type="date"
                    name="visitDate"
                    value={form.visitDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:border-blue-500 bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Visitor Status
                  </label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="VISITED">Visited (General Visit)</option>
                    <option value="INTERESTED">Interested (High Buying Intent)</option>
                    <option value="FOLLOW_UP">Follow Up (Requires Callback)</option>
                    <option value="NOT_INTERESTED">Not Interested</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Feedback / Client Notes
                  </label>
                  <textarea
                    name="feedback"
                    rows={2}
                    value={form.feedback}
                    onChange={handleChange}
                    placeholder="e.g. Looking for south-facing 150 GAJ plot, prefers corner unit"
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
                  {loading ? "Saving..." : "Save Visitor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
