import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateNextMemberId } from "@/lib/memberId";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, username, email, phone, password, referralCode } = body;

    if (!name || !username || !phone || !password) {
      return NextResponse.json(
        { error: "Name, username, phone, and password are required" },
        { status: 400 }
      );
    }

    const normalizedUsername = username.toLowerCase().trim();

    // Check if username is already taken
    const existing = await prisma.user.findFirst({
      where: { username: normalizedUsername },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Username is already registered. Please choose another or login." },
        { status: 400 }
      );
    }

    // Resolve referredById if referralCode was supplied
    let referredById: string | null = null;
    if (referralCode && referralCode.trim()) {
      const referrer = await prisma.user.findFirst({
        where: {
          memberId: referralCode.trim().toUpperCase(),
        },
      });
      if (referrer) {
        referredById = referrer.id;
      }
    }

    // Generate unique member ID
    const memberId = await generateNextMemberId();
    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        username: normalizedUsername,
        email: email ? email.trim() : null,
        phone: phone.trim(),
        password: hashedPassword,
        memberId,
        role: "ASSOCIATE",
        rank: "Client Adviser",
        referredById,
        walletBalance: 0,
      },
    });

    return NextResponse.json({
      success: true,
      memberId: newUser.memberId,
      message: "Account created successfully! You can now log in.",
    });
  } catch (error: any) {
    console.error("Public registration error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create account. Please try again." },
      { status: 500 }
    );
  }
}
