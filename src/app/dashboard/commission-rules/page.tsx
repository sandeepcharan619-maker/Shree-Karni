import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Award,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Info,
  DollarSign,
  Sparkles,
  Target,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AssociateCommissionRulesPage() {
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

  // 2. Fetch sales to calculate cumulative Gaj
  const effectiveUserId = user?.id || userId;
  const sales = effectiveUserId
    ? await prisma.sale.findMany({
        where: { soldById: effectiveUserId },
        include: { plot: true },
      })
    : [];

  const actualSalesGaj = sales.reduce((sum, s) => sum + (s.plot?.sizeGaj || 0), 0);
  const totalSalesGaj = user?.customSalesGaj !== null && user?.customSalesGaj !== undefined
    ? user.customSalesGaj
    : actualSalesGaj;

  // 3. Fetch official commission slabs from DB
  const slabs = await prisma.commissionSlab.findMany({
    orderBy: { minSqYard: "asc" },
  });

  // Find active slab
  const currentSlab = slabs.find((s) => {
    if (s.maxSqYard !== null) {
      return totalSalesGaj >= s.minSqYard && totalSalesGaj <= s.maxSqYard;
    }
    return totalSalesGaj >= s.minSqYard;
  }) || slabs[0];

  // Find next slab
  const currentSlabIndex = slabs.findIndex((s) => s.id === currentSlab?.id);
  const nextSlab = currentSlabIndex >= 0 && currentSlabIndex < slabs.length - 1
    ? slabs[currentSlabIndex + 1]
    : null;

  const gajNeededForNext = nextSlab ? Math.max(0, nextSlab.minSqYard - totalSalesGaj) : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Page Title & Breadcrumb */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-900">
              <Award size={22} />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Associate Commission Rules
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official sales volume commission matrix based on total square yards (Gaj) sold.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
        >
          <span>Back to Dashboard</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Current Progress & Active Tier Banner */}
      <div className="bg-gradient-to-br from-[#0d1b2a] via-[#1b2a47] to-[#0d1b2a] text-white p-6 rounded-3xl shadow-xl relative overflow-hidden border border-slate-700">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-amber-400 block mb-1">
              Your Current Sales Performance
            </span>
            <h3 className="text-3xl font-black text-white font-mono">
              {totalSalesGaj.toLocaleString("en-IN")}{" "}
              <span className="text-base font-normal text-slate-300">Sq. Yard (Gaj)</span>
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Associate: <strong className="text-white">{user?.name || "Partner"}</strong> ({user?.memberId || "SKR"})
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300 block">
              Active Commission Rate
            </span>
            <div className="text-3xl font-black text-amber-300 my-1 font-mono">
              ₹ {currentSlab?.associateRate?.toLocaleString("en-IN") || 500}
              <span className="text-xs text-white/80 font-normal"> / Gaj</span>
            </div>
            <span className="text-[11px] text-emerald-300 font-semibold block">
              Current Slab: {currentSlab?.rangeLabel || "0 - 249"} Gaj
            </span>
          </div>

          <div className="text-left md:text-right">
            {nextSlab ? (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-300 block">
                  Next Milestone Target
                </span>
                <p className="text-sm font-bold text-white">
                  Unlock <span className="text-amber-400 font-black">₹ {nextSlab.associateRate} / Gaj</span>
                </p>
                <p className="text-xs text-slate-300">
                  Sell <strong className="text-amber-300">{gajNeededForNext.toLocaleString("en-IN")} more Gaj</strong> to reach the {nextSlab.rangeLabel} Gaj tier!
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-900 inline-block">
                  TOP TIER ACHIEVED 👑
                </span>
                <p className="text-xs text-slate-300 mt-1">
                  You are at the maximum commission rate of ₹ 1,500 / Gaj!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Official Slabs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Commission Slab Table (Per Square Yard)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Rates apply per square yard (Gaj) sold, scaling progressively as your cumulative sales grow.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900">
            Official Company Slabs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0d1b2a] text-white uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="py-3 px-5">Total Sales Range (In Square Yard / Gaj)</th>
                <th className="py-3 px-5 text-center">Associate Commission (₹ / Sq. Yard)</th>
                <th className="py-3 px-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {slabs.map((s) => {
                const isCurrent = s.id === currentSlab?.id;
                const isPast = totalSalesGaj > (s.maxSqYard || Infinity);

                return (
                  <tr
                    key={s.id}
                    className={`transition ${
                      isCurrent
                        ? "bg-amber-50/80 font-bold border-l-4 border-amber-500"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="py-3.5 px-5 font-bold text-slate-900 text-sm">
                      <span className="font-mono">{s.rangeLabel}</span>{" "}
                      <span className="text-slate-400 font-medium text-xs">Sq. Yard</span>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <span
                        className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-black ${
                          isCurrent
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        ₹ {s.associateRate?.toLocaleString("en-IN")} / Gaj
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-amber-200 text-amber-900">
                          <CheckCircle2 size={12} />
                          <span>YOUR ACTIVE SLAB</span>
                        </span>
                      ) : isPast ? (
                        <span className="text-[11px] font-bold text-slate-400">
                          Completed ✓
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400">
                          Upcoming Milestone
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

      {/* Practical Calculation Example & FAQ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <Sparkles size={16} />
            </span>
            <h3 className="text-sm font-bold text-slate-900">How Commission Is Calculated</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your commission is earned directly on the size of the plot sold in Square Yards (Gaj):
          </p>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">100 Gaj Plot @ ₹500/Gaj:</span>
              <strong className="text-slate-900">₹ 50,000</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">150 Gaj Plot @ ₹1,000/Gaj:</span>
              <strong className="text-slate-900">₹ 1,50,000</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">200 Gaj Plot @ ₹1,500/Gaj:</span>
              <strong className="text-emerald-700 font-black">₹ 3,00,000</strong>
            </div>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <ShieldCheck size={16} />
            </span>
            <h3 className="text-sm font-bold text-slate-900">Terms & Payout Policies</h3>
          </div>
          <ul className="text-xs text-slate-600 space-y-2">
            <li className="flex items-start gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
              <span>All fees and charges are inclusive of taxes.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
              <span>Approved commissions are directly credited to your <strong>Bank Wallet Balance</strong>.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
              <span>Your sales volume accumulates continuously across all projects in Jaipur and Vatika.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
