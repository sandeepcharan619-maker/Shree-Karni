"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserPlus, RefreshCw } from "lucide-react";

interface Sponsor {
  id: string;
  name: string;
  memberId: string;
}

export default function CreateAssociateAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    password: "password123",
    rank: "Client Adviser",
    referredById: "",
    walletBalance: 0,
  });

  useEffect(() => {
    fetch("/api/admin/associates")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSponsors(data.map((u: any) => ({ id: u.id, name: u.name, memberId: u.memberId })));
        }
      })
      .catch(() => {});
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const suggested = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, ".");
    
    setForm((prev) => ({
      ...prev,
      name,
      username: prev.username === "" || prev.username.startsWith(prev.name.toLowerCase().trim().replace(/[^a-z0-9]/g, "."))
        ? suggested
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
      if (!res.ok) throw new Error(data.error || "Failed to create associate");

      const createdAssoc = {
        id: data.user?.id || `local-${Date.now()}`,
        name: form.name.trim(),
        username: form.username.trim(),
        memberId: data.memberId,
        phone: form.phone.trim(),
        rank: form.rank,
        isActive: true,
        walletBalance: form.walletBalance || 0,
        referredBy: sponsors.find((s) => s.id === form.referredById) || null,
        _count: { referrals: 0, sales: 0 },
      };

      try {
        const stored = localStorage.getItem("shreekarni_custom_associates_v1");
        const list = stored ? JSON.parse(stored) : [];
        const updated = [createdAssoc, ...list.filter((a: any) => a.memberId !== data.memberId)];
        localStorage.setItem("shreekarni_custom_associates_v1", JSON.stringify(updated));
      } catch (e) {}

      setSuccess(`Associate created successfully! Assigned Member ID: ${data.memberId}`);
      setTimeout(() => {
        router.push("/admin/associates");
      }, 1000);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/associates"
            className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Add New Associate</h1>
            <p className="text-sm text-gray-500">Register a new sales associate into the network</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg mb-6 text-sm font-medium">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
                placeholder="e.g. +91 9829012345"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Initial Password */}
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
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-xs"
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
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              >
                <option value="Client Adviser">Client Adviser</option>
                <option value="Senior Adviser">Senior Adviser</option>
                <option value="Team Leader">Team Leader</option>
                <option value="Branch Manager">Branch Manager</option>
                <option value="Director">Director</option>
              </select>
            </div>

            {/* Sponsor */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Sponsor / Referred By
              </label>
              <select
                value={form.referredById}
                onChange={(e) => setForm({ ...form, referredById: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              >
                <option value="">Direct / Head Office (No Sponsor)</option>
                {sponsors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.memberId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <Link
              href="/admin/associates"
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Creating Associate...</span>
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  <span>Create Associate</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
