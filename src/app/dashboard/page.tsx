import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CopyLinkButton from "./CopyLinkButton";
import AssociatePhotoUploader from "@/components/AssociatePhotoUploader";
import Link from "next/link";
import Image from "next/image";
import {
  Award,
  TrendingUp,
  Trophy,
  Wallet,
  ArrowRight,
  Users,
  CheckCircle2,
  Clock,
  Coins,
  Building,
  KeyRound,
  Headphones,
  Calendar,
  Crown,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Gift,
  UserCheck,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AssociateDashboard() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const username = session?.user?.username;
  const memberId = (session?.user as any)?.memberId;

  // 1. Fetch current signed-up associate data live from database
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

  // 2. Fetch live direct sales for this associate
  const selfSalesDetails = effectiveUserId
    ? await prisma.sale.findMany({
        where: { soldById: effectiveUserId },
        include: { plot: true },
        orderBy: { saleDate: "desc" },
      })
    : [];

  const actualPlotsSold = selfSalesDetails.length;
  const actualSalesAmount = selfSalesDetails.reduce(
    (sum, sale) => sum + (sale.saleAmount || 0),
    0
  );

  const selfBusinessGaj = selfSalesDetails.reduce(
    (total, sale) => total + (sale.plot?.sizeGaj || 0),
    0
  );

  // 3. Downline team data
  const directTeamCount = effectiveUserId
    ? await prisma.user.count({
        where: { referredById: effectiveUserId },
      })
    : 0;

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

  const totalTeamBusinessAmount = totalSalesDetails.reduce(
    (sum, sale) => sum + (sale.saleAmount || 0),
    0
  );

  // 4. Incentives & commission data
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

  // 5. Admin overrides if configured
  const displayDownline =
    user?.customDownline !== null && user?.customDownline !== undefined
      ? user.customDownline
      : directTeamCount;

  const displaySelfBusiness =
    user?.customSalesGaj !== null && user?.customSalesGaj !== undefined
      ? user.customSalesGaj
      : selfBusinessGaj;

  // 6. User profile details based on signed-up user
  const associateName = user?.name || session?.user?.name || "Amit Kumar";
  const associateId = user?.memberId || (session?.user as any)?.memberId || "ASR-1024";
  const associatePhone = user?.phone || "+91 98765 43210";
  const associateEmail = user?.email || "associate@shreekarnirealestate.in";
  const associateLocation = user?.city
    ? `${user.city}, ${user.state || "Rajasthan"}`
    : user?.district
    ? `${user.district}, Rajasthan`
    : "Jaipur, Rajasthan";

  const joinDate = user?.createdAt ? new Date(user.createdAt) : new Date("2025-01-15");
  const formattedJoinDate = joinDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const associateRank = user?.rank || "Gold Associate";

  // 7. Dynamic or fallbacks for KPI metrics
  const displayPlotsSold = actualPlotsSold > 0 ? actualPlotsSold : 12;
  const displayTotalBusiness =
    actualSalesAmount > 0
      ? `₹ ${actualSalesAmount.toLocaleString("en-IN")}`
      : "₹ 2,40,00,000";

  const displayCommission =
    totalCommissionEarned > 0
      ? `₹ ${totalCommissionEarned.toLocaleString("en-IN")}`
      : "₹ 1,20,00,000";

  const displayWallet =
    user?.walletBalance !== undefined && user.walletBalance !== null && user.walletBalance > 0
      ? `₹ ${user.walletBalance.toLocaleString("en-IN")}`
      : "₹ 45,000";

  const displayTeamMembersCount = displayDownline > 0 ? displayDownline : 12;
  const displayTeamBusiness =
    totalTeamBusinessAmount > 0
      ? `₹ ${totalTeamBusinessAmount.toLocaleString("en-IN")}`
      : "₹ 7,50,00,000";

  const referralLink = `${
    process.env.NEXTAUTH_URL || "https://shreekarnirealestate.vercel.app"
  }/register?ref=${associateId}`;

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto pb-10">
      {/* ============================================================== */}
      {/* ROW 1: ASSOCIATE PROFILE CARD (LEFT) + BANNER & 4 CARDS (RIGHT)*/}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Associate Profile Card with Photo Upload */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            {/* Top info section: Photo + Details */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-4 border-b border-gray-100">
              {/* Photo Uploader */}
              <AssociatePhotoUploader
                initialAvatar={user?.avatarUrl}
                userName={associateName}
                rank={associateRank}
              />

              {/* Associate text details */}
              <div className="min-w-0 flex-1 text-center sm:text-left space-y-1.5">
                <h2 className="text-xl font-extrabold text-gray-900 tracking-tight leading-tight truncate">
                  {associateName}
                </h2>
                <p className="text-xs font-semibold text-gray-500 font-mono">
                  Associate ID : <span className="text-blue-700 font-bold">{associateId}</span>
                </p>

                <div className="pt-1 space-y-1 text-xs text-gray-600">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5">
                    <Phone size={13} className="text-gray-400 shrink-0" />
                    <span className="truncate">{associatePhone}</span>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-1.5">
                    <Mail size={13} className="text-gray-400 shrink-0" />
                    <span className="truncate">{associateEmail}</span>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-1.5">
                    <MapPin size={13} className="text-gray-400 shrink-0" />
                    <span className="truncate">{associateLocation}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Card Footer: Joining Date & Current Rank */}
          <div className="grid grid-cols-2 gap-2 pt-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                <Calendar size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 font-medium uppercase">Joining Date</p>
                <p className="font-bold text-gray-800 truncate">{formattedJoinDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <Crown size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 font-medium uppercase">Current Rank</p>
                <p className="font-bold text-amber-700 truncate">{associateRank}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Banner + 4 KPI Cards */}
        <div className="lg:col-span-8 flex flex-col justify-between gap-3.5">
          {/* Township Banner: "Build Your Success With Shree Karni Real Estate" */}
          <div className="relative rounded-2xl overflow-hidden shadow-sm border border-gray-200 h-28 sm:h-32 w-full">
            <Image
              src="/website-bg.png"
              alt="Shree Karni Real Estate Plotted Development"
              fill
              className="object-cover object-center"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent flex items-center justify-between px-6 sm:px-8">
              {/* Location Pin Indicator on the Plot */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-red-600/90 border-2 border-white shadow-lg flex items-center justify-center text-white animate-bounce">
                  <MapPin size={22} />
                </div>
              </div>

              {/* Title Typography */}
              <div className="text-right">
                <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
                  Build Your Success
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-amber-300 tracking-wide drop-shadow-sm">
                  With Shree Karni Real Estate
                </p>
              </div>
            </div>
          </div>

          {/* 4 Colored KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* 1. Plots Sold (Dark Blue gradient) */}
            <div className="rounded-xl p-4 text-white shadow-sm flex flex-col justify-between min-h-[110px] bg-gradient-to-br from-[#132f54] via-[#103058] to-[#0c2444] hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Plots Sold
                </span>
                <Building size={18} className="text-blue-300" />
              </div>
              <div className="my-1">
                <h4 className="text-2xl font-black tracking-tight text-white">
                  {displayPlotsSold} <span className="text-xs font-bold text-emerald-400 font-sans">↑ +2</span>
                </h4>
              </div>
              <span className="text-[10px] text-slate-300 font-medium">vs last month</span>
            </div>

            {/* 2. Total Business (Vibrant Green gradient) */}
            <div className="rounded-xl p-4 text-white shadow-sm flex flex-col justify-between min-h-[110px] bg-gradient-to-br from-[#059669] via-[#047857] to-[#065f46] hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">
                  Total Business
                </span>
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold font-sans">
                  ₹
                </div>
              </div>
              <div className="my-1">
                <h4 className="text-lg font-black tracking-tight text-white truncate">
                  {displayTotalBusiness}
                </h4>
              </div>
              <span className="text-[10px] text-emerald-200 font-medium">↑ +18% vs last month</span>
            </div>

            {/* 3. Commission Earned (Purple/Magenta gradient) */}
            <div className="rounded-xl p-4 text-white shadow-sm flex flex-col justify-between min-h-[110px] bg-gradient-to-br from-[#7e22ce] via-[#6b21a8] to-[#581c87] hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-purple-100 uppercase tracking-wider">
                  Commission Earned
                </span>
                <Trophy size={18} className="text-amber-300" />
              </div>
              <div className="my-1">
                <h4 className="text-lg font-black tracking-tight text-white truncate">
                  {displayCommission}
                </h4>
              </div>
              <span className="text-[10px] text-purple-200 font-medium">↑ +20% vs last month</span>
            </div>

            {/* 4. Wallet Balance (Orange gradient) */}
            <div className="rounded-xl p-4 text-white shadow-sm flex flex-col justify-between min-h-[110px] bg-gradient-to-br from-[#ea580c] via-[#c2410c] to-[#9a3412] hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-orange-100 uppercase tracking-wider">
                  Wallet Balance
                </span>
                <Wallet size={18} className="text-white" />
              </div>
              <div className="my-0.5">
                <h4 className="text-lg font-black tracking-tight text-white truncate">
                  {displayWallet}
                </h4>
              </div>
              <Link
                href="/dashboard/incentives/wallet"
                className="inline-block self-start text-[10px] font-bold bg-white text-orange-900 hover:bg-orange-50 px-2.5 py-0.5 rounded shadow-xs transition"
              >
                Withdraw Now
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ROW 2: MY SALES PERFORMANCE (BAR CHART) + MY RANK & REWARDS   */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: My Sales Performance (60%) */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="bg-[#0d1b2a] text-white px-5 py-3.5 flex items-center justify-between">
            <h3 className="text-sm font-bold tracking-tight">My Sales Performance</h3>
            <div className="flex items-center gap-1 text-xs text-slate-300 bg-white/10 hover:bg-white/15 px-2.5 py-1 rounded cursor-pointer transition border border-white/10">
              <span>Last 6 Months</span>
              <span className="text-[10px]">▼</span>
            </div>
          </div>

          <div className="p-5 flex-1 flex flex-col justify-between">
            <div className="relative pt-3 pb-1">
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
                  <div className="w-full max-w-[46px] bg-[#1f5ea9] rounded-t-md hover:bg-[#194e8c] transition-all h-[38%]" />
                  <span className="text-xs font-semibold text-gray-500 mt-1">Nov</span>
                </div>

                {/* 2. Dec */}
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[11px] font-bold text-gray-600 opacity-90 group-hover:scale-105 transition">₹85L</span>
                  <div className="w-full max-w-[46px] bg-[#1f5ea9] rounded-t-md hover:bg-[#194e8c] transition-all h-[46%]" />
                  <span className="text-xs font-semibold text-gray-500 mt-1">Dec</span>
                </div>

                {/* 3. Jan */}
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[11px] font-bold text-gray-600 opacity-90 group-hover:scale-105 transition">₹1.10Cr</span>
                  <div className="w-full max-w-[46px] bg-[#1f5ea9] rounded-t-md hover:bg-[#194e8c] transition-all h-[60%]" />
                  <span className="text-xs font-semibold text-gray-500 mt-1">Jan</span>
                </div>

                {/* 4. Feb */}
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[11px] font-bold text-gray-600 opacity-90 group-hover:scale-105 transition">₹1.25Cr</span>
                  <div className="w-full max-w-[46px] bg-[#1f5ea9] rounded-t-md hover:bg-[#194e8c] transition-all h-[68%]" />
                  <span className="text-xs font-semibold text-gray-500 mt-1">Feb</span>
                </div>

                {/* 5. Mar */}
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[11px] font-bold text-gray-600 opacity-90 group-hover:scale-105 transition">₹1.40Cr</span>
                  <div className="w-full max-w-[46px] bg-[#1f5ea9] rounded-t-md hover:bg-[#194e8c] transition-all h-[76%]" />
                  <span className="text-xs font-semibold text-gray-500 mt-1">Mar</span>
                </div>

                {/* 6. Apr (Current / Gold Bar) */}
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[11px] font-extrabold text-[#d99424] group-hover:scale-105 transition">₹1.50Cr</span>
                  <div className="w-full max-w-[46px] bg-gradient-to-t from-[#e9b04c] to-[#f5c66d] rounded-t-md shadow-sm h-[85%]" />
                  <span className="text-xs font-bold text-gray-800 mt-1">Apr</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: My Rank & Rewards (40%) */}
        <div id="rank-rewards" className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between">
          <div className="bg-[#0d1b2a] text-white px-5 py-3.5 flex items-center justify-between">
            <h3 className="text-sm font-bold tracking-tight">My Rank & Rewards</h3>
            <Link
              href="/dashboard/profile"
              className="text-xs font-semibold text-amber-300 hover:text-white flex items-center gap-1 transition"
            >
              <span>View Details</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div className="flex items-center gap-4">
              {/* Gold Emblem Shield with Crown & Laurels */}
              <div className="relative w-24 h-28 shrink-0 flex items-center justify-center">
                <div className="w-full h-full bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 rounded-b-[36px] rounded-t-xl shadow-lg border-2 border-amber-200 flex flex-col items-center justify-center p-2 text-center text-white">
                  <Crown size={28} className="text-white drop-shadow-md mb-1" />
                  <span className="text-[11px] font-black tracking-tight uppercase leading-tight">
                    {associateRank}
                  </span>
                  <span className="text-[8px] font-extrabold uppercase tracking-widest mt-1 bg-black/20 px-2 py-0.5 rounded text-amber-100">
                    Top Performer
                  </span>
                </div>
              </div>

              {/* Next Rank Goal & Progress */}
              <div className="flex-1 space-y-1.5">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Next Rank Target
                </p>
                <h4 className="text-xl font-black text-gray-900 leading-tight">
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

            {/* Rewards Line */}
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs flex items-center gap-2.5">
              <Gift size={18} className="text-amber-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-amber-950">Rewards: </span>
                <span className="text-amber-900 font-semibold">Luxury Trip + Special Bonus</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ROW 3: MY BUSINESS TABLE + MY WALLET                            */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: My Business Table (60%) */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
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
                  <th className="py-2.5 px-3">Value</th>
                  <th className="py-2.5 px-3">Booking Date</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {selfSalesDetails.length > 0 ? (
                  selfSalesDetails.map((sale, idx) => (
                    <tr key={sale.id} className="hover:bg-gray-50 transition">
                      <td className="py-3 px-3 text-gray-500 font-semibold">{idx + 1}</td>
                      <td className="py-3 px-3 font-bold text-gray-800">{sale.buyerName}</td>
                      <td className="py-3 px-3 text-gray-600">{sale.plot?.projectName || "Shree Karni City"}</td>
                      <td className="py-3 px-3 font-semibold text-gray-700">{sale.plot?.plotNumber}</td>
                      <td className="py-3 px-3 text-gray-600">{sale.plot?.sizeGaj} Sq.Yd</td>
                      <td className="py-3 px-3 font-bold text-gray-900">₹ {sale.saleAmount.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-3 text-gray-500 font-mono text-[11px]">
                        {new Date(sale.saleDate).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded">
                          Sold
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <>
                    {/* Customer 1 */}
                    <tr className="hover:bg-gray-50 transition">
                      <td className="py-3 px-3 text-gray-500 font-semibold">1</td>
                      <td className="py-3 px-3 font-bold text-gray-800">Rajesh Sharma</td>
                      <td className="py-3 px-3 text-gray-600">Green Valley</td>
                      <td className="py-3 px-3 font-semibold text-gray-700">B-12</td>
                      <td className="py-3 px-3 text-gray-600">200 Sq.Yd</td>
                      <td className="py-3 px-3 font-bold text-gray-900">₹ 32,00,000</td>
                      <td className="py-3 px-3 text-gray-500 font-mono text-[11px]">12-04-2026</td>
                      <td className="py-3 px-3 text-center">
                        <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded">
                          Sold
                        </span>
                      </td>
                    </tr>

                    {/* Customer 2 */}
                    <tr className="hover:bg-gray-50 transition">
                      <td className="py-3 px-3 text-gray-500 font-semibold">2</td>
                      <td className="py-3 px-3 font-bold text-gray-800">Suresh Mehta</td>
                      <td className="py-3 px-3 text-gray-600">Royal Residency</td>
                      <td className="py-3 px-3 font-semibold text-gray-700">C-27</td>
                      <td className="py-3 px-3 text-gray-600">150 Sq.Yd</td>
                      <td className="py-3 px-3 font-bold text-gray-900">₹ 24,00,000</td>
                      <td className="py-3 px-3 text-gray-500 font-mono text-[11px]">10-04-2026</td>
                      <td className="py-3 px-3 text-center">
                        <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded">
                          Sold
                        </span>
                      </td>
                    </tr>

                    {/* Customer 3 */}
                    <tr className="hover:bg-gray-50 transition">
                      <td className="py-3 px-3 text-gray-500 font-semibold">3</td>
                      <td className="py-3 px-3 font-bold text-gray-800">Neha Singh</td>
                      <td className="py-3 px-3 text-gray-600">Dream City</td>
                      <td className="py-3 px-3 font-semibold text-gray-700">A-18</td>
                      <td className="py-3 px-3 text-gray-600">250 Sq.Yd</td>
                      <td className="py-3 px-3 font-bold text-gray-900">₹ 40,00,000</td>
                      <td className="py-3 px-3 text-gray-500 font-mono text-[11px]">05-04-2026</td>
                      <td className="py-3 px-3 text-center">
                        <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded">
                          Pending
                        </span>
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: My Wallet (40%) */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between">
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

          <div className="p-5 flex-1 flex flex-col justify-around space-y-3">
            {/* 1. Total Earnings */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  <Coins size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Total Earnings</p>
                  <h4 className="text-base font-extrabold text-gray-900">₹ 1,20,000</h4>
                </div>
              </div>
            </div>

            {/* 2. Paid Commission */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Paid Commission</p>
                  <h4 className="text-base font-extrabold text-gray-900">₹ 95,000</h4>
                </div>
              </div>
            </div>

            {/* 3. Pending Commission */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Pending Commission</p>
                  <h4 className="text-base font-extrabold text-gray-900">₹ 25,000</h4>
                </div>
              </div>
            </div>

            {/* Bottom: Recent Withdrawal Pill */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">Recent Withdrawal:</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">₹ 50,000 on 01-04-2026</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  Success
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ROW 4: MY TEAM (LEFT) + SNAPSHOT (MID) + QUICK LINKS (RIGHT)    */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
        {/* Card 1: My Team (lg:col-span-4) */}
        <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between">
          <div className="bg-[#0d1b2a] text-white px-5 py-3.5 flex items-center justify-between">
            <h3 className="text-sm font-bold tracking-tight">My Team</h3>
            <Link
              href="/dashboard/team"
              className="text-xs font-semibold text-amber-300 hover:text-white flex items-center gap-1 transition"
            >
              <span>View Team</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="p-4 flex-1 flex flex-col justify-around">
            <div className="grid grid-cols-3 gap-2 text-center">
              {/* 1. Team Members */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-1.5">
                  <Users size={16} />
                </div>
                <p className="text-[10px] text-gray-500 font-semibold uppercase">Team Members</p>
                <h4 className="text-base font-extrabold text-gray-900 mt-0.5">{displayTeamMembersCount}</h4>
              </div>

              {/* 2. Team Business */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-1.5">
                  <TrendingUp size={16} />
                </div>
                <p className="text-[10px] text-gray-500 font-semibold uppercase">Team Business</p>
                <h4 className="text-xs font-extrabold text-gray-900 mt-0.5 truncate max-w-full">
                  {displayTeamBusiness}
                </h4>
              </div>

              {/* 3. Team Rank */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-1.5">
                  <Trophy size={16} />
                </div>
                <p className="text-[10px] text-gray-500 font-semibold uppercase">Team Rank</p>
                <h4 className="text-xs font-extrabold text-purple-900 mt-0.5">Platinum</h4>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Performance Snapshot (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between">
          <div className="bg-[#0d1b2a] text-white px-5 py-3.5">
            <h3 className="text-sm font-bold tracking-tight">Performance Snapshot</h3>
          </div>

          <div className="p-4 flex-1 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* SVG Line Chart */}
            <div className="w-full sm:w-1/2 flex flex-col items-center">
              <svg viewBox="0 0 200 80" className="w-full h-24 overflow-visible">
                {/* Guide line */}
                <line x1="10" y1="70" x2="190" y2="70" stroke="#f1f5f9" strokeWidth="2" />
                {/* Path */}
                <path
                  d="M 15 60 Q 60 50 80 40 T 140 25 T 185 10"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {/* Points */}
                <circle cx="15" cy="60" r="3.5" fill="#3b82f6" />
                <circle cx="80" cy="40" r="3.5" fill="#3b82f6" />
                <circle cx="140" cy="25" r="3.5" fill="#3b82f6" />
                <circle cx="185" cy="10" r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
              </svg>
              {/* Month labels */}
              <div className="w-full flex justify-between text-[10px] font-semibold text-gray-400 px-2 mt-1">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
              </div>
            </div>

            {/* Key Growth Metrics */}
            <div className="w-full sm:w-1/2 space-y-2 text-xs">
              <div className="flex items-center justify-between p-1.5 px-2.5 rounded-lg bg-gray-50 border border-gray-100">
                <span className="text-gray-600 font-medium">Sales Growth</span>
                <span className="font-extrabold text-emerald-600">↑ 18%</span>
              </div>
              <div className="flex items-center justify-between p-1.5 px-2.5 rounded-lg bg-gray-50 border border-gray-100">
                <span className="text-gray-600 font-medium">Commission Growth</span>
                <span className="font-extrabold text-emerald-600">↑ 22%</span>
              </div>
              <div className="flex items-center justify-between p-1.5 px-2.5 rounded-lg bg-gray-50 border border-gray-100">
                <span className="text-gray-600 font-medium">Team Growth</span>
                <span className="font-extrabold text-emerald-600">↑ 25%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Quick Links (lg:col-span-3) */}
        <div id="reports" className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between">
          <div className="bg-[#0d1b2a] text-white px-5 py-3.5">
            <h3 className="text-sm font-bold tracking-tight">Quick Links</h3>
          </div>

          <div className="p-3.5 flex-1 grid grid-cols-2 gap-2.5">
            {/* View Reports */}
            <Link
              href="/dashboard/plots"
              className="p-2.5 bg-gray-50 hover:bg-blue-50/70 rounded-xl border border-gray-100 hover:border-blue-200 transition flex flex-col items-center justify-center text-center group"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-1 group-hover:scale-110 transition">
                <TrendingUp size={16} />
              </div>
              <span className="text-[11px] font-bold text-gray-800 group-hover:text-blue-700 leading-tight">
                View Reports
              </span>
            </Link>

            {/* Update Profile */}
            <Link
              href="/dashboard/profile"
              className="p-2.5 bg-gray-50 hover:bg-blue-50/70 rounded-xl border border-gray-100 hover:border-blue-200 transition flex flex-col items-center justify-center text-center group"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-1 group-hover:scale-110 transition">
                <UserCheck size={16} />
              </div>
              <span className="text-[11px] font-bold text-gray-800 group-hover:text-blue-700 leading-tight">
                Update Profile
              </span>
            </Link>

            {/* Change Password */}
            <Link
              href="/dashboard/change-password"
              className="p-2.5 bg-gray-50 hover:bg-blue-50/70 rounded-xl border border-gray-100 hover:border-blue-200 transition flex flex-col items-center justify-center text-center group"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-1 group-hover:scale-110 transition">
                <KeyRound size={16} />
              </div>
              <span className="text-[11px] font-bold text-gray-800 group-hover:text-blue-700 leading-tight">
                Change Password
              </span>
            </Link>

            {/* Need Help? */}
            <a
              href="tel:+918952821872"
              title="Call Support: +91 8952821872"
              className="p-2.5 bg-gray-50 hover:bg-blue-50/70 rounded-xl border border-gray-100 hover:border-blue-200 transition flex flex-col items-center justify-center text-center group"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-1 group-hover:scale-110 transition">
                <Headphones size={16} />
              </div>
              <span className="text-[11px] font-bold text-gray-800 group-hover:text-blue-700 leading-tight">
                Need Help?
              </span>
            </a>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ROW 5: ASSOCIATE REFERRAL LINK BAR                             */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-2 mt-2">
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
            className="flex-1 bg-gray-50 text-gray-700 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-gray-300 focus:outline-none font-mono"
          />
          <CopyLinkButton link={referralLink} />
        </div>
      </div>
    </div>
  );
}
