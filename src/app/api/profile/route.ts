import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const username = (session.user as any).username;
    const memberId = (session.user as any).memberId;

    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          referredBy: { select: { id: true, name: true, memberId: true } },
        },
      });
    }

    if (!user && (username || memberId)) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            username ? { username } : {},
            memberId ? { memberId } : {},
          ],
        },
        include: {
          referredBy: { select: { id: true, name: true, memberId: true } },
        },
      });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return profile without password
    const { password, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch (err: any) {
    console.error("GET profile error:", err);
    return NextResponse.json(
      { error: "Failed to fetch profile: " + err.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const username = (session.user as any).username;
    const memberId = (session.user as any).memberId;

    const body = await req.json();
    const {
      name,
      phone,
      email,
      gender,
      avatarUrl,
      address,
      state,
      district,
      city,
      pincode,
      tahsil,
      villagePost,
      spouseName,
      bankName,
      accountNumber,
      ifscCode,
      accountHolder,
      upiId,
      nomineeName,
      nomineeRelation,
      nomineePhone,
    } = body;

    // Find user by ID or username/memberId
    let existingUser = null;
    if (userId) {
      existingUser = await prisma.user.findUnique({ where: { id: userId } });
    }
    if (!existingUser && (username || memberId)) {
      existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            username ? { username } : {},
            memberId ? { memberId } : {},
          ],
        },
      });
    }

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        gender: gender !== undefined ? gender : undefined,
        phone: phone !== undefined ? phone?.trim() || null : undefined,
        email: email !== undefined ? email?.trim() || null : undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl || null : undefined,
        address: address !== undefined ? address?.trim() || null : undefined,
        state: state !== undefined ? state?.trim() || null : undefined,
        district: district !== undefined ? district?.trim() || null : undefined,
        city: city !== undefined ? city?.trim() || null : undefined,
        pincode: pincode !== undefined ? pincode?.trim() || null : undefined,
        tahsil: tahsil !== undefined ? tahsil?.trim() || null : undefined,
        villagePost: villagePost !== undefined ? villagePost?.trim() || null : undefined,
        spouseName: spouseName !== undefined ? spouseName?.trim() || null : undefined,
        bankName: bankName !== undefined ? bankName?.trim() || null : undefined,
        accountNumber:
          accountNumber !== undefined ? accountNumber?.trim() || null : undefined,
        ifscCode: ifscCode !== undefined ? ifscCode?.trim()?.toUpperCase() || null : undefined,
        accountHolder:
          accountHolder !== undefined ? accountHolder?.trim() || null : undefined,
        upiId: upiId !== undefined ? upiId?.trim() || null : undefined,
        nomineeName:
          nomineeName !== undefined ? nomineeName?.trim() || null : undefined,
        nomineeRelation:
          nomineeRelation !== undefined ? nomineeRelation?.trim() || null : undefined,
        nomineePhone:
          nomineePhone !== undefined ? nomineePhone?.trim() || null : undefined,
      },
    });

    const { password, ...safeUser } = updated;
    return NextResponse.json({
      success: true,
      message: "Profile updated successfully!",
      user: safeUser,
    });
  } catch (err: any) {
    console.error("PUT profile error:", err);
    return NextResponse.json(
      { error: "Failed to update profile: " + err.message },
      { status: 500 }
    );
  }
}
