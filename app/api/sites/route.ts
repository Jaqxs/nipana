import { NextResponse } from "next/server";
import { siteService } from "@/backend/services/site-service";

export async function GET() {
  try {
    const sites = await siteService.getAll();
    return NextResponse.json(sites);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const site = await siteService.create(data);
    return NextResponse.json(site, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
