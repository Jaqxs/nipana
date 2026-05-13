import { NextResponse } from "next/server";
import { siteService } from "@/backend/services/site-service";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const site = await siteService.update(params.id, data);
    return NextResponse.json(site);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
