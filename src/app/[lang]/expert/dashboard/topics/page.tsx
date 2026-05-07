"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { getTopics, saveTopics } from "@/lib/storage";
import { TOPICS as TOPIC_META } from "@/lib/constants";
import Link from "next/link";
import type { Topic } from "@/lib/types";
import { Folder, Eye, EyeOff, Trash2, Edit2, X, Activity, ChevronDown, CheckCircle2 } from "lucide-react";
import * as Icons from "lucide-react";

const PRESET_IDS = new Set([
  "hepatitis","pregnancy-problems","arsenic","menstrual","viral",
  "nutrition","pregnancy-care","birth-control","hpv-vaccination",
  "breast-cancer","thyroid","iron-deficiency",
]);

const ICON_SUGGESTIONS = [
  "Activity", "Heart", "Brain", "Bone", "Droplet", "Eye", "Thermometer", "Stethoscope",
  "Pill", "Syringe", "Microscope", "Dna", "TestTube", "Baby", "Salad", "Apple", "Dumbbell"
];

const COLOR_PALETTE = [
  "#065F46", "#047857", "#059669", "#10B981", "#34D399",
  "#0F766E", "#0E7490", "#0369A1", "#1D4ED8", "#4338CA",
  "#6D28D9", "#A21CAF", "#BE185D", "#E11D48", "#C2410C",
  "#B45309", "#0F172A", "#334155", "#475569", "#64748B"
];

interface NewTopicForm {
  label: string;
  icon: string;
  color: string;
  description: string;
  weight: number;
}

const BLANK_FORM: NewTopicForm = {
  label: "",
  icon: "Activity",
  color: "#065F46",
  description: "",
  weight: 1,
};

