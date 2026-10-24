import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AssociateTreeView, { AssociateNode } from "./AssociateTreeView";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getAllDownlinesRecursive(userId: string): Promise<AssociateNode[]> {
  try {
    const direct = await prisma.user.findMany({
      where: { referredById: userId },
      select: {
        id: true,
        name: true,
        username: true,
        memberId: true,
        phone: true,
        email: true,
        rank: true,
        isActive: true,
        createdAt: true,
        referredById: true,
        referredBy: {
          select: { id: true, name: true, memberId: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let all: AssociateNode[] = [...direct];
    for (const member of direct) {
      const sub = await getAllDownlinesRecursive(member.id);
      all = [...all, ...sub];
    }
    return all;
  } catch (e) {
    console.error("Downline recursive fetch error:", e);
    return [];
  }
}

export default async function AssociateTreePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id;
  const username = (session.user as any).username;
  const memberId = (session.user as any).memberId;

  let currentUser = null;
  if (userId) {
    currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        memberId: true,
        phone: true,
        email: true,
        rank: true,
        isActive: true,
        createdAt: true,
        referredById: true,
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
      select: {
        id: true,
        name: true,
        username: true,
        memberId: true,
        phone: true,
        email: true,
        rank: true,
        isActive: true,
        createdAt: true,
        referredById: true,
      },
    });
  }

  // Fallback defaults from session if user record was not in local SQLite
  const rootNode: AssociateNode = {
    id: currentUser?.id || userId || "root-user",
    name: currentUser?.name || session.user.name || "Pushpendra singh charan",
    username: currentUser?.username || username || "associate",
    memberId: currentUser?.memberId || memberId || "JLM60712",
    phone: currentUser?.phone || "",
    email: currentUser?.email || session.user.email || "",
    rank: currentUser?.rank || "Client Adviser",
    isActive: currentUser?.isActive ?? true,
    createdAt: currentUser?.createdAt || new Date().toISOString(),
    referredById: currentUser?.referredById || null,
  };

  const initialDownlines = await getAllDownlinesRecursive(rootNode.id);

  return (
    <div className="w-full max-w-5xl">
      <AssociateTreeView currentUser={rootNode} initialDownlines={initialDownlines} />
    </div>
  );
}
