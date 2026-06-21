import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Missing ID parameter" }, { status: 400 });
    }

    if (id.startsWith("pending-")) {
      const inviteId = id.replace("pending-", "");
      await prisma.invitation.delete({
        where: { id: inviteId }
      });
    } else {
      await prisma.user.delete({
        where: { id }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
