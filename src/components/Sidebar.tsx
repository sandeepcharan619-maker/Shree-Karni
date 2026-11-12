"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Home,
  Briefcase,
  CreditCard,
  Users,
  Trophy,
  BarChart3,
  Settings,
  Headphones,
  Gauge,
  UserPlus,
  Repeat,
  Banknote,
  LogOut,
  Compass,
  Trees,
  Building2,
  MapPin,
  CalendarCheck,
  Contact,
  Receipt,
  Award,
  TrendingUp,
  Bell,
  FileText,
  ShieldCheck,
  LayoutDashboard,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

interface SidebarProps {
  userRole?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ userRole, isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [customName, setCustomName] = useState<string | null>(null);
  const [customMemberId, setCustomMemberId] = useState<string | null>(null);

  useEffect(() => {
    const syncProfileFromDB = () => {
      fetch("/api/profile?minimal=true")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.user) {
            if (data.user.name) setCustomName(data.user.name);
            if (data.user.memberId) setCustomMemberId(data.user.memberId);
            if (data.user.avatarUrl) setCustomAvatar(data.user.avatarUrl);
          }
        })
        .catch(() => {});
    };

    syncProfileFromDB();
    window.addEventListener("focus", syncProfileFromDB);
    window.addEventListener("skr-profile-updated", syncProfileFromDB);
    return () => {
      window.removeEventListener("focus", syncProfileFromDB);
      window.removeEventListener("skr-profile-updated", syncProfileFromDB);
    };
  }, [session]);

  const isAdmin = userRole === "ADMIN" || session?.user?.role === "ADMIN";

  // Associate Menu Items exactly matching the screenshot
  const associateMenu = [
    { label: "Dashboard", icon: Home, href: "/dashboard" },
    { label: "Projects", icon: Building2, href: "/dashboard/projects" },
    { label: "Plot Inventory & Maps", icon: MapPin, href: "/dashboard/plots" },
    { label: "My Business", icon: Briefcase, href: "/dashboard/business" },
    { label: "Commission Rules", icon: Award, href: "/dashboard/commission-rules" },
    { label: "My Team", icon: Users, href: "/dashboard/team" },
    { label: "My Wallet", icon: CreditCard, href: "/dashboard/incentives/wallet" },
    { label: "Rank & Rewards", icon: Trophy, href: "/dashboard/rank-rewards" },
    { label: "Reports", icon: BarChart3, href: "/dashboard/reports" },
    { label: "Profile & Settings", icon: Settings, href: "/dashboard/profile" },
    { label: "Support", icon: Headphones, href: "tel:+918952821872" },
  ];

  // Admin Menu Items - Premium Real Estate Management Suite
  const adminMenu = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
    { label: "Projects", icon: Building2, href: "/admin/projects" },
    { label: "Plot Inventory & Map", icon: MapPin, href: "/admin/plots" },
    { label: "Bookings", icon: CalendarCheck, href: "/admin/bookings" },
    { label: "Customers", icon: Contact, href: "/admin/customers" },
    { label: "Payments & Receipts", icon: Receipt, href: "/admin/payments" },
    { label: "Associates", icon: Users, href: "/admin/associates" },
    { label: "Commissions", icon: Award, href: "/admin/incentives" },
    { label: "Reports & Analytics", icon: TrendingUp, href: "/admin/reports" },
    { label: "Notifications", icon: Bell, href: "/admin/notifications" },
    { label: "Settings & Logs", icon: Settings, href: "/admin/settings" },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30 top-[60px]"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-[60px] left-0 bottom-0 w-64 bg-[#0d1b2a] text-white z-30 transition-transform duration-200 ease-in-out flex flex-col justify-between overflow-y-auto select-none shadow-xl ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div>
          {/* Top Logo Section */}
          <div className="p-4 border-b border-white/10 text-center bg-black/25">
            <Link href={isAdmin ? "/admin" : "/dashboard"} className="inline-block group w-full">
              <div className="flex flex-col items-center">
                {/* Official Shree Karni Real Estate Logo */}
                <div className="w-full max-w-[210px] py-1 flex items-center justify-center">
                  <Image
                    src="/shree-karni-logo.png"
                    alt="Shree Karni Real Estate"
                    width={400}
                    height={266}
                    className="w-full h-auto max-h-24 object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-300"
                    priority
                  />
                </div>
                <p className="text-[10px] text-amber-300 font-bold uppercase tracking-widest mt-1">
                  Vatika, Jaipur • Rajasthan
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5">
            {(isAdmin ? adminMenu : associateMenu).map((item) => {
              const isTel = item.href.startsWith("tel:");
              if (isTel) {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => {
                      if (onClose) onClose();
                    }}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <item.icon
                      size={17}
                      strokeWidth={2}
                      className="text-slate-400 hover:text-white"
                    />
                    <span>{item.label}</span>
                  </a>
                );
              }

              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : item.href.startsWith("/dashboard/")
                  ? pathname.startsWith(item.href)
                  : pathname === item.href;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => {
                    if (onClose) onClose();
                  }}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-[#e9b04c] text-[#0d1b2a] shadow-sm font-bold"
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <item.icon
                    size={17}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={isActive ? "text-[#0d1b2a]" : "text-slate-400"}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Logout to Main Website Button */}
            <button
              onClick={async () => {
                if (onClose) onClose();
                try {
                  await signOut({ redirect: false });
                } catch (err) {
                  console.error("SignOut error:", err);
                }
                if (typeof window !== "undefined") {
                  window.location.href = "/";
                }
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-500/20 transition-all cursor-pointer mt-1"
            >
              <LogOut size={17} strokeWidth={2} className="text-rose-400" />
              <span>Logout</span>
            </button>
          </nav>
        </div>

        {/* Bottom Decorative Township Banner: "Together We Grow Bigger..." */}
        <div className="p-3 mt-auto">
          <div className="relative rounded-xl overflow-hidden border border-amber-500/30 shadow-lg group">
            <div className="h-28 w-full relative">
              <Image
                src="/website-bg.png"
                alt="Shree Karni Township"
                fill
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-[#0a1628]/70 to-transparent" />
              <div className="absolute inset-0 flex items-end justify-center p-3 text-center">
                <p className="font-serif italic text-amber-300 text-sm tracking-wide drop-shadow-md">
                  Together<br />
                  <span className="text-white text-xs font-sans not-italic font-semibold tracking-wider">
                    We Grow Bigger...
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
