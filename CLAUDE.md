# Hướng dẫn cho phiên làm việc

## Theo dõi tiến độ
- Trước khi làm: đọc `docs/NHAT_KY_TRIEN_KHAI.md`, mục "Phiên tới bắt đầu từ đây".
- Mỗi phiên chỉ làm một giai đoạn (GĐ) trong `docs/KE_HOACH_TRIEN_KHAI.md`.
- Sau khi làm:
  - thêm một mục nhật ký (theo mẫu cuối file nhật ký);
  - cập nhật bảng trạng thái (mục 3) và ma trận truy vết (mục 4) trong `docs/KE_HOACH_TRIEN_KHAI.md`;
  - commit "GĐ n: …".

## Quy tắc
- **Căn cứ:** SRS (`docs/*.pdf`) quyết định phạm vi và quy tắc. Thiết kế (`docs/thiet-ke/`, `docs/KE_HOACH_GIAO_DIEN.md`) quyết định giao diện. Khi mâu thuẫn, làm theo SRS và ghi lý do.
- **Công thức:** chỉ nằm trong dữ liệu mẫu cửa và engine (`packages/engine`), không viết trong giao diện. App import engine qua `@matadoor/engine`.
- **Sửa mẫu cửa:**
  - Tăng `version` rồi chạy `npm run lock -w @matadoor/data`.
  - Mỗi mẫu `verified` phải có đáp án mẫu trong `packages/data/src/golden/srs-tc.json`.
- **Định dạng:** tiền `1.234.567 đ`, kích thước `2200 mm` (không ngăn nghìn), số thập phân dùng dấu phẩy, khoảng trắng không ngắt giữa số và đơn vị. Dùng các hàm trong `packages/engine/src/format.ts`.
- **Mạng:** không thêm thư viện gửi dữ liệu ra ngoài (phân tích, báo lỗi, quảng cáo) – NFR-SEC-01.
- **Giao diện:** toàn bộ tiếng Việt, không hiện mã màn (SCR-…) hay ghi chú dev.
- **Dữ liệu:** mọi đọc/ghi DB đi qua repository trong `apps/mobile/src/db/repos` và `getDb()`; không gọi expo-sqlite trực tiếp từ màn hình. Đổi lược đồ: tăng `SCHEMA_VERSION`, thêm migration, thêm `BACKUP_UPGRADES`, viết test nâng cấp.
- **Cài gói Expo:** proxy chặn `npx expo install`; lấy phiên bản trong `node_modules/expo/bundledNativeModules.json` rồi `npm install -w @matadoor/mobile <gói>@<bản>`.

## Lệnh
- `npm test` – test mọi gói
- `npm run typecheck`
- `npm run coverage` – độ phủ engine và lớp lưu trữ của app (ngưỡng 85%)
- `npm run lock -w @matadoor/data` – cập nhật khóa phiên bản mẫu
