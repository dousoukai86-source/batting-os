import { Suspense } from "react";
import AnalyzeClient from "../AnalyzeClient";

export default function Page({
  params,
  searchParams,
}: {
  params: { type: string };
  searchParams?: { movie?: string };
}) {
  return (
    <Suspense fallback={<div className="page">読み込み中...</div>}>
      <AnalyzeClient type={params.type} movie={searchParams?.movie} />
    </Suspense>
  );
}