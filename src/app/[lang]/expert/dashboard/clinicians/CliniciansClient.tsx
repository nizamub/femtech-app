"use client";
import { useState, useCallback } from "react";
import type { Locale } from "@/dictionaries";
import { Hospital, Phone, MapPin, X, CheckCircle2, Search, Plus, Edit2, Trash2 } from "lucide-react";

type Clinician = { id: string; name: string; specialty?: string | null; website?: string | null; address?: string | null; lat?: number | null; lng?: number | null; phone?: string | null; email?: string | null; verified: boolean; };

const EMPTY: Omit<Clinician, "id"> = { name: "", specialty: "", website: "", address: "", lat: null, lng: null, phone: "", email: "", verified: true };

export default function CliniciansClient({ initialClinicians, lang }: { initialClinicians: Clinician[]; lang: Locale; }) {
  const [clinicians, setClinicians] = useState(initialClinicians);
  const [editing, setEditing] = useState<(Clinician & { _isNew?: boolean }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = clinicians.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.specialty?.toLowerCase().includes(search.toLowerCase()))
  );

  const openCreate = () => setEditing({ ...EMPTY, id: "", _isNew: true });
  const openEdit = (c: Clinician) => setEditing({ ...c });
  const close = () => { setEditing(null); setError(null); };

  const save = useCallback(async () => {
    if (!editing) return;
    setSaving(true); setError(null);
    try {
      const payload = { 
        name: editing.name, 
        specialty: editing.specialty || null, 
        website: editing.website || null, 
        address: editing.address || null, 
        lat: editing.lat ?? null, 
        lng: editing.lng ?? null, 
        phone: editing.phone || null, 
        email: editing.email || null, 
        verified: editing.verified 
      };

      const url = editing._isNew ? "/api/expert/clinicians" : `/api/expert/clinicians/${editing.id}`;
      const method = editing._isNew ? "POST" : "PATCH";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      setClinicians(prev => editing._isNew ? [...prev, data].sort((a,b) => a.name.localeCompare(b.name)) : prev.map(c => c.id === data.id ? data : c));
      setSuccess(editing._isNew ? "Clinician created!" : "Clinician updated!");
      setTimeout(() => { setSuccess(null); close(); }, 1000);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }, [editing]);

  const deleteClinician = async (id: string) => {
    if (!confirm("Are you sure you want to completely delete this clinician?")) return;
    await fetch(`/api/expert/clinicians/${id}`, { method: "DELETE" });
    setClinicians(prev => prev.filter(c => c.id !== id));
  };

  const field = (label: string, el: React.ReactNode) => (
    <div>
      <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-1.5">{label}</label>
      {el}
    </div>
  );

  return (
    <div className={`grid gap-6 items-start ${editing ? 'lg:grid-cols-[1fr_440px]' : 'grid-cols-1'}`}>
      {/* List */}
      <div className="flex flex-col min-w-0">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm" 
              placeholder="Search clinicians by name or specialty..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          <button onClick={openCreate} className="bg-orange-700 hover:bg-orange-600 text-white font-semibold py-2.5 px-5 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 whitespace-nowrap">
            <Plus size={18} /> Add Clinician
          </button>
        </div>

        {success && <div className="p-3 bg-orange-50 text-orange-600 border border-orange-200 rounded-xl mb-4 text-sm font-medium flex items-center gap-2"><CheckCircle2 size={16} />{success}</div>}

        <div className="flex flex-col gap-3">
          {filtered.map(c => (
            <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 md:p-5 border border-stone-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="font-bold text-slate-900 text-base">{c.name}</span>
                  {c.verified && <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 font-bold border border-orange-200 flex items-center gap-1"><CheckCircle2 size={10} /> Verified</span>}
                </div>
                <div className="text-sm text-stone-500 font-medium flex flex-wrap gap-x-4 gap-y-1 mb-1.5">
                  {c.specialty && <span className="flex items-center gap-1.5"><Hospital size={14} /> {c.specialty}</span>}
                  {c.phone && <span className="flex items-center gap-1.5"><Phone size={14} /> {c.phone}</span>}
                </div>
                {c.address && <div className="text-xs text-stone-400 flex items-start gap-1.5 mt-0.5"><MapPin size={12} className="shrink-0 mt-0.5" /> <span className="truncate">{c.address}</span></div>}
              </div>
              <div className="flex gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                <button onClick={() => openEdit(c)} className="flex items-center gap-1.5 px-3 py-1.5 border border-stone-200 rounded-lg bg-white text-stone-600 hover:text-slate-900 hover:bg-stone-50 font-semibold text-xs transition-colors shadow-sm">
                  <Edit2 size={12} /> Edit
                </button>
                <button onClick={() => deleteClinician(c.id)} className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-semibold text-xs transition-colors shadow-sm">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="text-center p-12 bg-white border border-stone-200 rounded-2xl text-stone-500 shadow-sm font-medium">No clinicians found.</div>}
        </div>
      </div>

      {/* Editor panel */}
      {editing && (
        <div className="bg-white border border-orange-200 rounded-2xl shadow-lg sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto overflow-x-hidden p-6 animate-up relative z-10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900 text-lg m-0">{editing._isNew ? "New Clinician" : "Edit Clinician"}</h3>
            <button onClick={close} className="text-stone-400 hover:text-stone-600 bg-stone-50 hover:bg-stone-100 rounded-full p-1.5 transition-colors">
              <X size={20} />
            </button>
          </div>

          {error && <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl mb-6 text-sm font-medium">{error}</div>}

          <div className="flex flex-col gap-5">
            {field("FULL NAME *", <input className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm" value={editing.name} onChange={e => setEditing(p => p ? { ...p, name: e.target.value } : null)} placeholder="e.g. Dr. Jane Doe" />)}
            {field("SPECIALTY", <input className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm" value={editing.specialty ?? ""} onChange={e => setEditing(p => p ? { ...p, specialty: e.target.value } : null)} placeholder="e.g. Gynecology" />)}
            {field("WEBSITE", <input className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm" value={editing.website ?? ""} onChange={e => setEditing(p => p ? { ...p, website: e.target.value } : null)} placeholder="e.g. https://clinic.com" />)}
            {field("ADDRESS", <textarea className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm resize-y min-h-[80px]" rows={2} value={editing.address ?? ""} onChange={e => setEditing(p => p ? { ...p, address: e.target.value } : null)} />)}
            
            <div className="grid grid-cols-2 gap-4">
              {field("LATITUDE", <input type="number" step="any" className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm" value={editing.lat ?? ""} onChange={e => setEditing(p => p ? { ...p, lat: e.target.value ? Number(e.target.value) : null } : null)} placeholder="e.g. 23.8103" />)}
              {field("LONGITUDE", <input type="number" step="any" className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm" value={editing.lng ?? ""} onChange={e => setEditing(p => p ? { ...p, lng: e.target.value ? Number(e.target.value) : null } : null)} placeholder="e.g. 90.4125" />)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {field("PHONE", <input className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm" value={editing.phone ?? ""} onChange={e => setEditing(p => p ? { ...p, phone: e.target.value } : null)} />)}
              {field("EMAIL", <input type="email" className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm" value={editing.email ?? ""} onChange={e => setEditing(p => p ? { ...p, email: e.target.value } : null)} />)}
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 mt-2 p-3 border border-stone-200 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors">
              <input type="checkbox" className="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500" checked={editing.verified} onChange={e => setEditing(p => p ? { ...p, verified: e.target.checked } : null)} />
              Verified Expert (shown with green badge)
            </label>
          </div>

          <button onClick={save} disabled={saving} className="w-full bg-orange-700 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors shadow-sm mt-8 flex items-center justify-center gap-2">
            {saving ? "Saving..." : editing._isNew ? "Add Clinician" : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}
