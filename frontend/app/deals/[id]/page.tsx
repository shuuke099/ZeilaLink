import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { serverApiGet } from "@/lib/serverApi";

type Deal = { id: string; title: string; description?: string | null; discountText: string; promoCode?: string | null; imageUrl?: string | null; business: { slug?: string | null; id: string; name: string; bannerUrl?: string | null } };

export default async function DealPage({ params }: { params: { id: string } }) {
  let deal: Deal | null = null;
  try { const response = await serverApiGet<{ deal?: Deal }>(`/deals/${encodeURIComponent(params.id)}`); deal = response.deal || null; } catch { notFound(); }
  if (!deal) notFound();
  const image = deal.imageUrl || deal.business.bannerUrl;
  return <div className="min-h-screen bg-background"><Navbar /><main className="mx-auto max-w-4xl px-4 pb-20 pt-28 sm:px-6"><Link href="/deals" className="text-sm font-bold text-primary hover:underline">← All deals</Link><article className="mt-5 overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">{image && <img src={image} alt="" className="max-h-96 w-full object-cover" />}<div className="p-6 sm:p-9"><span className="rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary">{deal.discountText}</span><h1 className="mt-5 text-3xl font-bold text-heading sm:text-4xl">{deal.title}</h1><p className="mt-2 font-semibold text-foreground/65">Offered by {deal.business.name}</p>{deal.description && <p className="mt-6 whitespace-pre-line leading-relaxed text-foreground/75">{deal.description}</p>}{deal.promoCode && <div className="mt-6 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4"><span className="text-sm text-foreground/65">Promo code: </span><strong className="text-primary">{deal.promoCode}</strong></div>}<Link href={`/businesses/${deal.business.slug || deal.business.id}`} className="mt-7 inline-flex rounded-xl bg-primary px-6 py-3 font-bold text-white">View business</Link></div></article></main></div>;
}
