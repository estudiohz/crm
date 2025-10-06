import { NextResponse } from "next/server";

export async function GET(request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.FB_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(request) {
  const body = await request.json();
  console.log("Lead recibido:", body);
  // ⚠️ Aquí debes guardar el lead en BD asociado al userId correcto
  return NextResponse.json({ success: true });
}