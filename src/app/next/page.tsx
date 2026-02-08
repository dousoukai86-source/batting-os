'use client';

import { useEffect, useMemo, useState } from 'react';

type UploadItem = {
  name: string;
  url: string; // /uploads/xxx.mov
};

export default function Page() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<UploadItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const base = useMemo(() => {
    // iPhoneで開いたときも同じホストに向く（172... で開いてるならそれに向く）
    if (typeof window === 'undefined') return '';
    return window.location.origin;
  }, []);

  async function fetchList() {
    setLoading(true);
    setError(null);

    try {
      // 1) まず /api/uploads があればそれを使う（後で作ればOK）
      const r = await fetch(`${base}/api/uploads`, { cache: 'no-store' });
      if (r.ok) {
        const data = await r.json();
        const list: UploadItem[] = Array.isArray(data?.items) ? data.items : [];
        setItems(list);
        setSelected(list[0] ?? null);
        setLoading(false);
        return;
      }

      // 2) 無ければフォールバック（手動入力のみ）でも落ちない
      setItems([]);
      setSelected(null);
      setLoading(false);
    } catch (e: any) {
      setError(e?.message ?? 'failed to load');
      setItems([]);
      setSelected(null);
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base]);

  return (
    <main style={{ minHeight: '100vh', background: '#0b0b0b', color: '#fff', padding: 16 }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <h1 style={{ margin: '12px 0 6px', fontSize: 22, fontWeight: 800 }}>BATTTING OS</h1>
        <div style={{ opacity: 0.7, marginBottom: 14 }}>プレビュー（/uploads の動画を再生）</div>

        <div
          style={{
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 16,
            padding: 14,
            background: 'rgba(255,255,255,0.03)',
          }}
        >
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
            <button
              onClick={fetchList}
              style={{
                padding: '10px 12px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.06)',
                color: '#fff',
                fontWeight: 700,
              }}
            >
              一覧を再読込
            </button>

            <div style={{ fontSize: 12, opacity: 0.7 }}>
              {loading ? '読み込み中…' : `件数: ${items.length}`}
            </div>
          </div>

          {error && (
            <div
              style={{
                background: 'rgba(255,0,0,0.12)',
                border: '1px solid rgba(255,0,0,0.35)',
                padding: 10,
                borderRadius: 12,
                marginBottom: 12,
                fontSize: 13,
              }}
            >
              エラー: {error}
            </div>
          )}

          {/* リストが取れない場合でもプレビューできる “手動URL入力” */}
          <ManualUrlPicker
            base={base}
            onPick={(u) => setSelected({ name: u.split('/').pop() || u, url: u })}
          />

          <div style={{ height: 10 }} />

          {/* セレクタ */}
          {items.length > 0 && (
            <select
              value={selected?.url ?? ''}
              onChange={(e) => {
                const u = e.target.value;
                const it = items.find((x) => x.url === u) ?? null;
                setSelected(it);
              }}
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.18)',
                background: '#111',
                color: '#fff',
                fontSize: 14,
              }}
            >
              {items.map((it) => (
                <option key={it.url} value={it.url}>
                  {it.name}
                </option>
              ))}
            </select>
          )}

          <div style={{ height: 14 }} />

          {/* プレビュー */}
          <div
            style={{
              width: '100%',
              aspectRatio: '1 / 1',
              borderRadius: 18,
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.14)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            {selected ? (
              <video
                key={selected.url}
                src={`${base}${selected.url}`}
                controls
                playsInline
                preload="metadata"
                style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }}
                onError={() => {
                  setError(
                    `動画が読めない: ${selected.url}（/public/uploads に存在するか確認してね）`
                  );
                }}
              />
            ) : (
              <div style={{ opacity: 0.7, fontSize: 14, padding: 16, textAlign: 'center' }}>
                まだ動画が選ばれてないよ。
                <br />
                下の入力に <b>/uploads/xxxx.MOV</b> を貼ってもOK。
              </div>
            )}
          </div>

          <div style={{ height: 12 }} />

          {selected && (
            <div style={{ fontSize: 12, opacity: 0.75, wordBreak: 'break-all' }}>
              再生URL: <span style={{ opacity: 0.95 }}>{base}{selected.url}</span>
            </div>
          )}
        </div>

        <div style={{ height: 16 }} />

        <div style={{ fontSize: 12, opacity: 0.6, lineHeight: 1.6 }}>
          もし一覧が0件でも大丈夫。
          <br />
          まずはアップロード成功で出た <b>/uploads/〜.MOV</b> を貼ってプレビューできるようにしてる。
        </div>
      </div>
    </main>
  );
}

function ManualUrlPicker({
  base,
  onPick,
}: {
  base: string;
  onPick: (urlPath: string) => void;
}) {
  const [value, setValue] = useState('');

  return (
    <div
      style={{
        border: '1px solid rgba(255,255,255,0.18)',
        borderRadius: 14,
        padding: 12,
        background: 'rgba(255,255,255,0.04)',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
        手動でプレビュー（一覧が取れない時用）
      </div>
      <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>
        例: <b>/uploads/1770376522251-xxx.MOV</b>
      </div>

      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="/uploads/xxxx.MOV"
        style={{
          width: '100%',
          padding: 12,
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.18)',
          background: '#0f0f0f',
          color: '#fff',
          fontSize: 14,
        }}
      />

      <div style={{ height: 10 }} />

      <button
        onClick={() => {
          const v = value.trim();
          if (!v) return;
          // フルURL貼ってもOK → パスに変換
          if (v.startsWith('http://') || v.startsWith('https://')) {
            try {
              const u = new URL(v);
              onPick(u.pathname);
              return;
            } catch {
              // fallthrough
            }
          }
          // /uploads じゃない場合でも受ける（落とさない）
          onPick(v.startsWith('/') ? v : `/${v}`);
        }}
        style={{
          width: '100%',
          padding: 14,
          borderRadius: 14,
          border: 'none',
          background: '#2563eb',
          color: '#fff',
          fontWeight: 900,
          fontSize: 16,
        }}
      >
        このURLでプレビューする（{base || 'localhost'}）
      </button>
    </div>
  );
}