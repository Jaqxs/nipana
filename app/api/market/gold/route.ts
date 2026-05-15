import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Using a reliable public gold price API
    const response = await fetch("https://api.gold-api.com/price/XAU", {
      next: { revalidate: 300 } // Cache for 5 minutes
    });
    
    if (!response.ok) throw new Error("Failed to fetch market data");
    
    const data = await response.json();
    
    // Convert from Ounce (typical API unit) to Gram if needed
    // XAU is usually per ounce (31.1035g)
    const pricePerOunce = data.price;
    const pricePerGram = pricePerOunce / 31.1035;

    return NextResponse.json({
      current: pricePerGram,
      delta: data.change || 0,
      asOf: new Date().toLocaleTimeString(),
      source: "Global Market Data"
    });
  } catch (error) {
    console.error("Gold Price Error:", error);
    return NextResponse.json({ error: "Market data unavailable" }, { status: 500 });
  }
}
