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

// PATCH: Update associate details (status, rank, wallet, etc.)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, isActive, rank, walletBalance, name, phone, email, password } = body;

    if (!id) {
      return NextResponse.json({ error: "Associate ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (typeof isActive === "boolean") updateData.isActive = isActive;
    if (rank) updateData.rank = rank;
    if (typeof walletBalance === "number") updateData.walletBalance = walletBalance;
    if (name) updateData.name = name.trim();
    if (phone) updateData.phone = phone.trim();
    if (email !== undefined) updateData.email = email ? email.trim() : null;
    if (password && password.trim().length >= 6) {
      updateData.password = await bcrypt.hash(password.trim(), 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    try {
      revalidatePath("/admin");
      revalidatePath("/admin/associates");
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Associate updated successfully",
      user: { id: updated.id, memberId: updated.memberId, rank: updated.rank, isActive: updated.isActive },
    });
  } catch (error: any) {
    console.error("Admin update associate error:", error);
    return NextResponse.json({ error: "Failed to update associate" }, { status: 500 });
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
