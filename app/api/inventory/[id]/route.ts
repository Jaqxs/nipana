import { NextResponse } from "next/server";
import { inventoryService } from "@/backend/services/inventory-service";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const batch = await inventoryService.update(params.id, data);
    return NextResponse.json(batch);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
