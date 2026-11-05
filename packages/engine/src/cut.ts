/**
 * Tối ưu cắt nhôm (SRS mục 4.3, FR-CUT-01…04).
 *
 * Phần dùng được của cây = dài cây − 2 × phần bỏ đầu; mỗi đoạn sau đoạn đầu cộng thêm một mạch cưa.
 * Bài toán tương đương xếp thùng: mỗi đoạn chiếm (dài + mạch cưa), sức chứa cây = phần dùng được + mạch cưa.
 *
 * Thuật toán:
 *  1. First Fit Decreasing theo từng mã nhôm (như SRS 4.3).
 *  2. Cải thiện cục bộ có giới hạn (kiểu Falkenauer): bỏ vài cây ít đầy nhất, đổi thanh nhỏ trong các cây
 *     còn lại lấy thanh tự do lớn hơn để cây đầy hơn, rồi xếp lại thanh tự do bằng FFD. Chỉ nhận khi bớt cây.
 *     Có hạt giống cố định nên cùng đầu vào luôn ra cùng sơ đồ cắt.
 * Kết quả không bao giờ dùng nhiều cây hơn FFD.
 *
 * Hao hụt = 1 − tổng chiều dài các đoạn / (số cây × dài cây).
 */

export interface CutSettings {
  /** Chiều dài cây nhôm (mm), mặc định 5800 (giả định A3). */
  barLength: number;
  /** Mạch cưa (mm), mặc định 4. */
  kerf: number;
  /** Phần bỏ mỗi đầu cây (mm), mặc định 10. */
  trim: number;
}

export const DEFAULT_CUT_SETTINGS: Readonly<CutSettings> = { barLength: 5800, kerf: 4, trim: 10 };

export interface CutPiece {
  length: number;
  /** Ký hiệu bộ cửa (D1, S2…) – ghi trên phiếu cắt (FR-BOM-05). */
  symbol: string;
  /** Vai trò thanh (canh_ngang…). */
  role: string;
  /** Tên vai trò để hiện (Cánh ngang…). */
  label: string;
  /** Góc cắt, nếu có. */
  angle?: string;
  /** Id bộ cửa trong dự án (nếu có). */
  doorId?: string;
}

export interface CutBar {
  pieces: CutPiece[];
  /** Tổng chiều dài các đoạn. */
  piecesLength: number;
  /** Tổng mạch cưa = (số đoạn − 1) × mạch cưa. */
  kerfLength: number;
  /** Phần còn dư = dài cây − 2 × bỏ đầu − đoạn − mạch cưa. */
  remaining: number;
}

export interface CutPlan {
  code: string;
  settings: CutSettings;
  /** Các cây, cây đầy nhất trước. */
  bars: CutBar[];
  /** Đoạn dài hơn phần dùng được của cây (FR-CUT-03) – không xếp được. */
  tooLong: CutPiece[];
  /** Tổng chiều dài các đoạn đã xếp. */
  totalLength: number;
  /** Cận dưới theo SRS 4.3 = ceil(tổng chiều dài / phần dùng được). */
  lowerBound: number;
  /** Cận dưới chặt hơn (Martello–Toth L2, có tính mạch cưa). Số cây tối ưu không thể nhỏ hơn số này. */
  lowerBoundStrong: number;
  /** Số cây nếu chỉ dùng FFD (để đối chiếu). */
  ffdBars: number;
  /** Hao hụt 0..1. */
  waste: number;
}

export interface OptimizeOptions {
  /** Số vòng cải thiện tối đa (mặc định 120). 0 = chỉ FFD. */
  maxIterations?: number;
  /** Dừng khi bấy nhiêu vòng liền không bớt được cây (mặc định 30). */
  patience?: number;
}

const EPS = 1e-6;

export function usableLength(s: CutSettings): number {
  return s.barLength - 2 * s.trim;
}

