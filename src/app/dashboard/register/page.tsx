"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterAssociatePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/associates/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      // Save to local cache so Tree View, Direct Team and Downline reflect it immediately
      try {
        const stored = localStorage.getItem("shreekarni_custom_associates_v1");
        const list = stored ? JSON.parse(stored) : [];
        const newAssoc = data.user || {
          id: `local-${Date.now()}`,
          name: form.name.trim(),
          username: form.username.trim(),
          memberId: data.memberId,
          phone: form.phone.trim(),
          email: form.email?.trim() || null,
          rank: "Client Adviser",
          isActive: true,
          walletBalance: 0,
          referredById: session?.user ? (session.user as any).id : null,
          referredBy: {
            name: session?.user?.name || "Pushpendra singh charan",
            memberId: (session?.user as any)?.memberId || "SKR00001",
          },
          createdAt: new Date().toISOString(),
        };
        list.unshift(newAssoc);
        localStorage.setItem("shreekarni_custom_associates_v1", JSON.stringify(list));
        window.dispatchEvent(new CustomEvent("skr-associate-added", { detail: newAssoc }));
      } catch (e) {
        console.warn("Storage sync:", e);
      }

      setSuccess(`Associate registered successfully! Member ID: ${data.memberId}`);
      setForm({ name: "", username: "", email: "", phone: "", password: "" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Register New Associate</h1>
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg mb-4 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{success}</p>
              <p className="text-xs text-green-700 mt-0.5">
                The associate is now active in your downline and visible in your tree view.
              </p>
            </div>
            <Link
              href="/dashboard/team/tree"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-green-700 hover:bg-green-800 text-white rounded text-xs font-bold shrink-0 transition"
            >
              View in Tree View →
            </Link>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        <p className="text-sm text-gray-500 mb-4">
          Register a new associate under your referral. They will appear in your downline.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
              <input type="text" name="username" value={form.username} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50">
            {loading ? "Registering..." : "Register Associate"}
          </button>
        </form>
      </div>
    </div>
  );
}
