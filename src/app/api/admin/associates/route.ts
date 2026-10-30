import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateNextMemberId } from "@/lib/memberId";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

function isAdmin(session: any): boolean {
  if (!session?.user) return false;
  const role = (session.user.role || "").toUpperCase();
  const username = (session.user.username || "").toLowerCase();
  const memberId = (session.user.memberId || "").toUpperCase();
  return role === "ADMIN" || username === "admin" || memberId === "SKRADMIN";
}

// GET: List all associates
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const associates = await prisma.user.findMany({
      where: { role: "ASSOCIATE" },
      include: {
        _count: { select: { referrals: true, sales: true, leads: true, visitors: true } },
        referredBy: { select: { id: true, name: true, memberId: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(associates);
  } catch (error) {
    console.error("Admin associates GET error:", error);
    return NextResponse.json({ error: "Failed to fetch associates" }, { status: 500 });
  }
}

// POST: Admin creates a new associate
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      username,
      email,
      phone,
      password,
      rank = "Client Adviser",
      referredById = null,
      walletBalance = 0,
    } = body;

    if (!name || !username || !phone || !password) {
      return NextResponse.json(
        { error: "Full Name, Username, Phone number, and Password are required" },
        { status: 400 }
      );
    }

    const normalizedUsername = username.trim().toLowerCase();

    // Check if username is already taken
    const existingUser = await prisma.user.findFirst({
      where: {
        username: normalizedUsername,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: `Username "${username}" is already taken. Please choose another.` },
        { status: 400 }
      );
    }

    // Verify sponsor / referredBy if provided
    let verifiedReferredById: string | null = null;
    if (referredById && referredById.trim()) {
      const sponsor = await prisma.user.findUnique({
        where: { id: referredById.trim() },
      });
      if (sponsor) {
        verifiedReferredById = sponsor.id;
      }
    }

    // Generate safe, collision-free member ID
    const memberId = await generateNextMemberId();
    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        username: normalizedUsername,
        phone: phone.trim(),
        email: email ? email.trim() : null,
        password: hashedPassword,
        memberId,
        role: "ASSOCIATE",
        rank: rank || "Client Adviser",
        referredById: verifiedReferredById,
        walletBalance: typeof walletBalance === "number" ? walletBalance : parseFloat(walletBalance) || 0,
        isActive: true,
      },
    });

    try {
      revalidatePath("/admin");
      revalidatePath("/admin/associates");
      revalidatePath("/dashboard/team/direct");
      revalidatePath("/dashboard/team/downline");
    } catch {}

    return NextResponse.json({
      success: true,
      memberId: newUser.memberId,
      user: {
        id: newUser.id,
        name: newUser.name,
        username: newUser.username,
        memberId: newUser.memberId,
        rank: newUser.rank,
        phone: newUser.phone,
        email: newUser.email,
        walletBalance: newUser.walletBalance,
        isActive: newUser.isActive,
        referredBy: verifiedReferredById ? { id: verifiedReferredById } : null,
        _count: { referrals: 0, sales: 0 },
        createdAt: newUser.createdAt,
      },
      message: `Associate ${newUser.name} created successfully with Member ID: ${newUser.memberId}`,
    });
  } catch (error: any) {
    console.error("Admin create associate error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create associate" },
      { status: 500 }
    );
  }
}

