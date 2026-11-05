# Nhật ký triển khai MATADOOR

Đây là nơi theo dõi tiến độ. Đầu mỗi phiên đọc file này; cuối mỗi phiên ghi tiếp.

- Kế hoạch và lộ trình: `docs/KE_HOACH_TRIEN_KHAI.md` (bảng trạng thái ở mục 3, quyết định Q7–Q18 ở mục 5).
- Quyết định giao diện: `docs/KE_HOACH_GIAO_DIEN.md`. Thiết kế: `docs/thiet-ke/`.

## Cách dùng

1. **Đầu phiên:** đọc mục "Phiên tới bắt đầu từ đây".
2. **Trong phiên:** chỉ làm một giai đoạn. Gặp chỗ phải lệch kế hoạch thì ghi ngay, kèm lý do.
3. **Cuối phiên:**
   - Chạy `npm run check` (gồm typecheck, lint, test) và `npm run coverage`.
   - Thêm một mục vào "Các phiên" (mới nhất ở trên), theo mẫu cuối file.
   - Cập nhật bảng trạng thái và ma trận truy vết trong `KE_HOACH_TRIEN_KHAI.md`.
   - Commit theo mẫu "GĐ n: …", rồi push.

## Phiên tới bắt đầu từ đây

**GĐ 3 · Khung app Expo** (chi tiết ở `KE_HOACH_TRIEN_KHAI.md` mục 3):
1. Tạo `apps/mobile`: lấy mẫu `expo-template-default` của SDK 58, bỏ phần ví dụ. Thêm `@matadoor/engine` và `@matadoor/data` vào dependencies dạng workspace. Kiểm Metro đọc được file `.ts` và `.json` của workspace.
2. Viết `src/theme/tokens.ts`: Light/Dark đúng Handoff1, kể cả các màu phụ (`primarySoft`, `onPrimarySoft`, `warningSoft`, `errorSoft`, `snack`…). Lấy từ hàm `tokens()` trong `docs/thiet-ke/artboard/ProjectList.dc.html`.
3. Nạp font Be Vietnam Pro; dựng các component nền và màn `/dev-components`; thanh tab 3 mục.
4. Thêm ESLint (`eslint-config-expo`) và Jest cho app; sửa CI để chạy cả hai.
5. Chạy thử bản web và chụp màn hình ở khổ 390 × 844.

## Việc tồn

- [ ] **Chủ dự án:** nếu còn giữ `cửa_mẫu.xlsx`, `QUYET_DINH.md` hoặc mã engine v0.1 cũ, đưa vào `docs/nguon/` để đối chiếu 2 mẫu đã dựng lại (Q15).
- [ ] **Chủ dự án:** xem Q14 (tiêu chí cắt SRS 4.3 không phải lúc nào cũng đạt được) và Q7–Q18.
- [ ] Các việc ngoài code ở `KE_HOACH_TRIEN_KHAI.md` mục 6.
- [ ] Lint: hiện chưa có cấu hình ESLint, sẽ thêm ở GĐ 3 cùng app. `npm run lint` lúc này không chạy gì.

## Các phiên

### 2026-11-05 · Phiên 2 · GĐ 0, 1, 2 – Nền móng, engine, gói dữ liệu

- **Bối cảnh:** kho `phong091095/CuaNhom` trống. Chủ dự án yêu cầu viết lại từ đầu. Không có `cửa_mẫu.xlsx` và engine v0.1, nên dựng engine mới theo SRS và dựng lại dữ liệu mẫu theo các ca TC trong SRS.
- **Đã làm:**
  - **GĐ 0:**
    - npm workspaces (`packages/*`, `apps/*`); `.gitignore`, `.editorconfig`, `.nvmrc`.
    - Chép SRS và `KE_HOACH_GIAO_DIEN.md` vào `docs/`.
    - Lưu thiết kế vào `docs/thiet-ke/`, vì link artifact có thể mất quyền truy cập:
      - 31 artboard HTML;
      - `canvas.json`;
      - hồ sơ bàn giao trích chữ (`HO_SO_BAN_GIAO.md`);
      - ghi chú canvas (`GHI_CHU_CANVAS.txt`).
    - CI GitHub Actions.
  - **GĐ 1 – `packages/engine`:**
    - Bộ đọc biểu thức BR-12, không dùng eval.
    - `computeDoor` theo BR-01…11; `validateTemplate`.
    - `summarizeProject` (BR-04 ở cấp dự án; nhôm theo mã + màu) và `collectCutPieces`.
    - `optimizeCuts`: FFD, sau đó cải thiện cục bộ, kết quả cố định; có cận dưới SRS và cận dưới L2.
    - Báo giá OP1/OP2, chiết khấu, VAT, số báo giá.
    - Định dạng vi-VN; đọc số người dùng gõ; tìm không dấu.
  - **GĐ 2 – `packages/data`:**
    - 2 mẫu cửa (khớp TC-01…07, 10); 26 vật tư; hệ Xingfa 55.
    - Đáp án mẫu SRS ở `srs-tc.json`.
    - Quy đổi giá (giá cây → giá m, hệ số nhóm, giá riêng, ₫/kg).
    - `templates.lock.json` và script `npm run lock`.
  - **Tài liệu:** viết lại kế hoạch cho hướng dựng từ đầu (`KE_HOACH_TRIEN_KHAI.md`). File `KE_HOACH_HOAN_THIEN_MVP.md` của phiên 1 viết cho code cũ nên bỏ; nội dung ĐX-01…14 đã gộp vào lộ trình mới.
