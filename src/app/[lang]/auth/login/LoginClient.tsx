"use client";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import type { Dictionary, Locale } from "@/dictionaries";

interface Props { dict: Dictionary; lang: Locale; }

export default function LoginClient({ dict, lang }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const verified = params.get("verified") === "1";
  const d = dict.auth;
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      email: form.email.toLowerCase(),
      password: form.password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError(d.errors.invalidCredentials);
      return;
    }
    // Fetch session to get role for redirect
    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();
    const role = session?.user?.role ?? "user";
    if (role === "expert" || role === "admin") {
      router.push(`/${lang}/expert/dashboard`);
    } else {
      router.push(`/${lang}/dashboard`);
    }
    router.refresh();
  };

  return (
    <div className="min-h-[calc(100vh-60px)] flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Sparkles className="text-orange-700 mx-auto mb-4" size={48} />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{d.loginTitle}</h1>
          <p className="text-stone-500 text-sm">{d.loginSubtitle}</p>
        </div>

        {verified && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-orange-700 text-sm mb-4 text-center font-medium">
            ✅ Email verified! You can now sign in.
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-xl border border-stone-200 shadow-sm rounded-2xl p-6 sm:p-8 flex flex-col gap-5 animate-up">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">{d.email}</label>
            <input id="login-email" className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all" type="email" autoComplete="email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@email.com" required />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-semibold text-slate-700 m-0">{d.password}</label>
              <Link href={`/${lang}/auth/forgot-password`} className="text-stone-500 text-xs hover:text-orange-700 transition-colors font-medium">{d.forgotPassword}</Link>
            </div>
            <input id="login-password" className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all" type="password" autoComplete="current-password" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" required />
          </div>

          <button id="login-submit" className="w-full bg-orange-700 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg transition-colors mt-2" type="submit" disabled={loading}>
            {loading ? dict.common.loading : d.login}
          </button>

          <p className="text-sm text-stone-500 text-center mt-2">
            {d.noAccount}{" "}
            <Link href={`/${lang}/auth/register`} className="text-orange-700 font-bold hover:underline">{d.signUp}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
