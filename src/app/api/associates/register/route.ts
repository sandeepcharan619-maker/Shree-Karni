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

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        username: normalizedUsername,
        email: email ? email.trim() : null,
        phone: phone.trim(),
        password: hashedPassword,
        memberId,
        referredById: session.user.role === "ADMIN" ? null : session.user.id,
      },
    });

    return NextResponse.json({
      memberId: user.memberId,
      message: "Associate registered successfully",
    });
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json({ error: error?.message || "Registration failed" }, { status: 500 });
  }
}
