import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { broadcastAdminEvent } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const isMinimal = url.searchParams.get("minimal") === "true";
    const includeDocs = url.searchParams.get("includeDocs") === "true";

    const userId = (session.user as any).id;
    const username = (session.user as any).username;
    const memberId = (session.user as any).memberId;

    if (isMinimal) {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            ...(userId ? [{ id: userId }] : []),
            ...(username ? [{ username }] : []),
            ...(memberId ? [{ memberId }] : []),
          ],
        },
        select: {
          id: true,
          name: true,
          memberId: true,
          avatarUrl: true,
          role: true,
        },
      });
      return NextResponse.json({ user });
    }

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
            ...(username ? [{ username }] : []),
            ...(memberId ? [{ memberId }] : []),
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

    if (!includeDocs) {
      const {
        aadhaarDocUrl,
        panDocUrl,
        photoDocUrl,
        addressDocUrl,
        bankDocUrl,
        ...lightUser
      } = safeUser;

      return NextResponse.json({
        user: {
          ...lightUser,
          hasAadhaarDoc: Boolean(aadhaarDocUrl),
          hasPanDoc: Boolean(panDocUrl),
          hasPhotoDoc: Boolean(photoDocUrl),
          hasAddressDoc: Boolean(addressDocUrl),
          hasBankDoc: Boolean(bankDocUrl),
        },
      });
    }

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

    // ─── Document Upload Notification & Activity Log ───
    const uploadedDocs: string[] = [];
    if (aadhaarDocUrl) uploadedDocs.push("Aadhaar Card");
    if (panDocUrl) uploadedDocs.push("PAN Card");
    if (photoDocUrl) uploadedDocs.push("Passport Photo");
    if (addressDocUrl) uploadedDocs.push("Address Proof");
    if (bankDocUrl) uploadedDocs.push("Bank Proof (Passbook / Cheque)");
    if (avatarUrl && !photoDocUrl && avatarUrl !== existingUser.avatarUrl) {
      uploadedDocs.push("Profile Photograph");
    }

    if (uploadedDocs.length > 0) {
      const docListStr = uploadedDocs.join(", ");
      const assocName = existingUser.name || "Associate";
      const assocMemberId = existingUser.memberId || "SKR";

      try {
        const notif = await prisma.notification.create({
          data: {
            title: `📄 KYC Document Uploaded: ${assocName} (${assocMemberId})`,
            message: `Associate ${assocName} (${assocMemberId}) has uploaded ${docListStr} for KYC verification. Please review and verify.`,
            type: "KYC",
            link: `/admin/associates?openKyc=${existingUser.id}`,
            isRead: false,
          },
        });

        // Broadcast real-time SSE push to all open admin tabs
        broadcastAdminEvent("document_uploaded", {
          associateId: existingUser.id,
          memberId: assocMemberId,
          name: assocName,
          docs: uploadedDocs,
          notificationId: notif.id,
          createdAt: notif.createdAt,
        });
        broadcastAdminEvent("notification_received", {
          id: notif.id,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          link: notif.link,
          createdAt: notif.createdAt,
        });
      } catch (notifErr) {
        console.error("Failed to create admin notification for document upload:", notifErr);
      }

      try {
        await prisma.activityLog.create({
          data: {
            action: "DOCUMENTS_UPLOADED",
            entity: "User",
            entityId: existingUser.id,
            performedBy: assocName,
            details: `Associate (${assocMemberId}) uploaded ${docListStr} for KYC verification.`,
          },
        });
      } catch (actErr) {
        console.error("Failed to create activity log for document upload:", actErr);
      }
    } else {
      // Create a general profile update activity log if not a document upload
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
