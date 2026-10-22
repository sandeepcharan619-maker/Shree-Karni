import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardCard from "@/components/DashboardCard";
import CopyLinkButton from "./CopyLinkButton";
import { Gauge, Home } from "lucide-react";
import Link from "next/link";

export default async function AssociateDashboard() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  // Fetch associate data
  const user = await prisma.user.findUnique({
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

  // Total direct + indirect downline
  const totalDownline = await prisma.user.count({
    where: { referredById: userId },
  });

  // Calculate self business in GAJ
  const selfSalesDetails = await prisma.sale.findMany({
    where: { soldById: userId },
    include: { plot: true },
  });
  const selfBusinessGaj = selfSalesDetails.reduce(
    (total, sale) => total + (sale.plot?.sizeGaj || 0),
    0
  );

  // Total business (self + team) in GAJ
  const teamMembers = await prisma.user.findMany({
    where: { referredById: userId },
    select: { id: true },
  });
  const teamIds = [userId!, ...teamMembers.map((m) => m.id)];

  const totalSalesDetails = await prisma.sale.findMany({
    where: { soldById: { in: teamIds } },
    include: { plot: true },
  });
  const totalBusinessGaj = totalSalesDetails.reduce(
    (total, sale) => total + (sale.plot?.sizeGaj || 0),
    0
  );

  const referralLink = `${
    process.env.NEXTAUTH_URL || "https://shreekarnirealestate.vercel.app"
  }/register?ref=${user?.memberId || "SKR00001"}`;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Title & Breadcrumbs header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-200 pb-3">
        <h1 className="text-2xl font-normal text-[#333333] tracking-tight">Dashboard</h1>

        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Gauge size={13} className="text-gray-600" />
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-800 font-medium">
            Home
          </Link>
          <span>&gt;</span>
          <span className="text-gray-400">Dashboard</span>
        </div>
      </div>

      {/* Referral Link Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <input
          type="text"
          value={referralLink}
          readOnly
          className="flex-1 bg-[#eeeeee] text-[#555555] px-4 py-2.5 rounded text-sm border border-transparent focus:outline-none focus:border-gray-300"
        />
        <CopyLinkButton link={referralLink} />
      </div>

      {/* 6 Metric Cards matching screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        {/* 1. Magenta: Member ID */}
        <DashboardCard
          cardType="member"
          topText={`ID: ${user?.memberId || "SKR00001"}`}
          mainLabel="Member ID"
        />

        {/* 2. Purple: Total Downline */}
        <DashboardCard
          cardType="downline"
          topText={totalDownline}
          mainLabel="Total Downline"
        />

        {/* 3. Blue: Currant Rank */}
        <DashboardCard
          cardType="rank"
          topText={user?.rank || "Client Adviser"}
          mainLabel="Currant Rank"
        />

        {/* 4. Red: Self Business(GAJ) */}
        <DashboardCard
          cardType="selfBusiness"
          topText={selfBusinessGaj}
          mainLabel="Self Business(GAJ)"
        />

        {/* 5. Sky Blue: Bank Wallet Balance */}
        <DashboardCard
          cardType="wallet"
          topText={user?.walletBalance || 0}
          mainLabel="Bank Wallet Balance"
        />

        {/* 6. Orange: Total Business(GAJ) */}
        <DashboardCard
          cardType="totalBusiness"
          topText={totalBusinessGaj}
          mainLabel="Total Business(GAJ)"
        />
      </div>
    </div>
  );
}
