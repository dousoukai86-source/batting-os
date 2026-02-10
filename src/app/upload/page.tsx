// src/app/upload/page.tsx
import { Suspense } from "react";
import UploadClient from "./UploadClient";

type Props = {
  searchParams: {
    category?: string;
  };
};

export default function Page({ searchParams }: Props) {
  const category = searchParams?.category ?? null;

  const titleMap: Record<string, string> = {
    "1": "Ⅰ 前伸傾向",
    "2": "Ⅱ 前沈傾向",
    "3": "Ⅲ 後伸傾向",
    "4": "Ⅳ 後沈傾向",
  };

  const title = category ? titleMap[category] ?? "不明" : "未選択";

  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <UploadClient category={category} title={title} />
    </Suspense>
  );
}