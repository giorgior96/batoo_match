import { getBoats } from "@/lib/api";
import { Deck } from "@/components/Deck";

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Load first 50 boats (API max per page)
  // Force "Exploration Mode" defaults for SSR: <= 15m and Random Order
  const boats = await getBoats(1, 50, { lengthTo: '15', orderBy: 'Random' });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 overflow-hidden">
      <Deck initialBoats={boats} />
    </main>
  );
}