- **Kiểm thử:**
  - `npm test -w @matadoor/engine`: 84/84 đạt.
  - `npm run coverage`: dòng 99,58%, nhánh 97,31%, hàm 100%.
  - `npm test -w @matadoor/data`: 25/25 đạt, gồm TC-01, 02, 03, 04, 05, 06, 07 (diện tích và quy tắc OP2), 10.
  - `npm run typecheck` ở cả hai gói: sạch.
- **Lỗi thật mà test bắt được:** tên biến `constructor` / `toString` bị nhận nhầm là toán tử, vì bảng toán tử là object thường. Đã sửa bằng `Map`, có test.
- **Lệch so với kế hoạch / SRS, và lý do:**
  - **Q14:** tiêu chí "≤ cận dưới + 1" ở SRS 4.3 không phải lúc nào cũng đạt được. Có phản ví dụ thành test: 49 cửa 1200 × 2800 cần tối ưu 62 cây, cận dưới là 58. Thêm bước cải thiện sau FFD:
    - Dự án hỗn hợp: luôn ≤ cận dưới SRS + 1 (200 dự án ngẫu nhiên).
    - Cửa lùa: ≤ L2 + 1.
    - Khung cửa đi toàn thanh gần nửa cây: có thể hơn L2 tới 3, vì L2 lỏng.
  - **Q15:** công thức mẫu dựng lại theo TC:
    - Hằng số `canhLotNgang = 87`, `canhLotDung = 68.2`, `kinhHutDung = 5` được suy ra để khớp TC-01, chưa có căn cứ từ sheet gốc.
    - Phụ kiện ngoài silicone, nêm, bản lề là số tạm.
  - **TC-07:** OP1 = 17.628.149 đ dựa trên bảng giá trong file Excel mà kho không có. Test chỉ kiểm diện tích 7,465 m² và quy tắc gợi ý OP2 với đúng số OP1 của SRS → 2.370.000 đ/m².
- **Commit:** "GĐ 0–2: nền móng monorepo, engine tính toán, gói dữ liệu mẫu".
- **Bước tiếp theo:** GĐ 3 (xem mục "Phiên tới bắt đầu từ đây").

### 2026-11-05 · Phiên 1 · Đối chiếu SRS với kế hoạch giao diện

- **Bối cảnh:** chưa gắn được kho mã, chỉ có SRS và `KE_HOACH_GIAO_DIEN.md`.
- **Đã làm:**
  - Đọc toàn bộ SRS: 41 FR, 15 NFR, BR-01…12, quy tắc 5.2, TC-01…10.
  - Tìm ra các khoảng trống:
    - FR-DOR-05, FR-DOR-08, FR-SET-04;
    - khóa app (NFR-SEC-01), hướng dẫn lần đầu (NFR-USE-01), máy tính bảng (NFR-CMP-01), dung lượng (NFR-SIZE-01);
    - "mẫu đã cập nhật" và ẩn vật tư (5.2);
    - tìm vật tư theo mã hoặc tên (FR-MAT-01).
  - Viết 14 đề xuất ĐX-01…14 và các câu Q7–Q13. Ở phiên 2 tất cả đã gộp vào `KE_HOACH_TRIEN_KHAI.md`.
- **Kiểm thử:** không có code.

---

## Mẫu mục nhật ký

```
### YYYY-MM-DD · Phiên N · GĐ x – <tên giai đoạn>

- Bối cảnh: …
- Đã làm:
  - …
- File chính: `đường/dẫn` (…)
- DB: SCHEMA_VERSION a → b; migration …; test nâng cấp …   (bỏ dòng này nếu không đổi DB)
- Kiểm thử:
  - `npm run check` → …
  - `npm run coverage` → …%
  - Giao diện: web 390 × 844 / 360 × 800 – …; Maestro – …
- Con số: dự án mẫu trước/sau giống nhau | đổi có chủ đích ở …
- Lệch so với kế hoạch và lý do:
  - …
- Việc dở / phát sinh: …
- Commit: "GĐ x: …"
- Bước tiếp theo: …
```
