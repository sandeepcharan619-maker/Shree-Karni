"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { Menu, Bell, ArrowRight, User as UserIcon } from "lucide-react";
import { useState, useEffect } from "react";

interface HeaderProps {
  userRole?: string;
  onToggleSidebar?: () => void;
}

export default function Header({ userRole, onToggleSidebar }: HeaderProps) {
  const { data: session } = useSession();
  const [profileData, setProfileData] = useState<{
    name: string;
    memberId: string;
    avatarUrl?: string;
  }>({
    name: session?.user?.name || "Rakesh Sharma",
    memberId: (session?.user as any)?.memberId || "ASR-1024",
    avatarUrl: "",
  });

  useEffect(() => {
    if (session?.user) {
      setProfileData({
        name: session.user.name || "Rakesh Sharma",
        memberId: (session.user as any)?.memberId || "ASR-1024",
      });
    }

    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setProfileData({
            name: data.user.name || session?.user?.name || "Rakesh Sharma",
            memberId: data.user.memberId || (session?.user as any)?.memberId || "ASR-1024",
            avatarUrl: data.user.avatarUrl || "",
          });
        }
      })
      .catch(() => {});
  }, [session]);

  const isAdmin = userRole === "ADMIN" || session?.user?.role === "ADMIN";

  return (
    <header className="bg-white border-b border-gray-200 text-gray-800 h-[60px] flex items-center justify-between px-3 md:px-6 fixed top-0 left-0 right-0 z-30 shadow-sm select-none">
      {/* Left side: Hamburger + Dashboard title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation"
          className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-700 cursor-pointer"
        >
          <Menu size={22} strokeWidth={2.2} />
        </button>

        <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">
          {isAdmin ? "Admin Dashboard" : "Associate Portal"}
        </h1>
      </div>

      {/* Right side: Notifications + User pill + Logout */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notification Bell with red badge */}
        <Link
          href={isAdmin ? "/admin/notifications" : "#"}
          className="relative p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition cursor-pointer"
          title="Notifications"
        >
          <Bell size={20} strokeWidth={2} />
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
            4
          </span>
        </Link>

        {/* User Pill */}
        <Link
          href={isAdmin ? "/admin" : "/dashboard/profile"}
          className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-gray-50 transition"
        >
          <div className="w-9 h-9 rounded-full overflow-hidden bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
            {profileData.avatarUrl ? (
              <img
                src={profileData.avatarUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon size={20} className="text-amber-700" />
            )}
          </div>
          <div className="hidden sm:block text-left text-xs leading-tight">
            <p className="font-bold text-gray-900 truncate max-w-[140px]">
              {profileData.name}
            </p>
            <p className="text-[11px] text-gray-500 font-mono">
              {profileData.memberId}
            </p>
          </div>
        </Link>

        {/* Logout Button */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="bg-[#0d1b2a] hover:bg-[#1a2d42] text-white text-xs font-semibold px-3 sm:px-4 py-2 rounded-lg flex items-center gap-1.5 transition shadow-sm cursor-pointer"
        >
          <span className="hidden xs:inline">Logout</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </header>
  );
}
