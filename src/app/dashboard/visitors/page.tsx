import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import VisitorManager, { VisitorItem } from "./VisitorManager";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function VisitorsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id;
  const username = (session.user as any).username;
  const memberId = (session.user as any).memberId;

  let user = null;
  if (userId && !userId.startsWith("master-admin")) {
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

  let visitors: VisitorItem[] = [];
  try {
    const dbVisitors = await prisma.visitor.findMany({
      where: user ? { associateId: user.id } : {},
      orderBy: { visitDate: "desc" },
    });

    visitors = dbVisitors.map((v) => ({
      id: v.id,
      visitorName: v.visitorName,
      phone: v.phone,
      plotInterest: v.plotInterest,
      visitDate: v.visitDate,
      feedback: v.feedback,
      status: v.status,
      createdAt: v.createdAt,
    }));
  } catch (e) {
    console.error("Visitors fetch error:", e);
  }

  return (
    <div className="w-full max-w-6xl">
      <VisitorManager initialVisitors={visitors} />
    </div>
  );
}
