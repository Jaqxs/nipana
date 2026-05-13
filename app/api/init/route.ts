import { NextResponse } from "next/server";
import { seedService } from "@/backend/services/seed-service";

export async function POST() {
  try {
    const result = await seedService.seed();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
