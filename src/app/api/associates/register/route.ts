import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    }

    // Generate unique member ID
    const count = await prisma.user.count({ where: { role: "ASSOCIATE" } });
    const memberId = `SKR${String(count + 1).padStart(5, "0")}`;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        username,
        email: email || null,
        phone,
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
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
