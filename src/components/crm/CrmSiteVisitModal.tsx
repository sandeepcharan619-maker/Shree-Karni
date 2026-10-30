"use client";

import { useState } from "react";
import { X, Car, RefreshCw, Calendar, Clock, MapPin, Phone, Building2 } from "lucide-react";

interface AssociateOption {
  id: string;
  name: string;
  memberId: string;
}

export default function CrmSiteVisitModal({
  isOpen,
  onClose,
  associates = [],
  initialData,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  associates: AssociateOption[];
  initialData?: { visitorName?: string; phone?: string; plotInterest?: string };
  onSuccess?: (visit: any) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    visitorName: initialData?.visitorName || "",
    phone: initialData?.phone || "",
    email: "",
    projectName: "Shree Karni City, Jaipur",
    plotInterest: initialData?.plotInterest || "",
    visitDate: new Date().toISOString().split("T")[0],
    timeSlot: "10:00 AM - 12:00 PM",
    pickupLocation: "Mansarovar Metro Station / Client House",
    driverOrCab: "Company Vehicle (Scorpio / Ertiga)",
    associateId: "",
    status: "SCHEDULED",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/crm/site-visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to schedule site visit");

      if (onSuccess) onSuccess(data.visit);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to schedule visit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-[#0a1628] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car size={18} className="text-emerald-400" />
            <div>
              <h3 className="font-semibold text-lg">Schedule Township Site Visit</h3>
              <p className="text-xs text-gray-300">Arrange site inspection tour with transport and sales agent</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition p-1">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Customer / Visitor Name *</label>
              <input
                type="text"
                required
                value={form.visitorName}
                onChange={(e) => setForm({ ...form, visitorName: e.target.value })}
                placeholder="e.g. Ramesh Chandra"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone Number *</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="9829012345"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Township / Project</label>
              <div className="relative">
                <Building2 size={14} className="absolute left-3 top-3 text-gray-400" />
                <select
                  value={form.projectName}
                  onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Shree Karni City, Jaipur">Shree Karni City, Jaipur (Ajmer Road)</option>
                  <option value="Karni Greens, Jaipur">Karni Greens, Jaipur (Ring Road)</option>
                  <option value="Shree Karni Vihar, Jodhpur">Shree Karni Vihar, Jodhpur</option>
                  <option value="Airport Residency, Jodhpur">Airport Residency, Jodhpur</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Plots of Interest</label>
              <input
                type="text"
                value={form.plotInterest}
                onChange={(e) => setForm({ ...form, plotInterest: e.target.value })}
                placeholder="e.g. SKC-005, SKC-008 (150 GAJ)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Visit Date *</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="date"
                  required
                  value={form.visitDate}
                  onChange={(e) => setForm({ ...form, visitDate: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Time Slot</label>
              <div className="relative">
                <Clock size={14} className="absolute left-3 top-3 text-gray-400" />
                <select
                  value={form.timeSlot}
                  onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="09:00 AM - 11:00 AM">Morning (09:00 AM - 11:00 AM)</option>
                  <option value="11:00 AM - 01:00 PM">Noon (11:00 AM - 01:00 PM)</option>
                  <option value="02:00 PM - 04:00 PM">Afternoon (02:00 PM - 04:00 PM)</option>
                  <option value="04:00 PM - 06:00 PM">Evening (04:00 PM - 06:00 PM)</option>
                </select>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Pickup Location / Meeting Point</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={form.pickupLocation}
                  onChange={(e) => setForm({ ...form, pickupLocation: e.target.value })}
                  placeholder="e.g. Client Residence / Metro Station / Shree Karni Head Office"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Transport Vehicle / Driver</label>
              <div className="relative">
                <Car size={14} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={form.driverOrCab}
                  onChange={(e) => setForm({ ...form, driverOrCab: e.target.value })}
                  placeholder="Company Car / Cab arrangement"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Assigned Associate / Guide</label>
              <select
                value={form.associateId}
                onChange={(e) => setForm({ ...form, associateId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Head Office Team</option>
                {associates.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.memberId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Scheduling...</span>
                </>
              ) : (
                <>
                  <Car size={15} />
                  <span>Confirm Site Visit</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
