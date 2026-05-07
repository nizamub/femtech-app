"use client";
import { useState, useCallback } from "react";
import type { Locale } from "@/dictionaries";
import { Search, Plus, Edit2, Trash2, X, Save, Activity, LayoutList, Stethoscope } from "lucide-react";

type Condition = { id: string; slug: string; nameEn: string; nameBn?: string | null; laypersonNameEn: string; laypersonNameBn?: string | null; descriptionEn: string; descriptionBn?: string | null; severity: string; urgencyLabel: string; specialistType?: string | null; nextStepsEn?: string | null; nextStepsBn?: string | null; scoringThreshold?: number | null; active: boolean; };

const SEVERITIES = ["low", "moderate", "high", "critical"];

const RISK_CONFIG: Record<string, { bg: string, text: string, border: string, dot: string }> = {
  low: { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-200", dot: "bg-emerald-500" },
  moderate: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200", dot: "bg-amber-500" },
  high: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200", dot: "bg-orange-500" },
  critical: { bg: "bg-red-100", text: "text-red-800", border: "border-red-200", dot: "bg-red-500" },
};

const EMPTY: Omit<Condition, "id"> = { slug: "", nameEn: "", nameBn: "", laypersonNameEn: "", laypersonNameBn: "", descriptionEn: "", descriptionBn: "", severity: "moderate", urgencyLabel: "Within 1 week", specialistType: "", nextStepsEn: "", nextStepsBn: "", scoringThreshold: null, active: true };

export default function ConditionsClient({ initialConditions, lang }: { initialConditions: Condition[]; lang: Locale; }) {
  const [conditions, setConditions] = useState(initialConditions);
  const [editing, setEditing] = useState<(Condition & { _isNew?: boolean }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = conditions.filter(c => c.nameEn.toLowerCase().includes(search.toLowerCase()) || c.slug.includes(search.toLowerCase()));

  const openCreate = () => setEditing({ ...EMPTY, id: "", _isNew: true });
  const openEdit = (c: Condition) => setEditing({ ...c });
  const close = () => { setEditing(null); setError(null); };

  const save = useCallback(async () => {
    if (!editing) return;
    setSaving(true); setError(null);
    try {
      const payload = { slug: editing.slug, nameEn: editing.nameEn, nameBn: editing.nameBn || null, laypersonNameEn: editing.laypersonNameEn, laypersonNameBn: editing.laypersonNameBn || null, descriptionEn: editing.descriptionEn, descriptionBn: editing.descriptionBn || null, severity: editing.severity, urgencyLabel: editing.urgencyLabel, specialistType: editing.specialistType || null, nextStepsEn: editing.nextStepsEn || null, nextStepsBn: editing.nextStepsBn || null, scoringThreshold: editing.scoringThreshold ?? null, active: editing.active };

      const url = editing._isNew ? "/api/expert/conditions" : `/api/expert/conditions/${editing.id}`;
      const method = editing._isNew ? "POST" : "PATCH";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      setConditions(prev => editing._isNew ? [...prev, data] : prev.map(c => c.id === data.id ? data : c));
      setSuccess(editing._isNew ? "Condition created!" : "Condition updated!");
      setTimeout(() => { setSuccess(null); close(); }, 1000);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }, [editing]);

  const deactivate = async (id: string) => {
    if (!confirm("Deactivate this condition?")) return;
    await fetch(`/api/expert/conditions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: false }) });
    setConditions(prev => prev.map(c => c.id === id ? { ...c, active: false } : c));
  };

  const field = (label: string, el: React.ReactNode) => (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
      {el}
    </div>
  );

  return (
    <div className={`grid gap-6 items-start ${editing ? 'grid-cols-1 lg:grid-cols-[1fr_440px]' : 'grid-cols-1'}`}>
      {/* List */}
      <div>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium transition-all shadow-sm" 
              placeholder="Search conditions..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          <button onClick={openCreate} className="bg-emerald-800 hover:bg-emerald-700 text-white font-semibold py-2.5 px-5 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 whitespace-nowrap">
            <Plus size={18} /> New Condition
          </button>
        </div>

        {success && <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-3 rounded-xl mb-4 text-sm font-semibold flex items-center gap-2"><Activity size={16} /> {success}</div>}

        <div className="flex flex-col gap-3">
          {filtered.map(c => {
            const risk = RISK_CONFIG[c.severity] || RISK_CONFIG.low;
            return (
              <div key={c.id} className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm transition-all hover:shadow-md ${c.active ? '' : 'opacity-60 bg-slate-50'}`}>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="font-bold text-slate-900 text-[1.05rem]">{c.nameEn}</span>
                    <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${risk.bg} ${risk.text} ${risk.border}`}>{c.severity}</span>
                    {!c.active && <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 border border-orange-200 uppercase tracking-wider">Inactive</span>}
                  </div>
                  <div className="text-sm font-medium text-slate-500">{c.laypersonNameEn} &middot; <span className="text-slate-700">{c.urgencyLabel}</span></div>
                  {c.scoringThreshold !== null && <div className="text-xs font-bold text-slate-400 mt-1.5 bg-slate-100 w-fit px-2 py-0.5 rounded-md border border-slate-200">Threshold: {c.scoringThreshold}</div>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEdit(c)} className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 transition-colors" title="Edit">
                    <Edit2 size={16} />
                  </button>
                  {c.active && (
                    <button onClick={() => deactivate(c.id)} className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 hover:border-orange-200 transition-colors" title="Disable">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center p-10 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
              <LayoutList className="mx-auto text-slate-300 mb-3" size={48} />
              <div className="text-slate-500 font-medium">No conditions found matching your search.</div>
            </div>
          )}
        </div>
      </div>

      {/* Editor panel */}
      {editing && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl sticky top-4 max-h-[90vh] overflow-y-auto animate-up">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 sticky top-0 bg-white z-10 pt-2">
            <h3 className="text-lg font-bold text-slate-900 m-0 flex items-center gap-2">
              <Stethoscope className="text-emerald-800" size={20} />
              {editing._isNew ? "New Condition" : "Edit Condition"}
            </h3>
            <button onClick={close} className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-md hover:bg-slate-100"><X size={20} /></button>
          </div>

          {error && <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-xl mb-4 text-sm font-semibold">{error}</div>}

          <div className="flex flex-col gap-4">
            {field("SLUG *", <input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium font-mono" value={editing.slug} onChange={e => setEditing(p => p ? { ...p, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") } : null)} placeholder="e.g. iron-deficiency" />)}
            {field("NAME (EN) *", <input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold" value={editing.nameEn} onChange={e => setEditing(p => p ? { ...p, nameEn: e.target.value } : null)} />)}
            {field("NAME (বাংলা)", <input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold" value={editing.nameBn ?? ""} onChange={e => setEditing(p => p ? { ...p, nameBn: e.target.value } : null)} />)}
            {field("LAYPERSON NAME (EN) *", <input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium" value={editing.laypersonNameEn} onChange={e => setEditing(p => p ? { ...p, laypersonNameEn: e.target.value } : null)} />)}
            {field("LAYPERSON NAME (বাংলা)", <input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium" value={editing.laypersonNameBn ?? ""} onChange={e => setEditing(p => p ? { ...p, laypersonNameBn: e.target.value } : null)} />)}
            {field("DESCRIPTION (EN) *", <textarea className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium resize-y min-h-[80px]" rows={3} value={editing.descriptionEn} onChange={e => setEditing(p => p ? { ...p, descriptionEn: e.target.value } : null)} />)}
            {field("DESCRIPTION (বাংলা)", <textarea className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium resize-y min-h-[80px]" rows={3} value={editing.descriptionBn ?? ""} onChange={e => setEditing(p => p ? { ...p, descriptionBn: e.target.value } : null)} />)}

            <div className="grid grid-cols-2 gap-3">
              {field("SEVERITY *", (
                <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold" value={editing.severity} onChange={e => setEditing(p => p ? { ...p, severity: e.target.value } : null)}>
                  {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ))}
              {field("SCORING THRESHOLD", <input type="number" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold" value={editing.scoringThreshold ?? ""} onChange={e => setEditing(p => p ? { ...p, scoringThreshold: e.target.value ? Number(e.target.value) : null } : null)} placeholder="0–100" />)}
            </div>

            {field("URGENCY LABEL *", <input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-red-600" value={editing.urgencyLabel} onChange={e => setEditing(p => p ? { ...p, urgencyLabel: e.target.value } : null)} placeholder="e.g. Within 24h" />)}
            {field("SPECIALIST TYPE", <input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium" value={editing.specialistType ?? ""} onChange={e => setEditing(p => p ? { ...p, specialistType: e.target.value } : null)} placeholder="e.g. Gynaecologist" />)}
            {field("NEXT STEPS (EN)", <textarea className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium resize-y min-h-[80px]" rows={3} value={editing.nextStepsEn ?? ""} onChange={e => setEditing(p => p ? { ...p, nextStepsEn: e.target.value } : null)} placeholder="1. Step one..." />)}
            {field("NEXT STEPS (বাংলা)", <textarea className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium resize-y min-h-[80px]" rows={3} value={editing.nextStepsBn ?? ""} onChange={e => setEditing(p => p ? { ...p, nextStepsBn: e.target.value } : null)} />)}

            <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 mt-2">
              <input type="checkbox" className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 accent-emerald-600" checked={editing.active} onChange={e => setEditing(p => p ? { ...p, active: e.target.checked } : null)} />
              Active (shown in assessments)
            </label>
          </div>

          <button onClick={save} disabled={saving} className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-wait">
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Save size={18} /> {editing._isNew ? "Create Condition" : "Save Changes"}</>}
          </button>
        </div>
      )}
    </div>
  );
}
