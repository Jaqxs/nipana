import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import crypto from "crypto";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  // Only admins can invite
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email, role } = await request.json();
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48); // 48 hour expiry

    const invitation = await prisma.invitation.upsert({
      where: { email },
      update: { token, expiresAt, role: role || "sales_ops" },
      create: { email, token, expiresAt, role: role || "sales_ops" }
    });

    const inviteLink = `${process.env.NEXTAUTH_URL}/join?token=${token}`;

    return NextResponse.json({ 
      message: "Invitation generated",
      inviteLink 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
