import { NextResponse } from "next/server";
import { inventoryService } from "@/backend/services/inventory-service";

export async function GET() {
  try {
    const batches = await inventoryService.getAll();
    return NextResponse.json(batches);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const batch = await inventoryService.create(data);
    return NextResponse.json(batch, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
