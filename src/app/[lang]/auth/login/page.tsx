import { getDictionary, hasLocale, type Locale } from "@/dictionaries";
import { notFound } from "next/navigation";
import LoginClient from "./LoginClient";

export default async function LoginPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang as Locale);
  return <LoginClient dict={dict} lang={lang as Locale} />;
}
