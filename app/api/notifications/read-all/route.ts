import { NextResponse } from "next/server";
import { notificationService } from "@/backend/services/notification-service";

export async function POST() {
  try {
    await notificationService.markAllRead();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
