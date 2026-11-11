import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Trophy,
  Crown,
  Award,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Gift,
  Sparkles,
  ArrowRight,
  Target,
  Plane,
  Bike,
  Car,
  BadgeCheck,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface RankTier {
  level: number;
  rangeLabel: string;
  minSqYard: number;
  maxSqYard: number | null;
  rankName: string;
  rate: number;
  reward: string;
  rewardBadge: string;
  badgeColor: string;
  iconType: "welcome" | "trophy" | "domestic" | "intl" | "bike" | "car" | "luxury_car" | "crown";
}

const rankTiers: RankTier[] = [
  {
    level: 1,
    rangeLabel: "0 - 249",
    minSqYard: 0,
    maxSqYard: 249,
    rankName: "Client Adviser",
    rate: 500,
    reward: "Executive Welcome Kit + Official Associate Certificate",
    rewardBadge: "Welcome Kit & Certificate",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    iconType: "welcome",
  },
  {
    level: 2,
    rangeLabel: "250 - 499",
    minSqYard: 250,
    maxSqYard: 499,
    rankName: "Senior Adviser",
    rate: 700,
    reward: "Silver Trophy + ₹25,000 Milestone Bonus",
    rewardBadge: "Silver Trophy + ₹25K Bonus",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-300",
    iconType: "trophy",
  },
  {
    level: 3,
    rangeLabel: "500 - 999",
    minSqYard: 500,
    maxSqYard: 999,
    rankName: "Star Associate",
    rate: 900,
    reward: "Gold Shield + Domestic Luxury Tour (Goa / Udaipur)",
    rewardBadge: "Gold Shield + Goa/Udaipur Tour",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    iconType: "domestic",
  },
  {
    level: 4,
    rangeLabel: "1,000 - 1,999",
    minSqYard: 1000,
    maxSqYard: 1999,
    rankName: "Team Leader",
    rate: 1000,
    reward: "International Tour (Thailand / Dubai) + Leadership Pin",
    rewardBadge: "Dubai/Thailand Tour + Leadership Pin",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
    iconType: "intl",
  },
  {
    level: 5,
    rangeLabel: "2,000 - 3,499",
    minSqYard: 2000,
    maxSqYard: 3499,
    rankName: "Area Manager",
    rate: 1200,
    reward: "Royal Platinum Shield + Brand Bike / Cash Bonanza",
    rewardBadge: "Brand Bike / Cash Bonanza",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    iconType: "bike",
  },
  {
    level: 6,
    rangeLabel: "3,500 - 5,999",
    minSqYard: 3500,
    maxSqYard: 5999,
    rankName: "Zonal Head",
    rate: 1300,
    reward: "Diamond Club Award + Luxury Vehicle Bonus",
    rewardBadge: "Luxury Vehicle Milestone Bonus",
    badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-300",
    iconType: "car",
  },
  {
    level: 7,
    rangeLabel: "6,000 - 9,999",
    minSqYard: 6000,
    maxSqYard: 9999,
    rankName: "Vice President",
    rate: 1400,
    reward: "Crown Executive Trophy + Luxury Car Privilege",
    rewardBadge: "Luxury Car Privilege",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
    iconType: "luxury_car",
  },
  {
    level: 8,
    rangeLabel: "10,000 and Above",
    minSqYard: 10000,
    maxSqYard: null,
    rankName: "Crown Director",
    rate: 1500,
    reward: "Crown Director Hall of Fame + Real Estate Equity Partner Privilege",
    rewardBadge: "Equity Partner & Hall of Fame",
    badgeColor: "bg-amber-200 text-amber-950 border-amber-400",
    iconType: "crown",
  },
];

