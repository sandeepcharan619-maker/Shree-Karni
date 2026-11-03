import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateNextMemberId } from "@/lib/memberId";
import { generateSafeUsername } from "@/lib/username";
import { broadcastAdminEvent } from "@/lib/sse";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, username, email, phone, password, referredById: explicitReferredById } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }
    if (!password || !password.trim()) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email && typeof email === "string" && email.trim() ? email.trim().toLowerCase() : null;

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
        { error: `An associate with this phone number already exists (${existingPhone.memberId}). Please use a different phone number.` },
        { status: 400 }
      );
    }

    // 2. Verify email does not already exist (if provided)
    if (cleanEmail) {
      const existingEmail = await prisma.user.findFirst({
        where: {
          email: { equals: cleanEmail, mode: "insensitive" as const },
        },
        select: { id: true, memberId: true },
      });
      if (existingEmail) {
        return NextResponse.json(
          { error: `An associate with this email address already exists (${existingEmail.memberId}). Please use a different email.` },
          { status: 400 }
        );
      }
    }

    // Generate safe, collision-free unique username
    const finalUsername = await generateSafeUsername(username, cleanName, cleanPhone, cleanEmail);

    // Generate guaranteed unique member ID
    const memberId = await generateNextMemberId();
    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    // Resolve and VERIFY referrer exists in database to prevent Foreign Key Constraint errors
    let verifiedReferredById: string | null = null;
    let referrerName: string | null = null;
    let referrerMemberId: string | null = null;

    if (session.user.role !== "ADMIN") {
      // 1. Check if an explicit referrer ID was passed (e.g., from Tree View)
      if (explicitReferredById && typeof explicitReferredById === "string") {
        try {
          const directParent = await prisma.user.findUnique({
            where: { id: explicitReferredById.trim() },
          });
          if (directParent) {
            verifiedReferredById = directParent.id;
            referrerName = directParent.name;
            referrerMemberId = directParent.memberId;
          }
        } catch {}
      }

      // 2. If not verified yet, look up current session user in database
      if (!verifiedReferredById) {
        const uId = (session.user as any).id;
        const uName = (session.user as any).username;
        const mId = (session.user as any).memberId;

        let referrer = null;
        if (uId && typeof uId === "string" && !uId.startsWith("master-admin") && !uId.startsWith("local-")) {
          try {
            referrer = await prisma.user.findUnique({ where: { id: uId } });
          } catch {}
        }

        if (!referrer && (uName || mId)) {
          try {
            referrer = await prisma.user.findFirst({
              where: {
                OR: [
                  uName ? { username: uName } : {},
                  mId ? { memberId: mId } : {},
                ],
              },
            });
          } catch {}
        }

        if (referrer) {
          verifiedReferredById = referrer.id;
          referrerName = referrer.name;
          referrerMemberId = referrer.memberId;
        } else {
          // If the logged-in associate doesn't have a row in SQLite DB yet,
          // safely upsert them so foreign key constraint NEVER fails
          try {
            const seedMemberId = mId || "SKR00001";
            const seedUsername = uName || "associate";
            const tempPassword = await bcrypt.hash("associate123", 10);
            const createdReferrer = await prisma.user.upsert({
              where: { username: seedUsername },
              update: {},
              create: {
                name: session.user.name || "Associate User",
                username: seedUsername,
                password: tempPassword,
                memberId: seedMemberId,
                role: "ASSOCIATE",
                rank: "Client Adviser",
              },
            });
            verifiedReferredById = createdReferrer.id;
            referrerName = createdReferrer.name;
            referrerMemberId = createdReferrer.memberId;
          } catch (e) {
            // If upsert fails for any reason, keep verifiedReferredById as null
            verifiedReferredById = null;
          }
        }
      }
    }

    // Create user with verified foreign key (or null fallback if foreign key fails)
    let user;
    try {
      user = await prisma.user.create({
        data: {
          name: cleanName,
          username: finalUsername,
          email: cleanEmail,
          phone: cleanPhone,
          password: hashedPassword,
          memberId,
          referredById: verifiedReferredById,
        },
      });
    } catch (createErr: any) {
      // If SQLite foreign key constraint failed (P2003), retry safely with null
      if (createErr.code === "P2003" || createErr.message?.includes("Foreign key")) {
        console.warn("Retrying user creation with null referredById due to FK constraint");
        user = await prisma.user.create({
          data: {
            name: cleanName,
            username: finalUsername,
            email: cleanEmail,
            phone: cleanPhone,
            password: hashedPassword,
            memberId,
            referredById: null,
          },
        });
      } else {
        throw createErr;
      }
    }

    try {
      revalidatePath("/admin");
      revalidatePath("/admin/associates");
      revalidatePath("/dashboard/team/direct");
      revalidatePath("/dashboard/team/downline");
    } catch {}

    // Push SSE event to all open admin browser tabs instantly
    try {
      broadcastAdminEvent("associate_registered", {
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
        referredById: user.referredById || verifiedReferredById,
        referredBy: referrerName
          ? { id: verifiedReferredById, name: referrerName, memberId: referrerMemberId }
          : null,
        _count: { referrals: 0, sales: 0 },
      });
    } catch {}

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
        referredById: user.referredById || verifiedReferredById,
        referredBy: referrerName
          ? { id: verifiedReferredById, name: referrerName, memberId: referrerMemberId }
          : null,
      },
      memberId: user.memberId,
      message: "Associate registered successfully",
    });
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: error?.message || "Registration failed" },
      { status: 500 }
    );
  }
}
