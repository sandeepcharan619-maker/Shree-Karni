import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { broadcastAdminEvent } from "@/lib/sse";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const associateId = searchParams.get("associateId");

    if (!associateId) {
      return NextResponse.json({ error: "Associate ID is required" }, { status: 400 });
    }

    const associate = await prisma.user.findUnique({
      where: { id: associateId },
      select: {
        id: true,
        name: true,
        memberId: true,
        phone: true,
        email: true,
        avatarUrl: true,
        rank: true,
        createdAt: true,
        aadhaarDocUrl: true,
        panDocUrl: true,
        photoDocUrl: true,
        addressDocUrl: true,
        bankDocUrl: true,
        aadhaarStatus: true,
        panStatus: true,
        photoStatus: true,
        addressStatus: true,
        bankDocStatus: true,
        kycStatus: true,
        bankStatus: true,
        kycRejectReason: true,
      },
    });

    if (!associate) {
      return NextResponse.json({ error: "Associate not found" }, { status: 404 });
    }

    return NextResponse.json({ associate });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch KYC details" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { associateId, docType, action, reason } = body;
    // action: "APPROVE" | "REJECT" | "PENDING"
    // docType: "aadhaar" | "pan" | "photo" | "address" | "bank" | "all"

    if (!associateId || !docType || !action) {
      return NextResponse.json(
        { error: "associateId, docType, and action are required" },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({ where: { id: associateId } });
    if (!targetUser) {
      return NextResponse.json({ error: "Associate not found" }, { status: 404 });
    }

    const statusValue = action === "APPROVE" ? "APPROVED" : action === "REJECT" ? "REJECTED" : "PENDING";
    const updateData: any = {};

    if (docType === "all") {
      updateData.aadhaarStatus = statusValue;
      updateData.panStatus = statusValue;
      updateData.photoStatus = statusValue;
      updateData.addressStatus = statusValue;
      updateData.bankDocStatus = statusValue;
      updateData.kycStatus = statusValue;
      updateData.bankStatus = statusValue;
      if (action === "REJECT") {
        updateData.kycRejectReason = reason || "Documents rejected by admin.";
      } else {
        updateData.kycRejectReason = null;
      }
    } else {
      switch (docType) {
        case "aadhaar":
          updateData.aadhaarStatus = statusValue;
          break;
        case "pan":
          updateData.panStatus = statusValue;
          break;
        case "photo":
          updateData.photoStatus = statusValue;
          break;
        case "address":
          updateData.addressStatus = statusValue;
          break;
        case "bank":
          updateData.bankDocStatus = statusValue;
          updateData.bankStatus = statusValue;
          break;
      }

      // Check if all 5 are approved after this update
      const currentAadhaar = docType === "aadhaar" ? statusValue : targetUser.aadhaarStatus;
      const currentPan = docType === "pan" ? statusValue : targetUser.panStatus;
      const currentPhoto = docType === "photo" ? statusValue : targetUser.photoStatus;
      const currentAddress = docType === "address" ? statusValue : targetUser.addressStatus;
      const currentBank = docType === "bank" ? statusValue : targetUser.bankDocStatus;

      if (
        currentAadhaar === "APPROVED" &&
        currentPan === "APPROVED" &&
        currentPhoto === "APPROVED" &&
        currentAddress === "APPROVED" &&
        currentBank === "APPROVED"
      ) {
        updateData.kycStatus = "APPROVED";
        updateData.bankStatus = "APPROVED";
        updateData.kycRejectReason = null;
      } else if (action === "REJECT") {
        updateData.kycStatus = "REJECTED";
        updateData.kycRejectReason = reason || `Document (${docType}) rejected by admin.`;
      } else {
        updateData.kycStatus = "PENDING";
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: associateId },
      data: updateData,
    });

    // Write Activity Log
    try {
      await prisma.activityLog.create({
        data: {
          action: action === "APPROVE" ? "KYC_APPROVED" : "KYC_REJECTED",
          entity: "User",
          entityId: associateId,
          performedBy: session.user.name || "Admin",
          details: `Admin ${action.toLowerCase()}d KYC (${docType}) for associate ${targetUser.name} (${targetUser.memberId}).`,
        },
      });
    } catch {}

    // Broadcast SSE update
    try {
      broadcastAdminEvent("associate_updated", {
        id: updatedUser.id,
        memberId: updatedUser.memberId,
        kycStatus: updatedUser.kycStatus,
      });
    } catch {}

    try {
      revalidatePath("/admin/associates");
      revalidatePath("/dashboard/profile");
    } catch {}

    return NextResponse.json({
      success: true,
      message: `KYC document(s) successfully ${action.toLowerCase()}d`,
      associate: updatedUser,
    });
  } catch (error: any) {
    console.error("KYC admin action error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update KYC status" },
      { status: 500 }
    );
  }
}
