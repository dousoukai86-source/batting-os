import { redirect } from "next/navigation";

export default function AnalyzeIndex({
  searchParams,
}: {
  searchParams?: { type?: string; movie?: string };
}) {
  const t = Number(searchParams?.type);
  const movie = searchParams?.movie;

  if (t >= 1 && t <= 4) {
    const q = movie ? `?movie=${encodeURIComponent(movie)}` : "";
    redirect(`/analyze/${t}${q}`);
  }

  redirect("/");
}