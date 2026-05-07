import { getDictionary, hasLocale, type Locale } from "@/dictionaries";
import { notFound } from "next/navigation";
import VerifyClient from "./VerifyClient";

export default async function VerifyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang as Locale);
  return <VerifyClient dict={dict} lang={lang as Locale} />;
}
