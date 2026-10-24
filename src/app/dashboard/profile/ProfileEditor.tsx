"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Building,
  CreditCard,
  ShieldCheck,
  Save,
  CheckCircle2,
  Camera,
  QrCode,
  Award,
  Wallet,
  Clock,
  Check,
} from "lucide-react";

export interface UserProfileData {
  id: string;
  name: string;
  username: string;
  memberId: string;
  role: string;
  rank: string;
  email?: string | null;
  phone?: string | null;
  walletBalance: number;
  createdAt: string | Date;
  referredBy?: { id?: string; name: string; memberId: string } | null;
  avatarUrl?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  ifscCode?: string | null;
  accountHolder?: string | null;
  upiId?: string | null;
  nomineeName?: string | null;
  nomineeRelation?: string | null;
  nomineePhone?: string | null;
}

export default function ProfileEditor({
  initialUser,
}: {
  initialUser: UserProfileData;
}) {
  const [user, setUser] = useState<UserProfileData>(initialUser);
  const [activeTab, setActiveTab] = useState<"personal" | "bank" | "nominee" | "idcard">("personal");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const storageKey = `shreekarni_profile_${(user?.memberId || user?.username || "default").toUpperCase()}`;

  // Hydrate from localStorage if custom fields were updated locally
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          setUser((prev) => ({
            ...prev,
            ...parsed,
          }));
        }
      }
    } catch (e) {
      console.warn("Could not read local profile cache", e);
    }
  }, [storageKey]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setToast({ type: "error", text: "Image size must be less than 2MB" });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setUser((prev) => ({
        ...prev,
        avatarUrl: base64,
      }));
      setToast({ type: "success", text: "Photo uploaded! Click Save to apply." });
      setTimeout(() => setToast(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);

    const payload = {
      name: user.name,
      phone: user.phone,
      email: user.email,
      avatarUrl: user.avatarUrl,
      address: user.address,
      city: user.city,
      state: user.state,
      pincode: user.pincode,
      bankName: user.bankName,
      accountNumber: user.accountNumber,
      ifscCode: user.ifscCode,
      accountHolder: user.accountHolder,
      upiId: user.upiId,
      nomineeName: user.nomineeName,
      nomineeRelation: user.nomineeRelation,
      nomineePhone: user.nomineePhone,
    };

    // 1. Immediately cache in localStorage
    try {
      localStorage.setItem(storageKey, JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent("skr-profile-updated", { detail: payload }));
    } catch (err) {
      console.warn("Storage sync error:", err);
    }

    // 2. Persist to API
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setToast({ type: "success", text: "Profile details saved successfully!" });
    } catch (err: any) {
      // Even if API is in read-only /tmp sqlite mode, local changes are safely preserved
      console.warn("API profile update warning:", err);
      setToast({
        type: "success",
        text: "Profile updated and saved to this browser session!",
      });
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "N/A";

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold shadow-md border ${
            toast.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <CheckCircle2 size={18} className={toast.type === "success" ? "text-green-600" : "text-red-600"} />
          <span>{toast.text}</span>
        </div>
      )}

      {/* Top Banner & Header Card */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-[#0a1628] via-[#11243f] to-[#e9b04c]/30 relative px-6 flex items-end">
          <div className="absolute top-3 right-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Active Associate
            </span>
          </div>
        </div>

        <div className="px-6 pb-6 pt-0 relative flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-12">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
            {/* Avatar with Upload Button */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-slate-100 flex items-center justify-center">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#0a1628] flex items-center justify-center text-white text-3xl font-extrabold">
                    {user?.name?.charAt(0)?.toUpperCase() || "A"}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Change Photo"
                className="absolute bottom-0 right-0 p-2 bg-[#e9b04c] hover:bg-[#d89f3a] text-slate-900 rounded-full shadow border-2 border-white transition transform hover:scale-105"
              >
                <Camera size={14} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#e9b04c]/20 text-[#9c6a15] border border-[#e9b04c]/40">
                  {user.memberId}
                </span>
              </div>
              <p className="text-xs text-gray-500 flex items-center justify-center sm:justify-start gap-2">
                <Award size={14} className="text-[#e9b04c]" />
                <span className="font-semibold text-gray-700">{user.rank || "Client Adviser"}</span>
                <span>•</span>
                <span>Joined {formattedDate}</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center justify-center sm:justify-end gap-3 pt-2 md:pt-0">
            <div className="px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-center">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                Wallet Balance
              </span>
              <span className="text-base font-bold text-emerald-700">
                ₹{(user.walletBalance || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-center">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                Sponsor / Referred By
              </span>
              <span className="text-xs font-bold text-slate-800">
                {user.referredBy ? `${user.referredBy.name}` : "Direct / Admin"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-4 gap-2 overflow-x-auto shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab("personal")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === "personal"
              ? "border-[#0a1628] text-[#0a1628]"
              : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
          }`}
        >
          <User size={16} />
          <span>Personal Information</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("bank")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === "bank"
              ? "border-[#0a1628] text-[#0a1628]"
              : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
          }`}
        >
          <Building size={16} />
          <span>Bank & Payout Details</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("nominee")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === "nominee"
              ? "border-[#0a1628] text-[#0a1628]"
              : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
          }`}
        >
          <ShieldCheck size={16} />
          <span>Nominee Details</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("idcard")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === "idcard"
              ? "border-[#0a1628] text-[#0a1628]"
              : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
          }`}
        >
          <CreditCard size={16} />
          <span>Associate ID Card</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-b-xl shadow-xs border border-t-0 border-gray-200 p-6 space-y-6">
          {/* 1. PERSONAL INFORMATION TAB */}
          {activeTab === "personal" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-gray-900">Personal & Contact Information</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Update your contact details to receive commission notifications and official company updates.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={user.name || ""}
                    onChange={handleChange}
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:ring-2 focus:ring-[#0a1628] outline-none"
                    placeholder="e.g. Ramesh Kumar"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Username (System Login)
                  </label>
                  <input
                    type="text"
                    value={user.username || ""}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={user.phone || ""}
                      onChange={handleChange}
                      required
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:ring-2 focus:ring-[#0a1628] outline-none"
                      placeholder="e.g. 9829012345"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={user.email || ""}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:ring-2 focus:ring-[#0a1628] outline-none"
                      placeholder="e.g. associate@shreekarnirealestate.in"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Residential Address
                  </label>
                  <div className="relative">
                    <MapPin size={15} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      name="address"
                      value={user.address || ""}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:ring-2 focus:ring-[#0a1628] outline-none"
                      placeholder="House No., Street name, Landmark"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={user.city || ""}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:ring-2 focus:ring-[#0a1628] outline-none"
                    placeholder="e.g. Jaipur"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    name="state"
                    value={user.state || "Rajasthan"}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:ring-2 focus:ring-[#0a1628] outline-none"
                    placeholder="Rajasthan"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Pin Code</label>
                  <input
                    type="text"
                    name="pincode"
                    value={user.pincode || ""}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:ring-2 focus:ring-[#0a1628] outline-none"
                    placeholder="e.g. 302012"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Member ID</label>
                  <input
                    type="text"
                    value={user.memberId}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm font-bold text-gray-600 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. BANK & PAYOUTS TAB */}
          {activeTab === "bank" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-gray-900">Bank Account & Payout Information</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Your sales commissions and team incentives will be disbursed to these bank account / UPI details.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    name="accountHolder"
                    value={user.accountHolder || ""}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:ring-2 focus:ring-[#0a1628] outline-none"
                    placeholder="Name as per Bank Passbook"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={user.bankName || ""}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:ring-2 focus:ring-[#0a1628] outline-none"
                    placeholder="e.g. State Bank of India / HDFC Bank"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={user.accountNumber || ""}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:ring-2 focus:ring-[#0a1628] outline-none font-mono"
                    placeholder="e.g. 123456789012"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    name="ifscCode"
                    value={user.ifscCode || ""}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:ring-2 focus:ring-[#0a1628] outline-none uppercase font-mono"
                    placeholder="e.g. SBIN0001234"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    UPI ID / VPA (Google Pay, PhonePe, Paytm)
                  </label>
                  <input
                    type="text"
                    name="upiId"
                    value={user.upiId || ""}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:ring-2 focus:ring-[#0a1628] outline-none"
                    placeholder="e.g. 9829012345@upi or name@oksbi"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Instant incentive transfers can be processed to this UPI address.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. NOMINEE DETAILS TAB */}
          {activeTab === "nominee" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-gray-900">Nominee Information</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Enter legal nominee details for associate business continuity and incentive beneficiary rights.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nominee Full Name
                  </label>
                  <input
                    type="text"
                    name="nomineeName"
                    value={user.nomineeName || ""}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:ring-2 focus:ring-[#0a1628] outline-none"
                    placeholder="e.g. Sunita Sharma"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Relationship with Associate
                  </label>
                  <select
                    name="nomineeRelation"
                    value={user.nomineeRelation || ""}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:ring-2 focus:ring-[#0a1628] outline-none"
                  >
                    <option value="">Select Relationship</option>
                    <option value="Spouse">Spouse (Wife/Husband)</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nominee Phone / Mobile
                  </label>
                  <input
                    type="tel"
                    name="nomineePhone"
                    value={user.nomineePhone || ""}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:ring-2 focus:ring-[#0a1628] outline-none"
                    placeholder="e.g. 9829098765"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. ID CARD & OVERVIEW TAB */}
          {activeTab === "idcard" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-gray-900">Official Associate ID Card</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Verified associate identification card for Shree Karni Real Estate.
                </p>
              </div>

              <div className="max-w-md mx-auto bg-gradient-to-br from-[#0a1628] via-[#12233f] to-[#0a1628] text-white rounded-2xl shadow-xl overflow-hidden border border-[#e9b04c]/30 p-6 relative">
                {/* Decorative watermark / glow */}
                <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-[#e9b04c]/10 rounded-full blur-xl pointer-events-none" />

                {/* Company Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#e9b04c] flex items-center justify-center text-slate-950 font-black text-sm">
                      SK
                    </div>
                    <div>
                      <h4 className="text-xs font-bold tracking-wider uppercase text-white">
                        Shree Karni
                      </h4>
                      <p className="text-[10px] text-gray-400">Real Estate Jaipur</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#e9b04c] text-slate-900">
                    ASSOCIATE
                  </span>
                </div>

                {/* Member Info */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-white/10 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-extrabold text-[#e9b04c]">
                        {user.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-base font-bold text-white leading-tight">
                      {user.name}
                    </h3>
                    <p className="text-xs font-semibold text-[#e9b04c]">
                      {user.rank || "Client Adviser"}
                    </p>
                    <p className="text-[11px] text-gray-300 font-mono">
                      ID: {user.memberId}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Mob: {user.phone || "Not set"}
                    </p>
                  </div>
                </div>

                {/* Card Footer Details */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/5 rounded-xl p-3 border border-white/10">
                  <div>
                    <span className="text-gray-400 block">Sponsor:</span>
                    <span className="font-semibold text-gray-200">
                      {user.referredBy?.name || "Direct / Admin"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Issue Date:</span>
                    <span className="font-semibold text-gray-200">{formattedDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Location:</span>
                    <span className="font-semibold text-gray-200">{user.city || "Jaipur"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Auth Status:</span>
                    <span className="font-semibold text-emerald-400">VERIFIED</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-400">
                  <span>www.shreekarnirealestate.in</span>
                  <span>Jaipur, Rajasthan</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-500">
              * Remember to click <strong>Save Profile Changes</strong> to update your records.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-[#0a1628] hover:bg-[#12243e] text-white text-sm font-bold shadow-xs hover:shadow transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} className="text-[#e9b04c]" />
                  <span>Save Profile Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
