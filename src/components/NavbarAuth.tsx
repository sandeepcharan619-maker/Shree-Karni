"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { LogIn, UserPlus, LayoutDashboard, LogOut } from "lucide-react";

export default function NavbarAuth() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="w-28 h-9 bg-gray-100 rounded-lg animate-pulse" />;
  }

  if (session && session.user) {
    const isAdmin = session.user.role === "ADMIN";
    const dashboardHref = isAdmin ? "/admin" : "/dashboard";

    return (
      <div className="flex items-center gap-2">
        <Link
          href={dashboardHref}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#0a1628] hover:bg-[#11243f] text-white text-xs font-bold transition shadow-xs"
        >
          <LayoutDashboard size={15} className="text-[#e9b04c]" />
          <span className="max-w-[140px] truncate">{session.user.name || "Dashboard"}</span>
        </Link>

        <button
          onClick={() => {
            const target =
              typeof window !== "undefined" && window.location.hostname === "localhost"
                ? "/"
                : "https://www.shreekarnirealestate.in";
            signOut({ callbackUrl: target });
          }}
          title="Sign Out"
          className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:text-red-600 hover:bg-red-50 transition"
        >
          <LogOut size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <Link
        href="/login"
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm font-semibold hover:bg-slate-50 transition"
      >
        <LogIn size={16} className="text-slate-600" />
        <span>Login</span>
      </Link>

      <Link
        href="/register"
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#e9b04c] hover:bg-[#d89f3a] text-slate-900 text-sm font-bold shadow-xs hover:shadow transition"
      >
        <UserPlus size={16} />
        <span>Sign Up</span>
      </Link>
    </div>
  );
}
