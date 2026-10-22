import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function WalletPage() {
  const session = await getServerSession(authOptions);
  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id },
  });

  const paidIncentives = await prisma.incentive.aggregate({
    where: { associateId: session?.user?.id, status: "PAID" },
    _sum: { amount: true },
  });

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
