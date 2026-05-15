import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { token, password, name } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find and validate invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token }
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 400 });
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.invitation.delete({ where: { token } });
      return NextResponse.json({ error: "Invitation has expired" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create or Update user
    await prisma.user.upsert({
      where: { email: invitation.email },
      update: {
        name: name,
        password: hashedPassword,
        role: invitation.role,
        status: "active"
      },
      create: {
        email: invitation.email,
        name: name,
        password: hashedPassword,
        role: invitation.role,
        status: "active"
      }
    });

    // Clean up
    await prisma.invitation.delete({
      where: { token }
    });

    return NextResponse.json({ message: "User onboarded successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
