import { NextResponse } from "next/server";
import { notificationService } from "@/backend/services/notification-service";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await notificationService.markRead(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
