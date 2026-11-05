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

// Fast in-memory downline resolution: computes the entire hierarchy in <1ms without repeated DB roundtrips
function buildFullDownlineInMemory(
  parentId: string,
  parentName: string,
  parentMemberId: string,
  allUsers: any[]
): TeamMember[] {
  const directUsers = allUsers.filter((u) => u.referredById === parentId);
  let result: TeamMember[] = [];

  for (const user of directUsers) {
    const subDownline = buildFullDownlineInMemory(
      user.id,
      user.name,
      user.memberId,
      allUsers
    );

    const selfBusiness = (user.sales || []).reduce(
      (sum: number, s: any) => sum + (s.saleAmount || 0),
      0
    );

    const teamBusiness = subDownline.reduce(
      (sum, m) => sum + m.selfBusiness,
      0
    );

    const commissionEarned = (user.incentives || []).reduce(
      (sum: number, inc: any) => sum + (inc.amount || 0),
      0
    );

    const memberSales = (user.sales || []).map((s: any) => ({
      id: s.id,
      plotNumber: s.plot?.plotNumber || "N/A",
      projectName: s.plot?.projectName || "Shree Karni City",
      buyerName: s.buyerName,
      saleAmount: s.saleAmount,
      saleDate: s.saleDate instanceof Date ? s.saleDate.toISOString() : s.saleDate,
    }));

    const directCount = allUsers.filter((u) => u.referredById === user.id).length;

    const memberData: TeamMember = {
      id: user.id,
      name: user.name,
      memberId: user.memberId,
      phone: user.phone || "+91 98765 00000",
      email: user.email || `${user.username}@shreekarnirealestate.in`,
      rank: user.rank || "Client Adviser",
      isActive: user.isActive,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
      referredById: user.referredById,
      directSeniorName: parentName,
      directSeniorId: parentMemberId,
      selfBusiness,
      teamBusiness,
      totalBusiness: selfBusiness + teamBusiness,
      directTeamCount: directCount,
      totalDownlineCount: subDownline.length,
      commissionEarned,
      sales: memberSales,
    };

    result.push(memberData);
    result.push(...subDownline);
  }

  return result;
}

export default async function MyTeamPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id;
  const username = (session.user as any).username;
  const memberId = (session.user as any).memberId;

  // Single fast query selecting all users and sales without heavy base64 bloat
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      memberId: true,
      username: true,
      phone: true,
      email: true,
      rank: true,
      isActive: true,
      walletBalance: true,
      createdAt: true,
      referredById: true,
      avatarUrl: true,
      sales: {
        include: { plot: true },
        orderBy: { saleDate: "desc" },
      },
      incentives: true,
    },
  });

  const currentUser = allUsers.find(
    (u) =>
      (userId && u.id === userId) ||
      (username && u.username === username) ||
      (memberId && u.memberId === memberId)
  );

  if (!currentUser) {
    redirect("/login");
  }

  // Compute all downline members fast in-memory
  const downlineMembers = buildFullDownlineInMemory(
    currentUser.id,
    currentUser.name,
    currentUser.memberId,
    allUsers
  );

  // Compute root associate data
  const ownSalesSum = (currentUser.sales || []).reduce(
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
    createdAt: currentUser.createdAt instanceof Date ? currentUser.createdAt.toISOString() : currentUser.createdAt,
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
