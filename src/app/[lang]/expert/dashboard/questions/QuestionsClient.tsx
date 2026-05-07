"use client";
import { useState, useCallback } from "react";
import type { Locale } from "@/dictionaries";
import { Plus, X, Edit2, Trash2, Settings, Save, Activity, LayoutList } from "lucide-react";
import * as Icons from "lucide-react";

type AnswerOption = { id?: string; label: string; labelBn?: string | null; value: string; severity: number; severityTag: string; orderIndex: number; nextQuestionId?: string | null; triggerConditionId?: string | null; endAssessment: boolean; };
type Question = { id: string; topicId: string; text: string; textBn?: string | null; type: string; required: boolean; active: boolean; orderIndex: number; minAge: number; maxAge: number; targetGender: string | null; options: AnswerOption[]; };
type Topic = { id: string; label: string; labelBn?: string | null; icon: string; color: string; questions: Question[]; };
type Condition = { id: string; nameEn: string; slug: string; };

const QUESTION_TYPES = ["single", "multi", "scale", "date", "text", "colorpicker"];
const SEVERITY_TAGS = ["none", "low", "moderate", "high", "critical"];

const EMPTY_OPTION: AnswerOption = { label: "", labelBn: "", value: "", severity: 0, severityTag: "none", orderIndex: 0, endAssessment: false, nextQuestionId: null, triggerConditionId: null };
const EMPTY_QUESTION: Omit<Question, "id"> = { topicId: "", text: "", textBn: "", type: "single", required: true, active: true, orderIndex: 0, minAge: 0, maxAge: 120, targetGender: null, options: [{ ...EMPTY_OPTION }] };

