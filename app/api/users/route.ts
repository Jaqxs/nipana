import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";

export async function POST(request: Request) {
  try {
    // 1. Check if requester is an admin (Optional but recommended)
    // const session = await getServerSession();
    // if (!session || (session.user as any).role !== "admin") {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { email, name, password, role } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        password: hashedPassword,
        role: role || "sales_ops",
      }
    });

    return NextResponse.json({ 
      id: user.id, 
      email: user.email, 
      name: user.name, 
      role: user.role 
    }, { status: 201 });

  } catch (error: any) {
    console.error("User Creation Error:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
