import { NextResponse } from "next/server";
import { inventoryService } from "@/backend/services/inventory-service";

export async function GET() {
  try {
    const movements = await inventoryService.getMovements();
    return NextResponse.json(movements);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const movement = await inventoryService.addMovement(data);
    return NextResponse.json(movement, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
