// src/app/analyze/page.tsx
import { redirect } from "next/navigation";

type Props = {
  searchParams?: {
    type?: string;
  };
};

export default function AnalyzeIndex({ searchParams }: Props) {
  const t = Number(searchParams?.type);

  if (t >= 1 && t <= 4) {
    redirect(`/analyze/${t}`);
  }

  redirect("/");
}