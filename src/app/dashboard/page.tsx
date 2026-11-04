import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardCard from "@/components/DashboardCard";
import CopyLinkButton from "./CopyLinkButton";
import {
  Gauge,
  Award,
  Building2,
  TrendingUp,
  Gift,
  Wallet,
  Target,
  Users,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AssociateDashboard() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const username = session?.user?.username;
  const memberId = (session?.user as any)?.memberId;

  // Fetch associate data with fallbacks to ensure live DB lookup
  let user = null;
  if (userId) {
    user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            referrals: true,
            sales: true,
          },
        },
      },
    });
  }

  if (!user && (username || memberId)) {
    user = await prisma.user.findFirst({
      where: {
        OR: [
          username ? { username } : {},
          memberId ? { memberId } : {},
        ],
      },
      include: {
        _count: {
          select: {
            referrals: true,
            sales: true,
          },
        },
      },
    });
  }

  const effectiveUserId = user?.id || userId;

  // 1. Total direct downline
  const totalDownline = effectiveUserId
    ? await prisma.user.count({
        where: { referredById: effectiveUserId },
      })
    : 0;

  // 2. Fetch all sales by this associate (direct sales)
  const selfSalesDetails = effectiveUserId
    ? await prisma.sale.findMany({
        where: { soldById: effectiveUserId },
        include: { plot: true },
        orderBy: { saleDate: "desc" },
      })
    : [];

  const selfBusinessGaj = selfSalesDetails.reduce(
    (total, sale) => total + (sale.plot?.sizeGaj || 0),
    0
  );

  // 3. Team members & sales (downline network)
  const teamMembers = effectiveUserId
    ? await prisma.user.findMany({
        where: { referredById: effectiveUserId },
        select: { id: true },
      })
    : [];
  const teamIds = effectiveUserId ? [effectiveUserId, ...teamMembers.map((m) => m.id)] : [];

  const totalSalesDetails = teamIds.length > 0
    ? await prisma.sale.findMany({
        where: { soldById: { in: teamIds } },
        include: { plot: true },
      })
    : [];
  const totalBusinessGaj = totalSalesDetails.reduce(
    (total, sale) => total + (sale.plot?.sizeGaj || 0),
    0
  );

  // 4. Fetch incentives for commission calculations
  const incentives = effectiveUserId
    ? await prisma.incentive.findMany({
        where: { associateId: effectiveUserId },
      })
    : [];

  const totalCommissionEarned = incentives.reduce(
    (sum, inc) => sum + (inc.amount || 0),
    0
  );
  const totalCommissionPaid = incentives
    .filter((i) => i.status === "PAID")
    .reduce((sum, inc) => sum + (inc.amount || 0), 0);
  const totalCommissionPending = incentives
    .filter((i) => i.status === "PENDING" || i.status === "APPROVED")
    .reduce((sum, inc) => sum + (inc.amount || 0), 0);

  // 5. Apply admin custom overrides if set
  const displayDownline =
    user?.customDownline !== null && user?.customDownline !== undefined
      ? user.customDownline
      : totalDownline;

  const displaySelfBusiness =
    user?.customSalesGaj !== null && user?.customSalesGaj !== undefined
      ? user.customSalesGaj
      : selfBusinessGaj;

  const teamBusiness = Math.max(0, totalBusinessGaj - selfBusinessGaj);
  const displayTotalBusiness =
    user?.customSalesGaj !== null && user?.customSalesGaj !== undefined
      ? user.customSalesGaj + teamBusiness
      : totalBusinessGaj;

  // 6. Compute Total Plots Sold and Total Business Generated (₹)
  const totalPlotsSold = selfSalesDetails.length;
  const actualSalesAmount = selfSalesDetails.reduce(
    (sum, sale) => sum + (sale.saleAmount || 0),
    0
  );
  // If customSalesGaj is manually set by admin but no sale row exists, estimate ₹5,000/Gaj fallback
  const totalBusinessRupees =
    actualSalesAmount > 0
      ? actualSalesAmount
      : displaySelfBusiness > 0
      ? displaySelfBusiness * 5000
      : 0;

  const currentRank = user?.rank || "Client Adviser";
  const availableWalletBalance = user?.walletBalance || 0;

  // 7. Monthly Target Achievement calculation
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const currentMonthName = now.toLocaleString("en-US", { month: "short" });
  const currentYear = now.getFullYear();

  const currentMonthSales = selfSalesDetails.filter((sale) => {
    const saleDate = new Date(sale.saleDate || sale.createdAt);
    return saleDate >= startOfMonth && saleDate <= endOfMonth;
  });

  const currentMonthSalesAmount = currentMonthSales.reduce(
    (sum, sale) => sum + (sale.saleAmount || 0),
    0
  );
  const currentMonthPlots = currentMonthSales.length;

  const rankTargets: Record<string, { amount: number; plots: number }> = {
    "Client Adviser": { amount: 500000, plots: 1 },
    "Senior Adviser": { amount: 1000000, plots: 2 },
    "Team Leader": { amount: 2000000, plots: 3 },
    "Branch Manager": { amount: 3500000, plots: 5 },
    "Director": { amount: 5000000, plots: 8 },
  };

  const targetConfig = rankTargets[currentRank] || { amount: 500000, plots: 1 };
  const monthlyTargetAmount = targetConfig.amount;
  const monthlyTargetPlots = targetConfig.plots;

  // Monthly Achievement Percentage
  const achievementPercent = Math.min(
    100,
    monthlyTargetAmount > 0
      ? Math.round((currentMonthSalesAmount / monthlyTargetAmount) * 100)
      : 0
  );

  const referralLink = `${
    process.env.NEXTAUTH_URL || "https://shreekarnirealestate.vercel.app"
  }/register?ref=${user?.memberId || "SKR00001"}`;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Title & Breadcrumbs header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-200 pb-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Welcome back, <span className="font-semibold text-gray-700">{user?.name || "Associate"}</span> (
            <span className="font-mono text-blue-600 font-bold">{user?.memberId || "SKR00001"}</span>)
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Gauge size={13} className="text-gray-600" />
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-800 font-medium">
            Home
          </Link>
          <span>&gt;</span>
          <span className="text-gray-400">Dashboard</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TOP SECTION: IMPORTANT INFORMATION OVERVIEW CARDS (6 METRICS) */}
      {/* ============================================================== */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">
              Key Performance & Overview
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-200">
            Live Statistics
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. CURRENT RANK */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 text-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[140px]">
            <div className="absolute right-3 top-3 opacity-15 pointer-events-none">
              <Award size={80} strokeWidth={1.8} />
            </div>
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-indigo-200">
                Current Rank
              </span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium">
                Rank Status
              </span>
            </div>
            <div className="relative z-10 my-2">
              <h3 className="text-2xl font-black tracking-tight text-white drop-shadow-sm">
                {currentRank}
              </h3>
            </div>
            <div className="relative z-10 flex items-center justify-between text-xs text-indigo-100/90 pt-1 border-t border-white/10">
              <span className="truncate">Member ID: {user?.memberId || "SKR00001"}</span>
              <Link
                href="/dashboard/profile"
                className="hover:underline flex items-center gap-0.5 font-medium shrink-0 ml-1"
              >
                Profile <ChevronRight size={12} />
              </Link>
            </div>
          </div>

          {/* 2. TOTAL PLOTS SOLD */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[140px]">
            <div className="absolute right-3 top-3 opacity-15 pointer-events-none">
              <Building2 size={80} strokeWidth={1.8} />
            </div>
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-emerald-200">
                Total Plots Sold
              </span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium">
                Direct Sales
              </span>
            </div>
            <div className="relative z-10 my-2">
              <h3 className="text-3xl font-black tracking-tight text-white drop-shadow-sm">
                {totalPlotsSold} <span className="text-base font-normal opacity-90">{totalPlotsSold === 1 ? "Plot" : "Plots"}</span>
              </h3>
            </div>
            <div className="relative z-10 flex items-center justify-between text-xs text-emerald-100/90 pt-1 border-t border-white/10">
              <span>{displaySelfBusiness.toLocaleString("en-IN")} GAJ booked</span>
              <Link
                href="/dashboard/plots"
                className="hover:underline flex items-center gap-0.5 font-medium shrink-0 ml-1"
              >
                View Plots <ChevronRight size={12} />
              </Link>
            </div>
          </div>

          {/* 3. TOTAL BUSINESS GENERATED (₹) */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-700 via-purple-800 to-indigo-900 text-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[140px]">
            <div className="absolute right-3 top-3 opacity-15 pointer-events-none">
              <TrendingUp size={80} strokeWidth={1.8} />
            </div>
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-purple-200">
                Total Business Generated
              </span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium">
                In Rupees (₹)
              </span>
            </div>
            <div className="relative z-10 my-2">
              <h3 className="text-2xl font-black tracking-tight text-white drop-shadow-sm">
                ₹{totalBusinessRupees.toLocaleString("en-IN")}
              </h3>
            </div>
            <div className="relative z-10 flex items-center justify-between text-xs text-purple-100/90 pt-1 border-t border-white/10">
              <span>From {totalPlotsSold} direct sale{totalPlotsSold === 1 ? "" : "s"}</span>
              <Link
                href="/dashboard/plots"
                className="hover:underline flex items-center gap-0.5 font-medium shrink-0 ml-1"
              >
                Plots <ChevronRight size={12} />
              </Link>
            </div>
          </div>

          {/* 4. TOTAL COMMISSION EARNED (₹) */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-700 text-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[140px]">
            <div className="absolute right-3 top-3 opacity-15 pointer-events-none">
              <Gift size={80} strokeWidth={1.8} />
            </div>
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-amber-100">
                Total Commission Earned
              </span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium">
                Incentives (₹)
              </span>
            </div>
            <div className="relative z-10 my-2">
              <h3 className="text-2xl font-black tracking-tight text-white drop-shadow-sm">
                ₹{totalCommissionEarned.toLocaleString("en-IN")}
              </h3>
            </div>
            <div className="relative z-10 flex items-center justify-between text-xs text-amber-100/90 pt-1 border-t border-white/10">
              <span className="truncate">
                ₹{totalCommissionPaid.toLocaleString("en-IN")} Paid • ₹{totalCommissionPending.toLocaleString("en-IN")} Pending
              </span>
              <Link
                href="/dashboard/incentives"
                className="hover:underline flex items-center gap-0.5 font-medium shrink-0 ml-1"
              >
                Details <ChevronRight size={12} />
              </Link>
            </div>
          </div>

          {/* 5. AVAILABLE WALLET BALANCE (₹) */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-600 via-sky-600 to-blue-700 text-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[140px]">
            <div className="absolute right-3 top-3 opacity-15 pointer-events-none">
              <Wallet size={80} strokeWidth={1.8} />
            </div>
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-cyan-100">
                Available Wallet Balance
              </span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium">
                In Rupees (₹)
              </span>
            </div>
            <div className="relative z-10 my-2">
              <h3 className="text-2xl font-black tracking-tight text-white drop-shadow-sm">
                ₹{availableWalletBalance.toLocaleString("en-IN")}
              </h3>
            </div>
            <div className="relative z-10 flex items-center justify-between text-xs text-cyan-100/90 pt-1 border-t border-white/10">
              <span>Ready for payout</span>
              <Link
                href="/dashboard/incentives/wallet"
                className="hover:underline flex items-center gap-0.5 font-medium shrink-0 ml-1"
              >
                Wallet <ChevronRight size={12} />
              </Link>
            </div>
          </div>

          {/* 6. MONTHLY TARGET ACHIEVEMENT */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-600 via-rose-700 to-pink-800 text-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[140px]">
            <div className="absolute right-3 top-3 opacity-15 pointer-events-none">
              <Target size={80} strokeWidth={1.8} />
            </div>
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-rose-200">
                Monthly Target Achievement
              </span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium">
                {currentMonthName} {currentYear}
              </span>
            </div>
            <div className="relative z-10 my-1">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-2xl font-black text-white">{achievementPercent}%</span>
                <span className="text-xs text-rose-100/90 font-medium">
                  ₹{currentMonthSalesAmount.toLocaleString("en-IN")} / ₹{monthlyTargetAmount.toLocaleString("en-IN")}
                </span>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-black/25 rounded-full h-2.5 overflow-hidden p-0.5">
                <div
                  className="bg-white h-full rounded-full transition-all duration-700 shadow-sm"
                  style={{ width: `${Math.max(achievementPercent, achievementPercent > 0 ? 5 : 2)}%` }}
                />
              </div>
            </div>
            <div className="relative z-10 flex items-center justify-between text-xs text-rose-100/90 pt-1 border-t border-white/10">
              <span>Target: {monthlyTargetPlots} Plot{monthlyTargetPlots > 1 ? "s" : ""}</span>
              <span className="font-semibold text-white">
                {currentMonthPlots >= monthlyTargetPlots ? "Achieved 🎉" : `${currentMonthPlots}/${monthlyTargetPlots} Sold`}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Referral Link Bar */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={14} className="text-yellow-500" />
            Your Associate Referral Link
          </label>
          <span className="text-xs text-gray-500">
            Share to register new associates under your direct downline
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 bg-gray-50 text-gray-700 px-3.5 py-2.5 rounded-lg text-sm border border-gray-300 focus:outline-none focus:border-blue-500 font-mono"
          />
          <CopyLinkButton link={referralLink} />
        </div>
      </div>

      {/* Network & Downline Summary Cards */}
      <section className="space-y-3 pt-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">
          Downline & Network Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Magenta: Member ID */}
          <DashboardCard
            cardType="member"
            topText={`ID: ${user?.memberId || "SKR00001"}`}
            mainLabel="Member ID"
          />

          {/* Purple: Total Downline */}
          <DashboardCard
            cardType="downline"
            topText={displayDownline}
            mainLabel="Total Downline"
          />

          {/* Red: Self Business(GAJ) */}
          <DashboardCard
            cardType="selfBusiness"
            topText={displaySelfBusiness}
            mainLabel="Self Business(GAJ)"
          />

          {/* Orange: Total Business(GAJ) */}
          <DashboardCard
            cardType="totalBusiness"
            topText={displayTotalBusiness}
            mainLabel="Total Business(GAJ)"
          />
        </div>
      </section>
    </div>
  );
}
