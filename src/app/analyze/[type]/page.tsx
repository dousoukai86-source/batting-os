import AnalyzeClient from "../AnalyzeClient";

export default async function Page({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const resolved = await params;
  return <AnalyzeClient type={resolved.type} />;
} 