import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppHeader from "@/components/AppHeader";
import SwingList from "@/components/SwingList";
import { getServerLocale, getT } from "@/lib/i18n";

export default async function DashboardPage() {
  const [session, locale] = await Promise.all([auth(), getServerLocale()]);
  const t = getT(locale);

  const swings = await prisma.swing.findMany({
    where: { userId: session!.user!.id! },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, clubType: true, status: true, createdAt: true },
  });
  const swingsForClient = swings.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() }));

  return (
    <main className="min-h-screen bg-green-950/75 text-white p-6 pb-24">
      <div className="max-w-2xl mx-auto">
        <AppHeader />

        <h2 className="text-lg font-semibold mb-3 text-green-200" style={{ fontFamily: "var(--font-playfair)" }}>
          {t.yourSwings}
        </h2>

        <SwingList initialSwings={swingsForClient} />
      </div>
    </main>
  );
}
