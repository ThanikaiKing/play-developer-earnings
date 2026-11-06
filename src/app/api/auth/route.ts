import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const pin = process.env.DASHBOARD_PIN;
  if (!pin || pin.trim() === "") {
    return NextResponse.json({ required: false, authenticated: true });
  }

  const cookie = request.cookies.get("playstore_auth");
  const isAuthenticated = cookie?.value === "authenticated";

  return NextResponse.json({
    required: true,
    authenticated: isAuthenticated,
  });
}

export async function POST(request: NextRequest) {
  const requiredPin = process.env.DASHBOARD_PIN;
  if (!requiredPin || requiredPin.trim() === "") {
    return NextResponse.json({ success: true, authenticated: true });
  }

  try {
    const body = await request.json();
    const userPin = (body?.pin || "").trim();

    if (userPin === requiredPin.trim()) {
      const response = NextResponse.json({ success: true, authenticated: true });
      response.cookies.set("playstore_auth", "authenticated", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      return response;
    }

    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, authenticated: false });
  response.cookies.delete("playstore_auth");
  return response;
}

