import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import MyTeamDashboardView, {
  TeamMember,
  RootAssociate,
} from "./MyTeamDashboardView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Helper to recursively fetch downline members and their sales/incentives
async function getFullDownlineRecursive(
  parentId: string,
  parentName: string,
  parentMemberId: string
): Promise<TeamMember[]> {
  try {
    const directUsers = await prisma.user.findMany({
      where: { referredById: parentId },
      include: {
        sales: {
          include: { plot: true },
          orderBy: { saleDate: "desc" },
        },
        incentives: true,
      },
      orderBy: { createdAt: "desc" },
    });

    let result: TeamMember[] = [];

    for (const user of directUsers) {
      // Fetch sub-downline recursively
      const subDownline = await getFullDownlineRecursive(
        user.id,
        user.name,
        user.memberId
      );

      const selfBusiness = user.sales.reduce(
        (sum, s) => sum + (s.saleAmount || 0),
        0
      );

      const teamBusiness = subDownline.reduce(
        (sum, m) => sum + m.selfBusiness,
        0
      );

      const commissionEarned = user.incentives.reduce(
        (sum, inc) => sum + (inc.amount || 0),
        0
      );

      const memberSales = user.sales.map((s) => ({
        id: s.id,
        plotNumber: s.plot?.plotNumber || "N/A",
        projectName: s.plot?.projectName || "Shree Karni City",
        buyerName: s.buyerName,
        saleAmount: s.saleAmount,
        saleDate: s.saleDate.toISOString(),
      }));

      const memberData: TeamMember = {
        id: user.id,
        name: user.name,
        memberId: user.memberId,
        phone: user.phone || "+91 98765 00000",
        email: user.email || `${user.username}@shreekarnirealestate.in`,
        rank: user.rank || "Client Adviser",
        isActive: user.isActive,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt.toISOString(),
        referredById: user.referredById,
        directSeniorName: parentName,
        directSeniorId: parentMemberId,
        selfBusiness,
        teamBusiness,
        totalBusiness: selfBusiness + teamBusiness,
        directTeamCount: directUsers.length,
        totalDownlineCount: subDownline.length,
        commissionEarned,
        sales: memberSales,
      };

      result.push(memberData);
      result.push(...subDownline);
    }

    return result;
  } catch (error) {
    console.error("Downline fetch error:", error);
    return [];
  }
}

export default async function MyTeamPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id;
  const username = (session.user as any).username;
  const memberId = (session.user as any).memberId;

  // 1. Fetch current logged-in associate
  let currentUser = null;
  if (userId) {
    currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sales: { include: { plot: true } },
        incentives: true,
      },
    });
  }

  if (!currentUser && (username || memberId)) {
    currentUser = await prisma.user.findFirst({
      where: {
        OR: [
          username ? { username } : {},
          memberId ? { memberId } : {},
        ],
      },
      include: {
        sales: { include: { plot: true } },
        incentives: true,
      },
    });
  }

  if (!currentUser) {
    redirect("/login");
  }

  // 2. Fetch all downline members recursively from PostgreSQL database
  const downlineMembers = await getFullDownlineRecursive(
    currentUser.id,
    currentUser.name,
    currentUser.memberId
  );

  // 3. Compute root associate data
  const ownSalesSum = currentUser.sales.reduce(
    (sum, s) => sum + (s.saleAmount || 0),
    0
  );

  const totalDownlineBusiness = downlineMembers.reduce(
    (sum, m) => sum + m.selfBusiness,
    0
  );

  const totalTeamCommission = downlineMembers.reduce(
    (sum, m) => sum + m.commissionEarned,
    0
  );

  const directTeamMembersCount = downlineMembers.filter(
    (m) => m.referredById === currentUser.id
  ).length;

  const rootAssociate: RootAssociate = {
    id: currentUser.id,
    name: currentUser.name,
    memberId: currentUser.memberId,
    rank: currentUser.rank || "Client Adviser",
    avatarUrl: currentUser.avatarUrl,
    phone: currentUser.phone || "No phone linked",
    email: currentUser.email || "No email linked",
    createdAt: currentUser.createdAt.toISOString(),
    selfBusiness: ownSalesSum,
    teamBusiness: totalDownlineBusiness,
    totalBusiness: ownSalesSum + totalDownlineBusiness,
    directTeamCount: directTeamMembersCount,
    totalTeamMembers: downlineMembers.length,
    totalTeamCommission: totalTeamCommission,
  };

  return (
    <MyTeamDashboardView
      rootAssociate={rootAssociate}
      allTeamMembers={downlineMembers}
    />
  );
}
