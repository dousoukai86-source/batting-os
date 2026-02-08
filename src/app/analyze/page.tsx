import { Suspense } from "react";
import AnalyzeClient from "./AnalyzeClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>Loading...</div>}>
      <AnalyzeClient />
    </Suspense>
  );
}