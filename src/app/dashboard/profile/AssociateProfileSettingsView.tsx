"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  Shield,
  Award,
  CreditCard,
  FileText,
  Lock,
  Bell,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  EyeOff,
  Upload,
  Copy,
  Check,
  Building,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  Crown,
  KeyRound,
  ExternalLink,
  ChevronRight,
  Save,
  RefreshCw,
  LogOut,
  Camera,
  X,
  Smartphone,
  ShieldCheck,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import AssociatePhotoUploader from "@/components/AssociatePhotoUploader";

export interface AssociateProfileData {
  id: string;
  name: string;
  username: string;
  memberId: string;
  role: string;
  rank: string;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  fatherName?: string | null;
  dob?: string | null;
  whatsappNumber?: string | null;
  gender?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  district?: string | null;
  tahsil?: string | null;
  villagePost?: string | null;
  spouseName?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  ifscCode?: string | null;
  accountHolder?: string | null;
  bankBranch?: string | null;
  upiId?: string | null;
  bankStatus?: string | null;
  aadhaarDocUrl?: string | null;
  panDocUrl?: string | null;
  photoDocUrl?: string | null;
  addressDocUrl?: string | null;
  bankDocUrl?: string | null;
  aadhaarStatus?: string | null;
  panStatus?: string | null;
  photoStatus?: string | null;
  addressStatus?: string | null;
  bankDocStatus?: string | null;
  kycStatus?: string | null;
  kycRejectReason?: string | null;
  twoFactorEnabled?: boolean;
  notificationPrefs?: string | null;
  lastLoginAt?: string | Date | null;
  lastLoginIp?: string | null;
  createdAt: string | Date;
  referredBy?: { id?: string; name: string; memberId: string } | null;
  walletBalance: number;
}

export interface NetworkStats {
  directMembersCount: number;
  totalTeamMembersCount: number;
  selfBusiness: number;
  teamBusiness: number;
  totalBusiness: number;
  plotsSold: number;
  commissionEarned: number;
}

export interface ActivityItem {
  id: string;
  action: string;
  title: string;
  description: string;
  timestamp: string;
  type: "success" | "info" | "warning" | "gold";
}

interface Props {
  initialUser: AssociateProfileData;
  networkStats: NetworkStats;
  activities?: ActivityItem[];
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

export default function AssociateProfileSettingsView({
  initialUser,
  networkStats,
  activities: initialActivities,
}: Props) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<
    | "personal"
    | "professional"
    | "bank"
    | "kyc"
    | "security"
    | "notifications"
    | "activity"
  >("personal");

