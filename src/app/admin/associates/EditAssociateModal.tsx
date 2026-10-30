"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Edit3, X, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { AssociateItem } from "@/components/AssociatesManager";

interface SponsorOption {
  id: string;
  name: string;
  memberId: string;
}

export default function EditAssociateModal({
  associate,
  sponsors = [],
  isOpen,
  onClose,
  onSuccess,
}: {
  associate: AssociateItem | null;
  sponsors: SponsorOption[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updated: AssociateItem) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    memberId: "",
    name: "",
    phone: "",
    email: "",
    rank: "Client Adviser",
    referredById: "",
    customDownline: "",
    customSalesGaj: "",
    walletBalance: 0,
    isActive: true,
    newPassword: "",
  });

  useEffect(() => {
    if (associate) {
      setForm({
        memberId: associate.memberId || "",
        name: associate.name || "",
        phone: associate.phone || "",
        email: associate.email || "",
        rank: associate.rank || "Client Adviser",
        referredById: associate.referredById || associate.referredBy?.id || "",
        customDownline:
          associate.customDownline !== null && associate.customDownline !== undefined
            ? String(associate.customDownline)
            : "",
        customSalesGaj:
          associate.customSalesGaj !== null && associate.customSalesGaj !== undefined
            ? String(associate.customSalesGaj)
            : "",
        walletBalance: associate.walletBalance || 0,
        isActive: associate.isActive !== false,
        newPassword: "",
      });
      setError("");
      setSuccess("");
    }
  }, [associate, isOpen]);

  if (!isOpen || !associate) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload: any = {
        id: associate.id,
        memberId: form.memberId.trim().toUpperCase(),
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        rank: form.rank,
        referredById: form.referredById || null,
        customDownline: form.customDownline === "" ? null : parseInt(form.customDownline, 10),
        customSalesGaj: form.customSalesGaj === "" ? null : parseFloat(form.customSalesGaj),
        walletBalance: parseFloat(String(form.walletBalance)) || 0,
        isActive: form.isActive,
      };

      if (form.newPassword.trim()) {
        if (form.newPassword.trim().length < 6) {
          throw new Error("Password must be at least 6 characters");
        }
        payload.password = form.newPassword.trim();
      }

      const res = await fetch("/api/admin/associates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update associate");
      }

      const updatedUser: AssociateItem = {
        ...associate,
        ...data.user,
      };

      setSuccess("Associate details saved and updated for their dashboard!");

      if (onSuccess) {
        onSuccess(updatedUser);
      }

      try {
        window.dispatchEvent(new CustomEvent("skr-associate-updated", { detail: updatedUser }));
      } catch {}

      setTimeout(() => {
        onClose();
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const availableSponsors = sponsors.filter(
    (s) => s.id !== associate.id && s.memberId !== associate.memberId
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#0a1628] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 size={18} className="text-yellow-400" />
            <div>
              <h3 className="font-semibold text-lg">Edit Associate Details</h3>
              <p className="text-xs text-gray-300">
                Changes apply immediately to the associate&apos;s login dashboard
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition p-1 rounded-md"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm flex items-center gap-2 font-medium">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Member ID */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Member ID *
              </label>
              <input
                type="text"
                required
                value={form.memberId}
                onChange={(e) => setForm({ ...form, memberId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                placeholder="e.g. SKR00001"
              />
              <p className="text-[11px] text-gray-400 mt-0.5">
                Shows in Associate&apos;s Dashboard Member ID card and referral links.
              </p>
            </div>

            {/* 2. Associate Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Associate Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. Surendra Singh"
              />
              <p className="text-[11px] text-gray-400 mt-0.5">
                Displays in their dashboard header and profile.
              </p>
            </div>

            {/* 3. Phone */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. 9876543210"
              />
            </div>

            {/* 4. Rank */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Rank *
              </label>
              <select
                value={form.rank}
                onChange={(e) => setForm({ ...form, rank: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
              >
                <option value="Client Adviser">Client Adviser</option>
                <option value="Senior Adviser">Senior Adviser</option>
                <option value="Team Leader">Team Leader</option>
                <option value="Branch Manager">Branch Manager</option>
                <option value="Director">Director</option>
              </select>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Shows in Associate&apos;s &quot;Currant Rank&quot; dashboard card.
              </p>
            </div>

            {/* 5. Referred By / Sponsor */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Referred By (Sponsor)
              </label>
              <select
                value={form.referredById}
                onChange={(e) => setForm({ ...form, referredById: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="">Direct / Head Office (No Sponsor)</option>
                {availableSponsors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.memberId})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Updates their team tree and referral parent.
              </p>
            </div>

            {/* 6. Downline Count */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Total Downline (Count)
              </label>
              <input
                type="number"
                min="0"
                value={form.customDownline}
                onChange={(e) => setForm({ ...form, customDownline: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-purple-700 font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder={
                  associate._count?.referrals !== undefined
                    ? `Default: ${associate._count.referrals}`
                    : "e.g. 10"
                }
              />
              <p className="text-[11px] text-gray-400 mt-0.5">
                Appears on Associate&apos;s &quot;Total Downline&quot; card. Leave blank for auto.
              </p>
            </div>

            {/* 7. Sales (GAJ) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Self Business / Sales (GAJ)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.customSalesGaj}
                onChange={(e) => setForm({ ...form, customSalesGaj: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-red-700 font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder={
                  associate._count?.sales !== undefined
                    ? `Default: ${associate._count.sales} plots`
                    : "e.g. 250"
                }
              />
              <p className="text-[11px] text-gray-400 mt-0.5">
                Appears on Associate&apos;s &quot;Self Business(GAJ)&quot; card. Leave blank for auto.
              </p>
            </div>

            {/* 8. Wallet Balance */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Bank Wallet Balance (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500 font-semibold text-sm">₹</span>
                <input
                  type="number"
                  step="any"
                  value={form.walletBalance}
                  onChange={(e) => setForm({ ...form, walletBalance: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-sky-700 font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Displays on Associate&apos;s &quot;Bank Wallet Balance&quot; card and wallet page.
              </p>
            </div>

            {/* 9. Status */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Account Status *
              </label>
              <select
                value={form.isActive ? "ACTIVE" : "INACTIVE"}
                onChange={(e) => setForm({ ...form, isActive: e.target.value === "ACTIVE" })}
                className={`w-full px-3 py-2 border rounded-lg text-sm font-semibold outline-none ${
                  form.isActive
                    ? "border-emerald-300 text-emerald-700 bg-emerald-50/50"
                    : "border-red-300 text-red-700 bg-red-50/50"
                }`}
              >
                <option value="ACTIVE">ACTIVE (Can log in &amp; operate)</option>
                <option value="INACTIVE">INACTIVE (Account disabled)</option>
              </select>
            </div>

            {/* 10. Optional Reset Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Reset Password (Optional)
              </label>
              <input
                type="text"
                minLength={6}
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Leave blank to keep unchanged"
              />
              <p className="text-[11px] text-gray-400 mt-0.5">
                Enter new password only if associate forgot their login.
              </p>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Saving Updates...</span>
                </>
              ) : (
                <>
                  <Edit3 size={16} />
                  <span>Save All Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
