import { prisma } from "@/lib/prisma";
import AdminNotificationsManager from "@/components/admin/AdminNotificationsManager";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function AdminNotificationsPage() {
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <AdminNotificationsManager
      initialNotifications={notifications as any}
    />
  );
}
