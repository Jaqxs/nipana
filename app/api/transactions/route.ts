import { NextResponse } from "next/server";
import { transactionService } from "@/backend/services/transaction-service";

export async function GET() {
  try {
    const transactions = await transactionService.getAll();
    return NextResponse.json(transactions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const transaction = await transactionService.create(data);
    return NextResponse.json(transaction, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
