import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";

export default async function DashboardPage() {
  const session = await auth();
  const swings = await prisma.swing.findMany({
    where: { userId: session!.user!.id! },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, clubType: true, status: true, createdAt: true },
  });

  return (
    <main className="min-h-screen bg-green-950 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <AppHeader />

        <Link
          href="/record"
          className="block mb-8 bg-green-600 hover:bg-green-500 text-white text-center rounded-xl py-4 font-semibold text-lg transition"
        >
          + Record new swing
        </Link>

        <h2 className="text-lg font-semibold mb-3 text-green-200" style={{ fontFamily: "var(--font-playfair)" }}>
          Your swings
        </h2>

        {swings.length === 0 ? (
          <p className="text-green-400 text-sm">
            No swings yet — record your first one above.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {swings.map((swing) => (
              <li key={swing.id}>
                <Link
                  href={`/swings/${swing.id}`}
                  className="flex items-center justify-between bg-green-900 hover:bg-green-800 rounded-xl px-5 py-4 transition"
                >
                  <span className="font-medium capitalize">
                    {swing.clubType.toLowerCase()} swing
                  </span>
                  <span className="flex items-center gap-3 text-sm text-green-300">
                    <span
                      className={
                        swing.status === "PROCESSED"
                          ? "text-green-400"
                          : swing.status === "FAILED"
                          ? "text-red-400"
                          : "text-yellow-400"
                      }
                    >
                      {swing.status.toLowerCase()}
                    </span>
                    <span>
                      {new Date(swing.createdAt).toLocaleDateString("nl-BE", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
