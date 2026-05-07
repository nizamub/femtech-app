"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { EXPERT_PIN } from "@/lib/constants";
import { setExpertAuth } from "@/lib/storage";
import Link from "next/link";
import { Stethoscope, Lock } from "lucide-react";

export default function ExpertLoginPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const params = useParams();
  const lang = (params?.lang as string) ?? "en";

  const handleLogin = () => {
    if (pin === EXPERT_PIN) {
      setExpertAuth(true);
      router.push(`/${lang}/expert/dashboard`);
    } else {
      setError("Incorrect PIN. Please try again.");
      setPin("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-emerald-50/50 to-slate-50">
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-sm rounded-3xl p-8 w-full max-w-md text-center animate-up">
        <Stethoscope className="text-emerald-800 mx-auto mb-6" size={56} />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Expert Portal</h2>
        <p className="text-sm text-slate-500 mb-6">Enter your access PIN to manage questions and settings.</p>

        <div className="mb-4 text-left">
          <label className="block text-sm font-semibold text-slate-700 mb-1">Access PIN</label>
          <input
            id="expert-pin"
            type="password"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-center tracking-widest font-mono text-lg"
            placeholder="••••••••"
            value={pin}
            onChange={e => { setPin(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            autoFocus
          />
        </div>
        {error && <p className="text-sm mb-4 font-medium text-red-600 bg-red-50 py-2 px-3 rounded-lg border border-red-100">{error}</p>}
        <button id="expert-login-btn" className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors shadow-sm mb-4" onClick={handleLogin}>
          Login →
        </button>
        <div className="mb-6">
          <Link href={`/${lang}`} className="text-sm font-medium text-slate-500 hover:text-emerald-800 transition-colors">← Back to User App</Link>
        </div>
        <div className="text-left text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex gap-2 items-start">
          <Lock size={14} className="mt-0.5 shrink-0" />
          <span>Demo PIN: <strong className="font-bold">femtech2024</strong> — Change in <code className="bg-white px-1 py-0.5 rounded border border-emerald-100">src/lib/constants.ts</code> for production.</span>
        </div>
      </div>
    </div>
  );
}
