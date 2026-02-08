import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const type = Number(body?.type);
  const movie = String(body?.movie ?? "/uploads/demo.mov");

  if (![1, 2, 3, 4].includes(type)) {
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  }

  // デモ結果（適当にそれっぽい値）
  const total = 60 + type * 5;

  const data = {
    type,
    total,
    breakdown: {
      posture: 12 + type,
      weight: 11 + type,
      impact: 10 + type,
      reproducibility: 11 + type,
      timing: 10 + type,
    },
    comment:
      type === 1
        ? "上体が前に入りやすい。軸（胸）を残して回転で打ちたい。"
        : type === 2
        ? "沈み込みで詰まりやすい。沈む量を一定にして最短で出そう。"
        : type === 3
        ? "体重移動が弱く伸び上がりやすい。下半身主導で押し込もう。"
        : "後ろに沈みやすい。股関節で受けて最後まで振り切ろう。",
    nextDrill:
      type === 1
        ? "壁ドン素振り（軸残し） 20回×2"
        : type === 2
        ? "片足ステップ（沈み一定） 15回×2"
        : type === 3
        ? "連続ティー（下半身主導） 20球×2"
        : "トップ静止→回転（股関節受け） 15回×2",
    movie,
  };

  return NextResponse.json(data);
}