"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, ArrowRight, UserCheck, LogIn } from "lucide-react";
import { saveToLocalCache } from "@/lib/associatesCache";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCodeFromUrl = searchParams.get("ref") || "";

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    referralCode: refCodeFromUrl,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successInfo, setSuccessInfo] = useState<{
    memberId: string;
    email: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    if (refCodeFromUrl) {
      setForm((prev) => ({ ...prev, referralCode: refCodeFromUrl }));
    }
  }, [refCodeFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

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
          saveToLocalCache(data.user);
          // 1. Dispatch custom event for current window
          window.dispatchEvent(new CustomEvent("skr-associate-added", { detail: data.user }));

          // 2. Broadcast across all open tabs in real-time
          if (typeof window !== "undefined" && "BroadcastChannel" in window) {
            const channel = new BroadcastChannel("shreekarni_associates_channel");
            channel.postMessage({ type: "ASSOCIATE_REGISTERED", user: data.user });
            setTimeout(() => channel.close(), 1000);
          }
        } catch {}
      }

      setSuccessInfo({
        memberId: data.memberId,
        email: form.email.trim(),
        name: form.name.trim(),
      });

      // Clear the form fields
      setForm({
        name: "",
        email: "",
        phone: "",
        password: "",
        referralCode: "",
      });

      // Redirect after 5 seconds so associate can read their Member ID and thank-you message
      setTimeout(() => {
        router.push("/login");
      }, 5000);
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
          {successInfo ? (
            <div className="space-y-5">
              <div className="bg-emerald-50 border-2 border-emerald-400 rounded-xl p-5 text-emerald-950 shadow-sm">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-emerald-900">
                      Thanks for signing up!
                    </h3>
                    <p className="text-sm text-emerald-800 mt-1">
                      Welcome to Shree Karni Real Estate, <span className="font-semibold">{successInfo.name}</span>. Your associate account is now active.
                    </p>

                    <div className="mt-4 p-3.5 bg-white rounded-lg border border-emerald-200 text-xs space-y-1.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-medium">Your Member ID:</span>
                        <span className="font-mono font-bold text-sm text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {successInfo.memberId}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-medium">Registered Email:</span>
                        <span className="font-semibold text-gray-900">{successInfo.email}</span>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                      <p className="font-semibold">
                        Please login with your email and password (or your Member ID: {successInfo.memberId}).
                      </p>
                    </div>

                    <div className="mt-5 flex flex-col sm:flex-row items-center gap-3">
                      <Link
                        href="/login"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm shadow transition"
                      >
                        <LogIn size={16} />
                        Login with Email / Member ID
                      </Link>
                      <span className="text-xs text-emerald-700 font-medium">
                        Redirecting to login in 5s...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1. Name (Mandatory) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>

                {/* 2. Email (Mandatory) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    You can sign in using this email address.
                  </p>
                </div>

                {/* 3. Phone Number (Mandatory) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Enter 10-digit mobile number"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>

                {/* 4. Password (Mandatory) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Password <span className="text-red-500">*</span>
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

                {/* 5. Ref ID (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Referral ID / Sponsor ID <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SKR00001 (Optional)"
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
                  className="w-full bg-[#e9b04c] hover:bg-[#d89f3a] text-slate-900 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50 mt-2 cursor-pointer"
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
            </>
          )}
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