export default function QuestionsClient({ initialTopics, allConditions, lang }: { initialTopics: Topic[]; allConditions: Condition[]; lang: Locale; }) {
  const [topics, setTopics] = useState(initialTopics);
  const [selectedTopicId, setSelectedTopicId] = useState(initialTopics[0]?.id ?? "");
  const [editingQuestion, setEditingQuestion] = useState<(Question & { _isNew?: boolean }) | null>(null);
  const [editingTopic, setEditingTopic] = useState<(Topic & { _isNew?: boolean }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedTopic = topics.find(t => t.id === selectedTopicId);

  const openCreate = () => setEditingQuestion({ id: "", topicId: selectedTopicId, text: "", textBn: "", type: "single", required: true, active: true, orderIndex: 0, minAge: 0, maxAge: 120, targetGender: null, options: [{ ...EMPTY_OPTION }], _isNew: true });
  const openEdit = (q: Question) => setEditingQuestion({ ...q, options: q.options.map(o => ({ ...o })) });
  const closePanel = () => { setEditingQuestion(null); setError(null); };

  const openCreateTopic = () => setEditingTopic({ id: "", label: "", labelBn: "", icon: "Activity", color: "#065F46", questions: [], _isNew: true });
  const openEditTopic = (t: Topic) => setEditingTopic({ ...t });
  const closeTopicModal = () => { setEditingTopic(null); setError(null); };

  const saveTopic = useCallback(async () => {
    if (!editingTopic) return;
    setSaving(true); setError(null); setSuccess(null);
    try {
      const isNew = editingTopic._isNew;
      const payload = { label: editingTopic.label, labelBn: editingTopic.labelBn, icon: editingTopic.icon, color: editingTopic.color };

      const url = isNew ? "/api/expert/topics" : `/api/expert/topics/${editingTopic.id}`;
      const res = await fetch(url, { method: isNew ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save topic");

      setTopics(prev => isNew ? [...prev, { ...data, questions: [] }] : prev.map(t => t.id === data.id ? { ...t, ...data } : t));
      if (isNew) setSelectedTopicId(data.id);
      setSuccess(isNew ? "Topic created!" : "Topic updated!");
      setTimeout(() => { setSuccess(null); closeTopicModal(); }, 1000);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }, [editingTopic]);

  const deleteTopic = async (topicId: string) => {
    if (!confirm("Delete this topic AND all of its questions? This is permanent.")) return;
    await fetch(`/api/expert/topics/${topicId}`, { method: "DELETE" });
    setTopics(prev => prev.filter(t => t.id !== topicId));
    if (selectedTopicId === topicId) setSelectedTopicId(topics[0]?.id ?? "");
  };

  const saveQuestion = useCallback(async () => {
    if (!editingQuestion) return;
    setSaving(true); setError(null); setSuccess(null);
    try {
      const isNew = editingQuestion._isNew;
      const payload = { topicId: editingQuestion.topicId || selectedTopicId, text: editingQuestion.text, textBn: editingQuestion.textBn, type: editingQuestion.type, required: editingQuestion.required, active: editingQuestion.active, orderIndex: editingQuestion.orderIndex, minAge: editingQuestion.minAge, maxAge: editingQuestion.maxAge, targetGender: editingQuestion.targetGender, options: editingQuestion.options };

      let res: Response;
      if (isNew) {
        const createRes = await fetch("/api/expert/questions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const created = await createRes.json();
        if (!createRes.ok) throw new Error(created.error || "Failed to create");
        res = await fetch(`/api/expert/questions/${created.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ options: editingQuestion.options }) });
      } else {
        res = await fetch(`/api/expert/questions/${editingQuestion.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      setTopics(prev => prev.map(t => t.id === (editingQuestion.topicId || selectedTopicId) ? {
        ...t, questions: isNew ? [...t.questions, data] : t.questions.map(q => q.id === data.id ? data : q)
      } : t));
      setSuccess(isNew ? "Question created!" : "Question updated!");
      setTimeout(() => { setSuccess(null); closePanel(); }, 1000);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }, [editingQuestion, selectedTopicId]);

  const deleteQuestion = async (questionId: string) => {
    if (!confirm("Permanently delete this question? This cannot be undone.")) return;
    await fetch(`/api/expert/questions/${questionId}`, { method: "DELETE" });
    setTopics(prev => prev.map(t => ({ ...t, questions: t.questions.filter(q => q.id !== questionId) })));
  };

  const updateOption = (idx: number, field: keyof AnswerOption, val: any) => {
    setEditingQuestion(prev => prev ? { ...prev, options: prev.options.map((o, i) => i === idx ? { ...o, [field]: val } : o) } : null);
  };

  const addOption = () => setEditingQuestion(prev => prev ? { ...prev, options: [...prev.options, { ...EMPTY_OPTION, orderIndex: prev.options.length }] } : null);
  const removeOption = (idx: number) => setEditingQuestion(prev => prev ? { ...prev, options: prev.options.filter((_, i) => i !== idx) } : null);

  const allQuestions = topics.flatMap(t => t.questions.map(q => ({ id: q.id, label: `[${t.label}] ${q.text.slice(0, 50)}` })));

  return (
    <div className={`grid gap-6 items-start ${editingQuestion || editingTopic ? 'grid-cols-1 lg:grid-cols-[1fr_420px]' : 'grid-cols-1'}`}>
      {/* Left — Topic tabs + Question list */}
      <div>
        {/* Topic selector */}
        <div className="flex flex-wrap gap-2 mb-6 items-center">
          {topics.map(t => {
            const isSelected = selectedTopicId === t.id;
            const IconComp = (Icons as any)[t.icon] || Icons.Activity;
            const isLucide = !!(Icons as any)[t.icon];
            
            return (
              <button 
                key={t.id} 
                onClick={() => setSelectedTopicId(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-sm transition-all ${isSelected ? 'font-bold shadow-sm' : 'font-medium bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                style={isSelected ? { borderColor: t.color, backgroundColor: `${t.color}15`, color: t.color } : {}}
              >
                {isLucide ? <IconComp size={16} /> : <span>{t.icon}</span>}
                {t.label}
              </button>
            );
          })}
          <button 
            onClick={openCreateTopic} 
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border-2 border-dashed border-slate-300 bg-transparent text-slate-500 hover:text-emerald-700 hover:border-emerald-500 hover:bg-emerald-50 font-medium text-sm transition-all"
          >
            <Plus size={16} /> Add Topic
          </button>
        </div>

        {/* Question list */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <span className="font-bold text-lg text-slate-900">{selectedTopic?.questions.length ?? 0} questions</span>
              <span className="text-slate-500 text-sm ml-2 font-medium">in {selectedTopic?.label}</span>
            </div>
            <div className="flex gap-2">
              {selectedTopic && (
                <>
                  <button onClick={() => openEditTopic(selectedTopic)} className="bg-white border border-slate-200 hover:border-slate-300 text-slate-600 font-semibold py-1.5 px-3 rounded-lg text-sm transition-colors shadow-sm flex items-center gap-1.5">
                    <Edit2 size={14} /> Edit Topic
                  </button>
                  <button onClick={() => deleteTopic(selectedTopic.id)} className="bg-white border border-red-200 hover:bg-red-50 text-red-600 font-semibold py-1.5 px-3 rounded-lg text-sm transition-colors shadow-sm flex items-center gap-1.5">
                    <Trash2 size={14} />
                  </button>
                </>
              )}
              <button onClick={openCreate} className="bg-emerald-800 hover:bg-emerald-700 text-white font-semibold py-1.5 px-3 rounded-lg text-sm transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!selectedTopic}>
                <Plus size={14} /> Add Question
              </button>
            </div>
          </div>

          {success && <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-3 rounded-xl mb-4 text-sm font-semibold flex items-center gap-2"><Activity size={16} /> {success}</div>}

          {selectedTopic?.questions.length === 0 && (
            <div className="text-center p-10 border-2 border-dashed border-slate-200 rounded-2xl">
              <LayoutList className="mx-auto text-slate-300 mb-3" size={48} />
              <div className="text-slate-500 font-medium">No questions yet. Click "Add Question" to start.</div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {selectedTopic?.questions.map(q => (
              <div key={q.id} className={`flex items-center gap-4 p-4 border border-slate-200 rounded-xl transition-all ${q.active ? 'bg-white hover:border-emerald-300 hover:shadow-sm' : 'bg-slate-50 opacity-60'}`}>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 text-sm mb-1 truncate">{q.text}</div>
                  <div className="flex gap-2 flex-wrap items-center">
                    <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">{q.type}</span>
                    <span className="text-[0.7rem] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">{q.options.length} options</span>
                    {(q.targetGender || q.minAge > 0 || q.maxAge < 120) && (
                      <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                        {q.targetGender ? q.targetGender : 'All'} &middot; {q.minAge}-{q.maxAge}y
                      </span>
                    )}
                    {!q.active && <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 border border-orange-200 uppercase tracking-wider">Inactive</span>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEdit(q)} className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 transition-colors" title="Edit">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => deleteQuestion(q.id)} className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Edit panel */}
      {editingQuestion && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl sticky top-4 animate-up">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 m-0 flex items-center gap-2">
              <Settings className="text-emerald-800" size={20} />
              {editingQuestion._isNew ? "New Question" : "Edit Question"}
            </h3>
            <button onClick={closePanel} className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-md hover:bg-slate-100"><X size={20} /></button>
          </div>

          {error && <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-xl mb-4 text-sm font-semibold">{error}</div>}

          {/* Question fields */}
          <div className="flex flex-col gap-4 mb-6">
            <div>
              <label className="block text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider mb-1.5">QUESTION TEXT (EN) *</label>
              <textarea className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium resize-y min-h-[60px]" rows={2} value={editingQuestion.text} onChange={e => setEditingQuestion(p => p ? { ...p, text: e.target.value } : null)} placeholder="Question text..." />
            </div>

            <div>
              <label className="block text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider mb-1.5">QUESTION TEXT (বাংলা)</label>
              <textarea className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium resize-y min-h-[60px]" rows={2} value={editingQuestion.textBn ?? ""} onChange={e => setEditingQuestion(p => p ? { ...p, textBn: e.target.value } : null)} placeholder="প্রশ্নের বাংলা টেক্সট..." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider mb-1.5">TYPE</label>
                <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium" value={editingQuestion.type} onChange={e => setEditingQuestion(p => p ? { ...p, type: e.target.value } : null)}>
                  {QUESTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider mb-1.5">ORDER</label>
                <input type="number" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium" value={editingQuestion.orderIndex} onChange={e => setEditingQuestion(p => p ? { ...p, orderIndex: Number(e.target.value) } : null)} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Target Gender</label>
                <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium" value={editingQuestion.targetGender || ""} onChange={e => setEditingQuestion(p => p ? { ...p, targetGender: e.target.value || null } : null)}>
                  <option value="">All Genders</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label className="block text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Min Age</label>
                <input type="number" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium" value={editingQuestion.minAge} onChange={e => setEditingQuestion(p => p ? { ...p, minAge: Number(e.target.value) } : null)} />
              </div>
              <div>
                <label className="block text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Max Age</label>
                <input type="number" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium" value={editingQuestion.maxAge} onChange={e => setEditingQuestion(p => p ? { ...p, maxAge: Number(e.target.value) } : null)} />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <input type="checkbox" className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 accent-emerald-600" checked={editingQuestion.active} onChange={e => setEditingQuestion(p => p ? { ...p, active: e.target.checked } : null)} />
              Active (shown in assessments)
            </label>
          </div>

          {/* Options */}
          {(editingQuestion.type === "single" || editingQuestion.type === "multi") && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider">ANSWER OPTIONS</span>
                <button onClick={addOption} className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-md text-xs font-bold transition-colors border border-emerald-200 flex items-center gap-1">
                  <Plus size={12} /> Add
                </button>
              </div>
              <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1">
                {editingQuestion.options.map((opt, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[0.65rem] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200 uppercase">OPTION {idx + 1}</span>
                      {editingQuestion.options.length > 1 && (
                        <button onClick={() => removeOption(idx)} className="text-red-500 hover:text-red-700 text-xs font-bold transition-colors">Remove</button>
                      )}
                    </div>
                    <div className="flex flex-col gap-2.5">
                      <input className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium" placeholder="Label (EN) *" value={opt.label} onChange={e => updateOption(idx, "label", e.target.value)} />
                      <input className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium" placeholder="লেবেল (বাংলা)" value={opt.labelBn ?? ""} onChange={e => updateOption(idx, "labelBn", e.target.value)} />
                      <input className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium font-mono" placeholder="Value (key)" value={opt.value} onChange={e => updateOption(idx, "value", e.target.value)} />
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[0.6rem] font-bold text-slate-400 uppercase mb-1">Severity (0-10)</label>
                          <input type="number" className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold" min={0} max={10} value={opt.severity} onChange={e => updateOption(idx, "severity", Number(e.target.value))} />
                        </div>
                        <div>
                          <label className="block text-[0.6rem] font-bold text-slate-400 uppercase mb-1">Severity Tag</label>
                          <select className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold" value={opt.severityTag} onChange={e => updateOption(idx, "severityTag", e.target.value)}>
                            {SEVERITY_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* Branch logic */}
                      <div className="bg-white p-2 rounded-lg border border-slate-200 flex flex-col gap-2">
                        <div>
                          <label className="block text-[0.6rem] font-bold text-indigo-500 uppercase mb-1 flex items-center gap-1">→ Branch to Question</label>
                          <select className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700 text-[0.7rem] focus:outline-none focus:ring-1 focus:ring-indigo-500" value={opt.nextQuestionId ?? ""} onChange={e => updateOption(idx, "nextQuestionId", e.target.value || null)}>
                            <option value="">— Default (sequential) —</option>
                            {allQuestions.map(q => <option key={q.id} value={q.id}>{q.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[0.6rem] font-bold text-amber-500 uppercase mb-1 flex items-center gap-1">⚡ Trigger Condition</label>
                          <select className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700 text-[0.7rem] focus:outline-none focus:ring-1 focus:ring-amber-500" value={opt.triggerConditionId ?? ""} onChange={e => updateOption(idx, "triggerConditionId", e.target.value || null)}>
                            <option value="">— None —</option>
                            {allConditions.map(c => <option key={c.id} value={c.id}>{c.nameEn}</option>)}
                          </select>
                        </div>
                        <label className="flex items-center gap-1.5 cursor-pointer text-[0.7rem] font-bold text-red-600 mt-1">
                          <input type="checkbox" className="w-3 h-3 text-red-600 rounded focus:ring-red-500 accent-red-600" checked={opt.endAssessment} onChange={e => updateOption(idx, "endAssessment", e.target.checked)} />
                          End assessment when selected
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={saveQuestion} disabled={saving} className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-wait">
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Save size={18} /> {editingQuestion._isNew ? "Create Question" : "Save Changes"}</>}
          </button>
        </div>
      )}

      {editingTopic && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl sticky top-4 animate-up">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 m-0 flex items-center gap-2">
              <Settings className="text-emerald-800" size={20} />
              {editingTopic._isNew ? "New Topic" : "Edit Topic"}
            </h3>
            <button onClick={closeTopicModal} className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-md hover:bg-slate-100"><X size={20} /></button>
          </div>

          {error && <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-xl mb-4 text-sm font-semibold">{error}</div>}

          <div className="flex flex-col gap-4 mb-6">
            <div>
              <label className="block text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider mb-1.5">TOPIC NAME (EN) *</label>
              <input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold" value={editingTopic.label} onChange={e => setEditingTopic(p => p ? { ...p, label: e.target.value } : null)} placeholder="e.g. Mental Health" />
            </div>

            <div>
              <label className="block text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider mb-1.5">TOPIC NAME (বাংলা)</label>
              <input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold" value={editingTopic.labelBn ?? ""} onChange={e => setEditingTopic(p => p ? { ...p, labelBn: e.target.value } : null)} placeholder="e.g. মানসিক স্বাস্থ্য" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider mb-1.5">ICON (Lucide Name)</label>
                <input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold" value={editingTopic.icon} onChange={e => setEditingTopic(p => p ? { ...p, icon: e.target.value } : null)} placeholder="Activity" />
              </div>
              <div>
                <label className="block text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider mb-1.5">COLOR (Hex)</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1 focus-within:ring-2 focus-within:ring-emerald-500 transition-all">
                  <input type="color" className="w-8 h-8 rounded border-none cursor-pointer p-0 bg-transparent" value={editingTopic.color} onChange={e => setEditingTopic(p => p ? { ...p, color: e.target.value } : null)} />
                  <input className="flex-1 bg-transparent border-none text-slate-900 text-sm font-bold focus:outline-none font-mono uppercase" value={editingTopic.color} onChange={e => setEditingTopic(p => p ? { ...p, color: e.target.value } : null)} placeholder="#065F46" />
                </div>
              </div>
            </div>
            
            {/* Topic Preview */}
            <div className="mt-2 p-4 rounded-xl flex items-center gap-3 border transition-colors" style={{ backgroundColor: `${editingTopic.color}15`, borderColor: `${editingTopic.color}30` }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white shadow-sm" style={{ color: editingTopic.color }}>
                {(() => {
                  const IconComp = (Icons as any)[editingTopic.icon] || Icons.Activity;
                  const isLucide = !!(Icons as any)[editingTopic.icon];
                  return isLucide ? <IconComp size={20} /> : <span className="text-xl">{editingTopic.icon}</span>;
                })()}
              </div>
              <div className="font-bold" style={{ color: editingTopic.color }}>
                {editingTopic.label || "New Topic Preview"}
              </div>
            </div>
          </div>

          <button onClick={saveTopic} disabled={saving} className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait">
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Save size={18} /> {editingTopic._isNew ? "Create Topic" : "Save Changes"}</>}
          </button>
        </div>
      )}
    </div>
  );
}
