"use client";
import { useState, useEffect } from "react";
import { getThresholds, saveThresholds } from "@/lib/storage";
import type { Thresholds, ScoreThreshold } from "@/lib/types";
import { DEFAULT_THRESHOLDS } from "@/lib/constants";
import { Settings2, RotateCcw, Save, CheckCircle2, AlertTriangle, AlertCircle, ShieldAlert, Activity } from "lucide-react";
import * as Icons from "lucide-react";

const ICON_SUGGESTIONS = [
  "CheckCircle", "CheckCircle2", "Info", "AlertTriangle", "AlertCircle", "ShieldAlert", "Activity", "HeartPulse", "Thermometer"
];

export default function ThresholdsPage() {
  const [thresholds, setThresholds] = useState<Thresholds>(DEFAULT_THRESHOLDS as Thresholds);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setThresholds(getThresholds()); }, []);

  const updateLevel = (key: keyof Thresholds, field: keyof ScoreThreshold, value: string | number) => {
    setThresholds(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const save = () => { saveThresholds(thresholds); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const reset = () => { setThresholds(DEFAULT_THRESHOLDS as Thresholds); };

  const levels: (keyof Thresholds)[] = ["low", "moderate", "high", "critical"];

  return (
    <div className="animate-up max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
            <Settings2 className="text-emerald-800" size={28} /> Score Thresholds
          </h2>
          <p className="text-sm text-slate-500 font-medium">Customize the score ranges and advice text for each risk level.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 font-semibold py-2 px-4 rounded-xl transition-colors shadow-sm flex items-center gap-2" onClick={reset}>
            <RotateCcw size={16} /> Reset Defaults
          </button>
          <button className={`font-semibold py-2 px-5 rounded-xl transition-all shadow-sm flex items-center gap-2 ${saved ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-emerald-800 hover:bg-emerald-700 text-white'}`} onClick={save}>
            {saved ? <><CheckCircle2 size={18} /> Saved!</> : <><Save size={18} /> Save Changes</>}
          </button>
        </div>
      </div>

      {/* Visual range preview */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mb-8">
        <div className="flex justify-between items-center mb-4">
          <span className="font-bold text-slate-900 text-sm uppercase tracking-wide">Score Range Preview</span>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">0 → 100</span>
        </div>
        <div className="flex h-10 rounded-xl overflow-hidden gap-1 shadow-inner bg-slate-100 p-1">
          {levels.map(k => {
            const t = thresholds[k];
            const IconComp = (Icons as any)[t.emoji] || Icons.Activity;
            const isLucide = !!(Icons as any)[t.emoji];
            
            return (
              <div key={k} className="h-full rounded-lg transition-all duration-300 flex items-center justify-center relative group" style={{ flex: t.max - t.min, backgroundColor: t.color }}>
                {isLucide ? <IconComp size={16} className="text-white drop-shadow-md z-10" /> : <span className="text-xs text-white font-bold drop-shadow-md z-10">{t.emoji}</span>}
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 transition-colors z-0"></div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 px-1">
          <span className="text-xs font-bold text-slate-400">0</span>
          <span className="text-xs font-bold text-slate-400">100</span>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {levels.map(key => {
          const t = thresholds[key];
          const IconComp = (Icons as any)[t.emoji] || Icons.Activity;
          const isLucide = !!(Icons as any)[t.emoji];

          return (
            <div key={key} className="bg-white border-l-4 border-y border-r border-slate-200 rounded-r-3xl rounded-l-lg p-6 shadow-sm transition-shadow hover:shadow-md" style={{ borderLeftColor: t.color }}>
              <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: t.color }}>
                    {isLucide ? <IconComp size={20} /> : <span className="text-xl">{t.emoji}</span>}
                  </div>
                  <span className="text-xl font-extrabold tracking-tight" style={{ color: t.color }}>{t.label}</span>
                </div>
                <div className="font-bold text-sm px-3 py-1.5 rounded-lg border bg-opacity-10 uppercase tracking-wider" style={{ backgroundColor: `${t.color}15`, color: t.color, borderColor: `${t.color}30` }}>
                  {t.min}–{t.max} pts
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Min Score</label>
                  <input type="number" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold" value={t.min} min={0} max={100}
                    onChange={e => updateLevel(key, "min", Number(e.target.value))} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Max Score</label>
                  <input type="number" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold" value={t.max} min={0} max={100}
                    onChange={e => updateLevel(key, "max", Number(e.target.value))} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Icon Name</label>
                  <input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold" value={t.emoji}
                    onChange={e => updateLevel(key, "emoji", e.target.value)} />
                </div>
              </div>
              
              <div className="mb-5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Label</label>
                <input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold" value={t.label}
                  onChange={e => updateLevel(key, "label", e.target.value)} />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Advice Text (shown to user)</label>
                <textarea className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium resize-y min-h-[80px]" value={t.advice}
                  onChange={e => updateLevel(key, "advice", e.target.value)} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <button className="flex-1 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 font-bold py-3.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2" onClick={reset}>
          <RotateCcw size={18} /> Reset to Defaults
        </button>
        <button className={`flex-1 font-bold py-3.5 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 ${saved ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-emerald-800 hover:bg-emerald-700 text-white border border-transparent'}`} onClick={save}>
          {saved ? <><CheckCircle2 size={20} /> Saved Successfully!</> : <><Save size={20} /> Save All Changes</>}
        </button>
      </div>
    </div>
  );
}
