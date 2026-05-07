import { getDictionary, hasLocale, type Locale } from "@/dictionaries";
import { notFound } from "next/navigation";
import RegisterClient from "./RegisterClient";

export default async function RegisterPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang as Locale);
  return <RegisterClient dict={dict} lang={lang as Locale} />;
}
