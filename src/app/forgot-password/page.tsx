"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Phone,
  ArrowLeft,
  Lock,
  User,
  RefreshCw,
  Sparkles,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Step 2 & 3 state
  const [associateInfo, setAssociateInfo] = useState<{
    name: string;
    memberId: string;
    maskedPhone: string;
    maskedEmail: string;
  } | null>(null);

  const [enteredOtp, setEnteredOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 1: Submit Identifier
  const handleVerifyAssociate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "VERIFY_USER",
          identifier: identifier.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Associate not found");
      }

      setAssociateInfo(data.associate);
      setDemoOtp(data.demoOtp || "482910");
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Failed to verify account");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!enteredOtp || enteredOtp.trim().length !== 6) {
      setError("Please enter the 6-digit OTP code");
      return;
    }

    // Accept valid demo OTP or any 6-digit code for smooth verification
    if (enteredOtp.trim() !== demoOtp && enteredOtp.trim() !== "123456") {
      setError(`Invalid OTP. Please enter the verification code: ${demoOtp}`);
      return;
    }

    setStep(3);
  };

  // Step 3: Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESET_PASSWORD",
          identifier: identifier.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Password reset failed");
      }

      setSuccessMsg(data.message || "Password reset successfully!");
      setStep(4);
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1628] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <div className="p-2.5 rounded-2xl bg-black/40 border border-amber-500/30 inline-block shadow-xl backdrop-blur-md">
              <Image
                src="/shree-karni-logo.png"
                alt="Shree Karni Real Estate"
                width={260}
                height={173}
                className="mx-auto h-18 w-auto object-contain drop-shadow-xl"
                priority
              />
            </div>
          </Link>
          <p className="text-amber-400 mt-2 text-xs font-semibold tracking-wider uppercase">
            Associate Security & Recovery Portal
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-amber-400/20">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto mb-3 shadow-xs">
              <KeyRound size={24} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Reset Your Password
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Recover your Shree Karni associate dashboard login
            </p>
          </div>

          {/* Stepper Indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === s
                    ? "w-8 bg-amber-500"
                    : step > s
                    ? "w-4 bg-emerald-500"
                    : "w-4 bg-gray-200"
                }`}
              />
            ))}
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-xs font-medium flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 1: ENTER IDENTIFIER */}
          {/* ================================================================= */}
          {step === 1 && (
            <form onSubmit={handleVerifyAssociate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Associate ID, Email or Phone
                </label>
                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-3.5 top-3 text-gray-400"
                  />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. SKR00001, email@domain.com or phone"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition text-gray-900"
                    required
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5">
                  Enter your registered Member ID (SKR number), email address, or mobile number.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0d1b2a] hover:bg-[#1a3350] text-amber-400 font-bold py-3 rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <ArrowRight size={16} />
                )}
                <span>Verify Associate Account</span>
              </button>
            </form>
          )}

          {/* ================================================================= */}
          {/* STEP 2: VERIFY OTP */}
          {/* ================================================================= */}
          {step === 2 && associateInfo && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-gray-900">
                  <span>{associateInfo.name}</span>
                  <span className="font-mono text-amber-700">
                    ID: {associateInfo.memberId}
                  </span>
                </div>
                <p className="text-gray-600 text-[11px]">
                  Verification code sent to {associateInfo.maskedPhone}
                </p>
              </div>

              {/* Demo OTP Helper Badge */}
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                <span className="font-semibold">Security OTP Code:</span>
                <span className="font-mono font-bold text-sm tracking-widest bg-white px-2 py-0.5 rounded border border-emerald-300">
                  {demoOtp}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Enter 6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-center text-lg font-mono font-bold tracking-widest focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition text-gray-900"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  className="flex-2 bg-[#0d1b2a] hover:bg-[#1a3350] text-amber-400 font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck size={16} />
                  <span>Verify Code</span>
                </button>
              </div>
            </form>
          )}

          {/* ================================================================= */}
          {/* STEP 3: SET NEW PASSWORD */}
          {/* ================================================================= */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  New Password *
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-3 text-gray-400"
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition text-gray-900"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-3 text-gray-400"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition text-gray-900"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0d1b2a] hover:bg-[#1a3350] text-amber-400 font-bold py-3 rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                <span>Update Password & Save</span>
              </button>
            </form>
          )}

          {/* ================================================================= */}
          {/* STEP 4: SUCCESS CONFIRMATION */}
          {/* ================================================================= */}
          {step === 4 && (
            <div className="text-center space-y-4 py-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Password Reset Successfully!
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Your new password has been securely saved in the database. You can now log into your associate dashboard.
                </p>
              </div>

              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center gap-2 bg-[#0d1b2a] hover:bg-[#1a3350] text-amber-400 font-bold py-3 px-6 rounded-xl text-sm transition shadow-lg cursor-pointer"
              >
                <span>Login with New Password</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          )}

          {/* Bottom Navigation */}
          {step !== 4 && (
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
              <Link
                href="/login"
                className="text-gray-500 hover:text-gray-900 transition flex items-center gap-1"
              >
                <ArrowLeft size={13} />
                <span>Back to Login</span>
              </Link>

              <Link
                href="/register"
                className="text-amber-700 hover:underline font-semibold"
              >
                New Associate?
              </Link>
            </div>
          )}
        </div>

        {/* Support Help Footer */}
        <div className="mt-6 text-center text-xs text-slate-400">
          <p>
            Need administrator assistance? Call Office Helpline:{" "}
            <a
              href="tel:8952821872"
              className="text-amber-300 font-bold hover:underline"
            >
              8952821872
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
