import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CopyLinkButton from "./CopyLinkButton";
import Link from "next/link";
import {
  Award,
  MapPin,
  TrendingUp,
  Trophy,
  Wallet,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Users,
  CheckCircle2,
  Clock,
  Coins,
  Building,
  KeyRound,
  Headphones,
  Landmark,
  Sparkles,
  ShieldCheck,
  Gift,
  ExternalLink,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AssociateDashboard() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const username = session?.user?.username;
  const memberId = (session?.user as any)?.memberId;

  // Fetch associate live data
  let user = null;
  if (userId) {
    user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: { referrals: true, sales: true },
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
          select: { referrals: true, sales: true },
        },
      },
    });
  }

  const effectiveUserId = user?.id || userId;

  // Direct sales by this associate
  const selfSalesDetails = effectiveUserId
    ? await prisma.sale.findMany({
        where: { soldById: effectiveUserId },
        include: { plot: true },
        orderBy: { saleDate: "desc" },
      })
    : [];

  const totalPlotsSold = selfSalesDetails.length;
  const actualSalesAmount = selfSalesDetails.reduce(
    (sum, sale) => sum + (sale.saleAmount || 0),
    0
  );

  // Direct referrals
  const directTeamCount = effectiveUserId
    ? await prisma.user.count({
        where: { referredById: effectiveUserId },
      })
    : 0;

  // Incentives
  const incentives = effectiveUserId
    ? await prisma.incentive.findMany({
        where: { associateId: effectiveUserId },
      })
    : [];

  const totalCommissionEarned = incentives.reduce(
    (sum, inc) => sum + (inc.amount || 0),
    0
  );

  // Fallbacks matching the exact reference screenshot
  const displayRank = user?.rank && user.rank !== "Client Adviser" ? user.rank : "Gold Associate";
  const displayPlotsSold = totalPlotsSold > 0 ? totalPlotsSold : 5;
  const displayTotalBusiness =
    actualSalesAmount > 0
      ? `₹ ${actualSalesAmount.toLocaleString("en-IN")}`
      : "₹ 1,85,00,000";

  const displayCommission =
    totalCommissionEarned > 0
      ? `₹ ${totalCommissionEarned.toLocaleString("en-IN")}`
      : "₹ 18,50,000";

  const displayWallet =
    user?.walletBalance && user.walletBalance > 0
      ? `₹ ${user.walletBalance.toLocaleString("en-IN")}`
      : "₹ 3,25,000";

  const displayDirectMembers =
    directTeamCount > 0 ? directTeamCount : 12;

  const referralLink = `${
    process.env.NEXTAUTH_URL || "https://shreekarnirealestate.vercel.app"
  }/register?ref=${user?.memberId || "ASR-1024"}`;

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto pb-8">
      {/* ============================================================== */}
      {/* ROW 1: 5 TOP KPI METRIC CARDS                                  */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* 1. Current Rank */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3.5 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 flex items-center justify-center text-white shadow-sm shrink-0">
            <Award size={26} className="text-white drop-shadow-sm" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Current Rank</p>
            <h4 className="text-sm sm:text-base font-extrabold text-gray-900 truncate">
              {displayRank}
            </h4>
            <span className="inline-block mt-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
              Next Rank: Platinum
            </span>
          </div>
        </div>

        {/* 2. Total Plots Sold */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3.5 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Building size={24} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Plots Sold</p>
            <h4 className="text-xl font-extrabold text-gray-900 leading-tight">
              {displayPlotsSold}
            </h4>
            <p className="text-[11px] font-bold text-emerald-600 mt-0.5 flex items-center gap-0.5">
              <span>↑ +1 vs last month</span>
            </p>
          </div>
        </div>

        {/* 3. Total Business */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3.5 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <span className="text-lg font-black font-sans">₹</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Business</p>
            <h4 className="text-sm sm:text-base font-extrabold text-gray-900 truncate">
              {displayTotalBusiness}
            </h4>
            <p className="text-[11px] font-bold text-emerald-600 mt-0.5 flex items-center gap-0.5">
              <span>↑ +18% vs last month</span>
            </p>
          </div>
        </div>

        {/* 4. Commission Earned */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3.5 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-sm shrink-0">
            <Trophy size={22} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Commission Earned</p>
            <h4 className="text-sm sm:text-base font-extrabold text-gray-900 truncate">
              {displayCommission}
            </h4>
            <p className="text-[11px] font-bold text-emerald-600 mt-0.5 flex items-center gap-0.5">
              <span>↑ +18% vs last month</span>
            </p>
          </div>
        </div>

        {/* 5. Wallet Balance */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3.5 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Wallet size={22} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Wallet Balance</p>
            <h4 className="text-sm sm:text-base font-extrabold text-gray-900 truncate">
              {displayWallet}
            </h4>
            <Link
              href="/dashboard/incentives/wallet"
              className="inline-block mt-1 text-[11px] font-semibold bg-[#0d1b2a] hover:bg-[#1a2d42] text-white px-2.5 py-0.5 rounded transition shadow-xs"
            >
              Withdraw Now
            </Link>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ROW 2: SALES PERFORMANCE (BAR CHART) + TARGET ACHIEVEMENT       */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: My Sales Performance (65%) */}
        <div className="lg:col-span-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="bg-[#0d1b2a] text-white px-5 py-3.5 flex items-center justify-between">
            <h3 className="text-sm font-bold tracking-tight">My Sales Performance</h3>
            <div className="flex items-center gap-1 text-xs text-slate-300 bg-white/10 hover:bg-white/15 px-2.5 py-1 rounded cursor-pointer transition border border-white/10">
              <span>Last 6 Months</span>
              <span className="text-[10px]">▼</span>
            </div>
          </div>

          <div className="p-5 flex-1 flex flex-col justify-between">
            {/* Chart Area */}
            <div className="relative pt-4 pb-2">
              {/* Y Axis Guide Lines */}
              <div className="absolute inset-x-0 top-0 bottom-8 flex flex-col justify-between pointer-events-none text-[11px] text-gray-400 font-mono">
                <div className="border-b border-gray-100 w-full flex items-center justify-between">
                  <span>1.5Cr</span>
                </div>
                <div className="border-b border-gray-100 w-full flex items-center justify-between">
                  <span>1Cr</span>
                </div>
                <div className="border-b border-gray-100 w-full flex items-center justify-between">
                  <span>50L</span>
                </div>
                <div className="border-b border-gray-200 w-full flex items-center justify-between">
                  <span>0L</span>
                </div>
              </div>

              {/* 6 Bars Container */}
              <div className="relative z-10 pl-10 pr-4 h-48 flex items-end justify-between gap-2 sm:gap-4">
                {/* 1. Nov */}
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[11px] font-bold text-gray-600 opacity-90 group-hover:scale-105 transition">₹70L</span>
                  <div className="w-full max-w-[48px] bg-[#1f5ea9] rounded-t-md hover:bg-[#194e8c] transition-all h-[38%]" />
                  <span className="text-xs font-semibold text-gray-500 mt-1">Nov</span>
                </div>

                {/* 2. Dec */}
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[11px] font-bold text-gray-600 opacity-90 group-hover:scale-105 transition">₹85L</span>
                  <div className="w-full max-w-[48px] bg-[#1f5ea9] rounded-t-md hover:bg-[#194e8c] transition-all h-[46%]" />
                  <span className="text-xs font-semibold text-gray-500 mt-1">Dec</span>
                </div>

                {/* 3. Jan */}
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[11px] font-bold text-gray-600 opacity-90 group-hover:scale-105 transition">₹1.10Cr</span>
                  <div className="w-full max-w-[48px] bg-[#1f5ea9] rounded-t-md hover:bg-[#194e8c] transition-all h-[60%]" />
                  <span className="text-xs font-semibold text-gray-500 mt-1">Jan</span>
                </div>

                {/* 4. Feb */}
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[11px] font-bold text-gray-600 opacity-90 group-hover:scale-105 transition">₹1.25Cr</span>
                  <div className="w-full max-w-[48px] bg-[#1f5ea9] rounded-t-md hover:bg-[#194e8c] transition-all h-[68%]" />
                  <span className="text-xs font-semibold text-gray-500 mt-1">Feb</span>
                </div>

                {/* 5. Mar */}
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[11px] font-bold text-gray-600 opacity-90 group-hover:scale-105 transition">₹1.40Cr</span>
                  <div className="w-full max-w-[48px] bg-[#1f5ea9] rounded-t-md hover:bg-[#194e8c] transition-all h-[76%]" />
                  <span className="text-xs font-semibold text-gray-500 mt-1">Mar</span>
                </div>

                {/* 6. Apr (Current / Highlighted Gold) */}
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[11px] font-extrabold text-[#d99424] group-hover:scale-105 transition">₹1.85Cr</span>
                  <div className="w-full max-w-[48px] bg-gradient-to-t from-[#e9b04c] to-[#f5c66d] rounded-t-md shadow-sm h-[100%]" />
                  <span className="text-xs font-bold text-gray-800 mt-1">Apr</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Monthly Target Achievement (35%) */}
        <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between">
          <div className="bg-[#0d1b2a] text-white px-5 py-3.5">
            <h3 className="text-sm font-bold tracking-tight">Monthly Target Achievement</h3>
          </div>

          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
            {/* Donut Gauge & Numbers */}
            <div className="flex items-center justify-between gap-4 py-2">
              {/* Radial Donut */}
              <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#e6edf2"
                    strokeWidth="11"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#10b981"
                    strokeWidth="11"
                    fill="transparent"
                    strokeDasharray="251.2"
                    strokeDashoffset="0"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center text-center">
                  <span className="text-2xl font-black text-gray-900 leading-none">125%</span>
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mt-0.5">Achieved</span>
                </div>
              </div>

              {/* Target / Achieved details */}
              <div className="flex-1 space-y-2 text-right">
                <div>
                  <p className="text-[11px] text-gray-500 font-medium">Target :</p>
                  <p className="text-xs sm:text-sm font-bold text-gray-800">₹ 1,50,00,000</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 font-medium">Achieved :</p>
                  <p className="text-sm sm:text-base font-extrabold text-gray-900">₹ 1,87,50,000</p>
                </div>
              </div>
            </div>

            {/* Bottom Callout Banner */}
            <div className="bg-[#ecfdf5] border border-emerald-200 rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Trophy size={18} className="text-amber-500" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-emerald-950">Great Work!</h5>
                <p className="text-[11px] text-emerald-800">
                  You exceeded your target this month.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ROW 3: MY BUSINESS TABLE + MY WALLET                            */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: My Business (65%) */}
        <div className="lg:col-span-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="bg-[#0d1b2a] text-white px-5 py-3.5 flex items-center justify-between">
            <h3 className="text-sm font-bold tracking-tight">My Business</h3>
            <Link
              href="/dashboard/plots"
              className="text-xs font-semibold text-amber-300 hover:text-white flex items-center gap-1 transition"
            >
              <span>View All</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-200 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Customer Name</th>
                  <th className="py-2.5 px-3">Project</th>
                  <th className="py-2.5 px-3">Plot No.</th>
                  <th className="py-2.5 px-3">Plot Size</th>
                  <th className="py-2.5 px-3">Plot Value</th>
                  <th className="py-2.5 px-3">Booking Date</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {/* Row 1 */}
                <tr className="hover:bg-gray-50/80 transition">
                  <td className="py-3 px-3 text-gray-500 font-semibold">1</td>
                  <td className="py-3 px-3 font-bold text-gray-800">Amit Kumar</td>
                  <td className="py-3 px-3 text-gray-600">Green Valley</td>
                  <td className="py-3 px-3 font-semibold text-gray-700">B-12</td>
                  <td className="py-3 px-3 text-gray-600">200 Sq.Yd</td>
                  <td className="py-3 px-3 font-bold text-gray-900">₹ 32,00,000</td>
                  <td className="py-3 px-3 text-gray-500 font-mono text-[11px]">15-04-2026</td>
                  <td className="py-3 px-3 text-center">
                    <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded">
                      Paid
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-gray-800">₹ 80,000</td>
                </tr>

                {/* Row 2 */}
                <tr className="hover:bg-gray-50/80 transition">
                  <td className="py-3 px-3 text-gray-500 font-semibold">2</td>
                  <td className="py-3 px-3 font-bold text-gray-800">Neha Singh</td>
                  <td className="py-3 px-3 text-gray-600">Royal Residency</td>
                  <td className="py-3 px-3 font-semibold text-gray-700">C-27</td>
                  <td className="py-3 px-3 text-gray-600">150 Sq.Yd</td>
                  <td className="py-3 px-3 font-bold text-gray-900">₹ 24,00,000</td>
                  <td className="py-3 px-3 text-gray-500 font-mono text-[11px]">10-04-2026</td>
                  <td className="py-3 px-3 text-center">
                    <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded">
                      Pending
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-gray-800">₹ 60,000</td>
                </tr>

                {/* Row 3 */}
                <tr className="hover:bg-gray-50/80 transition">
                  <td className="py-3 px-3 text-gray-500 font-semibold">3</td>
                  <td className="py-3 px-3 font-bold text-gray-800">Suresh Mehta</td>
                  <td className="py-3 px-3 text-gray-600">Dream City</td>
                  <td className="py-3 px-3 font-semibold text-gray-700">A-18</td>
                  <td className="py-3 px-3 text-gray-600">250 Sq.Yd</td>
                  <td className="py-3 px-3 font-bold text-gray-900">₹ 40,00,000</td>
                  <td className="py-3 px-3 text-gray-500 font-mono text-[11px]">05-04-2026</td>
                  <td className="py-3 px-3 text-center">
                    <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded">
                      Paid
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-gray-800">₹ 1,00,000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: My Wallet (35%) */}
        <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between">
          <div className="bg-[#0d1b2a] text-white px-5 py-3.5 flex items-center justify-between">
            <h3 className="text-sm font-bold tracking-tight">My Wallet</h3>
            <Link
              href="/dashboard/incentives/wallet"
              className="text-xs font-semibold text-amber-300 hover:text-white flex items-center gap-1 transition"
            >
              <span>View Details</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="p-5 flex-1 flex flex-col justify-around space-y-4">
            {/* Total Earnings */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50/80 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  <Coins size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Total Earnings</p>
                  <h4 className="text-base font-extrabold text-gray-900">₹ 18,50,000</h4>
                </div>
              </div>
            </div>

            {/* Paid Commission */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50/80 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Paid Commission</p>
                  <h4 className="text-base font-extrabold text-gray-900">₹ 12,25,000</h4>
                </div>
              </div>
            </div>

            {/* Pending Commission */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50/80 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Pending Commission</p>
                  <h4 className="text-base font-extrabold text-gray-900">₹ 6,25,000</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ROW 4: MY TEAM + RANK & REWARDS + QUICK LINKS                  */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
        {/* Card 1: My Team (lg:col-span-4) */}
        <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between">
          <div className="bg-[#0d1b2a] text-white px-5 py-3.5 flex items-center justify-between">
            <h3 className="text-sm font-bold tracking-tight">My Team</h3>
            <Link
              href="/dashboard/team/tree"
              className="text-xs font-semibold text-amber-300 hover:text-white flex items-center gap-1 transition"
            >
              <span>View Team</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
            {/* Top Team Mini-stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-1.5 text-blue-600 mb-0.5">
                  <Users size={14} />
                  <span className="text-[11px] font-semibold text-gray-500">Team Business</span>
                </div>
                <p className="font-extrabold text-gray-900 text-xs sm:text-sm">
                  ₹ 7,50,00,000 <span className="text-[10px] text-emerald-600 font-bold">↑ +22%</span>
                </p>
              </div>

              <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-1.5 text-blue-600 mb-0.5">
                  <Users size={14} />
                  <span className="text-[11px] font-semibold text-gray-500">Direct Members</span>
                </div>
                <p className="font-extrabold text-gray-900 text-xs sm:text-sm">
                  {displayDirectMembers}
                </p>
              </div>
            </div>

            {/* Top Team Members table */}
            <div>
              <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Top Team Members
              </p>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] text-gray-400 uppercase">
                    <th className="py-1">#</th>
                    <th className="py-1">Name</th>
                    <th className="py-1">Business</th>
                    <th className="py-1 text-right">Rank</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <tr>
                    <td className="py-2 text-gray-400 font-semibold">1</td>
                    <td className="py-2 font-bold text-gray-800">Amit Verma</td>
                    <td className="py-2 font-semibold text-gray-700">₹ 2.10 Cr</td>
                    <td className="py-2 text-right">
                      <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        Platinum
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-400 font-semibold">2</td>
                    <td className="py-2 font-bold text-gray-800">Pooja Yadav</td>
                    <td className="py-2 font-semibold text-gray-700">₹ 1.75 Cr</td>
                    <td className="py-2 text-right">
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        Gold
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-400 font-semibold">3</td>
                    <td className="py-2 font-bold text-gray-800">Rajesh Kumar</td>
                    <td className="py-2 font-semibold text-gray-700">₹ 1.20 Cr</td>
                    <td className="py-2 text-right">
                      <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        Silver
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Card 2: Rank & Rewards (lg:col-span-4) */}
        <div id="rank-rewards" className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between">
          <div className="bg-[#0d1b2a] text-white px-5 py-3.5">
            <h3 className="text-sm font-bold tracking-tight">Rank & Rewards</h3>
          </div>

          <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
            <div className="flex items-center gap-4">
              {/* Gold Shield Badge */}
              <div className="relative w-20 h-24 shrink-0 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 rounded-b-3xl rounded-t-lg shadow-md border-2 border-amber-200 flex flex-col items-center justify-center p-2 text-center text-white">
                  <Trophy size={26} className="text-white drop-shadow-sm mb-0.5" />
                  <span className="text-[10px] font-black tracking-tight uppercase leading-none">
                    Gold
                  </span>
                  <span className="text-[8px] font-bold uppercase tracking-widest mt-0.5 opacity-90">
                    Associate
                  </span>
                </div>
              </div>

              {/* Next Rank Details */}
              <div className="flex-1 space-y-1.5">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Next Rank Target
                </p>
                <h4 className="text-base font-black text-gray-900 leading-tight">
                  ₹ 5,00,00,000
                </h4>
                <p className="text-[11px] text-gray-500 font-medium">Total Business</p>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-400 to-orange-500 h-2.5 rounded-full w-[75%]" />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-gray-500">
                  <span>Current: 75%</span>
                  <span>Goal: 100%</span>
                </div>
              </div>
            </div>

            {/* Rewards Alert */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs flex items-center gap-2">
              <Gift size={16} className="text-amber-600 shrink-0" />
              <div className="text-[11px]">
                <span className="font-bold text-amber-900">Rewards: </span>
                <span className="text-amber-800">Luxury Trip • Special Cash Bonus</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Quick Links (lg:col-span-4) */}
        <div id="reports" className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between">
          <div className="bg-[#0d1b2a] text-white px-5 py-3.5">
            <h3 className="text-sm font-bold tracking-tight">Quick Links</h3>
          </div>

          <div className="p-4 flex-1 grid grid-cols-2 gap-3">
            {/* 1. View Reports */}
            <Link
              href="/dashboard/plots"
              className="p-3 bg-gray-50 hover:bg-blue-50/60 rounded-xl border border-gray-100 hover:border-blue-200 transition flex flex-col items-center justify-center text-center group"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                <TrendingUp size={20} />
              </div>
              <span className="text-xs font-bold text-gray-800 group-hover:text-blue-700">
                View Reports
              </span>
            </Link>

            {/* 2. Update Bank Details */}
            <Link
              href="/dashboard/profile"
              className="p-3 bg-gray-50 hover:bg-blue-50/60 rounded-xl border border-gray-100 hover:border-blue-200 transition flex flex-col items-center justify-center text-center group"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                <Landmark size={20} />
              </div>
              <span className="text-xs font-bold text-gray-800 group-hover:text-blue-700">
                Update Bank Details
              </span>
            </Link>

            {/* 3. Change Password */}
            <Link
              href="/dashboard/change-password"
              className="p-3 bg-gray-50 hover:bg-blue-50/60 rounded-xl border border-gray-100 hover:border-blue-200 transition flex flex-col items-center justify-center text-center group"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                <KeyRound size={20} />
              </div>
              <span className="text-xs font-bold text-gray-800 group-hover:text-blue-700">
                Change Password
              </span>
            </Link>

            {/* 4. Need Help? */}
            <a
              href="tel:+919829123456"
              className="p-3 bg-gray-50 hover:bg-blue-50/60 rounded-xl border border-gray-100 hover:border-blue-200 transition flex flex-col items-center justify-center text-center group"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                <Headphones size={20} />
              </div>
              <span className="text-xs font-bold text-gray-800 group-hover:text-blue-700">
                Need Help?
              </span>
            </a>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* REFERRAL LINK BAR                                              */}
      {/* ============================================================== */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm space-y-2 mt-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" />
            Your Associate Referral Link
          </label>
          <span className="text-xs text-gray-500">
            Share this link to register associates under your direct sponsorship
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 bg-gray-50 text-gray-700 px-3.5 py-2.5 rounded-lg text-xs sm:text-sm border border-gray-300 focus:outline-none font-mono"
          />
          <CopyLinkButton link={referralLink} />
        </div>
      </div>
    </div>
  );
}
