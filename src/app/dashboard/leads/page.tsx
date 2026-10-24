import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LeadManager, { LeadItem } from "./LeadManager";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LeadsPage() {
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

  let leads: LeadItem[] = [];
  try {
    const dbLeads = await prisma.lead.findMany({
      where: user ? { associateId: user.id } : {},
      orderBy: { createdAt: "desc" },
    });

    leads = dbLeads.map((l) => ({
      id: l.id,
      name: l.name,
      phone: l.phone,
      email: l.email,
      source: l.source,
      plotInterest: l.plotInterest,
      notes: l.notes,
      status: l.status,
      createdAt: l.createdAt,
    }));
  } catch (e) {
    console.error("Leads fetch error:", e);
  }

  return (
    <div className="w-full max-w-6xl">
      <LeadManager initialLeads={leads} />
    </div>
  );
}
