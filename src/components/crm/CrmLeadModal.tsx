"use client";

import { useState } from "react";
import { X, UserPlus, RefreshCw, Calendar, Phone, Mail, MapPin, IndianRupee } from "lucide-react";

interface AssociateOption {
  id: string;
  name: string;
  memberId: string;
}

export default function CrmLeadModal({
  isOpen,
  onClose,
  associates = [],
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  associates: AssociateOption[];
  onSuccess?: (lead: any) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    status: "NEW",
    source: "Website",
    budget: "10-20 Lakhs",
    preferredSizeGaj: 150,
    preferredLocation: "Jaipur",
    plotInterest: "",
    notes: "",
    followUpDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    associateId: "",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create lead");

      if (onSuccess) onSuccess(data.lead);
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-[#0a1628] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-yellow-400" />
            <div>
              <h3 className="font-semibold text-lg">Add New Real Estate Lead</h3>
              <p className="text-xs text-gray-300">Log incoming buyer inquiry from ads, website or walk-ins</p>
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
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Buyer Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Vikramaditya Rathore"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Mobile / WhatsApp *</label>
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
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="buyer@gmail.com"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Inquiry Source</label>
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Website">Website Form</option>
                <option value="WhatsApp">Direct WhatsApp</option>
                <option value="Meta Ads">Facebook / Instagram Ads</option>
                <option value="Google Ads">Google Search Ads</option>
                <option value="Walk-in">Head Office Walk-in</option>
                <option value="Referral">Associate Referral</option>
                <option value="99acres">99acres Portal</option>
                <option value="MagicBricks">MagicBricks Portal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Budget Range</label>
              <div className="relative">
                <IndianRupee size={14} className="absolute left-3 top-3 text-gray-400" />
                <select
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Under 5 Lakhs">Under ₹5 Lakhs</option>
                  <option value="5-10 Lakhs">₹5 - ₹10 Lakhs</option>
                  <option value="10-20 Lakhs">₹10 - ₹20 Lakhs</option>
                  <option value="20-35 Lakhs">₹20 - ₹35 Lakhs</option>
                  <option value="35-50 Lakhs">₹35 - ₹50 Lakhs</option>
                  <option value="50L+">₹50 Lakhs+</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Preferred Size (GAJ)</label>
              <input
                type="number"
                value={form.preferredSizeGaj}
                onChange={(e) => setForm({ ...form, preferredSizeGaj: parseFloat(e.target.value) || 0 })}
                placeholder="100, 150, 200 GAJ"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Location / City</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-3 text-gray-400" />
                <select
                  value={form.preferredLocation}
                  onChange={(e) => setForm({ ...form, preferredLocation: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Jaipur">Jaipur (Ajmer Road / Ring Road)</option>
                  <option value="Jodhpur">Jodhpur (Pali Road / Airport Area)</option>
                  <option value="Any Prime Area">Any Prime Township</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Follow-up Due Date</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="date"
                  value={form.followUpDate}
                  onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Assign to Sales Associate</label>
              <select
                value={form.associateId}
                onChange={(e) => setForm({ ...form, associateId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Unassigned (Head Office Pool)</option>
                {associates.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.memberId})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Customer Requirements / Notes</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Looking for immediate registry, corner plot preference, ready for site visit on Sunday..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
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
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Saving Lead...</span>
                </>
              ) : (
                <>
                  <UserPlus size={15} />
                  <span>Save Real Estate Lead</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