export default function TopicsManagerPage() {
  const params = useParams();
  const lang = (params?.lang as string) ?? "en";
  const [topics, setTopics] = useState<Topic[]>([]);
  const [saved, setSaved] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<NewTopicForm>(BLANK_FORM);
  const [errors, setErrors] = useState<Partial<NewTopicForm>>({});
  const [emojiOpen, setEmojiOpen] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setTopics(getTopics()); }, []);

  // Close emoji picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setEmojiOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleVisible = (id: string) => {
    setTopics(prev => prev.map(t => t.id === id ? { ...t, visible: !t.visible } : t));
  };

  const updateWeight = (id: string, weight: number) => {
    setTopics(prev => prev.map(t => t.id === id ? { ...t, weight } : t));
  };

  const save = () => {
    saveTopics(topics);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const deleteTopic = (id: string) => {
    if (!confirm("Delete this topic and all its questions? This cannot be undone.")) return;
    const updated = topics.filter(t => t.id !== id);
    setTopics(updated);
    saveTopics(updated);
  };

  const validateForm = (): boolean => {
    const errs: Partial<NewTopicForm> = {};
    if (!form.label.trim()) errs.label = "Topic name is required";
    if (!form.description.trim()) errs.description = "Description is required";
    if (!form.icon.trim()) errs.icon = "Icon is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = () => {
    if (!validateForm()) return;
    const slug = form.label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const id = `custom-${slug}-${Date.now()}`;
    const newTopic: Topic = {
      id,
      label: form.label.trim(),
      icon: form.icon.trim(),
      color: form.color,
      description: form.description.trim(),
      questions: [],
      visible: true,
      weight: form.weight,
    };
    const updated = [...topics, newTopic];
    setTopics(updated);
    saveTopics(updated);
    setShowModal(false);
    setForm(BLANK_FORM);
    setErrors({});
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(BLANK_FORM);
    setErrors({});
    setEmojiOpen(false);
  };

  return (
    <div className="animate-up max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
            <Folder className="text-emerald-800" size={28} /> Manage Topics
          </h2>
          <p className="text-sm text-slate-500 font-medium">Toggle visibility, set weights, add custom topics, or edit questions.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-200 hover:border-emerald-500 text-slate-700 hover:text-emerald-800 font-semibold py-2 px-4 rounded-xl transition-colors shadow-sm" onClick={() => setShowModal(true)}>
            + New Topic
          </button>
          <button className={`font-semibold py-2 px-5 rounded-xl transition-all shadow-sm flex items-center gap-2 ${saved ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-emerald-800 hover:bg-emerald-700 text-white'}`} onClick={save}>
            {saved ? <><CheckCircle2 size={18} /> Saved!</> : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Topic list */}
      <div className="flex flex-col gap-4">
        {topics.map(t => {
          const meta = TOPIC_META.find(m => m.id === t.id);
          const iconString  = meta?.icon  ?? t.icon;
          const color = meta?.color ?? t.color;
          const isCustom = !PRESET_IDS.has(t.id);
          
          const IconComp = (Icons as any)[iconString] || Icons.Activity;
          const isLucide = !!(Icons as any)[iconString];

          return (
            <div key={t.id} className={`bg-white border rounded-2xl p-5 shadow-sm transition-all ${t.visible ? 'border-slate-200 hover:shadow-md' : 'border-slate-200 opacity-60 bg-slate-50 grayscale-[20%]'}`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                {/* Left: icon + label */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border" style={{ color: color, backgroundColor: `${color}15`, borderColor: `${color}30` }}>
                    {isLucide ? <IconComp size={24} /> : <span className="text-2xl">{iconString}</span>}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-lg flex items-center gap-2 truncate">
                      <span className="truncate" style={{ color }}>{t.label}</span>
                      {isCustom && (
                        <span className="text-[0.6rem] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold border border-purple-200 uppercase tracking-wider shrink-0">
                          Custom
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-500 font-medium mt-0.5">
                      {t.questions.length} question{t.questions.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>

                {/* Right: controls */}
                <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap shrink-0">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                    <span className="text-xs font-bold text-slate-400 uppercase">Wt</span>
                    <select
                      className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none focus:ring-0 cursor-pointer appearance-none"
                      value={t.weight}
                      onChange={e => updateWeight(t.id, Number(e.target.value))}
                    >
                      {[0.5, 1, 1.5, 2, 3].map(w => <option key={w} value={w}>{w}x</option>)}
                    </select>
                  </div>
                  
                  <button
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-sm transition-colors border ${t.visible ? "bg-white border-slate-200 text-slate-600 hover:bg-slate-50" : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200"}`}
                    onClick={() => toggleVisible(t.id)}
                  >
                    {t.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                    {t.visible ? "Visible" : "Hidden"}
                  </button>
                  
                  <Link href={`/${lang}/expert/dashboard/topics/${t.id}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-sm transition-colors border border-emerald-200">
                    <Edit2 size={16} /> Edit
                  </Link>
                  
                  {isCustom && (
                    <button className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors" onClick={() => deleteTopic(t.id)}>
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {topics.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
          <Folder className="text-slate-300 mx-auto mb-4" size={64} />
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Topics Yet</h3>
          <p className="text-slate-500 font-medium mb-6">Get started by creating your first diagnostic topic.</p>
          <button className="bg-emerald-800 hover:bg-emerald-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors shadow-sm" onClick={() => setShowModal(true)}>
            + Create Topic
          </button>
        </div>
      )}

      {/* ── New Topic Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-200 animate-up">
            
            {/* Modal header */}
            <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center z-10">
              <div>
                <h3 className="text-lg font-bold text-slate-900 m-0">Create New Topic</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Add a custom diagnostic topic with questions</p>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full p-2 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* Topic Name */}
              <div className="mb-5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Topic Name *</label>
                <input
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold"
                  placeholder="e.g. Mental Health Screening"
                  value={form.label}
                  onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                />
                {errors.label && <div className="text-red-500 text-xs font-medium mt-1.5">{errors.label}</div>}
              </div>

              {/* Description */}
              <div className="mb-5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Description *</label>
                <textarea
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium resize-y min-h-[80px]"
                  placeholder="Brief description of what this topic assesses..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
                {errors.description && <div className="text-red-500 text-xs font-medium mt-1.5">{errors.description}</div>}
              </div>

              {/* Icon + Color row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                {/* Icon picker */}
                <div className="relative" ref={emojiRef}>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Icon</label>
                  <button
                    type="button"
                    className="w-full flex justify-between items-center px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold"
                    onClick={() => setEmojiOpen(v => !v)}
                  >
                    <span className="flex items-center gap-2">
                      {(() => {
                        const IconComp = (Icons as any)[form.icon] || Icons.Activity;
                        const isLucide = !!(Icons as any)[form.icon];
                        return isLucide ? <IconComp size={20} className="text-emerald-800" /> : <span className="text-xl">{form.icon}</span>;
                      })()}
                      <span className="text-sm font-medium text-slate-600 truncate max-w-[100px]">{form.icon}</span>
                    </span>
                    <ChevronDown size={16} className="text-slate-400" />
                  </button>
                  {emojiOpen && (
                    <div className="absolute top-[calc(100%+8px)] left-0 z-50 bg-white border border-slate-200 rounded-2xl p-3 w-[260px] shadow-xl grid grid-cols-6 gap-2">
                      {ICON_SUGGESTIONS.map(iconName => {
                        const IconComp = (Icons as any)[iconName];
                        if (!IconComp) return null;
                        return (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => { setForm(f => ({ ...f, icon: iconName })); setEmojiOpen(false); }}
                            className={`flex items-center justify-center p-2 rounded-lg transition-all ${form.icon === iconName ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent'}`}
                            title={iconName}
                          >
                            <IconComp size={20} />
                          </button>
                        );
                      })}
                      <div className="col-span-6 mt-2">
                        <input
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="Type icon name or emoji..."
                          value={form.icon}
                          onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  )}
                  {errors.icon && <div className="text-red-500 text-xs font-medium mt-1.5">{errors.icon}</div>}
                </div>

                {/* Color picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Accent Color</label>
                  <div className="grid grid-cols-5 gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
                    {COLOR_PALETTE.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, color: c }))}
                        className="w-full aspect-square rounded-lg transition-transform hover:scale-110 flex items-center justify-center"
                        style={{ background: c }}
                        title={c}
                      >
                        {form.color === c && <CheckCircle2 size={14} className="text-white drop-shadow-md" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Color preview */}
              <div className="mb-6 p-4 rounded-2xl flex items-center gap-4 transition-colors" style={{ backgroundColor: `${form.color}10`, borderColor: `${form.color}30`, borderWidth: 1 }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-white shadow-sm" style={{ color: form.color }}>
                  {(() => {
                    const IconComp = (Icons as any)[form.icon] || Icons.Activity;
                    const isLucide = !!(Icons as any)[form.icon];
                    return isLucide ? <IconComp size={24} /> : <span className="text-2xl">{form.icon}</span>;
                  })()}
                </div>
                <div>
                  <div className="font-bold text-lg" style={{ color: form.color }}>
                    {form.label || "Topic Name Preview"}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">{form.description || "Topic description preview"}</div>
                </div>
              </div>

              {/* Weight */}
              <div className="mb-8">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Scoring Weight</label>
                <div className="relative w-[180px]">
                  <select
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold appearance-none cursor-pointer"
                    value={form.weight}
                    onChange={e => setForm(f => ({ ...f, weight: Number(e.target.value) }))}
                  >
                    {[0.5, 1, 1.5, 2, 3].map(w => <option key={w} value={w}>{w}x — {w === 0.5 ? "Minor" : w === 1 ? "Standard" : w === 1.5 ? "Elevated" : w === 2 ? "High" : "Critical"}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1.5">
                  Higher weight = greater influence on the overall health score.
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button className="px-5 py-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-50 font-semibold rounded-xl transition-colors" onClick={closeModal}>Cancel</button>
                <button className="bg-emerald-800 hover:bg-emerald-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors shadow-sm" onClick={handleCreate}>
                  Create Topic
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}onClick={handleCreate}>
                ✨ Create Topic
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
