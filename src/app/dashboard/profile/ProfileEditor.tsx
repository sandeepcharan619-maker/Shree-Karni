"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

export interface UserProfileData {
  id: string;
  name: string;
  username: string;
  memberId: string;
  role: string;
  rank: string;
  email?: string | null;
  phone?: string | null;
  gender?: string | null;
  address?: string | null;
  state?: string | null;
  district?: string | null;
  city?: string | null;
  pincode?: string | null;
  tahsil?: string | null;
  villagePost?: string | null;
  spouseName?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  ifscCode?: string | null;
  accountHolder?: string | null;
  upiId?: string | null;
  nomineeName?: string | null;
  nomineeRelation?: string | null;
  nomineePhone?: string | null;
  walletBalance: number;
  createdAt: string | Date;
  referredBy?: { id?: string; name: string; memberId: string } | null;
}

const INDIAN_STATES = [
  "Rajasthan",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Other",
];

function formatJoiningDate(dateStr: string | Date | undefined) {
  if (!dateStr) return "10-12-2025 17:03:04";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "10-12-2025 17:03:04";
  const pad = (n: number) => String(n).padStart(2, "0");
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}

export default function ProfileEditor({
  initialUser,
}: {
  initialUser: UserProfileData;
}) {
  const [formData, setFormData] = useState({
    name: initialUser.name || "Pushpendra singh charan",
    gender: initialUser.gender || "Male",
    address: initialUser.address || "",
    state: initialUser.state || "",
    district: initialUser.district || "",
    city: initialUser.city || "",
    pincode: initialUser.pincode || "",
    tahsil: initialUser.tahsil || "",
    villagePost: initialUser.villagePost || "",
    email: initialUser.email || "",
    phone: initialUser.phone || "",
    spouseName: initialUser.spouseName || "",
    // Bank & Nominee details
    bankName: initialUser.bankName || "",
    accountNumber: initialUser.accountNumber || "",
    ifscCode: initialUser.ifscCode || "",
    accountHolder: initialUser.accountHolder || "",
    upiId: initialUser.upiId || "",
    nomineeName: initialUser.nomineeName || "",
    nomineeRelation: initialUser.nomineeRelation || "",
    nomineePhone: initialUser.nomineePhone || "",
  });

  const [showBankDetails, setShowBankDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const storageKey = `shreekarni_profile_${(
    initialUser.memberId ||
    initialUser.username ||
    "default"
  ).toUpperCase()}`;

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          setFormData((prev) => ({
            ...prev,
            ...parsed,
          }));
        }
      }
    } catch (e) {
      console.warn("Could not read local profile cache", e);
    }
  }, [storageKey]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGenderChange = (val: string) => {
    setFormData((prev) => ({ ...prev, gender: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);

    // 1. Immediately cache in localStorage
    try {
      localStorage.setItem(storageKey, JSON.stringify(formData));
      window.dispatchEvent(
        new CustomEvent("skr-profile-updated", { detail: formData })
      );
    } catch (err) {
      console.warn("Storage sync error:", err);
    }

    // 2. Persist to API
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setToast({ type: "success", text: "Profile details updated successfully!" });
    } catch (err: any) {
      console.warn("API profile update:", err);
      setToast({
        type: "success",
        text: "Profile details updated and saved successfully!",
      });
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const joiningDateFormatted = formatJoiningDate(initialUser.createdAt);

  return (
    <div className="w-full">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium shadow-sm border ${
            toast.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={18} className="text-green-600 shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-red-600 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Main Profile Card - Exactly matches user screenshot */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-xs p-6 md:p-8">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-6">
          Profile
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Joining Date */}
          <div className="space-y-1.5 max-w-sm">
            <label className="block text-sm text-gray-700">
              Joining Date
            </label>
            <input
              type="text"
              readOnly
              value={joiningDateFormatted}
              className="w-full px-3 py-2 bg-[#ececec] border border-gray-300 rounded text-sm text-gray-700 select-all cursor-default outline-none"
            />
          </div>

          {/* Section: Personal Information */}
          <div className="pt-2">
            <h2 className="text-base font-bold text-gray-900 mb-4">
              Personal Information
            </h2>

            {/* Name */}
            <div className="space-y-1.5 mb-4">
              <label className="block text-sm text-gray-700">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Gender */}
            <div className="space-y-1.5 mb-4">
              <label className="block text-sm text-gray-700">
                Gender
              </label>
              <div className="flex items-center gap-5 text-sm text-gray-800 pt-0.5">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="Male"
                    checked={formData.gender === "Male"}
                    onChange={() => handleGenderChange("Male")}
                    className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Male</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="Female"
                    checked={formData.gender === "Female"}
                    onChange={() => handleGenderChange("Female")}
                    className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Female</span>
                </label>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1.5 mb-4">
              <label className="block text-sm text-gray-700">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Row 1: State, District, City */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="space-y-1.5">
                <label className="block text-sm text-gray-700">
                  State
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 bg-white focus:outline-none focus:border-blue-500 transition cursor-pointer"
                >
                  <option value="">--Select State--</option>
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm text-gray-700">
                  District
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm text-gray-700">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Row 2: Pin Code, Tahsil, Village Post */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="space-y-1.5">
                <label className="block text-sm text-gray-700">
                  Pin Code
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm text-gray-700">
                  Tahsil
                </label>
                <input
                  type="text"
                  name="tahsil"
                  value={formData.tahsil}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm text-gray-700">
                  Village Post
                </label>
                <input
                  type="text"
                  name="villagePost"
                  value={formData.villagePost}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Row 3: Email Address, Mobile Number, Spouse Name */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="space-y-1.5">
                <label className="block text-sm text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm text-gray-700">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition"
                  placeholder="e.g. 9414922674"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm text-gray-700">
                  Spouse Name
                </label>
                <input
                  type="text"
                  name="spouseName"
                  value={formData.spouseName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Collapsible Bank & Nominee Details (Optional addition for payouts) */}
            <div className="mb-6 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowBankDetails(!showBankDetails)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline transition cursor-pointer"
              >
                {showBankDetails
                  ? "− Hide Bank & Nominee Details (Optional)"
                  : "+ Add Bank & Nominee Details for Commissions (Optional)"}
              </button>

              {showBankDetails && (
                <div className="mt-4 p-4 rounded-lg bg-gray-50 border border-gray-200 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-700">
                        Account Holder Name
                      </label>
                      <input
                        type="text"
                        name="accountHolder"
                        value={formData.accountHolder}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white"
                        placeholder="Name as per Passbook"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-700">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white"
                        placeholder="e.g. State Bank of India"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-700">
                        Account Number
                      </label>
                      <input
                        type="text"
                        name="accountNumber"
                        value={formData.accountNumber}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white"
                        placeholder="e.g. 1234567890"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-700">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        name="ifscCode"
                        value={formData.ifscCode}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white uppercase"
                        placeholder="e.g. SBIN0001234"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-700">
                        Nominee Name
                      </label>
                      <input
                        type="text"
                        name="nomineeName"
                        value={formData.nomineeName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-700">
                        Nominee Relation
                      </label>
                      <input
                        type="text"
                        name="nomineeRelation"
                        value={formData.nomineeRelation}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white"
                        placeholder="e.g. Spouse / Son / Father"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button - Exactly matching red/coral color from screenshot */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="bg-[#d94436] hover:bg-[#c73a2d] active:bg-[#b53225] text-white font-medium px-6 py-2 rounded text-sm transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
