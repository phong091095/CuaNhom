/**
 * Khóa phiên bản mẫu cửa (SRS 5.2, đề xuất ĐX-04): nội dung mẫu đổi thì version phải tăng.
 * templates.lock.json ghi id → { version, sha256 } của từng mẫu.
 */
import { createHash } from 'node:crypto';
import type { DoorTemplate } from '@matadoor/engine';

export interface LockEntry {
  version: number;
  sha256: string;
}
export type LockFile = Record<string, LockEntry>;

/** JSON có khóa xếp theo thứ tự chữ cái, để hash không phụ thuộc thứ tự khóa. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson((value as Record<string, unknown>)[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function templateHash(t: DoorTemplate): string {
  return createHash('sha256').update(canonicalJson(t)).digest('hex');
}

export function buildLock(templates: readonly DoorTemplate[]): LockFile {
  const out: LockFile = {};
  for (const t of [...templates].sort((a, b) => a.id.localeCompare(b.id))) {
    out[t.id] = { version: t.version, sha256: templateHash(t) };
  }
  return out;
}
