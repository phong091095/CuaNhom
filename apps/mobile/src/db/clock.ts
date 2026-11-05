/** Đồng hồ và sinh id dùng chung cho repository; test thay được để kết quả cố định. */

let nowFn: () => number = () => Date.now();
let idFn: () => string = defaultId;

function defaultId(): string {
  const rand = Math.random().toString(36).slice(2, 10).padEnd(8, '0');
  return `${Date.now().toString(36)}${rand}`;
}

export function now(): number {
  return nowFn();
}

export function newId(): string {
  return idFn();
}

/** Chỉ dùng trong test. */
export function setClock(fn: () => number): void {
  nowFn = fn;
}

/** Chỉ dùng trong test. */
export function setIdGenerator(fn: () => string): void {
  idFn = fn;
}

export function resetClock(): void {
  nowFn = () => Date.now();
  idFn = defaultId;
}

export const DAY_MS = 24 * 60 * 60 * 1000;
