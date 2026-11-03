import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateNextMemberId } from "@/lib/memberId";
import { generateSafeUsername } from "@/lib/username";
import { broadcastAdminEvent } from "@/lib/sse";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, username, email, phone, password, referralCode } = body;

    // Validate required fields: name, email, phone, password
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Full Name is required" }, { status: 400 });
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }
    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }
    if (!password || !password.trim()) {
      return NextResponse.json({ error: "Password is required (min 6 characters)" }, { status: 400 });
    }
    if (password.trim().length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
    }

    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    // 1. Verify phone number does not already exist
    const digitsOnly = cleanPhone.replace(/[^0-9]/g, "");
    const standard10 = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : "";
    const phoneQueries: any[] = [
      { phone: { equals: cleanPhone, mode: "insensitive" as const } },
      { phone: { equals: digitsOnly, mode: "insensitive" as const } },
    ];
    if (standard10.length === 10) {
      phoneQueries.push({ phone: { endsWith: standard10 } });
    }

    const existingPhone = await prisma.user.findFirst({
      where: { OR: phoneQueries },
      select: { id: true, memberId: true },
    });
    if (existingPhone) {
      return NextResponse.json(
        { error: `An account with this phone number already exists (${existingPhone.memberId}). Please log in or use a different phone number.` },
        { status: 400 }
      );
    }

    // 2. Verify email does not already exist
    const existingEmail = await prisma.user.findFirst({
      where: {
        email: { equals: cleanEmail, mode: "insensitive" as const },
      },
      select: { id: true, memberId: true },
    });
    if (existingEmail) {
      return NextResponse.json(
        { error: `An account with this email address already exists (${existingEmail.memberId}). Please log in or use a different email.` },
        { status: 400 }
      );
    }

    // Generate safe, guaranteed-unique username (no collision failures)
    const finalUsername = await generateSafeUsername(username, cleanName, cleanPhone, cleanEmail);

    // Resolve referredById if referralCode was supplied
    let referredById: string | null = null;
    let referrerInfo: { id: string; name: string; memberId: string } | null = null;
    if (referralCode && referralCode.trim()) {
      const referrer = await prisma.user.findFirst({
        where: {
          memberId: referralCode.trim().toUpperCase(),
        },
      });
      if (referrer) {
        referredById = referrer.id;
        referrerInfo = { id: referrer.id, name: referrer.name, memberId: referrer.memberId };
      }
    }

    // Generate guaranteed-unique member ID (e.g. SKR00005)
    const memberId = await generateNextMemberId();
    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    const newUser = await prisma.user.create({
      data: {
        name: cleanName,
        username: finalUsername,
        email: cleanEmail,
        phone: cleanPhone,
        password: hashedPassword,
        memberId,
        role: "ASSOCIATE",
        rank: "Client Adviser",
        referredById,
        walletBalance: 0,
        isActive: true,
      },
    });

    try {
      revalidatePath("/admin");
      revalidatePath("/admin/associates");
      revalidatePath("/dashboard/team/direct");
      revalidatePath("/dashboard/team/downline");
    } catch {}

    // Push SSE event to all open admin browser tabs instantly
    const userPayload = {
      id: newUser.id,
      name: newUser.name,
      username: newUser.username,
      memberId: newUser.memberId,
      phone: newUser.phone,
      email: newUser.email,
      rank: newUser.rank,
      isActive: newUser.isActive,
      walletBalance: newUser.walletBalance,
      referredBy: referrerInfo,
      _count: { referrals: 0, sales: 0 },
      createdAt: newUser.createdAt,
    };
    try {
      broadcastAdminEvent("associate_registered", userPayload);
    } catch {}

    return NextResponse.json({
      success: true,
      memberId: newUser.memberId,
      user: {
        id: newUser.id,
        name: newUser.name,
        username: newUser.username,
        memberId: newUser.memberId,
        phone: newUser.phone,
        email: newUser.email,
        rank: newUser.rank,
        isActive: newUser.isActive,
        walletBalance: newUser.walletBalance,
        referredBy: referrerInfo,
        _count: { referrals: 0, sales: 0 },
        createdAt: newUser.createdAt,
      },
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
