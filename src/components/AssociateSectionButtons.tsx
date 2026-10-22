"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { UserPlus, LogIn, LayoutDashboard, ArrowRight } from "lucide-react";

export default function AssociateSectionButtons() {
  const { data: session } = useSession();

  if (session && session.user) {
    const isAdmin = session.user.role === "ADMIN";
    const dashboardHref = isAdmin ? "/admin" : "/dashboard";

    return (
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Link
          href={dashboardHref}
          className="px-6 py-3 rounded-lg bg-[#e9b04c] hover:bg-[#d89f3a] text-slate-900 font-bold text-sm shadow-md transition flex items-center gap-2"
        >
          <LayoutDashboard size={16} />
          <span>Open {isAdmin ? "Admin Dashboard" : "My Dashboard"}</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-wrap items-center gap-4">
      <Link
        href="/register"
        className="px-6 py-3 rounded-lg bg-[#e9b04c] hover:bg-[#d89f3a] text-slate-900 font-bold text-sm shadow-md transition flex items-center gap-2"
      >
        <UserPlus size={16} />
        <span>Sign Up as Associate</span>
      </Link>

      <Link
        href="/login"
        className="px-6 py-3 rounded-lg border border-slate-600 hover:bg-slate-800 text-white font-semibold text-sm transition flex items-center gap-2"
      >
        <LogIn size={16} />
        <span>Associate Login</span>
      </Link>
    </div>
  );
}
