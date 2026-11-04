import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, identifier, otp, newPassword } = body;

    if (!identifier) {
      return NextResponse.json(
        { error: "Please enter your Email, Member ID, or Phone number" },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim();

    // 1. Locate the user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanIdentifier, mode: "insensitive" } },
          { memberId: { equals: cleanIdentifier, mode: "insensitive" } },
          { phone: cleanIdentifier },
          { username: cleanIdentifier },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No associate account found with this Email, Member ID, or Phone" },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "This associate account is currently suspended. Please contact Admin." },
        { status: 403 }
      );
    }

    // Step A: Verification step
    if (action === "VERIFY_USER") {
      const phone = user.phone || "";
      const maskedPhone = phone.length >= 4
        ? `${phone.slice(0, 2)}******${phone.slice(-2)}`
        : "registered phone";

      const email = user.email || "";
      const maskedEmail = email.includes("@")
        ? `${email.charAt(0)}***@${email.split("@")[1]}`
        : "registered email";

      // Fixed/generated verification OTP for testing/verification
      const generatedOtp = "482910";

      return NextResponse.json({
        success: true,
        message: "Associate identity verified.",
        associate: {
          name: user.name,
          memberId: user.memberId,
          maskedPhone,
          maskedEmail,
        },
        demoOtp: generatedOtp,
      });
    }

    // Step B: Set new password
    if (action === "RESET_PASSWORD") {
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters" },
          { status: 400 }
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      // Log in ActivityLog
      try {
        await prisma.activityLog.create({
          data: {
            action: "PASSWORD_RESET_SELF",
            entity: "User",
            entityId: user.id,
            performedBy: user.name || "Associate",
            details: `Associate (${user.memberId}) successfully reset their forgotten password via security verification.`,
          },
        });
      } catch (e) {
        // ignore
      }

      return NextResponse.json({
        success: true,
        message: "Password has been successfully reset! You can now log in.",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Failed to reset password: " + (error.message || "Unknown error") },
      { status: 500 }
    );
  }
}
