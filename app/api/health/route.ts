import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET() {
  const reports: any = {
    status: "active",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    database: {
      status: "PENDING"
    }
  };

  try {
    // Check DB connection
    await prisma.$queryRaw`SELECT 1`;
    reports.database.status = "connected";
  } catch (error: any) {
    reports.database.status = "disconnected";
    reports.database.error = error.message;
    reports.database.code = error.code;
  }

  return NextResponse.json(reports, { 
    status: reports.database.status === "connected" ? 200 : 500 
  });
}
