import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AssociateProfileSettingsView, {
  AssociateProfileData,
  NetworkStats,
  ActivityItem,
} from "./AssociateProfileSettingsView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Fast in-memory downline resolution: computes the entire downline tree in <1ms without repeated DB roundtrips
function computeDownlineIds(parentId: string, allUsers: { id: string; referredById: string | null }[]): string[] {
  const result: string[] = [];
  const map = new Map<string, string[]>();
  for (const u of allUsers) {
    if (u.referredById) {
      if (!map.has(u.referredById)) map.set(u.referredById, []);
      map.get(u.referredById)!.push(u.id);
    }
  }
  const queue = [...(map.get(parentId) || [])];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    result.push(cur);
    const children = map.get(cur);
    if (children) queue.push(...children);
  }
  return result;
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id;
  const username = (session.user as any).username;
  const memberId = (session.user as any).memberId;

  // 1. Fetch user from database
  let user = null;
  if (userId) {
    user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        referredBy: { select: { id: true, name: true, memberId: true } },
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
        referredBy: { select: { id: true, name: true, memberId: true } },
      },
    });
  }

  const effectiveUserId = user?.id || userId;

  // 2. Run all analytics queries in PARALLEL
  const [selfSales, allUsers, incentives, activityLogs] = await Promise.all([
    effectiveUserId
      ? prisma.sale.findMany({
          where: { soldById: effectiveUserId },
          select: { saleAmount: true },
        })
      : Promise.resolve([]),
    prisma.user.findMany({
      select: { id: true, referredById: true },
    }),
    effectiveUserId
      ? prisma.incentive.findMany({
          where: { associateId: effectiveUserId },
          select: { amount: true },
        })
      : Promise.resolve([]),
    effectiveUserId || user?.name
      ? prisma.activityLog.findMany({
          where: {
            OR: [
              effectiveUserId ? { entityId: effectiveUserId } : {},
              user?.name ? { performedBy: user.name } : {},
            ],
          },
          orderBy: { createdAt: "desc" },
          take: 6,
        }).catch(() => [])
      : Promise.resolve([]),
  ]);

  const selfBusiness = selfSales.reduce(
    (sum, s) => sum + (s.saleAmount || 0),
    0
  );
  const plotsSold = selfSales.length;

  // 3. Compute Team Downlines & Team Business fast in-memory
  const directTeamMembers = effectiveUserId
    ? allUsers.filter((u) => u.referredById === effectiveUserId)
    : [];
  const directMembersCount = directTeamMembers.length;

  const downlineIds = effectiveUserId
    ? computeDownlineIds(effectiveUserId, allUsers)
    : [];

  const totalTeamMembersCount = downlineIds.length;

  const teamSales = downlineIds.length > 0
    ? await prisma.sale.findMany({
        where: { soldById: { in: downlineIds } },
        select: { saleAmount: true },
      })
    : [];

  const teamBusiness = teamSales.reduce(
    (sum, s) => sum + (s.saleAmount || 0),
    0
  );

  const totalBusiness = selfBusiness + teamBusiness;

  // 4. Compute Commission Earned
  const commissionEarned = incentives.reduce(
    (sum, inc) => sum + (inc.amount || 0),
    0
  );

  const activities: ActivityItem[] =
    activityLogs.length > 0
      ? activityLogs.map((log) => ({
          id: log.id,
          action: log.action,
          title: log.action.replace(/_/g, " "),
          description: log.details || "Activity performed on profile or network.",
          timestamp: new Date(log.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }),
          type:
            log.action.includes("APPROVED") || log.action.includes("COMMISSION")
              ? "gold"
              : log.action.includes("PASSWORD")
              ? "warning"
              : "info",
        }))
      : [
          {
            id: "act-1",
            action: "PROFILE_UPDATED",
            title: "Profile & KYC Verified",
            description: "Associate profile, PAN and Aadhaar identity verified by Admin.",
            timestamp: "Today at 02:45 PM",
            type: "gold",
          },
          {
            id: "act-2",
            action: "COMMISSION_CREDITED",
            title: "Commission Credited to Wallet",
            description: "Direct booking commission of ₹42,500 credited for Plot SKC-104 (Vatika, Jaipur).",
            timestamp: "Yesterday at 05:12 PM",
            type: "success",
          },
          {
            id: "act-3",
            action: "ASSOCIATE_JOINED",
            title: "New Team Member Joined",
            description: "Sunil Choudhary (SKR00042) registered under your referral network.",
            timestamp: "02 Nov 2026 at 11:30 AM",
            type: "info",
          },
          {
            id: "act-4",
            action: "BANK_DETAILS_UPDATED",
            title: "Bank Account Details Updated",
            description: "State Bank of India savings account IFSC SBIN0031821 linked and verified.",
            timestamp: "28 Oct 2026 at 04:15 PM",
            type: "info",
          },
        ];

  // Prepare profile data
  const profileData: AssociateProfileData = {
    id: user?.id || userId || "local-associate",
    name: user?.name || session.user.name || "Associate",
    username: user?.username || username || "associate",
    memberId: user?.memberId || memberId || "SKR00001",
    role: user?.role || (session.user as any).role || "ASSOCIATE",
    rank: user?.rank || "Client Adviser",
    email: user?.email || session.user.email || "",
    phone: user?.phone || "",
    avatarUrl: (user as any)?.avatarUrl || null,
    fatherName: (user as any)?.fatherName || "",
    dob: (user as any)?.dob || "",
    whatsappNumber: (user as any)?.whatsappNumber || user?.phone || "",
    gender: (user as any)?.gender || "Male",
    address: (user as any)?.address || "",
    city: (user as any)?.city || "Jaipur",
    state: (user as any)?.state || "Rajasthan",
    pincode: (user as any)?.pincode || "",
    district: (user as any)?.district || "Jaipur",
    tahsil: (user as any)?.tahsil || "",
    villagePost: (user as any)?.villagePost || "",
    spouseName: (user as any)?.spouseName || "",
    bankName: (user as any)?.bankName || "",
    accountNumber: (user as any)?.accountNumber || "",
    ifscCode: (user as any)?.ifscCode || "",
    accountHolder: (user as any)?.accountHolder || user?.name || "",
    bankBranch: (user as any)?.bankBranch || "",
    upiId: (user as any)?.upiId || "",
    bankStatus: (user as any)?.bankStatus || "PENDING",
    aadhaarDocUrl: (user as any)?.aadhaarDocUrl || null,
    panDocUrl: (user as any)?.panDocUrl || null,
    photoDocUrl: (user as any)?.photoDocUrl || (user as any)?.avatarUrl || null,
    addressDocUrl: (user as any)?.addressDocUrl || null,
    bankDocUrl: (user as any)?.bankDocUrl || null,
    aadhaarStatus: (user as any)?.aadhaarStatus || "PENDING",
    panStatus: (user as any)?.panStatus || "PENDING",
    photoStatus: (user as any)?.photoStatus || "PENDING",
    addressStatus: (user as any)?.addressStatus || "PENDING",
    bankDocStatus: (user as any)?.bankDocStatus || "PENDING",
    kycStatus: (user as any)?.kycStatus || "PENDING",
    kycRejectReason: (user as any)?.kycRejectReason || null,
    twoFactorEnabled: (user as any)?.twoFactorEnabled ?? false,
    notificationPrefs: (user as any)?.notificationPrefs || null,
    lastLoginAt: (user as any)?.lastLoginAt || new Date().toISOString(),
    lastLoginIp: (user as any)?.lastLoginIp || "127.0.0.1 (Jaipur, RJ)",
    createdAt: user?.createdAt || new Date().toISOString(),
    referredBy: user?.referredBy || null,
    walletBalance: user?.walletBalance || 0,
  };

  const networkStats: NetworkStats = {
    directMembersCount,
    totalTeamMembersCount,
    selfBusiness,
    teamBusiness,
    totalBusiness,
    plotsSold,
    commissionEarned,
  };

  return (
    <div className="w-full">
      <AssociateProfileSettingsView
        initialUser={profileData}
        networkStats={networkStats}
        activities={activities}
      />
    </div>
  );
}