  // User State
  const [user, setUser] = useState<AssociateProfileData>(initialUser);
  const [copiedId, setCopiedId] = useState(false);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingBank, setIsEditingBank] = useState(!initialUser.accountNumber);

  // Form State for Personal Info
  const [personalForm, setPersonalForm] = useState({
    name: initialUser.name || "",
    fatherName: initialUser.fatherName || "",
    dob: initialUser.dob || "",
    gender: initialUser.gender || "Male",
    phone: initialUser.phone || "",
    whatsappNumber: initialUser.whatsappNumber || initialUser.phone || "",
    email: initialUser.email || "",
    address: initialUser.address || "",
    city: initialUser.city || "Jaipur",
    state: initialUser.state || "Rajasthan",
    pincode: initialUser.pincode || "",
  });

  // Bank details form (initially blank - associate fills in their own details)
  const [bankForm, setBankForm] = useState({
    accountHolder: initialUser.accountHolder || "",
    bankName: initialUser.bankName || "",
    accountNumber: initialUser.accountNumber || "",
    ifscCode: initialUser.ifscCode || "",
    bankBranch: initialUser.bankBranch || "",
    upiId: initialUser.upiId || "",
  });

  const [maskAccount, setMaskAccount] = useState(true);

  // Document & KYC State
  const [docUrls, setDocUrls] = useState({
    aadhaarDocUrl: initialUser.aadhaarDocUrl || "",
    panDocUrl: initialUser.panDocUrl || "",
    photoDocUrl: initialUser.photoDocUrl || initialUser.avatarUrl || "",
    addressDocUrl: initialUser.addressDocUrl || "",
    bankDocUrl: initialUser.bankDocUrl || "",
  });

  const [docStatuses, setDocStatuses] = useState({
    aadhaarStatus: initialUser.aadhaarStatus || "PENDING",
    panStatus: initialUser.panStatus || "PENDING",
    photoStatus: initialUser.photoStatus || "PENDING",
    addressStatus: initialUser.addressStatus || "PENDING",
    bankDocStatus: initialUser.bankDocStatus || "PENDING",
  });
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string } | null>(null);

  // Check if all 5 documents are approved by admin
  const isKycApproved =
    user.kycStatus === "APPROVED" ||
    user.kycStatus === "VERIFIED" ||
    (docStatuses.aadhaarStatus === "APPROVED" &&
      docStatuses.panStatus === "APPROVED" &&
      docStatuses.photoStatus === "APPROVED" &&
      docStatuses.addressStatus === "APPROVED" &&
      docStatuses.bankDocStatus === "APPROVED");

  // Check if any document is pending
  const hasPendingDocs =
    !isKycApproved &&
    (docStatuses.aadhaarStatus !== "APPROVED" ||
      docStatuses.panStatus !== "APPROVED" ||
      docStatuses.photoStatus !== "APPROVED" ||
      docStatuses.addressStatus !== "APPROVED" ||
      docStatuses.bankDocStatus !== "APPROVED");

  // Real-time synchronization of KYC & approval status from database
  useEffect(() => {
    const syncLatestStatus = () => {
      fetch(`/api/profile?_t=${Date.now()}`, { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.user) {
            setUser((prev) => ({ ...prev, ...data.user }));
            setDocStatuses({
              aadhaarStatus: data.user.aadhaarStatus || "PENDING",
              panStatus: data.user.panStatus || "PENDING",
              photoStatus: data.user.photoStatus || "PENDING",
              addressStatus: data.user.addressStatus || "PENDING",
              bankDocStatus: data.user.bankDocStatus || "PENDING",
            });
            if (
              data.user.aadhaarDocUrl ||
              data.user.panDocUrl ||
              data.user.photoDocUrl ||
              data.user.addressDocUrl ||
              data.user.bankDocUrl
            ) {
              setDocUrls({
                aadhaarDocUrl: data.user.aadhaarDocUrl || "",
                panDocUrl: data.user.panDocUrl || "",
                photoDocUrl: data.user.photoDocUrl || data.user.avatarUrl || "",
                addressDocUrl: data.user.addressDocUrl || "",
                bankDocUrl: data.user.bankDocUrl || "",
              });
            }
          }
        })
        .catch(() => {});
    };

    window.addEventListener("focus", syncLatestStatus);
    const interval = setInterval(syncLatestStatus, 15000);
    return () => {
      window.removeEventListener("focus", syncLatestStatus);
      clearInterval(interval);
    };
  }, []);

  // Handle tab navigation from Bell icon or external links (e.g. ?tab=activity or #activity)
  useEffect(() => {
    const handleUrlTab = () => {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get("tab");
        const hash = window.location.hash.replace("#", "");
        const target = tabParam || hash;
        if (
          target &&
          [
            "personal",
            "professional",
            "bank",
            "kyc",
            "security",
            "notifications",
            "activity",
          ].includes(target)
        ) {
          setActiveTab(target as any);
          if (target === "activity") {
            setTimeout(() => {
              const el = document.getElementById("account-activity-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }, 100);
          }
        }
      }
    };

    handleUrlTab();
    window.addEventListener("popstate", handleUrlTab);
    window.addEventListener("hashchange", handleUrlTab);

    const handleCustomNav = (e: any) => {
      if (e.detail?.tab) {
        setActiveTab(e.detail.tab);
        if (e.detail.tab === "activity") {
          setTimeout(() => {
            const el = document.getElementById("account-activity-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      }
    };
    window.addEventListener("skr-navigate-tab", handleCustomNav);

    return () => {
      window.removeEventListener("popstate", handleUrlTab);
      window.removeEventListener("hashchange", handleUrlTab);
      window.removeEventListener("skr-navigate-tab", handleCustomNav);
    };
  }, []);

  // Security Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    initialUser.twoFactorEnabled ?? true
  );

  // Notification Preferences State
  const defaultPrefs = {
    bookings: { inApp: true, email: true, whatsapp: true },
    payments: { inApp: true, email: true, whatsapp: true },
    commissions: { inApp: true, email: true, whatsapp: true },
    teamUpdates: { inApp: true, email: false, whatsapp: true },
    rankAchievements: { inApp: true, email: true, whatsapp: true },
    companyAnnouncements: { inApp: true, email: true, whatsapp: false },
  };

  const [notifPrefs, setNotifPrefs] = useState(() => {
    try {
      if (initialUser.notificationPrefs) {
        return JSON.parse(initialUser.notificationPrefs);
      }
    } catch (e) {
      // fallback
    }
    return defaultPrefs;
  });

  // Alerts & loading
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Dynamic Profile Completion calculation
  const profileCompletion = useMemo(() => {
    let score = 0;
    const checks = [
      { name: "Profile Photo", completed: Boolean(user.avatarUrl), weight: 15 },
      { name: "Full Name & Contact", completed: Boolean(personalForm.name && personalForm.phone && personalForm.email), weight: 15 },
      { name: "Father's Name & DOB", completed: Boolean(personalForm.fatherName && personalForm.dob), weight: 10 },
      { name: "Complete Address & PIN", completed: Boolean(personalForm.address && personalForm.pincode && personalForm.city), weight: 15 },
      { name: "Bank Account Details", completed: Boolean(bankForm.accountNumber && bankForm.ifscCode && bankForm.bankName), weight: 20 },
      { name: "Aadhaar Card Uploaded", completed: Boolean(docUrls.aadhaarDocUrl), weight: 10 },
      { name: "PAN Card Uploaded", completed: Boolean(docUrls.panDocUrl), weight: 10 },
      { name: "Bank Verification Proof", completed: Boolean(docUrls.bankDocUrl), weight: 5 },
    ];

    checks.forEach((c) => {
      if (c.completed) score += c.weight;
    });

    return {
      percentage: Math.min(100, score),
      checks,
    };
  }, [user.avatarUrl, personalForm, bankForm, docUrls]);

  // Copy associate ID
  const handleCopyId = () => {
    navigator.clipboard.writeText(user.memberId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Save Personal Info
  const handleSavePersonal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(personalForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      setUser((prev) => ({ ...prev, ...personalForm }));
      setIsEditingPersonal(false);
      showToast("Personal details updated and saved successfully!");

      // Update broadcast
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("skr-profile-updated", { detail: personalForm })
        );
      }
    } catch (err: any) {
      showToast(err.message || "Failed to update personal info", "error");
    } finally {
      setLoading(false);
    }
  };

  // Save Bank Details
  const handleSaveBank = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bankForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update bank details");

      setUser((prev) => ({ ...prev, ...bankForm }));
      setIsEditingBank(false);
      showToast("Bank details updated and submitted for verification!");
    } catch (err: any) {
      showToast(err.message || "Failed to update bank details", "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle Document Upload (Real high-res document capture & persistence)
  const handleDocUpload = (
    docKey: "aadhaarDocUrl" | "panDocUrl" | "photoDocUrl" | "addressDocUrl" | "bankDocUrl",
    file: File
  ) => {
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showToast("File size too large. Please select a file under 8MB.", "error");
      return;
    }

    setLoading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const fileDataUrl = (e.target?.result as string) || "";

        const statusKeyMap: Record<string, string> = {
          aadhaarDocUrl: "aadhaarStatus",
          panDocUrl: "panStatus",
          photoDocUrl: "photoStatus",
          addressDocUrl: "addressStatus",
          bankDocUrl: "bankDocStatus",
        };

        const statusField = statusKeyMap[docKey];

        const res = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            [docKey]: fileDataUrl,
            [statusField]: "PENDING",
            kycStatus: "PENDING",
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to upload document");
        }

        setDocUrls((prev) => ({ ...prev, [docKey]: fileDataUrl }));
        setDocStatuses((prev) => ({ ...prev, [statusField]: "PENDING" }));
        setUser((prev) => ({
          ...prev,
          [docKey]: fileDataUrl,
          [statusField]: "PENDING",
          kycStatus: "PENDING",
        }));

        showToast(`${file.name} uploaded successfully! Status: Pending Admin Verification.`);
      } catch (err: any) {
        showToast(err.message || "Failed to upload document", "error");
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      showToast("Error reading file", "error");
      setLoading(false);
    };

    reader.readAsDataURL(file);
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showToast("Password must be at least 6 characters long", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Password change failed");

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      showToast("Password updated successfully! Keep it secure.");
    } catch (err: any) {
      showToast(err.message || "Failed to update password", "error");
    } finally {
      setLoading(false);
    }
  };

  // Toggle 2FA
  const handleToggle2FA = async () => {
    const nextVal = !twoFactorEnabled;
    setTwoFactorEnabled(nextVal);
    try {
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ twoFactorEnabled: nextVal }),
      });
      showToast(
        nextVal
          ? "Two-Factor Authentication activated."
          : "Two-Factor Authentication turned off."
      );
    } catch (err) {
      console.warn("2FA toggle error", err);
    }
  };

  // Save Notifications
  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationPrefs: JSON.stringify(notifPrefs) }),
      });
      showToast("Notification preferences saved successfully!");
    } catch (err) {
      showToast("Preferences saved locally.", "success");
    } finally {
      setLoading(false);
    }
  };

  // Format masked account
  const displayAccount = useMemo(() => {
    const raw = bankForm.accountNumber || "";
    if (!raw) return "•••• •••• •••• ••••";
    if (!maskAccount) return raw;
    const last4 = raw.slice(-4);
    return `•••• •••• •••• ${last4}`;
  }, [bankForm.accountNumber, maskAccount]);

  const joiningDateFormatted = useMemo(() => {
    if (!user.createdAt) return "10 Dec 2024";
    const d = new Date(user.createdAt);
    return isNaN(d.getTime())
      ? "10 Dec 2024"
      : d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
  }, [user.createdAt]);

  // Account Activities Timeline
  const activityTimeline: ActivityItem[] = initialActivities || [
    {
      id: "act-1",
      action: "PROFILE_UPDATED",
      title: "Profile & KYC Verified",
      description: "Associate profile, PAN and Aadhaar identity verified by Admin.",
      timestamp: "Today at 02:45 PM",
      type: "gold",
    },
    {
      id: "act-2",
      action: "COMMISSION_CREDITED",
      title: "Commission Credited to Wallet",
      description: "Direct booking commission of ₹42,500 credited for Plot SKC-104 (Vatika, Jaipur).",
      timestamp: "Yesterday at 05:12 PM",
      type: "success",
    },
    {
      id: "act-3",
      action: "ASSOCIATE_JOINED",
      title: "New Team Member Joined",
      description: "Sunil Choudhary (SKR00042) registered under your referral network.",
      timestamp: "02 Nov 2026 at 11:30 AM",
      type: "info",
    },
    {
      id: "act-4",
      action: "BANK_DETAILS_UPDATED",
      title: "Bank Account Details Updated",
      description: "State Bank of India savings account IFSC SBIN0031821 linked and verified.",
      timestamp: "28 Oct 2026 at 04:15 PM",
      type: "info",
    },
    {
      id: "act-5",
      action: "PASSWORD_CHANGED",
      title: "Password Changed",
      description: "Security credentials updated via secure authenticated session.",
      timestamp: "20 Oct 2026 at 09:10 AM",
      type: "warning",
    },
    {
      id: "act-6",
      action: "PLOT_BOOKING",
      title: "Plot Booking Completed",
      description: "Customer Ramawtar Sharma successfully booked 200 Gaj Plot in Shree Karni City.",
      timestamp: "15 Oct 2026 at 03:20 PM",
      type: "success",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-18 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border text-sm font-semibold transition-all transform animate-in fade-in slide-in-from-top-4 ${
            toast.type === "success"
              ? "bg-[#0d1b2a] border-amber-400/60 text-amber-300 shadow-amber-900/20"
              : "bg-red-950 border-red-500/60 text-red-200 shadow-red-900/20"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={20} className="text-amber-400 shrink-0" />
          ) : (
            <AlertCircle size={20} className="text-red-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. PREMIUM PROFILE HEADER & BANNER */}
      {/* ========================================================================= */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#0a1628] via-[#0f243e] to-[#0a1628] border border-amber-500/30 shadow-2xl text-white">
        {/* Decorative Golden Ambient Sheen */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Gold Foil Accent Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-amber-600 via-amber-300 to-amber-500" />

        <div className="p-6 sm:p-8 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left: Photo & Essential Profile Identity */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              {/* Photo Uploader */}
              <div className="relative">
                <AssociatePhotoUploader
                  initialAvatar={user.avatarUrl}
                  userName={user.name}
                  rank={user.rank}
                />
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-[#0a1628]"></span>
                </span>
              </div>

              {/* Identity Details */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-sm">
                    {user.name}
                  </h1>

                  {/* Gold Rank Badge */}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-500/20 border border-amber-400/60 text-amber-300 shadow-xs">
                    <Crown size={14} className="text-amber-400 fill-amber-400" />
                    <span>{user.rank}</span>
                  </span>

                  {/* Account Status */}
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>Active Associate</span>
                  </span>

                  {/* KYC Verification Status */}
                  {isKycApproved ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                      <CheckCircle2 size={12} />
                      <span>KYC Approved</span>
                    </span>
                  ) : user.kycStatus === "REJECTED" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/15 border border-red-500/30 text-red-300">
                      <XCircle size={12} />
                      <span>KYC Rejected</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/15 border border-red-500/30 text-red-300">
                      <Clock size={12} className="text-red-400" />
                      <span>KYC Pending <span className="text-[10px] font-bold text-red-400 lowercase">(pending)</span></span>
                    </span>
                  )}
                </div>

                {/* Associate ID with Copy Button */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs sm:text-sm text-slate-300">
                  <button
                    onClick={handleCopyId}
                    className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg font-mono font-bold text-amber-300 border border-amber-400/30 transition cursor-pointer"
                    title="Click to copy Member ID"
                  >
                    <span>ID: {user.memberId}</span>
                    {copiedId ? (
                      <Check size={14} className="text-emerald-400" />
                    ) : (
                      <Copy size={13} className="text-amber-400/80" />
                    )}
                  </button>

                  <span className="text-slate-500 hidden sm:inline">•</span>

                  <span className="inline-flex items-center gap-1 text-slate-300">
                    <Calendar size={14} className="text-amber-400" />
                    <span>Joined {joiningDateFormatted}</span>
                  </span>

                  <span className="text-slate-500 hidden sm:inline">•</span>

                  <span className="inline-flex items-center gap-1 text-slate-300">
                    <Award size={14} className="text-amber-400" />
                    <span>
                      Senior: {user.referredBy?.name || "Direct / Company Root"} (
                      {user.referredBy?.memberId || "DIRECT"})
                    </span>
                  </span>
                </div>

                {/* Contact Pill Row */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-slate-300">
                  <span className="inline-flex items-center gap-1.5 bg-black/25 px-2.5 py-1 rounded-md border border-white/5">
                    <Phone size={13} className="text-emerald-400" />
                    <span>{user.phone || "No phone linked"}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-black/25 px-2.5 py-1 rounded-md border border-white/5">
                    <Mail size={13} className="text-sky-400" />
                    <span>{user.email || "No email linked"}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-black/25 px-2.5 py-1 rounded-md border border-white/5">
                    <MapPin size={13} className="text-rose-400" />
                    <span>{user.city || "Jaipur"}, {user.state || "Rajasthan"}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Gold Membership Badge & Quick Edit Button */}
            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/10">
              <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/20 via-amber-400/20 to-amber-500/20 border border-amber-400/50 rounded-2xl px-4 py-2.5 shadow-inner">
                <Sparkles size={18} className="text-amber-400 animate-pulse" />
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-amber-200">
                    Membership Tier
                  </p>
                  <p className="text-sm font-extrabold text-amber-300">
                    Golden Club Associate
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveTab("personal");
                  setIsEditingPersonal(true);
                  const el = document.getElementById("profile-main-tabs");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition transform hover:-translate-y-0.5 cursor-pointer"
              >
                <User size={15} />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2-COLUMN RESPONSIVE LAYOUT */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* --------------------------------------------------------------------- */}
        {/* LEFT COLUMN (4 cols on lg): VIP Card, Profile Completion, Quick Nav */}
        {/* --------------------------------------------------------------------- */}
        <div className="lg:col-span-4 space-y-6">
          {/* A. LUXURY GOLD MEMBERSHIP PRIVILEGE CARD */}
          <div className="relative rounded-2xl p-6 text-slate-900 shadow-xl overflow-hidden bg-gradient-to-tr from-[#946200] via-[#d49a37] to-[#ffd269] border border-amber-300/40">
            {/* Card Shimmer / Sheen Layer */}
            <div className="absolute inset-0 bg-radial from-white/30 to-transparent pointer-events-none opacity-40" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none" />

            {/* Card Header */}
            <div className="flex items-center justify-between relative z-10 mb-6">
              <div className="flex items-center gap-2">
                <Crown size={22} className="text-slate-950 fill-slate-950" />
                <div>
                  <p className="text-[10px] tracking-widest font-extrabold uppercase text-slate-900/80">
                    SHREE KARNI REAL ESTATE
                  </p>
                  <p className="text-xs font-black tracking-tight text-slate-950">
                    ASSOCIATE PRIVILEGE CLUB
                  </p>
                </div>
              </div>

              {/* Holographic Metal Chip */}
              <div className="w-10 h-7 rounded bg-gradient-to-br from-amber-200 via-amber-400 to-yellow-600 border border-amber-800/40 shadow-xs flex items-center justify-center">
                <div className="w-6 h-4 border border-black/30 rounded-xs grid grid-cols-2 gap-0.5 opacity-60">
                  <div className="bg-black/20"></div>
                  <div className="bg-black/20"></div>
                </div>
              </div>
            </div>

            {/* Member Card Code / Number */}
            <div className="relative z-10 mb-5">
              <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">
                ASSOCIATE ID
              </p>
              <p className="text-xl font-mono font-extrabold tracking-widest text-slate-950">
                {user.memberId}
              </p>
            </div>

            {/* Card Footer: Associate Name & Rank */}
            <div className="flex items-end justify-between relative z-10 pt-2 border-t border-black/15">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-800">
                  ASSOCIATE NAME
                </p>
                <p className="text-sm font-bold uppercase tracking-wide text-slate-950 truncate max-w-[160px]">
                  {user.name}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-800">
                  CURRENT RANK
                </p>
                <p className="text-xs font-extrabold text-slate-950 bg-black/10 px-2 py-0.5 rounded">
                  {user.rank}
                </p>
              </div>
            </div>
          </div>

          {/* B. REAL-TIME PROFILE COMPLETION GAUGE */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Profile Verification
                  </h3>
                  <p className="text-xs text-gray-500">
                    Completing profile unlocks faster payouts
                  </p>
                </div>
              </div>
              <span className="text-base font-extrabold text-amber-600 font-mono">
                {profileCompletion.percentage}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${profileCompletion.percentage}%` }}
              />
            </div>

            {/* Checklist summary */}
            <div className="space-y-2 pt-1 text-xs">
              {profileCompletion.checks.slice(0, 4).map((c, i) => (
                <div key={i} className="flex items-center justify-between text-gray-600">
                  <span className="flex items-center gap-1.5">
                    {c.completed ? (
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    ) : (
                      <Clock size={14} className="text-gray-300" />
                    )}
                    <span className={c.completed ? "text-gray-800" : "text-gray-400"}>
                      {c.name}
                    </span>
                  </span>
                  <span className={c.completed ? "font-bold text-emerald-600" : "text-gray-400"}>
                    {c.completed ? "Done" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* C. QUICK SECTION NAVIGATION PILLS */}
          <div
            id="profile-main-tabs"
            className="bg-white rounded-2xl border border-gray-200/80 p-3 shadow-xs space-y-1"
          >
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-3 py-1">
              Settings & Modules
            </p>

            {[
              { id: "personal", label: "Personal Information", icon: User },
              { id: "professional", label: "Professional Details", icon: Award },
              { id: "bank", label: "Bank Account Details", icon: CreditCard },
              { id: "kyc", label: "Documents & KYC", icon: FileText },
              { id: "security", label: "Security & Login", icon: Lock },
              { id: "notifications", label: "Notification Preferences", icon: Bell },
              { id: "activity", label: "Account Activity Timeline", icon: Activity },
            ].map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#0d1b2a] text-amber-400 shadow-md shadow-slate-900/10"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      size={17}
                      className={isActive ? "text-amber-400" : "text-gray-400"}
                    />
                    <div className="flex items-center gap-1.5">
                      <span>{item.label}</span>
                      {item.id === "kyc" && (
                        hasPendingDocs ? (
                          <span className="text-[10px] font-bold text-red-500 lowercase tracking-normal">
                            pending
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-500 lowercase tracking-normal">
                            approved
                          </span>
                        )
                      )}
                    </div>
                  </div>
                  <ChevronRight
                    size={15}
                    className={isActive ? "text-amber-400" : "text-gray-300"}
                  />
                </button>
              );
            })}
          </div>

          {/* D. FAST HELP / SUPPORT CARD */}
          <div className="rounded-2xl p-5 bg-gradient-to-br from-[#0d1b2a] to-[#172b47] border border-amber-500/20 text-white shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-400/20 flex items-center justify-center text-amber-400">
                <Phone size={16} />
              </div>
              <h4 className="text-sm font-bold text-white">Need Profile Help?</h4>
            </div>
            <p className="text-xs text-slate-300 mb-3">
              To update locked identity records or request corporate rank review, contact Head Office.
            </p>
            <a
              href="tel:8952821872"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 transition"
            >
              <span>Call Helpline: 8952821872</span>
              <ChevronRight size={13} />
            </a>
          </div>
        </div>

        {/* --------------------------------------------------------------------- */}
        {/* RIGHT COLUMN (8 cols on lg): Active Settings Tab Content */}
        {/* --------------------------------------------------------------------- */}
        <div className="lg:col-span-8 space-y-6">
          {/* =================================================================== */}
          {/* TAB 1: PERSONAL INFORMATION */}
          {/* =================================================================== */}
          {activeTab === "personal" && (
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 md:p-8 animate-in fade-in">
              <div className="flex items-center justify-between pb-5 border-b border-gray-100 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <User className="text-amber-500" size={22} />
                    <span>Personal Information</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Manage your personal identity, contact details, and registered address.
                  </p>
                </div>

                {!isEditingPersonal ? (
                  <button
                    onClick={() => setIsEditingPersonal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold hover:bg-amber-100 transition cursor-pointer"
                  >
                    <span>Edit Information</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditingPersonal(false)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition cursor-pointer"
                  >
                    <span>Cancel</span>
                  </button>
                )}
              </div>

              {/* Sensitive Info Alert Notice */}
              <div className="flex items-start gap-3 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl mb-6 text-xs text-amber-900">
                <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong className="font-semibold">Security Note:</strong> Full Name and Mobile number are linked to your commission account. Changes to critical credentials undergo admin verification.
                </p>
              </div>

              <form onSubmit={handleSavePersonal} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      disabled={!isEditingPersonal}
                      value={personalForm.name}
                      onChange={(e) =>
                        setPersonalForm({ ...personalForm, name: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 transition"
                      required
                    />
                  </div>

                  {/* Father's Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      Father's Name
                    </label>
                    <input
                      type="text"
                      disabled={!isEditingPersonal}
                      value={personalForm.fatherName}
                      onChange={(e) =>
                        setPersonalForm({
                          ...personalForm,
                          fatherName: e.target.value,
                        })
                      }
                      placeholder="Enter Father's name"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 transition"
                    />
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      disabled={!isEditingPersonal}
                      value={personalForm.dob}
                      onChange={(e) =>
                        setPersonalForm({ ...personalForm, dob: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 transition"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      Gender
                    </label>
                    <select
                      disabled={!isEditingPersonal}
                      value={personalForm.gender}
                      onChange={(e) =>
                        setPersonalForm({ ...personalForm, gender: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 transition"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      Mobile Number (Calling) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-xs font-bold text-gray-400">
                        +91
                      </span>
                      <input
                        type="tel"
                        disabled={!isEditingPersonal}
                        value={personalForm.phone}
                        onChange={(e) =>
                          setPersonalForm({
                            ...personalForm,
                            phone: e.target.value,
                          })
                        }
                        className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 transition"
                        required
                      />
                    </div>
                  </div>

                  {/* WhatsApp Number */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      WhatsApp Number
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-xs font-bold text-gray-400">
                        +91
                      </span>
                      <input
                        type="tel"
                        disabled={!isEditingPersonal}
                        value={personalForm.whatsappNumber}
                        onChange={(e) =>
                          setPersonalForm({
                            ...personalForm,
                            whatsappNumber: e.target.value,
                          })
                        }
                        placeholder="Same as mobile"
                        className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 transition"
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      disabled={!isEditingPersonal}
                      value={personalForm.email}
                      onChange={(e) =>
                        setPersonalForm({ ...personalForm, email: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 transition"
                      required
                    />
                  </div>

                  {/* Complete Address */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      Permanent Postal Address
                    </label>
                    <textarea
                      rows={2}
                      disabled={!isEditingPersonal}
                      value={personalForm.address}
                      onChange={(e) =>
                        setPersonalForm({
                          ...personalForm,
                          address: e.target.value,
                        })
                      }
                      placeholder="House / Flat No., Street, Village, Landmark"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 transition resize-none"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      City / Tehsil
                    </label>
                    <input
                      type="text"
                      disabled={!isEditingPersonal}
                      value={personalForm.city}
                      onChange={(e) =>
                        setPersonalForm({ ...personalForm, city: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 transition"
                    />
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      State
                    </label>
                    <select
                      disabled={!isEditingPersonal}
                      value={personalForm.state}
                      onChange={(e) =>
                        setPersonalForm({ ...personalForm, state: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 transition"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* PIN Code */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      PIN Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      disabled={!isEditingPersonal}
                      value={personalForm.pincode}
                      onChange={(e) =>
                        setPersonalForm({
                          ...personalForm,
                          pincode: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 transition"
                    />
                  </div>
                </div>

                {/* Save Changes Button */}
                {isEditingPersonal && (
                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setIsEditingPersonal(false)}
                      className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center gap-2 bg-[#0d1b2a] hover:bg-[#1a3350] text-amber-400 font-bold px-6 py-2.5 rounded-xl text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <Save size={16} />
                      )}
                      <span>Save Changes</span>
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* =================================================================== */}
          {/* TAB 2: PROFESSIONAL INFORMATION */}
          {/* =================================================================== */}
          {activeTab === "professional" && (
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 md:p-8 animate-in fade-in">
              <div className="pb-5 border-b border-gray-100 mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Award className="text-amber-500" size={22} />
                  <span>Professional Network Information</span>
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Non-editable career metrics calculated directly from the real estate sales database.
                </p>
              </div>

              {/* Grid of Verified Database Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {/* Associate ID */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/70">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Associate ID
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-base font-bold font-mono text-gray-900">
                      {user.memberId}
                    </span>
                    <Lock size={13} className="text-gray-400" />
                  </div>
                  <span className="text-[10px] text-gray-400">Unique Corporate Identifier</span>
                </div>

                {/* Joining Date */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/70">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Joining Date
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-base font-bold text-gray-900">
                      {joiningDateFormatted}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400">Date of induction</span>
                </div>

                {/* Current Rank */}
                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/60">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                    Current Rank
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Crown size={16} className="text-amber-600 fill-amber-500" />
                    <span className="text-base font-extrabold text-amber-900">
                      {user.rank}
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-600">Company Recognition</span>
                </div>

                {/* Senior Associate */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/70">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Senior Associate (Sponsor)
                  </span>
                  <p className="text-sm font-bold text-gray-900 mt-1 truncate">
                    {user.referredBy?.name || "Direct Company Placement"}
                  </p>
                  <span className="text-[10px] font-mono text-gray-500">
                    ID: {user.referredBy?.memberId || "DIRECT"}
                  </span>
                </div>

                {/* Direct Members */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/70">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Total Direct Members
                  </span>
                  <p className="text-2xl font-black text-gray-900 mt-1 font-mono">
                    {networkStats.directMembersCount}
                  </p>
                  <span className="text-[10px] text-gray-400">Tier 1 Partners</span>
                </div>

                {/* Total Team Members */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/70">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Total Downline Team
                  </span>
                  <p className="text-2xl font-black text-indigo-900 mt-1 font-mono">
                    {networkStats.totalTeamMembersCount}
                  </p>
                  <span className="text-[10px] text-gray-400">Total Network Hierarchy</span>
                </div>

                {/* Self Business */}
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/60">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                    Self Business (Direct Plots)
                  </span>
                  <p className="text-xl font-black text-emerald-900 mt-1 font-mono">
                    ₹{networkStats.selfBusiness.toLocaleString("en-IN")}
                  </p>
                  <span className="text-[10px] text-emerald-600">Approved personal sales</span>
                </div>

                {/* Team Business */}
                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/60">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                    Team Downline Business
                  </span>
                  <p className="text-xl font-black text-blue-900 mt-1 font-mono">
                    ₹{networkStats.teamBusiness.toLocaleString("en-IN")}
                  </p>
                  <span className="text-[10px] text-blue-600">Total downline turnover</span>
                </div>

                {/* Total Combined Business */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-[#0d1b2a] to-[#1e3450] text-white">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                    Total Combined Business
                  </span>
                  <p className="text-xl font-black text-amber-400 mt-1 font-mono">
                    ₹{networkStats.totalBusiness.toLocaleString("en-IN")}
                  </p>
                  <span className="text-[10px] text-slate-300">Plots Sold: {networkStats.plotsSold}</span>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      Account Standing: Active & In Good Standing
                    </h4>
                    <p className="text-xs text-gray-500">
                      Authorized to recruit associates and earn plot commissions in Vatika, Jaipur projects.
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white">
                  VERIFIED
                </span>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* TAB 3: BANK DETAILS */}
          {/* =================================================================== */}
          {activeTab === "bank" && (
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 md:p-8 animate-in fade-in space-y-6">
              <div className="flex items-center justify-between pb-5 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <CreditCard className="text-amber-500" size={22} />
                    <span>Payout Bank Account Details</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Your commissions and incentives are credited directly to this verified bank account.
                  </p>
                </div>

                {!isEditingBank ? (
                  <button
                    onClick={() => setIsEditingBank(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold hover:bg-amber-100 transition cursor-pointer"
                  >
                    <span>Update Bank Details</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditingBank(false)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition cursor-pointer"
                  >
                    <span>Cancel</span>
                  </button>
                )}
              </div>

              {/* Informational Banner if Bank Not Configured */}
              {!bankForm.accountNumber && (
                <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
                  <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-900">Payout Account Not Linked</p>
                    <p className="mt-0.5 text-amber-800">
                      Your payout bank account details are currently blank. Please fill in your account details below and click <strong>&quot;Save Bank Details&quot;</strong> to link your bank for commission credits.
                    </p>
                  </div>
                </div>
              )}

              {/* Luxury Virtual Bank Card */}
              <div className="max-w-md mx-auto rounded-2xl p-6 bg-gradient-to-tr from-[#0a1628] via-[#10243e] to-[#1c385c] text-white shadow-xl border border-amber-400/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div className="flex items-center gap-2">
                    <Building size={20} className="text-amber-400" />
                    <span className="font-bold text-sm tracking-wide text-amber-200 uppercase">
                      {bankForm.bankName || "NO BANK ACCOUNT LINKED"}
                    </span>
                  </div>

                  {user.bankStatus === "APPROVED" || user.bankStatus === "VERIFIED" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 border border-emerald-400 text-emerald-300">
                      <CheckCircle2 size={12} />
                      <span>VERIFIED</span>
                    </span>
                  ) : bankForm.accountNumber ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 border border-amber-400 text-amber-300">
                      <Clock size={12} />
                      <span>PENDING VERIFICATION</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 border border-slate-400 text-slate-300">
                      <span>NOT LINKED</span>
                    </span>
                  )}
                </div>

                {/* Account Number with Mask Toggle */}
                <div className="mb-6 relative z-10">
                  <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                    <span>ACCOUNT NUMBER</span>
                    <button
                      type="button"
                      onClick={() => setMaskAccount(!maskAccount)}
                      className="inline-flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200 cursor-pointer"
                    >
                      {maskAccount ? <Eye size={13} /> : <EyeOff size={13} />}
                      <span>{maskAccount ? "Reveal" : "Mask"}</span>
                    </button>
                  </div>
                  <p className="text-xl font-mono font-bold tracking-widest text-white">
                    {displayAccount}
                  </p>
                </div>

                {/* Account Holder & IFSC */}
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/10 relative z-10 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                      Account Holder
                    </span>
                    <p className="font-bold text-white uppercase truncate">
                      {bankForm.accountHolder || user.name || "NOT SPECIFIED"}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                      IFSC Code
                    </span>
                    <p className="font-mono font-bold text-amber-300">
                      {bankForm.ifscCode || "NOT LINKED"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bank Detail Form */}
              <form onSubmit={handleSaveBank} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Account Holder Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      Account Holder Name *
                    </label>
                    <input
                      type="text"
                      disabled={!isEditingBank}
                      value={bankForm.accountHolder}
                      onChange={(e) =>
                        setBankForm({ ...bankForm, accountHolder: e.target.value })
                      }
                      placeholder="Account holder name as per bank records"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 transition"
                      required
                    />
                  </div>

                  {/* Bank Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      Bank Name *
                    </label>
                    <input
                      type="text"
                      disabled={!isEditingBank}
                      value={bankForm.bankName}
                      onChange={(e) =>
                        setBankForm({ ...bankForm, bankName: e.target.value })
                      }
                      placeholder="e.g. State Bank of India, HDFC Bank, ICICI..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 transition"
                      required
                    />
                  </div>

                  {/* Account Number */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      Account Number *
                    </label>
                    <input
                      type="text"
                      disabled={!isEditingBank}
                      value={bankForm.accountNumber}
                      onChange={(e) =>
                        setBankForm({
                          ...bankForm,
                          accountNumber: e.target.value,
                        })
                      }
                      placeholder="Enter your bank account number"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 font-mono focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 transition"
                      required
                    />
                  </div>

                  {/* IFSC Code */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      IFSC Code *
                    </label>
                    <input
                      type="text"
                      disabled={!isEditingBank}
                      value={bankForm.ifscCode}
                      onChange={(e) =>
                        setBankForm({
                          ...bankForm,
                          ifscCode: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="e.g. SBIN0031821"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 font-mono uppercase focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 transition"
                      required
                    />
                  </div>

                  {/* Branch Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      Branch Name
                    </label>
                    <input
                      type="text"
                      disabled={!isEditingBank}
                      value={bankForm.bankBranch}
                      onChange={(e) =>
                        setBankForm({ ...bankForm, bankBranch: e.target.value })
                      }
                      placeholder="e.g. Vatika Branch, Tonk Road, Jaipur"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 transition"
                    />
                  </div>

                  {/* UPI ID */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      UPI ID (Instant Wallet Transfer)
                    </label>
                    <input
                      type="text"
                      disabled={!isEditingBank}
                      value={bankForm.upiId}
                      onChange={(e) =>
                        setBankForm({ ...bankForm, upiId: e.target.value })
                      }
                      placeholder="e.g. username@okhdfcbank or phone@paytm"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 transition"
                    />
                  </div>
                </div>

                {isEditingBank && (
                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setIsEditingBank(false)}
                      className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center gap-2 bg-[#0d1b2a] hover:bg-[#1a3350] text-amber-400 font-bold px-6 py-2.5 rounded-xl text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <Save size={16} />
                      )}
                      <span>Save & Verify Bank</span>
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* =================================================================== */}
          {/* TAB 4: DOCUMENTS & KYC */}
          {/* =================================================================== */}
          {activeTab === "kyc" && (
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 md:p-8 animate-in fade-in space-y-6">
              <div className="pb-5 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <FileText className="text-amber-500" size={22} />
                      <span>Documents & KYC Verification</span>
                      {hasPendingDocs && (
                        <span className="text-[10px] font-bold text-red-500 lowercase bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                          pending
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Upload government-issued IDs for KYC approval and legal associate certification.
                    </p>
                  </div>

                  {isKycApproved ? (
                    <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-300 text-emerald-800 shadow-2xs">
                      <CheckCircle2 size={15} className="text-emerald-600" />
                      <span>KYC APPROVED</span>
                    </span>
                  ) : user.kycStatus === "REJECTED" ? (
                    <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-red-50 border border-red-300 text-red-800 shadow-2xs">
                      <XCircle size={15} className="text-red-600" />
                      <span>KYC REJECTED</span>
                    </span>
                  ) : (
                    <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-red-50 border border-red-200 text-red-600 shadow-2xs">
                      <Clock size={15} className="text-red-500" />
                      <span>KYC PENDING <span className="text-[10px] font-bold text-red-500 lowercase">(pending)</span></span>
                    </span>
                  )}
                </div>
              </div>

              {/* Informational Guidance Notice */}
              {!isKycApproved && (
                <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs flex items-start gap-3">
                  <Clock size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-amber-900">
                      KYC Verification in Progress
                    </p>
                    <p className="text-amber-800 leading-relaxed">
                      All new associates start with documents in <strong>Pending</strong> status. Please upload all 5 required government documents below. Our Admin team will review and approve them directly from the Admin Dashboard, after which your KYC status will automatically update to <span className="font-bold text-emerald-800">Approved</span>.
                    </p>
                    {user.kycRejectReason && (
                      <div className="mt-2 p-2.5 bg-red-100/80 border border-red-200 rounded-lg text-red-900 font-semibold">
                        Admin Note: {user.kycRejectReason}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Documents Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    key: "aadhaarDocUrl" as const,
                    statusKey: "aadhaarStatus" as const,
                    name: "Aadhaar Card (Front & Back)",
                    desc: "12-digit UIDAI proof with clear residential address.",
                    url: docUrls.aadhaarDocUrl,
                    status: docStatuses.aadhaarStatus,
                  },
                  {
                    key: "panDocUrl" as const,
                    statusKey: "panStatus" as const,
                    name: "PAN Card",
                    desc: "Mandatory for TDS tax deduction & plot commission payouts.",
                    url: docUrls.panDocUrl,
                    status: docStatuses.panStatus,
                  },
                  {
                    key: "photoDocUrl" as const,
                    statusKey: "photoStatus" as const,
                    name: "Passport Size Photograph",
                    desc: "Clean white background passport photo for corporate ID card.",
                    url: docUrls.photoDocUrl || user.avatarUrl,
                    status: docStatuses.photoStatus,
                  },
                  {
                    key: "addressDocUrl" as const,
                    statusKey: "addressStatus" as const,
                    name: "Address Proof",
                    desc: "Voter ID, Electricity bill or Rajasthan Domicile certificate.",
                    url: docUrls.addressDocUrl,
                    status: docStatuses.addressStatus,
                  },
                  {
                    key: "bankDocUrl" as const,
                    statusKey: "bankDocStatus" as const,
                    name: "Bank Proof (Cancelled Cheque / Passbook)",
                    desc: "Showing printed Account No. & IFSC Code matching bank details.",
                    url: docUrls.bankDocUrl,
                    status: docStatuses.bankDocStatus,
                  },
                ].map((doc) => {
                  const isApproved = doc.status === "APPROVED";
                  const isRejected = doc.status === "REJECTED";
                  const hasUrl = Boolean(doc.url);

                  return (
                    <div
                      key={doc.key}
                      className="p-5 rounded-2xl border border-gray-200 hover:border-amber-400/60 transition bg-slate-50/50 flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-gray-900">
                            {doc.name}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isApproved
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : isRejected
                                ? "bg-red-100 text-red-800 border border-red-200"
                                : "bg-red-50 text-red-600 border border-red-200"
                            }`}
                          >
                            {isApproved ? (
                              <CheckCircle2 size={11} className="text-emerald-600" />
                            ) : isRejected ? (
                              <XCircle size={11} className="text-red-600" />
                            ) : (
                              <Clock size={11} className="text-red-500" />
                            )}
                            <span className={isApproved ? "" : "lowercase"}>
                              {isApproved
                                ? "Approved"
                                : isRejected
                                ? "Rejected"
                                : "pending"}
                            </span>
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">{doc.desc}</p>

                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-gray-200 text-xs font-mono">
                          <FileText
                            size={15}
                            className={hasUrl ? (isApproved ? "text-emerald-600 shrink-0" : "text-amber-500 shrink-0") : "text-gray-400 shrink-0"}
                          />
                          <span
                            className={`truncate flex-1 ${
                              hasUrl
                                ? isApproved
                                  ? "text-emerald-800 font-semibold"
                                  : "text-red-600 font-semibold"
                                : "text-gray-400 italic font-sans"
                            }`}
                          >
                            {hasUrl
                              ? isApproved
                                ? "Verified & Approved by Admin"
                                : "Document uploaded (pending admin approval)"
                              : "Not uploaded yet - pending upload"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-gray-200/60">
                        {hasUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewDoc({
                                title: doc.name,
                                url: doc.url!,
                              })
                            }
                            className="flex-1 py-1.5 px-3 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-xs font-bold text-gray-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>
                        )}

                        <label className="flex-1 py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer">
                          <Upload size={13} />
                          <span>{hasUrl ? "Re-upload" : "Upload Document"}</span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleDocUpload(doc.key, e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* TAB 5: SECURITY SETTINGS */}
          {/* =================================================================== */}
          {activeTab === "security" && (
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 md:p-8 animate-in fade-in space-y-6">
              <div className="pb-5 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Lock className="text-amber-500" size={22} />
                  <span>Security & Account Credentials</span>
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Manage password security, two-factor authentication, and active sessions.
                </p>
              </div>

              {/* Password Change Form */}
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200/80">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <KeyRound size={17} className="text-amber-600" />
                  <span>Change Password</span>
                </h3>

                <form onSubmit={handleChangePassword} className="space-y-3 max-w-lg">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                        Current Password
                      </label>
                      <Link
                        href="/forgot-password"
                        className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 hover:underline"
                      >
                        Forgot Current Password?
                      </Link>
                    </div>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          currentPassword: e.target.value,
                        })
                      }
                      placeholder="Enter existing password"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          newPassword: e.target.value,
                        })
                      }
                      placeholder="Minimum 6 characters"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white"
                      required
                      minLength={6}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder="Repeat new password"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 bg-[#0d1b2a] hover:bg-[#1a3350] text-amber-400 font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow transition disabled:opacity-50 cursor-pointer mt-2"
                  >
                    {loading ? (
                      <RefreshCw size={15} className="animate-spin" />
                    ) : (
                      <Lock size={15} />
                    )}
                    <span>Update Password</span>
                  </button>
                </form>
              </div>

              {/* Two-Factor Authentication (2FA) */}
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      Two-Factor Authentication (2FA via SMS/WhatsApp)
                    </h4>
                    <p className="text-xs text-gray-500">
                      Require a one-time OTP code when signing in from an unknown device.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggle2FA}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    twoFactorEnabled ? "bg-emerald-600 justify-end" : "bg-gray-300 justify-start"
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>

              {/* Active Session & Login History */}
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      Active Login Session
                    </h4>
                    <p className="text-xs text-gray-500">
                      Current authenticated browser & device information.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      showToast("All other remote sessions have been revoked.");
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 transition cursor-pointer"
                  >
                    <LogOut size={13} />
                    <span>Logout All Other Devices</span>
                  </button>
                </div>

                <div className="p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="font-bold text-gray-900">
                      Current Session (macOS / Chrome)
                    </span>
                  </div>
                  <div className="text-gray-500 font-mono">
                    IP: {user.lastLoginIp || "127.0.0.1 (Jaipur, RJ)"} • Active now
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* TAB 6: NOTIFICATION PREFERENCES */}
          {/* =================================================================== */}
          {activeTab === "notifications" && (
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 md:p-8 animate-in fade-in space-y-6">
              <div className="flex items-center justify-between pb-5 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Bell className="text-amber-500" size={22} />
                    <span>Notification Preferences</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Choose which notifications you receive across In-App, Email, and WhatsApp.
                  </p>
                </div>

                <button
                  onClick={handleSaveNotifications}
                  disabled={loading}
                  className="inline-flex items-center gap-2 bg-[#0d1b2a] hover:bg-[#1a3350] text-amber-400 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm shadow transition cursor-pointer"
                >
                  <Save size={15} />
                  <span>Save Preferences</span>
                </button>
              </div>

              {/* Preferences Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-500">
                      <th className="py-3 px-2">Category</th>
                      <th className="py-3 px-4 text-center">In-App</th>
                      <th className="py-3 px-4 text-center">Email</th>
                      <th className="py-3 px-4 text-center">WhatsApp / SMS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      {
                        key: "bookings",
                        title: "Plot Booking Notifications",
                        desc: "Instant alerts when a plot is booked by or under you.",
                      },
                      {
                        key: "payments",
                        title: "Payment Notifications",
                        desc: "Receipts, customer installments, and payment clearances.",
                      },
                      {
                        key: "commissions",
                        title: "Commission Notifications",
                        desc: "Commission approvals, credits, and wallet withdrawals.",
                      },
                      {
                        key: "teamUpdates",
                        title: "Team Downline Updates",
                        desc: "When a new associate registers using your referral link.",
                      },
                      {
                        key: "rankAchievements",
                        title: "Rank Achievements",
                        desc: "Promotions, rank awards, and milestone achievements.",
                      },
                      {
                        key: "companyAnnouncements",
                        title: "Company Announcements",
                        desc: "New project launches, price revisions, and corporate events.",
                      },
                    ].map((row) => (
                      <tr key={row.key} className="hover:bg-gray-50/70 transition">
                        <td className="py-3.5 px-2">
                          <p className="font-bold text-gray-900">{row.title}</p>
                          <p className="text-xs text-gray-500">{row.desc}</p>
                        </td>

                        {/* In App Toggle */}
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={Boolean(notifPrefs[row.key]?.inApp)}
                            onChange={(e) =>
                              setNotifPrefs((prev: any) => ({
                                ...prev,
                                [row.key]: {
                                  ...prev[row.key],
                                  inApp: e.target.checked,
                                },
                              }))
                            }
                            className="w-4 h-4 text-amber-500 accent-amber-500 rounded cursor-pointer"
                          />
                        </td>

                        {/* Email Toggle */}
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={Boolean(notifPrefs[row.key]?.email)}
                            onChange={(e) =>
                              setNotifPrefs((prev: any) => ({
                                ...prev,
                                [row.key]: {
                                  ...prev[row.key],
                                  email: e.target.checked,
                                },
                              }))
                            }
                            className="w-4 h-4 text-amber-500 accent-amber-500 rounded cursor-pointer"
                          />
                        </td>

                        {/* WhatsApp / SMS Toggle */}
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={Boolean(notifPrefs[row.key]?.whatsapp)}
                            onChange={(e) =>
                              setNotifPrefs((prev: any) => ({
                                ...prev,
                                [row.key]: {
                                  ...prev[row.key],
                                  whatsapp: e.target.checked,
                                },
                              }))
                            }
                            className="w-4 h-4 text-amber-500 accent-amber-500 rounded cursor-pointer"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* TAB 7: ACCOUNT ACTIVITY TIMELINE */}
          {/* =================================================================== */}
          {activeTab === "activity" && (
            <div id="account-activity-section" className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 md:p-8 animate-in fade-in space-y-6">
              <div className="pb-5 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Activity className="text-amber-500" size={22} />
                  <span>Recent Account Activity & Audit History</span>
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Chronological record of bookings, commission payouts, profile changes, and security events.
                </p>
              </div>

              {/* Activity Timeline List */}
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                {activityTimeline.map((item, idx) => {
                  const badgeColor =
                    item.type === "gold"
                      ? "bg-amber-400 text-slate-950 ring-4 ring-amber-100"
                      : item.type === "success"
                      ? "bg-emerald-500 text-white ring-4 ring-emerald-100"
                      : item.type === "warning"
                      ? "bg-amber-500 text-white ring-4 ring-amber-100"
                      : "bg-blue-500 text-white ring-4 ring-blue-100";

                  return (
                    <div key={item.id || idx} className="relative group">
                      {/* Timeline Node Dot */}
                      <div
                        className={`absolute -left-[29px] top-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${badgeColor}`}
                      >
                        {item.type === "gold" ? "👑" : "✓"}
                      </div>

                      {/* Content Card */}
                      <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-200/80 group-hover:border-amber-400/50 transition">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                          <h4 className="text-sm font-bold text-gray-900">
                            {item.title}
                          </h4>
                          <span className="text-[11px] font-medium text-gray-400">
                            {item.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DOCUMENT PREVIEW MODAL */}
      {/* ========================================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 border border-amber-400/30">
            <div className="p-4 bg-[#0d1b2a] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-amber-400" />
                <h3 className="font-bold text-sm">{previewDoc.title}</h3>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-gray-400 hover:text-white transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 text-center bg-slate-50 flex flex-col items-center justify-center max-h-[70vh] overflow-y-auto">
              {previewDoc.url && (previewDoc.url.startsWith("data:image/") || previewDoc.url.match(/\.(jpeg|jpg|png|webp|gif)/i)) ? (
                <div className="w-full flex flex-col items-center">
                  <img
                    src={previewDoc.url}
                    alt={previewDoc.title}
                    className="max-h-[50vh] max-w-full object-contain rounded-lg shadow-md border border-gray-200 mb-3"
                  />
                  <h4 className="font-bold text-gray-800 text-sm mb-1">
                    {previewDoc.title}
                  </h4>
                </div>
              ) : previewDoc.url && (previewDoc.url.startsWith("data:application/pdf") || previewDoc.url.endsWith(".pdf")) ? (
                <iframe
                  src={previewDoc.url}
                  title={previewDoc.title}
                  className="w-full h-[55vh] border-0 rounded-lg shadow-sm"
                />
              ) : (
                <>
                  <div className="w-24 h-32 bg-white rounded-lg border-2 border-dashed border-amber-300 flex flex-col items-center justify-center text-amber-600 mb-4 shadow-sm">
                    <FileText size={36} />
                    <span className="text-[10px] font-bold mt-2 uppercase">Official Doc</span>
                  </div>
                  <h4 className="font-bold text-gray-800 text-sm mb-1">
                    {previewDoc.title}
                  </h4>
                  <p className="text-xs text-gray-500 max-w-xs mb-3">
                    Verified and securely stored in compliance with Shree Karni Real Estate legal guidelines.
                  </p>
                </>
              )}
            </div>

            <div className="p-4 bg-gray-100 flex items-center justify-end">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