// PATCH: Update associate details (status, rank, wallet, memberId, name, phone, sponsor, downline, sales, etc.)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      memberId,
      name,
      phone,
      email,
      rank,
      referredById,
      customDownline,
      customSalesGaj,
      walletBalance,
      isActive,
      password,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Associate ID is required" }, { status: 400 });
    }

    // Find target user first
    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id },
          { memberId: typeof memberId === "string" ? memberId : undefined },
        ],
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Associate not found" }, { status: 404 });
    }

    const updateData: any = {};

    // 1. Member ID
    if (memberId && typeof memberId === "string" && memberId.trim() !== "") {
      const cleanMemberId = memberId.trim().toUpperCase();
      if (cleanMemberId !== targetUser.memberId) {
        const existing = await prisma.user.findFirst({
          where: {
            memberId: cleanMemberId,
            NOT: { id: targetUser.id },
          },
        });
        if (existing) {
          return NextResponse.json(
            { error: `Member ID "${cleanMemberId}" is already taken by ${existing.name}` },
            { status: 400 }
          );
        }
        updateData.memberId = cleanMemberId;
      }
    }

    // 2. Name
    if (name && typeof name === "string") {
      updateData.name = name.trim();
    }

    // 3. Phone
    if (phone !== undefined) {
      updateData.phone = typeof phone === "string" ? phone.trim() : null;
    }

    // 4. Email
    if (email !== undefined) {
      updateData.email = email && typeof email === "string" ? email.trim() : null;
    }

    // 5. Rank
    if (rank && typeof rank === "string") {
      updateData.rank = rank;
    }

    // 6. Referred By / Sponsor
    if (referredById !== undefined) {
      if (!referredById || referredById === "" || referredById === "DIRECT" || referredById === "NONE") {
        updateData.referredById = null;
      } else {
        if (referredById === targetUser.id) {
          return NextResponse.json(
            { error: "An associate cannot be their own sponsor" },
            { status: 400 }
          );
        }
        const sponsor = await prisma.user.findUnique({
          where: { id: referredById },
        });
        if (sponsor) {
          updateData.referredById = sponsor.id;
        } else {
          updateData.referredById = null;
        }
      }
    }

    // 7. Custom Downline count override
    if (customDownline !== undefined) {
      if (customDownline === "" || customDownline === null) {
        updateData.customDownline = null;
      } else {
        const parsed = parseInt(String(customDownline), 10);
        updateData.customDownline = isNaN(parsed) ? null : Math.max(0, parsed);
      }
    }

    // 8. Custom Sales (GAJ) override
    if (customSalesGaj !== undefined) {
      if (customSalesGaj === "" || customSalesGaj === null) {
        updateData.customSalesGaj = null;
      } else {
        const parsed = parseFloat(String(customSalesGaj));
        updateData.customSalesGaj = isNaN(parsed) ? null : Math.max(0, parsed);
      }
    }

    // 9. Wallet Balance
    if (walletBalance !== undefined) {
      const parsedWallet = parseFloat(String(walletBalance));
      updateData.walletBalance = isNaN(parsedWallet) ? 0 : parsedWallet;
    }

    // 10. Status (Active / Inactive)
    if (typeof isActive === "boolean") {
      updateData.isActive = isActive;
    }

    // 11. Password reset
    if (password && typeof password === "string" && password.trim().length >= 6) {
      updateData.password = await bcrypt.hash(password.trim(), 10);
    }

    const updated = await prisma.user.update({
      where: { id: targetUser.id },
      data: updateData,
      include: {
        referredBy: { select: { id: true, name: true, memberId: true } },
        _count: { select: { referrals: true, sales: true } },
      },
    });

    try {
      revalidatePath("/admin");
      revalidatePath("/admin/associates");
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/profile");
      revalidatePath("/dashboard/incentives/wallet");
      revalidatePath("/dashboard/team/tree");
      revalidatePath("/dashboard/team/direct");
      revalidatePath("/dashboard/team/downline");
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Associate ${updated.name} (${updated.memberId}) updated successfully`,
      user: {
        id: updated.id,
        memberId: updated.memberId,
        name: updated.name,
        username: updated.username,
        phone: updated.phone,
        email: updated.email,
        rank: updated.rank,
        walletBalance: updated.walletBalance,
        customDownline: updated.customDownline,
        customSalesGaj: updated.customSalesGaj,
        isActive: updated.isActive,
        referredById: updated.referredById,
        referredBy: updated.referredBy,
        _count: updated._count,
        createdAt: updated.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Admin update associate error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update associate" },
      { status: 500 }
    );
  }
}

// DELETE: Safely remove associate and clean up relation cascades
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const id = body.id || req.nextUrl.searchParams.get("id");
    const memberId = body.memberId || req.nextUrl.searchParams.get("memberId");

    if (!id && !memberId) {
      return NextResponse.json({ error: "Associate ID or Member ID is required for deletion" }, { status: 400 });
    }

    // Find user by either id or memberId
    const target = await prisma.user.findFirst({
      where: {
        OR: [
          ...(id && !id.startsWith("local-") ? [{ id }] : []),
          ...(memberId ? [{ memberId }] : []),
        ],
      },
    });

    if (!target) {
      // If not present in DB (e.g. was local or already purged), treat as successfully deleted
      return NextResponse.json({
        success: true,
        message: "Associate removed successfully",
      });
    }

    if (target.role === "ADMIN") {
      return NextResponse.json({ error: "Cannot delete Administrator account" }, { status: 400 });
    }

    // Atomic cascade clean up using transaction
    await prisma.$transaction(async (tx) => {
      // 1. Unlink any associates who were referred by this user
      await tx.user.updateMany({
        where: { referredById: target.id },
        data: { referredById: null },
      });

      // 2. Delete incentive records
      await tx.incentive.deleteMany({
        where: { associateId: target.id },
      });

      // 3. Delete leads logged by this associate
      await tx.lead.deleteMany({
        where: { associateId: target.id },
      });

      // 4. Delete visitors logged by this associate
      await tx.visitor.deleteMany({
        where: { associateId: target.id },
      });

      // 5. Delete sales recorded under this associate
      await tx.sale.deleteMany({
        where: { soldById: target.id },
      });

      // 6. Delete the associate user account
      await tx.user.delete({
        where: { id: target.id },
      });
    });

    try {
      revalidatePath("/admin");
      revalidatePath("/admin/associates");
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Associate ${target.name} (${target.memberId}) was permanently removed.`,
    });
  } catch (error: any) {
    console.error("Admin delete associate error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete associate" },
      { status: 500 }
    );
  }
}
