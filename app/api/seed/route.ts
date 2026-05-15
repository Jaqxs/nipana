import { NextResponse } from "next/server";
import { seedService } from "@/backend/services/seed-service";

export async function GET() {
  try {
    await seedService.seed();
    return NextResponse.json({ message: "Seed successful: Admin accounts created." });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
