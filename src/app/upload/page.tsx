// src/app/upload/page.tsx
import { Suspense } from "react";
import UploadClient from "./UploadClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="page">読み込み中...</div>}>
      <UploadClient />
    </Suspense>
  );
}