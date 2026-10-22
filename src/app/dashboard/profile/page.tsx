import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    include: {
      referredBy: { select: { name: true, memberId: true } },
    },
  });

  const fields = [
    { label: "Member ID", value: user?.memberId },
    { label: "Full Name", value: user?.name },
    { label: "Username", value: user?.username },
    { label: "Email", value: user?.email || "Not provided" },
    { label: "Phone", value: user?.phone || "Not provided" },
    { label: "Rank", value: user?.rank },
    { label: "Referred By", value: user?.referredBy ? `${user.referredBy.name} (${user.referredBy.memberId})` : "Direct / Self" },
    { label: "Wallet Balance", value: `₹${(user?.walletBalance || 0).toLocaleString()}` },
    { label: "Joined On", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN") : "N/A" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h1>
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b">
          <div className="w-16 h-16 rounded-full bg-yellow-400 flex items-center justify-center text-white font-bold text-2xl">
            {user?.name?.charAt(0) || "U"}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{user?.name}</h2>
            <p className="text-sm text-gray-500">{user?.rank} • {user?.memberId}</p>
          </div>
        </div>
        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.label} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
              <span className="text-sm font-medium text-gray-500 sm:w-40 shrink-0">{field.label}</span>
              <span className="text-sm text-gray-800">{field.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
