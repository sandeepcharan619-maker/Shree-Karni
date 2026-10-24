import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateNextMemberId } from "@/lib/memberId";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, username, email, phone, password } = body;

    if (!name || !username || !phone || !password) {
      return NextResponse.json(
        { error: "Name, username, phone and password are required" },
        { status: 400 }
      );
    }

    // Check if username exists
    const normalizedUsername = username.toLowerCase().trim();
    const existing = await prisma.user.findFirst({
      where: { username: normalizedUsername },
    });
    if (existing) {
      return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    }

    // Generate guaranteed unique member ID
    const memberId = await generateNextMemberId();
    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    // Resolve referrer for associates
    let referrerId: string | null = null;
    let referrerName: string | null = null;
    let referrerMemberId: string | null = null;

    if (session.user.role !== "ADMIN") {
      const uId = (session.user as any).id;
      const uName = (session.user as any).username;
      const mId = (session.user as any).memberId;

      let referrer = null;
      if (uId) {
        referrer = await prisma.user.findUnique({ where: { id: uId } });
      }
      if (!referrer && (uName || mId)) {
        referrer = await prisma.user.findFirst({
          where: {
            OR: [
              uName ? { username: uName } : {},
              mId ? { memberId: mId } : {},
            ],
          },
        });
      }

      if (referrer) {
        referrerId = referrer.id;
        referrerName = referrer.name;
        referrerMemberId = referrer.memberId;
      } else {
        referrerId = uId || null;
      }
    }

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        username: normalizedUsername,
        email: email ? email.trim() : null,
        phone: phone.trim(),
        password: hashedPassword,
        memberId,
        referredById: referrerId,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        memberId: user.memberId,
        phone: user.phone,
        email: user.email,
        rank: user.rank,
        role: user.role,
        isActive: user.isActive,
        walletBalance: user.walletBalance,
        createdAt: user.createdAt,
        referredById: user.referredById,
        referredBy: referrerName
          ? { id: referrerId, name: referrerName, memberId: referrerMemberId }
          : null,
      },
      memberId: user.memberId,
      message: "Associate registered successfully",
    });
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json({ error: error?.message || "Registration failed" }, { status: 500 });
  }
}
