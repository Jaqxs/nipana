import { NextResponse } from "next/server";
import { notificationService } from "@/backend/services/notification-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const list = await notificationService.getAll();
    return NextResponse.json(list);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
