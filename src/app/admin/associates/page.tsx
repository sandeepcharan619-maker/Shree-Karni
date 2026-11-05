import { prisma } from "@/lib/prisma";
import AssociatesManager from "@/components/AssociatesManager";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function AdminAssociatesPage() {
  const associates = await prisma.user.findMany({
    where: {
      NOT: {
        OR: [
          { role: "ADMIN" },
          { username: "admin" },
          { memberId: "SKRADMIN" },
        ],
      },
    },
    select: {
      id: true,
      name: true,
      username: true,
      memberId: true,
      phone: true,
      email: true,
      role: true,
      rank: true,
      walletBalance: true,
      customDownline: true,
      customSalesGaj: true,
      isActive: true,
      createdAt: true,
      avatarUrl: true,
      referredById: true,
      referredBy: { select: { id: true, name: true, memberId: true } },
      _count: { select: { referrals: true, sales: true } },
      aadhaarStatus: true,
      panStatus: true,
      photoStatus: true,
      addressStatus: true,
      bankDocStatus: true,
      kycStatus: true,
      kycRejectReason: true,
      // Note: Heavy base64 document URLs (aadhaarDocUrl, panDocUrl, etc.) are intentionally omitted
      // here to keep page size tiny (<20KB instead of 14MB). They are fetched on demand when opening KYC modal.
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <AssociatesManager
        initialAssociates={associates}
        title="All Associates Network"
        subtitle="Manage sales team members, view downlines, update rank tiers, and remove records"
      />
    </div>
  );
}
