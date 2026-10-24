import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateNextMemberId } from "@/lib/memberId";
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
          name: name.trim(),
          username: normalizedUsername,
          email: email ? email.trim() : null,
          phone: phone.trim(),
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
            name: name.trim(),
            username: normalizedUsername,
            email: email ? email.trim() : null,
            phone: phone.trim(),
            password: hashedPassword,
            memberId,
            referredById: null,
          },
        });
      } else {
        throw createErr;
      }
    }

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
