/**
 * Bản vẽ cửa theo tỉ lệ (SRS FR-DOR-06): kích thước tổng và ký hiệu hướng mở, vẽ lại ngay khi đổi thông số.
 * Quy ước mặt đứng: tam giác mở có đỉnh ở phía bản lề; nét liền = mở ra ngoài, nét đứt = mở vào trong.
 * Cửa lùa: mũi tên chỉ chiều lùa của từng cánh. Kính dùng token `glass`.
 */
import { formatMmValue, formatSize, type DoorTemplate } from '@matadoor/engine';
import { View } from 'react-native';
import Svg, { G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { useColors } from '@/theme/ThemeProvider';
import { FONT_FAMILY } from '@/theme/tokens';

export interface DrawingProps {
  template: DoorTemplate;
  /** null = chưa nhập: vẽ theo kích thước mặc định của mẫu, nhãn kích thước để trống. */
  W: number | null;
  H: number | null;
  params: Record<string, number>;
  /** Bề ngang được phép (px). */
  width: number;
  maxHeight?: number;
  /** Hiện đường kích thước (tắt ở thẻ mẫu nhỏ). */
  dims?: boolean;
}

function leafCount(t: DoorTemplate, params: Record<string, number>): number {
  const l = t.drawing.leaves;
  if (typeof l === 'number') return l;
  if (typeof l === 'string') return Math.max(1, Math.round(params[l] ?? 1));
  return 1;
}

export function describeDrawing(t: DoorTemplate, W: number | null, H: number | null, params: Record<string, number>): string {
  const parts = [t.name];
  if (W && H) parts.push(formatSize(W, H));
  const d = t.drawing;
  if (d.kind === 'swing') {
    if (d.hingeParam) parts.push(params[d.hingeParam] === 1 ? 'bản lề phải' : 'bản lề trái');
    if (d.openInParam) parts.push(params[d.openInParam] === 1 ? 'mở vào trong' : 'mở ra ngoài');
  }
  if (d.kind === 'sliding') parts.push(`${leafCount(t, params)} cánh lùa`);
  return `Bản vẽ ${parts.join(', ')}`;
}

export function DoorDrawing({ template: t, W, H, params, width, maxHeight = 260, dims = true }: DrawingProps) {
  const c = useColors();
  const w = W && W > 0 ? W : t.defaults.W;
  const h = H && H > 0 ? H : t.defaults.H;
  const pad = dims ? { l: 34, r: 8, t: 8, b: 34 } : { l: 4, r: 4, t: 4, b: 4 };
  const s = Math.min((width - pad.l - pad.r) / w, (maxHeight - pad.t - pad.b) / h);
  const fw = w * s;
  const fh = h * s;
  const x0 = pad.l + Math.max(0, (width - pad.l - pad.r - fw) / 2);
  const y0 = pad.t;
  const frame = Math.max(3, 45 * s);
  const stroke = c.text;
  const kind = t.drawing.kind;
  const leaves = leafCount(t, params);
  const hingeRight = t.drawing.hingeParam ? params[t.drawing.hingeParam] === 1 : false;
  const openIn = t.drawing.openInParam ? params[t.drawing.openInParam] === 1 : false;
  const svgH = fh + pad.t + pad.b;

  const leafRects: { x: number; y: number; w: number; h: number }[] = [];
  if (kind === 'swing') {
    // Khung 3 cạnh (không ngưỡng), cánh cách khung một khe nhỏ.
    const gap = Math.max(1.5, 5 * s);
    leafRects.push({ x: x0 + frame + gap, y: y0 + frame + gap, w: fw - 2 * (frame + gap), h: fh - frame - gap - Math.max(2, 10 * s) });
  } else if (kind === 'sliding') {
    const inner = { x: x0 + frame, y: y0 + frame, w: fw - 2 * frame, h: fh - 2 * frame };
    const overlap = Math.max(2, 39 * s);
    const lw = (inner.w + overlap * (leaves - 1)) / leaves;
    for (let i = 0; i < leaves; i++) leafRects.push({ x: inner.x + i * (lw - overlap), y: inner.y + (i % 2 === 0 ? 0 : 1.5), w: lw, h: inner.h - 1.5 });
  } else {
    leafRects.push({ x: x0 + frame, y: y0 + frame, w: fw - 2 * frame, h: fh - 2 * frame });
  }
  const sash = Math.max(3, 60 * s);

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={describeDrawing(t, W, H, params)} style={{ width, height: svgH }}>
      <Svg width={width} height={svgH}>
        {/* Khung */}
        {kind === 'swing' ? (
          <G>
            <Path
              d={`M${x0} ${y0 + fh} V${y0} H${x0 + fw} V${y0 + fh} M${x0 + frame} ${y0 + fh} V${y0 + frame} H${x0 + fw - frame} V${y0 + fh}`}
              stroke={stroke}
              strokeWidth={1.5}
              fill="none"
            />
            <Line x1={x0 - 8} y1={y0 + fh} x2={x0 + fw + 8} y2={y0 + fh} stroke={c.text2} strokeWidth={1.5} />
          </G>
        ) : (
          <G>
            <Rect x={x0} y={y0} width={fw} height={fh} stroke={stroke} strokeWidth={1.5} fill={c.surface} />
            <Rect x={x0 + frame} y={y0 + frame} width={fw - 2 * frame} height={fh - 2 * frame} stroke={stroke} strokeWidth={1} fill="none" />
          </G>
        )}
        {/* Cánh + kính */}
        {leafRects.map((r, i) => (
          <G key={i}>
            <Rect x={r.x} y={r.y} width={r.w} height={r.h} stroke={stroke} strokeWidth={1.2} fill={c.surface} />
            {kind === 'fixed' ? (
              <Rect x={r.x} y={r.y} width={r.w} height={r.h} fill={c.glass} stroke="none" />
            ) : (
              <Rect x={r.x + sash} y={r.y + sash} width={Math.max(0, r.w - 2 * sash)} height={Math.max(0, r.h - 2 * sash)} fill={c.glass} stroke={stroke} strokeWidth={0.8} />
            )}
          </G>
        ))}
        {/* Ký hiệu mở */}
        {kind === 'swing' && leafRects[0]
          ? (() => {
              const r = leafRects[0]!;
              const hx = hingeRight ? r.x + r.w : r.x;
              const ox = hingeRight ? r.x : r.x + r.w;
              const handleX = hingeRight ? r.x + sash / 2 : r.x + r.w - sash / 2;
              return (
                <G>
                  <Path
                    d={`M${ox} ${r.y} L${hx} ${r.y + r.h / 2} L${ox} ${r.y + r.h}`}
                    stroke={c.primary}
                    strokeWidth={1.5}
                    strokeDasharray={openIn ? '6 4' : undefined}
                    fill="none"
                  />
                  <Line x1={handleX} y1={r.y + r.h * 0.48} x2={handleX} y2={r.y + r.h * 0.58} stroke={stroke} strokeWidth={3} strokeLinecap="round" />
                </G>
              );
            })()
          : null}
        {kind === 'sliding'
          ? leafRects.map((r, i) => {
              const toRight = i < leaves / 2;
              const cy = r.y + r.h / 2;
              const len = Math.min(r.w * 0.5, 60);
              const xs = r.x + (r.w - len) / 2;
              const xe = xs + len;
              const tip = toRight ? xe : xs;
              const back = toRight ? -8 : 8;
              return (
                <Path
                  key={`a${i}`}
                  d={`M${xs} ${cy} H${xe} M${tip + back} ${cy - 6} L${tip} ${cy} L${tip + back} ${cy + 6}`}
                  stroke={c.primary}
                  strokeWidth={1.8}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })
          : null}
        {kind === 'awning' && leafRects[0]
          ? (() => {
              const r = leafRects[0]!;
              return <Path d={`M${r.x} ${r.y + r.h} L${r.x + r.w / 2} ${r.y} L${r.x + r.w} ${r.y + r.h}`} stroke={c.primary} strokeWidth={1.5} fill="none" />;
            })()
          : null}
        {/* Kích thước tổng */}
        {dims ? (
          <G>
            <Line x1={x0} y1={y0 + fh + 18} x2={x0 + fw} y2={y0 + fh + 18} stroke={c.text2} strokeWidth={1} />
            <Line x1={x0} y1={y0 + fh + 12} x2={x0} y2={y0 + fh + 24} stroke={c.text2} strokeWidth={1} />
            <Line x1={x0 + fw} y1={y0 + fh + 12} x2={x0 + fw} y2={y0 + fh + 24} stroke={c.text2} strokeWidth={1} />
            <SvgText x={x0 + fw / 2} y={y0 + fh + 32} fontSize={14} fontFamily={FONT_FAMILY.medium} fill={c.text} textAnchor="middle">
              {W && W > 0 ? formatMmValue(W) : 'W'}
            </SvgText>
            <Line x1={x0 - 18} y1={y0} x2={x0 - 18} y2={y0 + fh} stroke={c.text2} strokeWidth={1} />
            <Line x1={x0 - 24} y1={y0} x2={x0 - 12} y2={y0} stroke={c.text2} strokeWidth={1} />
            <Line x1={x0 - 24} y1={y0 + fh} x2={x0 - 12} y2={y0 + fh} stroke={c.text2} strokeWidth={1} />
            <SvgText
              x={x0 - 24}
              y={y0 + fh / 2}
              fontSize={14}
              fontFamily={FONT_FAMILY.medium}
              fill={c.text}
              textAnchor="middle"
              transform={`rotate(-90 ${x0 - 24} ${y0 + fh / 2})`}
            >
              {H && H > 0 ? formatMmValue(H) : 'H'}
            </SvgText>
          </G>
        ) : null}
      </Svg>
    </View>
  );
}
