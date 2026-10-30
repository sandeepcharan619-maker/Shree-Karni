"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { UserCheck, ShieldCheck, ArrowRight } from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCodeFromUrl = searchParams.get("ref") || "";

  const [form, setForm] = useState({
    name: "",
    username: "",
    phone: "",
    email: "",
    password: "",
    referralCode: refCodeFromUrl,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (refCodeFromUrl) {
      setForm((prev) => ({ ...prev, referralCode: refCodeFromUrl }));
    }
  }, [refCodeFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sign up failed");

      if (data.user) {
        try {
          // 1. Dispatch custom event for current window
          window.dispatchEvent(new CustomEvent("skr-associate-added", { detail: data.user }));

          // 2. Broadcast across all open tabs in real-time
          if (typeof window !== "undefined" && "BroadcastChannel" in window) {
            const channel = new BroadcastChannel("shreekarni_associates_channel");
            channel.postMessage({ type: "ASSOCIATE_REGISTERED", user: data.user });
            setTimeout(() => channel.close(), 1000);
          }

          // 3. Unmark from deleted set
          const cleanMemberId = (data.user.memberId || "").toUpperCase();
          const cleanId = (data.user.id || "").toUpperCase();
          const delRaw = localStorage.getItem("shreekarni_deleted_associates_v1");
          if (delRaw) {
            const delArr = JSON.parse(delRaw);
            if (Array.isArray(delArr)) {
              const filtered = delArr.filter(
                (d) => String(d).toUpperCase() !== cleanMemberId && String(d).toUpperCase() !== cleanId
              );
              localStorage.setItem("shreekarni_deleted_associates_v1", JSON.stringify(filtered));
            }
          }

          // 4. Save to persistent custom associates store
          const stored = localStorage.getItem("shreekarni_custom_associates_v1");
          const list = stored ? JSON.parse(stored) : [];
          const updated = [
            data.user,
            ...list.filter((x: any) => (x.memberId || "").toUpperCase() !== cleanMemberId),
          ];
          localStorage.setItem("shreekarni_custom_associates_v1", JSON.stringify(updated));
        } catch {}
      }

      setSuccess(`Account registered successfully! Your Member ID is: ${data.memberId}. Redirecting to login...`);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo & Header */}
        <div className="text-center mb-6">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Shree Karni Real Estate"
              width={240}
              height={50}
              className="mx-auto h-12 w-auto"
              priority
            />
          </Link>
          <h2 className="text-2xl font-bold text-white mt-4">Join as Sales Associate</h2>
          <p className="text-gray-400 text-sm mt-1">
            Start selling premium residential & commercial plots with Shree Karni
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm flex items-center gap-2">
              <UserCheck size={18} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Surendra Singh"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. surendra.karni"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="9876543210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Referral Code / Sponsor ID (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. SKR00001"
                value={form.referralCode}
                onChange={(e) => setForm({ ...form, referralCode: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Enter the Member ID of the associate who introduced you, or leave blank for direct sign-up.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#e9b04c] hover:bg-[#d89f3a] text-slate-900 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50 mt-2"
            >
              {loading ? "Creating Account..." : "Sign Up as Associate"}
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
            <span>Already have an account?</span>
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
            >
              Sign In to Dashboard →
            </Link>
          </div>
        </div>

        <div className="text-center mt-6 text-gray-400 text-xs flex items-center justify-center gap-1">
          <ShieldCheck size={14} className="text-yellow-500" />
          <span>Shree Karni Real Estate • Secure Associate Platform</span>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a1628] flex items-center justify-center text-white">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
