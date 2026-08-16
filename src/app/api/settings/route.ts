import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface EmailBody {
  type: "email";
  newEmail: string;
}

interface PasswordBody {
  type: "password";
  currentPassword: string;
  newPassword: string;
}

type SettingsBody = EmailBody | PasswordBody;

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as SettingsBody;

  if (body.type === "email") {
    const { newEmail } = body;
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return Response.json({ error: "Invalid email" }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email: newEmail } });
    if (existing) return Response.json({ error: "emailInUse" }, { status: 409 });
    await prisma.user.update({
      where: { id: session.user.id },
      data: { email: newEmail },
    });
    return Response.json({ success: true });
  }

  if (body.type === "password") {
    const { currentPassword, newPassword } = body;
    if (!currentPassword || !newPassword) {
      return Response.json({ error: "Passwords required" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return Response.json({ error: "passwordTooShort" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });
    if (!user) return Response.json({ error: "Not found" }, { status: 404 });

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return Response.json({ error: "wrongPassword" }, { status: 400 });

    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: hash },
    });
    return Response.json({ success: true });
  }

  return Response.json({ error: "Invalid type" }, { status: 400 });
}
