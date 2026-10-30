"use client";

import { useState } from "react";
import {
  Car,
  Calendar,
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  Building2,
  Trash2,
  CheckCircle2,
  Star,
  Plus,
} from "lucide-react";
import CrmSiteVisitModal from "./CrmSiteVisitModal";

export interface SiteVisitItem {
  id: string;
  visitorName: string;
  phone: string;
  email?: string | null;
  projectName?: string | null;
  plotInterest?: string | null;
  visitDate: string | Date;
  timeSlot?: string | null;
  pickupLocation?: string | null;
  driverOrCab?: string | null;
  feedback?: string | null;
  rating?: number | null;
  status: string;
  associateId?: string | null;
  associate?: {
    id: string;
    name: string;
    memberId: string;
  } | null;
}

export default function CrmSiteVisitsManager({
  initialVisits = [],
  associates = [],
}: {
  initialVisits: SiteVisitItem[];
  associates: Array<{ id: string; name: string; memberId: string }>;
}) {
  const [visits, setVisits] = useState<SiteVisitItem[]>(initialVisits);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedbackVisit, setFeedbackVisit] = useState<SiteVisitItem | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setVisits((prev) => prev.map((v) => (v.id === id ? { ...v, status: newStatus } : v)));
    try {
      await fetch("/api/admin/crm/site-visits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      showToast("Visit status updated!");
    } catch {
      showToast("Error updating status");
    }
  };

  const handleSaveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackVisit) return;

    setVisits((prev) =>
      prev.map((v) =>
        v.id === feedbackVisit.id
          ? { ...v, feedback: feedbackText, rating: feedbackRating, status: "COMPLETED" }
          : v
      )
    );

    try {
      await fetch("/api/admin/crm/site-visits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: feedbackVisit.id,
          feedback: feedbackText,
          rating: feedbackRating,
          status: "COMPLETED",
        }),
      });
      showToast("Visit feedback recorded successfully!");
      setFeedbackVisit(null);
    } catch {
      showToast("Error saving feedback");
    }
  };

  const handleDeleteVisit = async (id: string, name: string) => {
    if (!window.confirm(`Delete site visit record for "${name}"?`)) return;
    setVisits((prev) => prev.filter((v) => v.id !== id));
    try {
      await fetch(`/api/admin/crm/site-visits?id=${id}`, { method: "DELETE" });
      showToast("Visit record removed.");
    } catch {
      showToast("Error deleting visit");
    }
  };

  const filtered = visits.filter((v) => {
    if (statusFilter === "ALL") return true;
    return v.status === statusFilter;
  });

  return (
    <div className="space-y-4">
      {/* Toast Alert */}
      {toast && (
        <div className="p-3 bg-emerald-600 text-white rounded-lg text-sm flex items-center gap-2 font-medium shadow-md">
          <CheckCircle2 size={16} />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Car size={18} className="text-emerald-600" />
            <span>Site Visit &amp; Tour Management</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
              {filtered.length} visits
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Coordinate client pickup, vehicle arrangement, sales representative, and record visit feedback
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white outline-none"
          >
            <option value="ALL">All Visits</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="NO_SHOW">No Show</option>
          </select>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus size={15} />
            <span>+ Schedule Visit</span>
          </button>
        </div>
      </div>

      {/* Visits Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b text-xs font-semibold text-gray-600 uppercase">
                <th className="px-4 py-3 text-left">Visitor / Buyer</th>
                <th className="px-4 py-3 text-left">Date &amp; Time</th>
                <th className="px-4 py-3 text-left">Project / Interest</th>
                <th className="px-4 py-3 text-left">Pickup &amp; Cab</th>
                <th className="px-4 py-3 text-left">Assigned Guide</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Feedback &amp; Rating</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500 text-sm">
                    No site visits scheduled yet. Click &quot;+ Schedule Visit&quot; to book a client tour.
                  </td>
                </tr>
              ) : (
                filtered.map((visit) => {
                  const cleanPhone = visit.phone.replace(/[^0-9]/g, "");
                  const waText = encodeURIComponent(
                    `Namaste ${visit.visitorName} ji, your site visit for ${visit.projectName || "Shree Karni City"} is confirmed for ${new Date(visit.visitDate).toLocaleDateString("en-IN")} at ${visit.timeSlot || "10:00 AM"}. Our executive will coordinate with you.`
                  );
                  const waLink = `https://wa.me/91${cleanPhone}?text=${waText}`;

                  return (
                    <tr key={visit.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm">
                        <p className="font-bold text-gray-900">{visit.visitorName}</p>
                        <p className="text-xs text-gray-500 font-mono">{visit.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-1 font-semibold text-slate-800">
                          <Calendar size={13} className="text-blue-600" />
                          <span>{new Date(visit.visitDate).toLocaleDateString("en-IN")}</span>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Clock size={11} className="text-gray-400" />
                          <span>{visit.timeSlot || "10:00 AM - 12:00 PM"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <p className="font-semibold text-gray-900">{visit.projectName || "Shree Karni City"}</p>
                        <p className="text-xs text-blue-600">{visit.plotInterest || "All plots"}</p>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <p className="text-xs text-gray-700 font-medium flex items-center gap-1">
                          <MapPin size={12} className="text-red-500 shrink-0" />
                          <span className="truncate max-w-[160px]">{visit.pickupLocation || "Direct Arrival"}</span>
                        </p>
                        {visit.driverOrCab && (
                          <p className="text-[11px] text-gray-400 mt-0.5">{visit.driverOrCab}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {visit.associate ? (
                          <div>
                            <p className="font-semibold text-gray-900">{visit.associate.name}</p>
                            <p className="text-xs text-blue-600">{visit.associate.memberId}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Head Office</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <select
                          value={visit.status}
                          onChange={(e) => handleStatusChange(visit.id, e.target.value)}
                          className="text-xs font-bold border border-gray-300 rounded px-2 py-1 bg-white outline-none cursor-pointer"
                        >
                          <option value="SCHEDULED">Scheduled</option>
                          <option value="IN_TRANSIT">In Transit</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                          <option value="NO_SHOW">No Show</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {visit.feedback ? (
                          <div>
                            <div className="flex items-center gap-0.5 text-amber-500 text-xs mb-0.5">
                              {Array.from({ length: visit.rating || 5 }).map((_, i) => (
                                <Star key={i} size={11} className="fill-amber-400" />
                              ))}
                            </div>
                            <p className="text-xs text-gray-700 italic max-w-[180px] truncate">&quot;{visit.feedback}&quot;</p>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setFeedbackVisit(visit);
                              setFeedbackText("");
                              setFeedbackRating(5);
                            }}
                            className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
                          >
                            + Record Feedback
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noreferrer"
                            title="WhatsApp confirmation"
                            className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                          >
                            <MessageSquare size={14} />
                          </a>
                          <a
                            href={`tel:${visit.phone}`}
                            title="Call Visitor"
                            className="p-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                          >
                            <Phone size={14} />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteVisit(visit.id, visit.visitorName)}
                            title="Delete Visit"
                            className="p-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Visit Modal */}
      <CrmSiteVisitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        associates={associates}
        onSuccess={(visit) => {
          setVisits((prev) => [visit, ...prev]);
          showToast(`Site visit for ${visit.visitorName} scheduled!`);
        }}
      />

      {/* Feedback Dialog */}
      {feedbackVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-gray-900 text-lg mb-1">
              Record Site Visit Outcome
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Visitor: {feedbackVisit.visitorName} ({feedbackVisit.projectName || "Shree Karni City"})
            </p>

            <form onSubmit={handleSaveFeedback} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Client Rating (1 to 5 Stars)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      className="p-1 cursor-pointer"
                    >
                      <Star
                        size={22}
                        className={
                          star <= feedbackRating
                            ? "text-amber-500 fill-amber-400"
                            : "text-gray-300"
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Client Feedback / Objections / Next Step
                </label>
                <textarea
                  rows={3}
                  required
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="e.g. Liked Plot SKC-005, asking for token negotiation on Monday..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setFeedbackVisit(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2 rounded-lg text-sm"
                >
                  Save Outcome
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
