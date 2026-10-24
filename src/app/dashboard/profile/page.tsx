import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileEditor, { UserProfileData } from "./ProfileEditor";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id;
  const username = (session.user as any).username;
  const memberId = (session.user as any).memberId;

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

  // Fallback defaults from session if user record was not in local SQLite
  const initialUserData: UserProfileData = {
    id: user?.id || userId || "local-associate",
    name: user?.name || session.user.name || "Pushpendra singh charan",
    username: user?.username || username || "associate",
    memberId: user?.memberId || memberId || "SKR00001",
    role: user?.role || (session.user as any).role || "ASSOCIATE",
    rank: user?.rank || "Client Adviser",
    email: user?.email || session.user.email || "",
    phone: user?.phone || "",
    gender: (user as any)?.gender || "Male",
    address: (user as any)?.address || "",
    state: (user as any)?.state || "Rajasthan",
    district: (user as any)?.district || "",
    city: (user as any)?.city || "",
    pincode: (user as any)?.pincode || "",
    tahsil: (user as any)?.tahsil || "",
    villagePost: (user as any)?.villagePost || "",
    spouseName: (user as any)?.spouseName || "",
    walletBalance: user?.walletBalance || 0,
    createdAt: user?.createdAt || new Date().toISOString(),
    referredBy: user?.referredBy || null,
    bankName: (user as any)?.bankName || "",
    accountNumber: (user as any)?.accountNumber || "",
    ifscCode: (user as any)?.ifscCode || "",
    accountHolder: (user as any)?.accountHolder || "",
    upiId: (user as any)?.upiId || "",
    nomineeName: (user as any)?.nomineeName || "",
    nomineeRelation: (user as any)?.nomineeRelation || "",
    nomineePhone: (user as any)?.nomineePhone || "",
  };

  return (
    <div className="w-full max-w-5xl">
      <ProfileEditor initialUser={initialUserData} />
    </div>
  );
}
