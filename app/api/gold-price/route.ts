import { NextResponse } from "next/server";

// Mock live gold price service
export async function GET() {
  return NextResponse.json({
    current: 72.45,
    change: +0.82,
    timestamp: new Date().toISOString()
  });
}