export default async function RankRewardsPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const username = session?.user?.username;

  // 1. Fetch associate details & sales
  let user = null;
  if (userId) {
    user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        memberId: true,
        rank: true,
        customSalesGaj: true,
      },
    });
  }

  if (!user && username) {
    user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        memberId: true,
        rank: true,
        customSalesGaj: true,
      },
    });
  }

  // 2. Compute cumulative business in Sq. Yard (Gaj)
  const effectiveUserId = user?.id || userId;
  const sales = effectiveUserId
    ? await prisma.sale.findMany({
        where: { soldById: effectiveUserId },
        include: { plot: true },
      })
    : [];

  const actualSalesGaj = sales.reduce((sum, s) => sum + (s.plot?.sizeGaj || 0), 0);
  const totalSalesGaj =
    user?.customSalesGaj !== null && user?.customSalesGaj !== undefined
      ? user.customSalesGaj
      : actualSalesGaj;

  // 3. Determine current rank and tier based on Gaj
  let currentTierIndex = 0;
  for (let i = rankTiers.length - 1; i >= 0; i--) {
    if (totalSalesGaj >= rankTiers[i].minSqYard) {
      currentTierIndex = i;
      break;
    }
  }

  const currentTier = rankTiers[currentTierIndex];
  const nextTier =
    currentTierIndex < rankTiers.length - 1 ? rankTiers[currentTierIndex + 1] : null;

  const targetGaj = nextTier ? nextTier.minSqYard : 10000;
  const gajRemaining = nextTier ? Math.max(0, nextTier.minSqYard - totalSalesGaj) : 0;
  const rankProgressPercent = nextTier
    ? Math.min(100, Math.round((totalSalesGaj / targetGaj) * 100))
    : 100;

  const dynamicRankTitle =
    user?.rank && user.rank !== "Client Adviser" ? user.rank : currentTier.rankName;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-amber-100 text-amber-900">
              <Trophy size={24} />
            </span>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Rank & Rewards Program
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Associate ranks, milestone targets, and luxury rewards measured by Square Yards (Gaj) sold.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/commission-rules"
            className="px-4 py-2 rounded-xl text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 transition flex items-center gap-1.5"
          >
            <Award size={14} />
            <span>Commission Rules</span>
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1.5"
          >
            <span>Dashboard</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Main Active Rank & Milestone Target Card */}
      <div className="bg-gradient-to-br from-[#0d1b2a] via-[#1b2a47] to-[#0d1b2a] text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden border border-slate-700">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Active Rank Shield & Identity (4 cols) */}
          <div className="lg:col-span-5 flex items-center gap-5 border-b lg:border-b-0 lg:border-r border-slate-700/80 pb-6 lg:pb-0 lg:pr-8">
            <div className="relative w-28 h-32 shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 rounded-b-[40px] rounded-t-2xl shadow-2xl border-2 border-amber-200 flex flex-col items-center justify-center p-2.5 text-center text-white">
                <Crown size={32} className="text-white drop-shadow-md mb-1" />
                <span className="text-[12px] font-black tracking-tight uppercase leading-tight">
                  {dynamicRankTitle}
                </span>
                <span className="text-[9px] font-extrabold uppercase tracking-widest mt-1.5 bg-black/25 px-2.5 py-0.5 rounded text-amber-100 font-mono">
                  ₹{currentTier.rate} / Gaj
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
                Current Associate Level
              </span>
              <h2 className="text-xl font-black text-white">{dynamicRankTitle}</h2>
              <p className="text-xs text-slate-300">
                {user?.name || "Partner"} ({user?.memberId || "SKR00001"})
              </p>
              <div className="pt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <BadgeCheck size={12} />
                  <span>Level {currentTier.level} of 8</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/10 text-slate-200 border border-white/15">
                  <span>{currentTier.rangeLabel} Gaj Slab</span>
                </span>
              </div>
            </div>
          </div>

          {/* Target Milestone & Progress (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-300">
                  Next Rank Milestone
                </span>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <span>{nextTier ? nextTier.rankName : "Crown Director (Maximum Rank)"}</span>
                  {nextTier && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950">
                      ₹{nextTier.rate}/Gaj
                    </span>
                  )}
                </h3>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300 block">
                  Cumulative Business
                </span>
                <span className="text-2xl font-black text-amber-300 font-mono">
                  {totalSalesGaj.toLocaleString("en-IN")}{" "}
                  <span className="text-xs font-normal text-slate-300">/ {targetGaj.toLocaleString("en-IN")} Gaj</span>
                </span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-800/80 rounded-full h-3.5 p-0.5 overflow-hidden border border-slate-700">
                <div
                  style={{ width: `${rankProgressPercent}%` }}
                  className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 h-2.5 rounded-full transition-all duration-500"
                />
              </div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                <span>Progress: {rankProgressPercent}% Completed</span>
                <span>
                  {nextTier
                    ? `${gajRemaining.toLocaleString("en-IN")} Gaj remaining`
                    : "Target fully achieved 👑"}
                </span>
              </div>
            </div>

            {/* Upcoming Milestone Reward Box */}
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300 shrink-0">
                <Gift size={20} />
              </div>
              <div className="text-xs">
                <span className="text-amber-300 font-bold uppercase tracking-wider block text-[10px]">
                  {nextTier ? "Next Milestone Reward" : "Current Milestone Honor"}
                </span>
                <span className="text-white font-semibold text-xs sm:text-sm">
                  {nextTier ? nextTier.reward : currentTier.reward}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 8-Tier Rank & Reward Milestone Catalog */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles size={18} className="text-amber-600" />
              <span>Official 8-Tier Rank & Reward Milestones</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Rank promotions and milestone rewards automatically unlock based on your total square yards (Gaj) sold.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 self-start sm:self-auto">
            100% Sq. Yard Based
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0d1b2a] text-white uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Level</th>
                <th className="py-3 px-4">Rank Title</th>
                <th className="py-3 px-4">Sales Target (Sq. Yard / Gaj)</th>
                <th className="py-3 px-4 text-center">Commission Rate</th>
                <th className="py-3 px-4">Milestone Reward</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rankTiers.map((tier) => {
                const isCurrent = tier.level === currentTier.level;
                const isAchieved = totalSalesGaj >= tier.minSqYard;

                return (
                  <tr
                    key={tier.level}
                    className={`transition ${
                      isCurrent
                        ? "bg-amber-50/90 font-bold border-l-4 border-amber-500"
                        : isAchieved
                        ? "bg-emerald-50/40"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      #{tier.level}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {isCurrent ? (
                          <Crown size={16} className="text-amber-600 shrink-0" />
                        ) : isAchieved ? (
                          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        ) : (
                          <Lock size={15} className="text-slate-400 shrink-0" />
                        )}
                        <span className="font-bold text-slate-900 text-sm">{tier.rankName}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                      {tier.rangeLabel} <span className="text-slate-500 font-sans text-xs">Gaj</span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black font-mono ${
                          isCurrent
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        ₹ {tier.rate.toLocaleString("en-IN")} / Gaj
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Gift size={14} className="text-amber-600 shrink-0" />
                        <span>{tier.reward}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-amber-200 text-amber-900">
                          <Crown size={12} />
                          <span>ACTIVE RANK</span>
                        </span>
                      ) : isAchieved ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                          <CheckCircle2 size={13} />
                          <span>Unlocked ✓</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400 flex items-center justify-end gap-1">
                          <Lock size={12} />
                          <span>{tier.minSqYard - totalSalesGaj} Gaj to unlock</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reward Showcase Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Domestic Tour */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Plane size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
              Star Associate (500 Gaj)
            </span>
            <h4 className="font-black text-slate-900 text-sm">Domestic Luxury Tour</h4>
            <p className="text-xs text-slate-600">
              All-expenses paid trip to Goa or Udaipur with 5-star resort stay & gala celebration.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-slate-500">
            {totalSalesGaj >= 500 ? (
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={13} /> Unlocked
              </span>
            ) : (
              <span>Target: 500 Gaj ({Math.max(0, 500 - totalSalesGaj)} Gaj left)</span>
            )}
          </div>
        </div>

        {/* Card 2: International Tour */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
              <Plane size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
              Team Leader (1,000 Gaj)
            </span>
            <h4 className="font-black text-slate-900 text-sm">International Tour</h4>
            <p className="text-xs text-slate-600">
              International flight & hotel package to Thailand or Dubai with leadership honours.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-slate-500">
            {totalSalesGaj >= 1000 ? (
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={13} /> Unlocked
              </span>
            ) : (
              <span>Target: 1,000 Gaj ({Math.max(0, 1000 - totalSalesGaj)} Gaj left)</span>
            )}
          </div>
        </div>

        {/* Card 3: Brand Bike / Bonanza */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Bike size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
              Area Manager (2,000 Gaj)
            </span>
            <h4 className="font-black text-slate-900 text-sm">Brand Bike / Cash Bonanza</h4>
            <p className="text-xs text-slate-600">
              Brand new executive motorbike or milestone cash bonus disbursed to your wallet.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-slate-500">
            {totalSalesGaj >= 2000 ? (
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={13} /> Unlocked
              </span>
            ) : (
              <span>Target: 2,000 Gaj ({Math.max(0, 2000 - totalSalesGaj)} Gaj left)</span>
            )}
          </div>
        </div>

        {/* Card 4: Luxury Car Privilege */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center">
              <Car size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
              Vice President (6,000 Gaj)
            </span>
            <h4 className="font-black text-slate-900 text-sm">Luxury Car Privilege</h4>
            <p className="text-xs text-slate-600">
              Corporate luxury vehicle allocation and executive perks for top real estate leadership.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-slate-500">
            {totalSalesGaj >= 6000 ? (
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={13} /> Unlocked
              </span>
            ) : (
              <span>Target: 6,000 Gaj ({Math.max(0, 6000 - totalSalesGaj)} Gaj left)</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
