import Link from "next/link";
import Navbar from "@/components/Navbar";
import { serverApiGet } from "@/lib/serverApi";

type Deal = { id: string; slug?: string | null; title: string; description?: string | null; discountText: string; imageUrl?: string | null; business: { name: string; bannerUrl?: string | null; logoUrl?: string | null } };

async function loadDeals(): Promise<Deal[]> {
  try {
    const response = await serverApiGet<{ deals?: Deal[] }>("/deals?limit=100");
    return Array.isArray(response.deals) ? response.deals : [];
  } catch {
    return [];
  }
}

export default async function DealsPage() {
  const deals = await loadDeals();
  return <div className="min-h-screen bg-background"><Navbar /><main className="mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 lg:px-8"><h1 className="text-3xl font-bold text-heading sm:text-4xl">Deals &amp; Promotions</h1><p className="mt-2 text-foreground/70">Special offers from businesses in your community.</p>{deals.length ? <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{deals.map((deal) => { const image = deal.imageUrl || deal.business.bannerUrl || deal.business.logoUrl; return <article key={deal.id} className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">{image && <img src={image} alt="" className="h-44 w-full object-cover" />}<div className="p-5"><span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-bold text-primary">{deal.discountText}</span><h2 className="mt-3 text-lg font-bold text-heading">{deal.title}</h2><p className="mt-1 text-sm font-medium text-foreground/60">{deal.business.name}</p>{deal.description && <p className="mt-3 line-clamp-2 text-sm text-foreground/70">{deal.description}</p>}<Link href={`/deals/${deal.slug || deal.id}`} className="mt-4 inline-flex font-bold text-primary hover:underline">View deal</Link></div></article>; })}</div> : <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-foreground/70">No active deals are available right now.</div>}</main></div>;
}
