"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowRight, LayoutDashboard, Users } from "lucide-react";

export default function HeroAuthButtons() {
  const { data: session } = useSession();

  if (session && session.user) {
    const isAdmin = session.user.role === "ADMIN";
    const dashboardHref = isAdmin ? "/admin" : "/dashboard";

    return (
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Link
          href={dashboardHref}
          className="px-6 py-3.5 rounded-lg bg-[#e9b04c] hover:bg-[#d89f3a] text-slate-900 font-bold text-base shadow-lg transition flex items-center gap-2"
        >
          <LayoutDashboard size={18} />
          <span>Go to {isAdmin ? "Admin Dashboard" : "My Dashboard"}</span>
          <ArrowRight size={18} />
        </Link>

        <Link
          href="#plots"
          className="px-6 py-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-base border border-slate-700 transition flex items-center gap-2"
        >
          <span>Browse Available Plots</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-wrap items-center gap-4">
      <Link
        href="#plots"
        className="px-6 py-3.5 rounded-lg bg-[#e9b04c] hover:bg-[#d89f3a] text-slate-900 font-bold text-base shadow-lg transition flex items-center gap-2"
      >
        <span>Browse Available Plots</span>
        <ArrowRight size={18} />
      </Link>

      <Link
        href="/register"
        className="px-6 py-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-base border border-slate-700 transition flex items-center gap-2"
      >
        <Users size={18} className="text-yellow-400" />
        <span>Join as Sales Associate</span>
      </Link>
    </div>
  );
}