export function validateCutSettings(s: CutSettings): string[] {
  const errors: string[] = [];
  if (!(s.barLength > 0)) errors.push('Chiều dài cây phải lớn hơn 0');
  if (!(s.kerf >= 0)) errors.push('Mạch cưa không được âm');
  if (!(s.trim >= 0)) errors.push('Phần bỏ đầu không được âm');
  if (s.barLength > 0 && usableLength(s) <= 0) errors.push('Phần bỏ hai đầu lớn hơn chiều dài cây');
  return errors;
}

/** So sánh để xếp đoạn: dài trước; bằng nhau thì theo ký hiệu, vai trò cho kết quả ổn định. */
function comparePieces(a: CutPiece, b: CutPiece): number {
  if (b.length !== a.length) return b.length - a.length;
  const s = a.symbol.localeCompare(b.symbol, 'vi', { numeric: true });
  if (s !== 0) return s;
  return a.role.localeCompare(b.role);
}

/** Cận dưới Martello–Toth L2 cho bài xếp thùng (kích thước `sizes`, sức chứa `C`). */
export function lowerBoundL2(sizes: readonly number[], C: number): number {
  if (sizes.length === 0) return 0;
  const alphas = new Set<number>([0]);
  for (const x of sizes) if (x <= C / 2) alphas.add(x);
  let best = 0;
  for (const a of alphas) {
    let j1 = 0;
    let j2 = 0;
    let s2 = 0;
    let s3 = 0;
    for (const x of sizes) {
      if (x > C - a + EPS) j1++;
      else if (x > C / 2 + EPS) {
        j2++;
        s2 += x;
      } else if (x >= a - EPS) s3 += x;
    }
    const v = j1 + j2 + Math.max(0, Math.ceil((s3 - (j2 * C - s2)) / C - 1e-9));
    if (v > best) best = v;
  }
  return best;
}

function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

function binFill(bin: readonly number[], sizes: readonly number[]): number {
  let f = 0;
  for (const i of bin) f += sizes[i]!;
  return f;
}

/** FFD trên chỉ số; `sizes` đã xếp giảm dần. */
function ffd(sizes: readonly number[], C: number): number[][] {
  const bins: number[][] = [];
  const fills: number[] = [];
  for (let i = 0; i < sizes.length; i++) {
    const s = sizes[i]!;
    let placed = false;
    for (let b = 0; b < bins.length; b++) {
      if (fills[b]! + s <= C + EPS) {
        bins[b]!.push(i);
        fills[b]! += s;
        placed = true;
        break;
      }
    }
    if (!placed) {
      bins.push([i]);
      fills.push(s);
    }
  }
  return bins;
}

/**
 * Trong một cây: thử đổi 1–2 thanh của cây lấy 1–2 thanh tự do có tổng lớn hơn mà vẫn vừa.
 * Trả về true nếu đã đổi.
 */
function tryExchange(bin: number[], free: number[], sizes: readonly number[], C: number): boolean {
  const fill = binFill(bin, sizes);
  const nb = bin.length;
  const nf = free.length;
  for (let x = 0; x < nb; x++) {
    for (let y = x; y <= nb; y++) {
      if (y === x && y < nb) continue; // y = nb: chỉ lấy một thanh của cây
      const outSize = sizes[bin[x]!]! + (y < nb ? sizes[bin[y]!]! : 0);
      for (let a = 0; a < nf; a++) {
        for (let c = a; c <= nf; c++) {
          if (c === a && c < nf) continue;
          const inSize = sizes[free[a]!]! + (c < nf ? sizes[free[c]!]! : 0);
          if (inSize > outSize + EPS && fill - outSize + inSize <= C + EPS) {
            const outItems = y < nb ? [bin[x]!, bin[y]!] : [bin[x]!];
            const inItems = c < nf ? [free[a]!, free[c]!] : [free[a]!];
            for (const o of outItems) bin.splice(bin.indexOf(o), 1);
            for (const i of inItems) free.splice(free.indexOf(i), 1);
            bin.push(...inItems);
            free.push(...outItems);
            return true;
          }
        }
      }
    }
  }
  return false;
}

