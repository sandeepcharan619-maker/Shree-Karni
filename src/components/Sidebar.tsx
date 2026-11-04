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
      fetch("/api/profile")
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
    { label: "My Business", icon: Briefcase, href: "/dashboard/plots" },
    { label: "My Wallet", icon: CreditCard, href: "/dashboard/incentives/wallet" },
    { label: "My Team", icon: Users, href: "/dashboard/team/tree" },
    { label: "Rank & Rewards", icon: Trophy, href: "/dashboard#rank-rewards" },
    { label: "Reports", icon: BarChart3, href: "/dashboard#reports" },
    { label: "Profile & Settings", icon: Settings, href: "/dashboard/profile" },
    { label: "Support", icon: Headphones, href: "tel:+919829123456" },
  ];

  // Admin Menu Items
  const adminMenu = [
    { label: "CRM DashBoard", icon: Gauge, href: "/admin" },
    { label: "Leads & Enquiries", icon: Users, href: "/admin?tab=leads" },
    { label: "Property Matcher", icon: Compass, href: "/admin?tab=matching" },
    { label: "All Associates", icon: Users, href: "/admin/associates" },
    { label: "Register Associate", icon: UserPlus, href: "/admin/associates/create" },
    { label: "Plot Manager", icon: Repeat, href: "/admin/plots" },
    { label: "Sales Overview", icon: Banknote, href: "/admin/sales" },
    { label: "Incentives", icon: Banknote, href: "/admin/incentives" },
    { label: "Change Password", icon: Settings, href: "/admin/change-password" },
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
          <div className="p-5 border-b border-white/10 text-center">
            <Link href="/" className="inline-block group">
              <div className="flex flex-col items-center">
                {/* Gold architectural icon or logo */}
                <div className="w-12 h-12 mb-2 flex items-center justify-center">
                  <Image
                    src="/logo.png"
                    alt="Shree Karni Real Estate"
                    width={160}
                    height={40}
                    className="h-10 w-auto object-contain brightness-125"
                    priority
                  />
                </div>
                <h2 className="text-base font-bold text-[#e9b04c] tracking-tight font-serif leading-tight">
                  Shree Karni
                </h2>
                <p className="text-xs font-semibold text-white tracking-widest uppercase">
                  Real Estate
                </p>
                <p className="text-[10px] text-amber-200/80 tracking-wider mt-0.5 font-medium">
                  Dream • Invest • Grow
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5">
            {(isAdmin ? adminMenu : associateMenu).map((item) => {
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
