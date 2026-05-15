import { NextResponse } from "next/server";
import { transactionService } from "@/backend/services/transaction-service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const transactions = await transactionService.getAll(session.user);
    return NextResponse.json(transactions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("POST /api/transactions - Incoming Data:", data);
    const transaction = await transactionService.create(data);
    console.log("POST /api/transactions - Success:", transaction.ref);
    return NextResponse.json(transaction, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/transactions - Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
