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
          className="px-6 py-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg transition flex items-center gap-2"
        >
          <LayoutDashboard size={18} />
          <span>Go to {isAdmin ? "Admin Dashboard" : "My Dashboard"}</span>
          <ArrowRight size={18} />
        </Link>

        <Link
          href="#calculator"
          className="px-6 py-3.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 font-semibold text-base border border-slate-300 shadow-2xs transition flex items-center gap-2"
        >
          <span>Calculate Plot Price & EMI</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-wrap items-center gap-4">
      <Link
        href="#calculator"
        className="px-6 py-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg transition flex items-center gap-2"
      >
        <span>Calculate Plot Price & EMI</span>
        <ArrowRight size={18} />
      </Link>

      <Link
        href="/register"
        className="px-6 py-3.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 font-semibold text-base border border-slate-300 shadow-2xs transition flex items-center gap-2"
      >
        <Users size={18} className="text-emerald-600" />
        <span>Join as Sales Associate</span>
      </Link>
    </div>
  );
}
