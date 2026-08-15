import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(email: string) {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());
  return adminEmails.includes(email);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, slug } = await request.json();
  if (!name || !slug) return Response.json({ error: "name and slug required" }, { status: 400 });

  const pro = await prisma.pro.create({ data: { name, slug } });
  return Response.json(pro, { status: 201 });
}
