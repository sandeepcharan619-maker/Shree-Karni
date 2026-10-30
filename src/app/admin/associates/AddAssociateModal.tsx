"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X, RefreshCw } from "lucide-react";

interface SponsorOption {
  id: string;
  name: string;
  memberId: string;
}

export default function AddAssociateModal({
  sponsors = [],
  onSuccess,
}: {
  sponsors: SponsorOption[];
  onSuccess?: (newAssoc: any) => void;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    username: "",
    phone: "",
    email: "",
    password: "password123",
    rank: "Client Adviser",
    referredById: "",
    walletBalance: 0,
  });

  const handleOpen = () => {
    setError("");
    setSuccess("");
    setForm({
      name: "",
      username: "",
      phone: "",
      email: "",
      password: "password123",
      rank: "Client Adviser",
      referredById: "",
      walletBalance: 0,
    });
    setIsOpen(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const suggestedUsername = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, ".");
    
    setForm((prev) => ({
      ...prev,
      name,
      username: prev.username === "" || prev.username.startsWith(prev.name.toLowerCase().trim().replace(/[^a-z0-9]/g, ".")) 
        ? suggestedUsername 
        : prev.username,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/associates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create associate");
      }

      setSuccess(`Associate created successfully! Assigned Member ID: ${data.memberId}`);

      const createdAssoc = {
        id: data.user?.id || `local-${Date.now()}`,
        name: form.name.trim(),
        username: form.username.trim(),
        memberId: data.memberId,
        phone: form.phone.trim(),
        email: form.email ? form.email.trim() : null,
        rank: form.rank,
        isActive: true,
        walletBalance: form.walletBalance || 0,
        referredBy: sponsors.find((s) => s.id === form.referredById) || null,
        _count: { referrals: 0, sales: 0 },
        createdAt: new Date().toISOString(),
      };

      try {
        // 1. Unmark from deleted set
        const deletedRaw = localStorage.getItem("shreekarni_deleted_associates_v1");
        if (deletedRaw) {
          const arr = JSON.parse(deletedRaw);
          if (Array.isArray(arr)) {
            const filtered = arr.filter(
              (x) =>
                String(x).toUpperCase() !== (createdAssoc.memberId || "").toUpperCase() &&
                String(x).toUpperCase() !== (createdAssoc.id || "").toUpperCase()
            );
            localStorage.setItem("shreekarni_deleted_associates_v1", JSON.stringify(filtered));
          }
        }
        // 2. Save directly to custom associates store
        const stored = localStorage.getItem("shreekarni_custom_associates_v1");
        const list = stored ? JSON.parse(stored) : [];
        const cleanMemberId = (createdAssoc.memberId || "").toUpperCase();
        const updated = [
          createdAssoc,
          ...list.filter((a: any) => (a.memberId || "").toUpperCase() !== cleanMemberId),
        ];
        localStorage.setItem("shreekarni_custom_associates_v1", JSON.stringify(updated));
      } catch (e) {}

      if (onSuccess) {
        onSuccess(createdAssoc);
      }
      try {
        window.dispatchEvent(new CustomEvent("skr-associate-added", { detail: createdAssoc }));
      } catch (e) {}

      setTimeout(() => {
        setIsOpen(false);
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-xs transition"
      >
        <UserPlus size={16} />
        <span>+ Add New Associate</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-[#0a1628] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus size={18} className="text-yellow-400" />
                <h3 className="font-semibold text-lg">Add New Associate</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {success && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm font-medium">
                  {success}
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Singh"
                    value={form.name}
                    onChange={handleNameChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ramesh.singh"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9829012345"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. associate@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Initial Password *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-xs"
                  />
                </div>

                {/* Rank */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Initial Rank
                  </label>
                  <select
                    value={form.rank}
                    onChange={(e) => setForm({ ...form, rank: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="Client Adviser">Client Adviser</option>
                    <option value="Senior Adviser">Senior Adviser</option>
                    <option value="Team Leader">Team Leader</option>
                    <option value="Branch Manager">Branch Manager</option>
                    <option value="Director">Director</option>
                  </select>
                </div>

                {/* Sponsor / Referred By */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Sponsor / Referred By
                  </label>
                  <select
                    value={form.referredById}
                    onChange={(e) => setForm({ ...form, referredById: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="">Direct (No Sponsor)</option>
                    {sponsors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.memberId})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition disabled:opacity-50"
                >
                  {loading && <RefreshCw size={14} className="animate-spin" />}
                  <span>{loading ? "Creating Associate..." : "Save Associate"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
