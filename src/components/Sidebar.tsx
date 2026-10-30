"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Gauge,
  UserPlus,
  User,
  Users,
  Repeat,
  Banknote,
  LogOut,
  ChevronRight,
  ChevronDown,
  Trees,
  Car,
  Compass,
} from "lucide-react";

interface SubMenuItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
}

interface MenuItem {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  href: string;
  submenu?: SubMenuItem[];
}

interface SidebarProps {
  userRole?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ userRole, isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
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

  const toggleMenu = (menu: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menu) ? prev.filter((m) => m !== menu) : [...prev, menu]
    );
  };

  const associateMenuItems: MenuItem[] = [
    { label: "DashBoard", icon: Gauge, href: "/dashboard" },
    { label: "Register New Associate", icon: UserPlus, href: "/dashboard/register" },
    { label: "Profile", icon: User, href: "/dashboard/profile" },
    {
      label: "My Team",
      icon: Users,
      href: "#",
      submenu: [
        { label: "Tree View", href: "/dashboard/team/tree", icon: Trees },
      ],
    },
    { label: "Plot Manager", icon: Repeat, href: "/dashboard/plots" },
    {
      label: "My Incentive",
      icon: Banknote,
      href: "#",
      submenu: [
        { label: "All Incentives", href: "/dashboard/incentives" },
        { label: "Wallet", href: "/dashboard/incentives/wallet" },
      ],
    },
    { label: "Visitor Management", icon: Repeat, href: "/dashboard/visitors" },
    { label: "Lead Manager", icon: Repeat, href: "/dashboard/leads" },
    { label: "Change Password", icon: Repeat, href: "/dashboard/change-password" },
  ];

  const adminMenuItems: MenuItem[] = [
    { label: "CRM DashBoard", icon: Gauge, href: "/admin" },
    { label: "Leads & Enquiries", icon: Users, href: "/admin?tab=leads" },
    { label: "Site Visits", icon: Car, href: "/admin?tab=visits" },
    { label: "Property Matcher", icon: Compass, href: "/admin?tab=matching" },
    { label: "All Associates", icon: Users, href: "/admin/associates" },
    { label: "Register New Associate", icon: UserPlus, href: "/admin/associates/create" },
    { label: "Plot Manager", icon: Repeat, href: "/admin/plots" },
    { label: "Sales Overview", icon: Banknote, href: "/admin/sales" },
    { label: "Incentive Management", icon: Banknote, href: "/admin/incentives" },
    { label: "Change Password", icon: Repeat, href: "/admin/change-password" },
  ];

  const menuItems: MenuItem[] = isAdmin ? adminMenuItems : associateMenuItems;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-30 top-[52px]"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-[52px] left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-30 transition-transform duration-200 ease-in-out overflow-y-auto select-none ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* User Card */}
        <div className="p-4 flex items-center gap-3 border-b border-gray-100">
          <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-200 border border-slate-300 flex items-center justify-center shrink-0">
            {customAvatar ? (
              <img src={customAvatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={28} className="text-slate-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-gray-800 leading-snug truncate">
              {customName || session?.user?.name || "Pushpendra singh charan"}
            </h4>
            <p className="text-xs text-gray-500 truncate">
              {customMemberId || session?.user?.memberId || "SKR00001"}
            </p>
          </div>
        </div>

        {/* Section Header */}
        <div className="px-4 py-2 bg-[#a4d0db]">
          <span className="text-[11px] font-bold text-slate-700 tracking-wider uppercase">
            MY ACCOUNT
          </span>
        </div>

        {/* Navigation list */}
        <nav className="py-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const hasSubmenu = Boolean(item.submenu && item.submenu.length > 0);
            const isExpanded = expandedMenus.includes(item.label);

            return (
              <div key={item.label} className="border-b border-gray-50 last:border-b-0">
                {hasSubmenu ? (
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors ${
                      isActive ? "bg-gray-100 text-blue-600 font-semibold" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={16} className="text-gray-600 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown size={14} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={14} className="text-gray-400" />
                    )}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-2.5 text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-gray-100 text-blue-600 font-semibold border-l-4 border-blue-600"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <item.icon size={16} className="text-gray-600 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                )}

                {/* Submenu */}
                {hasSubmenu && isExpanded && item.submenu && (
                  <div className="bg-slate-50 py-1 pl-10 pr-3 space-y-1">
                    {item.submenu.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={onClose}
                        className={`flex items-center gap-2 py-1.5 px-2 text-xs rounded transition-colors ${
                          pathname === sub.href
                            ? "text-blue-600 font-semibold bg-white shadow-xs"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        {sub.icon && <sub.icon size={13} className="text-gray-500 shrink-0" />}
                        <span>{sub.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Logout */}
          <button
            onClick={() => {
              const target =
                typeof window !== "undefined" && window.location.hostname === "localhost"
                  ? "/"
                  : "https://www.shreekarnirealestate.in";
              signOut({ callbackUrl: target });
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={16} className="text-gray-600 shrink-0" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>
    </>
  );
}
