import { getBoats } from "@/lib/api";
import { Deck } from "@/components/Deck";

export default async function Home() {
  // Load first 50 boats (API max per page)
  const boats = await getBoats(1, 50);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 overflow-hidden">
      <Deck initialBoats={boats} />
    </main>
  );
}
