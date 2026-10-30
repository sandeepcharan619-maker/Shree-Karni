import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WalletPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const username = session?.user?.username;
  const memberId = (session?.user as any)?.memberId;

  let user = null;
  if (userId) {
    user = await prisma.user.findUnique({ where: { id: userId } });
  }
  if (!user && (username || memberId)) {
    user = await prisma.user.findFirst({
      where: {
        OR: [
          username ? { username } : {},
          memberId ? { memberId } : {},
        ],
      },
    });
  }

  const effectiveUserId = user?.id || userId;

  const paidIncentives = effectiveUserId
    ? await prisma.incentive.aggregate({
        where: { associateId: effectiveUserId, status: "PAID" },
        _sum: { amount: true },
      })
    : { _sum: { amount: 0 } };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Wallet</h1>
      <div className="max-w-md">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-8 text-white shadow-lg">
          <p className="text-sm opacity-80 mb-1">Current Balance</p>
          <p className="text-4xl font-bold mb-4">₹{(user?.walletBalance || 0).toLocaleString()}</p>
          <div className="border-t border-white/20 pt-4 mt-4">
            <div className="flex justify-between text-sm">
              <span className="opacity-80">Total Earned</span>
              <span className="font-medium">₹{(paidIncentives._sum.amount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="opacity-80">Member ID</span>
              <span className="font-medium">{user?.memberId}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