function improve(
  sizes: readonly number[],
  C: number,
  start: number[][],
  lb: number,
  maxIterations: number,
  patience: number,
): number[][] {
  let best = start.map((b) => [...b]);
  if (best.length <= lb || maxIterations <= 0) return best;
  let cur = best.map((b) => [...b]);
  const rand = seededRandom(0x5eed + sizes.length);
  let stale = 0;
  for (let it = 0; it < maxIterations && stale < patience; it++) {
    const remove = 1 + (it % 3);
    cur.sort((p, q) => binFill(p, sizes) - binFill(q, sizes));
    const free = cur.splice(0, Math.min(remove, cur.length)).flat();
    for (const bin of cur) {
      free.sort((p, q) => sizes[q]! - sizes[p]!);
      let guard = 0;
      while (guard++ < 50 && tryExchange(bin, free, sizes, C)) {
        free.sort((p, q) => sizes[q]! - sizes[p]!);
      }
    }
    free.sort((p, q) => sizes[q]! - sizes[p]!);
    const fills = cur.map((b) => binFill(b, sizes));
    for (const i of free) {
      let placed = false;
      for (let b = 0; b < cur.length; b++) {
        if (fills[b]! + sizes[i]! <= C + EPS) {
          cur[b]!.push(i);
          fills[b]! += sizes[i]!;
          placed = true;
          break;
        }
      }
      if (!placed) {
        cur.push([i]);
        fills.push(sizes[i]!);
      }
    }
    if (cur.length < best.length) {
      best = cur.map((b) => [...b]);
      stale = 0;
      if (best.length <= lb) break;
    } else {
      stale++;
      if (cur.length > best.length || rand() < 0.1) cur = best.map((b) => [...b]);
    }
  }
  return best;
}

export function optimizeCuts(
  code: string,
  pieces: readonly CutPiece[],
  settings: CutSettings,
  options: OptimizeOptions = {},
): CutPlan {
  const errors = validateCutSettings(settings);
  if (errors.length > 0) throw new RangeError(errors.join('; '));
  const { maxIterations = 120, patience = 30 } = options;
  const usable = usableLength(settings);
  const C = usable + settings.kerf;
  const sorted = [...pieces].sort(comparePieces);
  const fit: CutPiece[] = [];
  const tooLong: CutPiece[] = [];
  for (const p of sorted) (p.length > usable + EPS ? tooLong : fit).push(p);

  const sizes = fit.map((p) => p.length + settings.kerf);
  const start = ffd(sizes, C);
  const totalLength = fit.reduce((s, p) => s + p.length, 0);
  const lowerBound = totalLength > 0 ? Math.ceil(totalLength / usable - 1e-9) : 0;
  const lowerBoundStrong = Math.max(lowerBoundL2(sizes, C), Math.ceil(sizes.reduce((s, x) => s + x, 0) / C - 1e-9));
  const binsIdx = improve(sizes, C, start, lowerBoundStrong, maxIterations, patience);

  const bars: CutBar[] = binsIdx.map((bin) => {
    const ps = bin.map((i) => fit[i]!).sort(comparePieces);
    const piecesLength = ps.reduce((s, p) => s + p.length, 0);
    const kerfLength = (ps.length - 1) * settings.kerf;
    return { pieces: ps, piecesLength, kerfLength, remaining: usable - piecesLength - kerfLength };
  });
  bars.sort((a, b) => a.remaining - b.remaining || comparePieces(a.pieces[0]!, b.pieces[0]!));

  const waste = bars.length > 0 ? 1 - totalLength / (bars.length * settings.barLength) : 0;
  return {
    code,
    settings: { ...settings },
    bars,
    tooLong,
    totalLength,
    lowerBound,
    lowerBoundStrong,
    ffdBars: start.length,
    waste,
  };
}

/** Gom đoạn theo khóa (mã nhôm, có thể kèm màu) rồi tối ưu từng nhóm. */
export function optimizeAll(
  groups: ReadonlyMap<string, readonly CutPiece[]>,
  settings: CutSettings,
  options?: OptimizeOptions,
): CutPlan[] {
  const keys = [...groups.keys()].sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));
  return keys.map((k) => optimizeCuts(k, groups.get(k)!, settings, options));
}
