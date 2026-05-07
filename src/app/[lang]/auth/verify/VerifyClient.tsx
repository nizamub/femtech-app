"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, CheckCircle } from "lucide-react";
import type { Dictionary, Locale } from "@/dictionaries";

interface Props { dict: Dictionary; lang: Locale; }

export default function VerifyClient({ dict, lang }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const d = dict.auth;
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleInput = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...code];
    next[index] = value;
    setCode(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setCode(text.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const token = code.join("");
    if (token.length !== 6) { setError("Please enter the 6-digit code"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, type: "verify" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || d.errors.invalidOtp); return; }
      setSuccess(true);
      setTimeout(() => router.push(`/${lang}/auth/login?verified=1`), 1500);
    } catch {
      setError(dict.common.error);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setCountdown(60);
    await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  };

  return (
    <div className="min-h-[calc(100vh-60px)] flex items-center justify-center p-8">
      <div className="w-full max-w-md text-center">
        {success ? (
          <CheckCircle className="text-emerald-500 mx-auto mb-4" size={48} />
        ) : (
          <Mail className="text-emerald-800 mx-auto mb-4" size={48} />
        )}
        <h1 className="text-2xl font-bold text-slate-900 mb-1">{d.verifyTitle}</h1>
        <p className="text-sm text-slate-500 mb-2">
          {d.verifySubtitle} <strong className="text-emerald-800">{email}</strong>
        </p>
        <p className="text-xs text-slate-400 mb-6">{d.otpExpiry}</p>

        {success ? (
          <div className="text-emerald-600 font-bold text-lg animate-up">✓ Email verified! Redirecting…</div>
        ) : (
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-sm rounded-2xl p-6 sm:p-8 flex flex-col animate-up">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm mb-4 font-medium">
                {error}
              </div>
            )}
            <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="text" inputMode="numeric" maxLength={1}
                  value={digit}
                  onChange={e => handleInput(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className={`w-12 h-14 text-center text-2xl font-extrabold bg-slate-50 border-2 rounded-xl text-slate-900 outline-none transition-all ${
                    digit ? "border-emerald-800" : "border-slate-200 focus:border-emerald-500"
                  }`}
                />
              ))}
            </div>
            <button id="verify-submit" className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg transition-colors mb-3" onClick={handleVerify} disabled={loading}>
              {loading ? dict.common.loading : d.verifyBtn}
            </button>
            <div className="text-sm text-slate-500">
              {countdown > 0
                ? <span>{d.resendIn} {countdown} {d.seconds}</span>
                : <button onClick={handleResend} className="bg-transparent border-none text-emerald-800 cursor-pointer font-bold hover:underline p-0">{d.resendCode}</button>
              }
            </div>
          </div>
        )}

        <p className="text-sm text-slate-500 mt-6">
          <Link href={`/${lang}/auth/register`} className="hover:text-slate-700 transition-colors">← Back to register</Link>
        </p>
      </div>
    </div>
  );
}
