import { NextResponse } from "next/server";
import { quotationService } from "@/backend/services/quotation-service";

export async function GET() {
  try {
    const quotations = await quotationService.getAll();
    return NextResponse.json(quotations);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const quotation = await quotationService.create(data);
    return NextResponse.json(quotation, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
