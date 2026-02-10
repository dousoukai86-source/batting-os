import AnalyzeClient from "../AnalyzeClient";

export default function Page({ params }: { params: { type: string } }) {
  return <AnalyzeClient type={params.type} />;
}