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
    console.log("POST /api/quotations - Incoming Data:", data);
    const quotation = await quotationService.create(data);
    console.log("POST /api/quotations - Success:", quotation.no);
    return NextResponse.json(quotation, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/quotations - Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
