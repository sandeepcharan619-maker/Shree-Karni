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

export async function PUT(req: Request) {
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
      fatherName,
      dob,
      whatsappNumber,
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
      bankBranch,
      upiId,
      bankStatus,
      aadhaarDocUrl,
      panDocUrl,
      photoDocUrl,
      addressDocUrl,
      bankDocUrl,
      aadhaarStatus,
      panStatus,
      photoStatus,
      addressStatus,
      bankDocStatus,
      kycStatus,
      kycRejectReason,
      twoFactorEnabled,
      notificationPrefs,
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
        fatherName: fatherName !== undefined ? fatherName?.trim() || null : undefined,
        dob: dob !== undefined ? dob?.trim() || null : undefined,
        whatsappNumber: whatsappNumber !== undefined ? whatsappNumber?.trim() || null : undefined,
        address: address !== undefined ? address?.trim() || null : undefined,
        state: state !== undefined ? state?.trim() || null : undefined,
        district: district !== undefined ? district?.trim() || null : undefined,
        city: city !== undefined ? city?.trim() || null : undefined,
        pincode: pincode !== undefined ? pincode?.trim() || null : undefined,
        tahsil: tahsil !== undefined ? tahsil?.trim() || null : undefined,
        villagePost: villagePost !== undefined ? villagePost?.trim() || null : undefined,
        spouseName: spouseName !== undefined ? spouseName?.trim() || null : undefined,
        bankName: bankName !== undefined ? bankName?.trim() || null : undefined,
        accountNumber: accountNumber !== undefined ? accountNumber?.trim() || null : undefined,
        ifscCode: ifscCode !== undefined ? ifscCode?.trim()?.toUpperCase() || null : undefined,
        accountHolder: accountHolder !== undefined ? accountHolder?.trim() || null : undefined,
        bankBranch: bankBranch !== undefined ? bankBranch?.trim() || null : undefined,
        upiId: upiId !== undefined ? upiId?.trim() || null : undefined,
        bankStatus: bankStatus !== undefined ? bankStatus : undefined,
        aadhaarDocUrl: aadhaarDocUrl !== undefined ? aadhaarDocUrl : undefined,
        panDocUrl: panDocUrl !== undefined ? panDocUrl : undefined,
        photoDocUrl: photoDocUrl !== undefined ? photoDocUrl : undefined,
        addressDocUrl: addressDocUrl !== undefined ? addressDocUrl : undefined,
        bankDocUrl: bankDocUrl !== undefined ? bankDocUrl : undefined,
        aadhaarStatus: aadhaarStatus !== undefined ? aadhaarStatus : aadhaarDocUrl ? "PENDING" : undefined,
        panStatus: panStatus !== undefined ? panStatus : panDocUrl ? "PENDING" : undefined,
        photoStatus: photoStatus !== undefined ? photoStatus : photoDocUrl ? "PENDING" : undefined,
        addressStatus: addressStatus !== undefined ? addressStatus : addressDocUrl ? "PENDING" : undefined,
        bankDocStatus: bankDocStatus !== undefined ? bankDocStatus : bankDocUrl ? "PENDING" : undefined,
        kycStatus: kycStatus !== undefined ? kycStatus : (aadhaarDocUrl || panDocUrl || photoDocUrl || addressDocUrl || bankDocUrl) ? "PENDING" : undefined,
        kycRejectReason: kycRejectReason !== undefined ? kycRejectReason : undefined,
        twoFactorEnabled: typeof twoFactorEnabled === "boolean" ? twoFactorEnabled : undefined,
        notificationPrefs: notificationPrefs !== undefined ? (typeof notificationPrefs === "string" ? notificationPrefs : JSON.stringify(notificationPrefs)) : undefined,
        nomineeName: nomineeName !== undefined ? nomineeName?.trim() || null : undefined,
        nomineeRelation: nomineeRelation !== undefined ? nomineeRelation?.trim() || null : undefined,
        nomineePhone: nomineePhone !== undefined ? nomineePhone?.trim() || null : undefined,
      },
    });

    // Create an activity log record
    try {
      await prisma.activityLog.create({
        data: {
          action: "PROFILE_UPDATED",
          entity: "User",
          entityId: existingUser.id,
          performedBy: existingUser.name || "Associate",
          details: `Associate (${existingUser.memberId}) updated their profile and account settings.`,
        },
      });
    } catch (e) {
      console.warn("Could not write activity log:", e);
    }

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
