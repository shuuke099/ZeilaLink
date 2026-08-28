'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, Eye, MapPin, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react';
import AdminDashboardPage from '@/components/admin/AdminDashboardPage';
import api from '@/lib/api';

type Business = { id: string; slug: string; name: string; category: string; address: string; city: string; published: boolean; featured: boolean; logoUrl?: string | null; createdAt: string };

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const load = async () => { try { setLoading(true); const { data } = await api.get('/admin/businesses'); setBusinesses(data.businesses || []); } catch (err:any) { setError(err?.response?.data?.error || 'Failed to load businesses'); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const filtered = useMemo(() => { const value=query.trim().toLowerCase(); return value ? businesses.filter((item)=>[item.name,item.category,item.city,item.address].some((field)=>field?.toLowerCase().includes(value))) : businesses; }, [businesses,query]);
  const remove = async (business: Business) => { if (!confirm(`Delete ${business.name}? This cannot be undone.`)) return; try { await api.delete(`/admin/businesses/${business.id}`); setBusinesses((items)=>items.filter((item)=>item.id!==business.id)); } catch (err:any) { setError(err?.response?.data?.error || 'Failed to delete business'); } };

  return <AdminDashboardPage title="Businesses" description="Manage businesses shown in the public directory.">
    <div className="-mt-6 h-[calc(100vh-190px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-xl font-black text-slate-900">Business Management</h1><p className="mt-1 text-sm text-slate-500">{businesses.length} {businesses.length===1?'business':'businesses'} in the directory</p></div>
        <div className="flex items-center gap-3"><label className="relative hidden sm:block"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search businesses" className="h-10 w-56 rounded-lg border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-primary"/></label><Link href="/admin/businesses/new" className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-blue-700"><Plus size={18}/>New</Link></div>
      </div>
      {error && <div className="m-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>}
      <div className="overflow-auto" style={{maxHeight:'calc(100% - 82px)'}}>
        <table className="min-w-full border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4">Business</th><th className="px-5 py-4">Category</th><th className="px-5 py-4">Location</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Added</th><th className="px-5 py-4 text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan={6} className="px-5 py-16 text-center text-slate-500">Loading businesses...</td></tr> : filtered.length===0 ? <tr><td colSpan={6} className="px-5 py-16 text-center"><Building2 size={36} className="mx-auto text-slate-300"/><p className="mt-3 font-bold text-slate-700">{query?'No businesses match your search':'No businesses have been added yet'}</p>{!query&&<Link href="/admin/businesses/new" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white"><Plus size={17}/>Add first business</Link>}</td></tr> : filtered.map((business)=><tr key={business.id} className="group hover:bg-blue-50/40">
              <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">{business.logoUrl?<img src={business.logoUrl} alt="" className="h-full w-full object-contain p-1"/>:<Building2 size={20} className="text-blue-600"/>}</div><div className="min-w-0"><div className="flex items-center gap-2"><span className="truncate font-bold text-slate-900">{business.name}</span>{business.featured&&<Star size={14} className="fill-amber-400 text-amber-400"/>}</div><span className="text-xs text-slate-400">ID: {business.id.slice(0,8)}</span></div></div></td>
              <td className="px-5 py-4"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{business.category}</span></td>
              <td className="px-5 py-4"><div className="flex max-w-xs items-start gap-2 text-sm text-slate-600"><MapPin size={15} className="mt-0.5 shrink-0 text-slate-400"/><span className="line-clamp-2">{business.address}, {business.city}</span></div></td>
              <td className="px-5 py-4"><span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${business.published?'bg-emerald-50 text-emerald-700':'bg-slate-100 text-slate-600'}`}><span className={`h-1.5 w-1.5 rounded-full ${business.published?'bg-emerald-500':'bg-slate-400'}`}/>{business.published?'Published':'Draft'}</span></td>
              <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">{new Intl.DateTimeFormat('en',{dateStyle:'medium'}).format(new Date(business.createdAt))}</td>
              <td className="px-5 py-4"><div className="flex justify-end gap-1"><Link href={`/businesses/${business.slug}`} target="_blank" title="View" className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-blue-600"><Eye size={17}/></Link><Link href={`/admin/businesses/${business.id}/edit`} title="Edit" className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-blue-600"><Pencil size={17}/></Link><button onClick={()=>remove(business)} title="Delete" className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-rose-600"><Trash2 size={17}/></button></div></td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>
  </AdminDashboardPage>;
}
