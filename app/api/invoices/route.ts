import { NextResponse } from "next/server";
import { invoiceService } from "@/backend/services/invoice-service";

export async function GET() {
  try {
    const invoices = await invoiceService.getAll();
    return NextResponse.json(invoices);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const invoice = await invoiceService.create(data);
    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
