// src/lib/analysisText.ts
export type CatId = 1 | 2 | 3 | 4;

export type Breakdown = {
  posture: number; // 姿勢
  weight: number;  // 体重移動
  impact: number;  // インパクト
  repeat: number;  // 再現性
  timing: number;  // タイミング
};

export type AnalysisResult = {
  type: CatId;
  score: number;        // 0-100
  summary: string;      // A：見せる文章
  nextDrill: string;    // A：次の宿題
  breakdown: Breakdown; // B：数値（裏）
};

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}
function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * デモ解析：
 * - A：カテゴリ別テンプレ文
 * - B：カテゴリに合わせて数値を“それっぽく”生成
 * 後で骨格推定に差し替えるときは breakdown を実測で埋めればOK
 */
export function makeDemoAnalysis(type: CatId): AnalysisResult {
  const base: Breakdown = { posture: 70, weight: 70, impact: 70, repeat: 70, timing: 70 };

  const tweak = (b: Breakdown) => {
    if (type === 1) { b.posture -= 12; b.timing -= 10; }
    if (type === 2) { b.weight -= 14; b.impact -= 8; }
    if (type === 3) { b.weight -= 10; b.repeat -= 12; }
    if (type === 4) { b.impact -= 10; b.posture -= 8; }
    return b;
  };

  const raw = tweak({ ...base });
  const breakdown: Breakdown = {
    posture: clamp(raw.posture + (Math.random() * 10 - 5)),
    weight: clamp(raw.weight + (Math.random() * 10 - 5)),
    impact: clamp(raw.impact + (Math.random() * 10 - 5)),
    repeat: clamp(raw.repeat + (Math.random() * 10 - 5)),
    timing: clamp(raw.timing + (Math.random() * 10 - 5)),
  };

  const score = clamp(Math.round(
    (breakdown.posture + breakdown.weight + breakdown.impact + breakdown.repeat + breakdown.timing) / 5
  ));

  const A = {
    1: {
      summary: [
        "前傾が早く出やすいので、トップ位置を作ってから打ちにいく意識が最優先。",
        "ポイントが前に出やすい。まずは“待てる形”を作って、タイミングを遅らせよう。",
      ],
      drill: [
        "トップ固定→1呼吸→スイング（ティー10本）",
        "ノーステップで“待つ”練習（ティー10本）",
      ],
    },
    2: {
      summary: [
        "沈み込みが入りやすい。下半身の支えを作って、沈みを“保ったまま”回そう。",
        "詰まりやすい傾向。沈む→止まる にならないように、回転につなげたい。",
      ],
      drill: [
        "片足タッチ→戻す→スイング（ティー10本）",
        "膝を残して回る（ミニスイング10本）",
      ],
    },
    3: {
      summary: [
        "体重移動が弱く、伸び上がりやすい。軸で回ってミートの再現性を上げよう。",
        "後ろに伸びやすい。骨盤の回転を先に出して、上体は後から付いてくる形に。",
      ],
      drill: [
        "骨盤先行→上体は我慢（ティー10本）",
        "壁当て（お尻）→回転（素振り10回）",
      ],
    },
    4: {
      summary: [
        "しまい込みが出やすい。振り切って止めない回転を作るのが鍵。",
        "弾道が乱れやすい。体幹のコントロールで“最後まで回り切る”を優先。",
      ],
      drill: [
        "フィニッシュ静止3秒（ティー10本）",
        "回転で振り切る（素振り10回→ティー5本）",
      ],
    },
  } as const;

  return {
    type,
    score,
    summary: pick([...A[type].summary]),
nextDrill: pick([...A[type].drill]),
    breakdown,
  };
}