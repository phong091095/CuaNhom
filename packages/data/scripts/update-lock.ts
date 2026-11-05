/**
 * Cập nhật templates.lock.json sau khi đã TĂNG version của mẫu vừa sửa.
 * Từ chối nếu một mẫu đổi nội dung mà version giữ nguyên.
 * Chạy: npm run lock -w @matadoor/data
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { TEMPLATES } from '../src/index';
import { buildLock, type LockFile } from './lockfile';

const path = fileURLToPath(new URL('../templates.lock.json', import.meta.url));
let old: LockFile = {};
try {
  old = JSON.parse(readFileSync(path, 'utf8')) as LockFile;
} catch {
  old = {};
}
const next = buildLock(TEMPLATES);
const problems: string[] = [];
for (const [id, e] of Object.entries(next)) {
  const prev = old[id];
  if (prev && prev.sha256 !== e.sha256 && prev.version >= e.version) {
    problems.push(`Mẫu "${id}" đổi nội dung nhưng version vẫn là ${e.version}: hãy tăng version.`);
  }
}
if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exit(1);
}
writeFileSync(path, `${JSON.stringify(next, null, 2)}\n`);
console.log(`Đã ghi ${Object.keys(next).length} mẫu vào templates.lock.json`);
