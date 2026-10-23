import { prisma } from "./prisma";

/**
 * Robustly generates the next sequential member ID (e.g. SKR00004).
 * Scans all existing IDs to find the maximum integer suffix,
 * ensuring no P2002 duplicate key collisions even after deletes.
 */
export async function generateNextMemberId(): Promise<string> {
  const users = await prisma.user.findMany({
    where: {
      memberId: {
        startsWith: "SKR",
      },
    },
    select: {
      memberId: true,
    },
  });

  let maxNum = 0;
  for (const u of users) {
    if (u.memberId === "SKRADMIN") continue;
    // Extract numerical digits from SKR00001 -> 1
    const match = u.memberId.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  let nextNum = maxNum + 1;
  let candidate = `SKR${String(nextNum).padStart(5, "0")}`;

  // Double-check against database to guarantee uniqueness
  let exists = await prisma.user.findUnique({
    where: { memberId: candidate },
  });

  while (exists) {
    nextNum++;
    candidate = `SKR${String(nextNum).padStart(5, "0")}`;
    exists = await prisma.user.findUnique({
      where: { memberId: candidate },
    });
  }

  return candidate;
}
