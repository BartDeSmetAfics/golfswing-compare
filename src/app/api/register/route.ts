import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { email, password, name, inviteCode } = await request.json();

  if (inviteCode !== process.env.INVITE_CODE) {
    return Response.json({ error: "Invalid invite code" }, { status: 403 });
  }

  if (!email || !password) {
    return Response.json({ error: "Email and password required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, name: name || null },
    select: { id: true, email: true, name: true },
  });

  return Response.json(user, { status: 201 });
}
