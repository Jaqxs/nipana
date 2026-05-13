import { NextResponse } from "next/server";
import { contactService } from "@/backend/services/contact-service";

export async function GET() {
  try {
    const contacts = await contactService.getAll();
    return NextResponse.json(contacts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const contact = await contactService.create(data);
    return NextResponse.json(contact, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
