import { NextResponse } from "next/server";
import { cashflowService } from "@/backend/services/cashflow-service";

export async function GET() {
  try {
    const entries = await cashflowService.getAll();
    return NextResponse.json(entries);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const entry = await cashflowService.create(data);
    return NextResponse.json(entry, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
