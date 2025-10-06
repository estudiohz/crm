import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request) {
  const url = new URL(request.url);
  const formId = url.searchParams.get("form_id");
  const userId = url.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  const connection = await prisma.facebookConnection.findUnique({ where: { userId } });
  if (!connection || !connection.accessToken || !formId) return NextResponse.json({ error: "Datos insuficientes" }, { status: 400 });

  const res = await fetch(`https://graph.facebook.com/v18.0/${formId}/leads?access_token=${connection.accessToken}`);
  const data = await res.json();

  return NextResponse.json(data);
}