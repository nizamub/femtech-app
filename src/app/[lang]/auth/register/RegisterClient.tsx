"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, User, Stethoscope } from "lucide-react";
import type { Dictionary, Locale } from "@/dictionaries";

interface Props { dict: Dictionary; lang: Locale; }

export default function RegisterClient({ dict, lang }: Props) {
  const router = useRouter();
  const d = dict.auth;
  const [role, setRole] = useState<"user" | "expert">("user");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", age: "", gender: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = d.errors.nameRequired;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = d.errors.invalidEmail;
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) e.password = d.errors.weakPassword;
    if (form.password !== form.confirm) e.confirm = d.errors.passwordMismatch;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(), email: form.email.toLowerCase(), password: form.password,
          age: form.age ? parseInt(form.age) : undefined,
          gender: form.gender || undefined, role, language: lang,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setServerError(data.error || dict.common.error); return; }
      router.push(`/${lang}/auth/verify?email=${encodeURIComponent(form.email)}`);
    } catch {
      setServerError(dict.common.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-60px)] flex items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Sparkles className="text-emerald-800 mx-auto mb-4" size={48} />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{d.registerTitle}</h1>
          <p className="text-slate-500 text-sm">{d.registerSubtitle}</p>
        </div>

        {/* Role toggle */}
        <div className="flex gap-2 mb-6 bg-slate-100 rounded-xl p-1.5 border border-slate-200">
          {(["user", "expert"] as const).map(r => (
            <button key={r} onClick={() => setRole(r)} className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border-none cursor-pointer text-sm font-semibold transition-all ${
              role === r ? "bg-emerald-800 text-white shadow-sm" : "bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            }`}>
              {r === "user" ? <User size={16} /> : <Stethoscope size={16} />}
              {r === "user" ? d.registerAsUser : d.registerAsExpert}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-sm rounded-2xl p-6 sm:p-8 flex flex-col gap-5 animate-up">
          {serverError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm font-medium">
              {serverError}
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">{d.name} *</label>
            <input id="reg-name" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" />
            {errors.name && <div className="text-red-600 text-xs mt-1 font-medium">{errors.name}</div>}
          </div>

          <div className="flex flex-col sm:flex-row gap-5">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-1">{d.age}</label>
              <input id="reg-age" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" type="number" min={10} max={120} value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} placeholder="25" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-1">{d.gender}</label>
              <select id="reg-gender" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                <option value="">— Select —</option>
                {Object.entries(d.genderOptions).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">{d.email} *</label>
            <input id="reg-email" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@email.com" />
            {errors.email && <div className="text-red-600 text-xs mt-1 font-medium">{errors.email}</div>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">{d.password} *</label>
            <input id="reg-password" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
            {errors.password && <div className="text-red-600 text-xs mt-1 font-medium">{errors.password}</div>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">{d.confirmPassword} *</label>
            <input id="reg-confirm" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" type="password" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} placeholder="••••••••" />
            {errors.confirm && <div className="text-red-600 text-xs mt-1 font-medium">{errors.confirm}</div>}
          </div>

          {role === "expert" && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-800 flex gap-2 items-start mt-2">
              <Stethoscope className="shrink-0 mt-0.5" size={16} />
              <p className="m-0 leading-relaxed font-medium">{d.expertNote}</p>
            </div>
          )}

          <button id="reg-submit" className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg transition-colors mt-2" type="submit" disabled={loading}>
            {loading ? dict.common.loading : d.register}
          </button>

          <p className="text-sm text-slate-500 text-center mt-2">
            {d.hasAccount}{" "}
            <Link href={`/${lang}/auth/login`} className="text-emerald-800 font-bold hover:underline">{d.signIn}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
