import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "../../../../components/common/Card";
import { Navbar } from "../../../../components/navigation/Navbar";
import { Footer } from "../../../../components/navigation/Footer";

export const metadata = {
  title: "Seat Selection | Smart Transit Faisalabad",
};

export default async function SeatSelectionRoute({ params }) {
  const { id } = await params;
  return <div className="min-h-screen bg-[var(--background)]"><Navbar /><main className="mx-auto grid min-h-[60vh] max-w-3xl place-items-center px-4 py-16 sm:px-6"><Card className="w-full max-w-lg p-8 text-center"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">Next step</p><h1 className="mt-2 text-2xl font-bold text-[var(--foreground)]">Seat selection is next</h1><p className="mt-2 text-sm leading-6 text-[var(--muted)]">The seat selection experience for bus {id} will be added next.</p><Link href="/booking" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-sm font-semibold text-white"><ArrowLeft size={16} /> Back to booking</Link></Card></main><Footer /></div>;
}
