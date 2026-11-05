# Kế hoạch triển khai MATADOOR (dựng từ đầu)

- **Căn cứ:**
  - Đặc tả: `docs/MATADOOR – Đặc tả yêu cầu phần mềm (SRS) v1.0.pdf`.
  - Quyết định giao diện: `docs/KE_HOACH_GIAO_DIEN.md` (mục 1–3: mức Giữ/Chỉnh/Hoãn/Bỏ cho từng màn, câu Q1–Q6).
  - Thiết kế: `docs/thiet-ke/` (token, component, artboard, ghi chú canvas).
- **Nhật ký thực hiện:** `docs/NHAT_KY_TRIEN_KHAI.md`. Đọc file này trước mỗi phiên.
- **Lập ngày:** 2026-11-05, khi kho `phong091095/CuaNhom` còn trống.

> Lưu ý về `KE_HOACH_GIAO_DIEN.md`: các đoạn "Đã làm …" trong file đó là của bản code cũ, không có trong kho này. Ta vẫn dùng **các quyết định** trong đó (mục 2, 3) làm căn cứ; còn tiến độ thì chỉ tính theo nhật ký của kho này.

## 1. Nguyên tắc

1. **Phạm vi:** SRS quyết định phạm vi và quy tắc nghiệp vụ; thiết kế quyết định giao diện. Khi hai bên mâu thuẫn, làm theo SRS và ghi lý do (giữ nguyên quy tắc của `KE_HOACH_GIAO_DIEN.md`).
2. **Công thức:**
   - Mọi con số đều do engine tính ra từ dữ liệu mẫu và bảng giá. Giao diện không chứa công thức (SRS mục 4).
   - Engine là TypeScript thuần, app chỉ import qua `index.ts` (SRS mục 8).
3. **Từng bước:**
   - Mỗi giai đoạn vừa một phiên. Xong giai đoạn thì typecheck, lint và test đều xanh, đã commit và push.
   - Cuối phiên ghi một mục vào nhật ký.
4. **Đổi lược đồ DB:** làm đủ bộ:
   - tăng `SCHEMA_VERSION`;
   - viết migration;
   - test nâng cấp từ DB bản trước;
   - cập nhật sao lưu và khôi phục;
   - test khôi phục được file sao lưu tạo từ bản trước.
5. **Đổi công thức mẫu cửa:** tăng `version` của mẫu, rồi chạy `npm run lock -w @matadoor/data`. Test sẽ đỏ nếu sửa mẫu mà quên tăng version.
6. **Không gửi dữ liệu ra ngoài** (NFR-SEC-01): không dùng SDK phân tích, báo lỗi hay quảng cáo. Nhật ký và báo lỗi lưu trên máy; người dùng tự bấm chia sẻ thì mới gửi đi.
7. **Làm sẵn từ đầu những đề xuất đã chốt**, rẻ hơn sửa về sau:
   - phiên bản mẫu;
   - màu nhôm, vị trí, ghi chú, thứ tự bộ cửa;
   - ẩn vật tư và kính riêng của xưởng;
   - số báo giá, thuế suất VAT;
   - logo nằm trong file sao lưu;
   - nhật ký sử dụng.

## 2. Kiến trúc

```
CuaNhom/
├─ packages/engine   @matadoor/engine – biểu thức (BR-12), tính 1 bộ (BR-01…11), tổng hợp dự án (BR-04),
│                    tối ưu cắt (4.3), báo giá OP1/OP2 (BR-10), định dạng số vi-VN, tìm bỏ dấu
├─ packages/data     @matadoor/data – mẫu cửa JSON, hệ nhôm, bảng vật tư mặc định, đáp án mẫu SRS,
│                    quy đổi giá (giá cây → giá m, hệ số nhóm), templates.lock.json
├─ apps/mobile       Expo (React Native) – Expo Router, Zustand, expo-sqlite, react-native-svg,
│                    expo-print, react-native-view-shot, expo-sharing          (từ GĐ 3)
└─ docs/             SRS, kế hoạch, nhật ký, thiết kế
```

- **Kiểm thử:**
  - `node:test` cho engine và dữ liệu, chạy qua `tsx`.
  - Jest cho app (DB, sao lưu, xuất file).
  - Maestro cho luồng giao diện đầu-cuối (SRS 10.1).
- **Lưu trữ (từ GĐ 4):**
  - Lớp repository viết trên một giao diện SQL nhỏ, theo kiểu API của `expo-sqlite`.
  - Khi test thì chạy trên `node:sqlite` (Node 22), nên không cần máy ảo.

## 3. Lộ trình

Ký hiệu trạng thái: ✅ xong · ⏳ đang làm · ☐ chưa làm. Bảng này cập nhật cùng nhật ký.

| GĐ | Nội dung | Trạng thái |
| --- | --- | --- |
| 0 | Nền móng kho mã: monorepo, tài liệu, thiết kế, CI | ✅ 2026-11-05 |
| 1 | Engine | ✅ 2026-11-05 |
| 2 | Gói dữ liệu: 2 mẫu khớp TC, bảng vật tư, đáp án mẫu, khóa phiên bản | ✅ 2026-11-05 |
| 3 | Khung app Expo, token, font, component nền, thanh tab | ✅ 2026-11-05 |
| 4 | Lưu trữ SQLite, store, sao lưu và khôi phục | ✅ 2026-11-05 |
| 5 | Nhóm B: dự án | ☐ |
| 6 | Nhóm D: chọn mẫu, nhập cửa, chi tiết cửa | ☐ |
| 7 | Nhóm E: cắt nhôm, phiếu cắt | ☐ |
| 8 | Nhóm F: tổng hợp kính, phụ kiện | ☐ |
| 9 | Nhóm G: báo giá, PDF/ảnh, lịch sử | ☐ |
| 10 | Thư viện và Cài đặt | ☐ |
| 11 | Phiên bản mẫu ("mẫu đã cập nhật") và nhập gói dữ liệu | ☐ |
| 12 | Lần đầu dùng, khóa app, nhắc sao lưu, nhật ký sử dụng | ☐ |
| 13 | Dark mode, rà soát, hiệu năng, Maestro, build thử, nghiệm thu | ☐ |

### GĐ 0 · Nền móng ✅
- npm workspaces; `.gitignore`, `.editorconfig`, `.nvmrc` (Node 22).
- Tài liệu và thiết kế trong `docs/`; CI GitHub Actions (typecheck, test, coverage).

### GĐ 1 · Engine ✅
- **Biểu thức (BR-12):**
  - Có lexer và parser riêng, không dùng `eval`.
  - Nhận các ký hiệu `× ÷ − ≤ ≥ ≠` và `and/or/not` (hoặc `&& || !`).
  - Biến chưa định nghĩa là lỗi dữ liệu, có ghi vị trí lỗi.
- **Tính một bộ cửa:**
  - Đúng thứ tự BR-01.
  - Chiều dài và kính làm tròn 0,1 mm theo kiểu Excel (BR-02).
  - Bỏ dòng có số lượng 0 (BR-03).
  - Phụ kiện: số lẻ × số bộ rồi mới làm tròn lên, có dung sai 1e-9 (BR-04).
  - Nhân công theo m² (BR-05); tiền theo BR-06; khối lượng kính theo BR-07; diện tích theo BR-08; lãi theo BR-09.
  - Kiểm tra 3 mức; chiều dài ≤ 0 là Lỗi (BR-11).
- **Tổng hợp dự án:**
  - Phụ kiện cộng số lẻ của các bộ rồi mới làm tròn (BR-04).
  - Nhôm gom theo **(mã, màu)**.
  - Kính có danh sách theo từng bộ.
- **Tối ưu cắt:** FFD, sau đó cải thiện cục bộ có giới hạn và cho kết quả cố định (xem Q14).
- **Báo giá:**
  - OP1 = Σ (giá bán 1 bộ làm tròn × số bộ).
  - OP2 gợi ý làm tròn lên bội 10.000 đ.
  - Chiết khấu, rồi VAT, rồi tổng.
  - Số báo giá `BG-YYMM-NNN`.
- **Định dạng:** `1.234.567 đ`, `2200 mm`, `2012,6 mm`, khoảng trắng không ngắt giữa số và đơn vị.
- **Đọc số người dùng gõ:** nhận cả `2012,6` và `2012.6`.
- **Tìm kiếm:** không phân biệt dấu.
- **Kết quả:** 84 test, độ phủ dòng 99,6% (yêu cầu ≥ 85%, NFR-MNT-01).

### GĐ 2 · Gói dữ liệu ✅
- **2 mẫu cửa:** dựng lại để khớp các ca SRS (xem Q15):
  - "Cửa đi mở quay 1 cánh": TC-01, 03, 05, 06.
  - "Cửa sổ lùa 2/4 cánh": TC-02.
  - TC-04, TC-07 là ca cấp dự án; TC-10 là ca sơ đồ cắt.
- **Bảng vật tư:** dùng số thật từ hồ sơ thiết kế (C3328, C3303, kính 8 ly, phụ kiện Draho, nhân công). Chỗ còn lại là giá tạm, đánh dấu `priceStatus: "tam"`.
- **Giá:** nhôm lưu giá theo cây, engine quy ra giá m (Q16). Giá bán = giá gốc × hệ số nhóm (mặc định 1,1), hoặc giá riêng (Q17).
- **Đáp án mẫu:** nằm ở `src/golden/srs-tc.json`. Test bắt buộc mỗi mẫu `verified` phải có ít nhất một ca.
- **Khóa phiên bản:** `templates.lock.json` và script `npm run lock`.

### GĐ 3 · Khung app Expo ✅
> **Đã làm (2026-11-05):** xem nhật ký Phiên 3. Ảnh chụp: `docs/anh-chup/gd3-*.png`.
>
> **Lệch thiết kế:**
> - chữ nhỏ nhất 14 (thiết kế 13);
> - nút stepper và chip cao 48 (thiết kế 44), vì NFR-USE-02 yêu cầu vùng chạm ≥ 48 dp;
> - tab Cài đặt dùng icon bánh răng;
> - nút lùi luôn có chữ "Quay lại".

- **Tạo app:** `apps/mobile` bằng Expo SDK 58 (bản mới nhất lúc lập kế hoạch) với Expo Router; import `@matadoor/engine` và `@matadoor/data` qua workspace.
- **Token** (`src/theme`):
  - Light và Dark đúng bảng bàn giao (Handoff1).
  - Thang chữ: nhỏ nhất **14** (NFR-USE-02; thiết kế ghi 13).
  - Khoảng cách 4/8; bo góc 8/12/16/20/999; đổ bóng E0–E2.
- **Font:** Be Vietnam Pro qua `@expo-google-fonts/be-vietnam-pro`; chờ nạp xong font rồi mới ẩn splash.
- **Component** (đủ trạng thái như Handoff1 mục 3):
  - Nút chính, nút phụ, nút phá hủy.
  - Ô nhập có đơn vị nằm trong ô; ô số có stepper; select dạng bottom sheet.
  - Chip lọc, segmented, thẻ danh sách, huy hiệu (luôn có icon + chữ).
  - Snackbar có Hoàn tác, bottom sheet, hộp thoại.
  - Trạng thái rỗng, trạng thái lỗi; thanh tiêu đề.
- **Màn ẩn `/dev-components`:** bày mọi component để so với artboard Components.
- **Thanh tab:** Dự án, Thư viện, Cài đặt.
- **Icon và splash:** theo logo hướng A (`LogoFinal`).
- **ESLint:** dùng `eslint-config-expo`; thêm Jest cho app.
- **Xong khi:** chạy được trên web (`npx expo start --web`) và Expo Go; đã chụp màn dev-components ở khổ 390 × 844.

### GĐ 4 · Lưu trữ ✅
> **Đã làm (2026-11-05):** xem nhật ký Phiên 4.
> - Lược đồ v1 có đủ bảng ngay từ đầu.
> - Repository, sao lưu và khôi phục, store, nối DB vào lúc mở app.
> - SQLite chạy được trên web (WASM, header COOP/COEP).
> - Thêm `domain/projectCalc.ts`: tính cả dự án theo bản chụp mẫu, dùng cho GĐ 5.

- **Bảng** (lược đồ v1 đủ cho cả MVP):
  - `workshop` (một dòng): tên, SĐT, địa chỉ, logo base64, VAT bật/tắt và thuế suất, ghi chú báo giá mẫu, tham số cắt mặc định, hệ số theo nhóm.
  - `materials` (giá do người dùng sửa): giá gốc, giá bán riêng, ẩn, nguồn (`bundled` / `user`), `updated_at`.
  - `projects`: tên công trình (bắt buộc), khách, SĐT, địa chỉ, trạng thái, tham số cắt, đơn giá OP2, `created_at`, `updated_at`, `deleted_at`.
  - `door_items`: ký hiệu, `template_id`, `template_version`, W, H, số bộ, tham số (JSON), kính (JSON), màu, vị trí, ghi chú, `sort_order`, `deleted_at`.
  - `quotes`: số báo giá, kiểu OP1/OP2, khách/nội bộ, chiết khấu, VAT, bản chụp `QuoteDoc`, ngày xuất.
  - `template_snapshots`: `(id, version)` → JSON.
  - `events`, `error_log`: nhật ký trên máy.
  - `drafts`: nháp form.
- **Code:**
  - Migration có `SCHEMA_VERSION`.
  - Repository viết trên giao diện SQL; test chạy bằng `node:sqlite`.
  - Store Zustand.
  - Sao lưu: một file JSON có phiên bản lược đồ (SRS 5.2, FR-SET-03). Khôi phục: kiểm file, xem trước nội dung, tự sao lưu dữ liệu hiện tại trước khi ghi đè; từ chối file đến từ bản app mới hơn.
- **Xóa mềm:** 30 ngày, tự xóa hẳn khi mở app.

### GĐ 5 · Nhóm B – Dự án
- B1 danh sách: tìm không dấu; xếp theo ngày sửa; trạng thái rỗng; snackbar Hoàn tác 10 giây.
- B2/B6 tạo và sửa dự án: chỉ tên công trình là bắt buộc; SĐT sai dạng chỉ nhắc.
- B3 chi tiết:
  - Thẻ tóm tắt: OP1, giá vốn, số bộ, m², đơn giá trung bình.
  - Khối "Bóc tách & báo giá".
  - Danh sách bộ cửa.
  - Huy hiệu trạng thái, chạm để đổi (FR-PRJ-04).
- B4 sheet thao tác: sửa, nhân bản, xuất, xóa.
- B7 xác nhận xóa, có gọi tên đối tượng.
- C1b "Đã xóa gần đây".
- Nhân bản dự án: chép bộ cửa và tham số; không chép báo giá; trạng thái về "Báo giá".

### GĐ 6 · Nhóm D – Bộ cửa
- **D3 chọn mẫu:**
  - Chip lọc theo nhóm (cửa đi, cửa sổ, vách), chỉ hiện nhóm đang có mẫu.
  - Nhãn "Lần trước".
- **D5 nhập cửa:**
  - Ô W/H; stepper số bộ; ký hiệu tự sinh và sửa được, chặn ký hiệu trùng.
  - Tham số mẫu; chọn kính (nhớ kính dùng lần trước); màu nhôm; vị trí, ghi chú.
  - Bản vẽ SVG theo tỉ lệ, có kích thước và ký hiệu hướng mở.
  - Giá cập nhật ngay; lỗi hiện dưới ô nhập; còn lỗi thì khóa nút Lưu.
  - Nháp tự lưu; hỏi khi thoát (kể cả bấm nút lùi Android).
- **D6 chi tiết:** tab Tổng quan, Nhôm, Kính, Phụ kiện, Nhân công; sheet thao tác (nhân bản, xóa mềm).
- **D4:** xem thông số hệ, chỉ xem (Q4).
- **D1 chọn nhiều:** xóa và nhân bản hàng loạt; chế độ sắp xếp ↑↓.

### GĐ 7 · Nhóm E – Cắt nhôm
- **E1:** thiết lập cắt theo dự án.
- **E2 tổng hợp nhôm** theo (mã, màu):
  - Số cây, kg, tiền ước tính và tiền thực mua, hao hụt (dưới 10% chữ thường; từ 10% dùng màu cảnh báo).
  - Không có kho thanh dư (FR-CUT-05 để sau MVP).
- **E3 sơ đồ cắt:**
  - Vẽ cây đúng tỉ lệ, đoạn bấm được, danh sách đoạn ngay bên dưới.
  - Dòng kiểm tra mỗi cây; cảnh báo đoạn dài hơn cây.
  - Cho xoay ngang riêng ở E3.
- **Phiếu cắt PDF** (FR-BOM-05).
- **Đo:** dự án 50 bộ phải xong trong ≤ 1 giây (NFR-PER-02).

### GĐ 8 · Nhóm F – Vật tư
- F1 kính, F2 phụ kiện (cộng số lẻ rồi mới làm tròn; chạm một dòng để xem số lẻ của từng bộ).
- Phiếu đặt kính và phiếu lấy phụ kiện, **không có giá**.
- F3 (vật tư phụ) hoãn tới khi dữ liệu có nhóm VTP riêng.

### GĐ 9 · Nhóm G – Báo giá
- **G1:**
  - OP1/OP2; OP2 gợi ý làm tròn lên bội 10.000 đ, sửa được.
  - Chiết khấu % hoặc số tiền; VAT bật/tắt và chọn thuế suất; ghi chú.
  - Khối giá vốn gập/mở.
- **G2:** xem trước tờ A4, luôn nền trắng; phóng to; xuất PDF và ảnh PNG; chia sẻ.
- **`QuoteDoc`:** bản chụp lúc xuất (FR-MAT-03). Bản cho khách không có giá vốn hay lãi (NFR-SEC-02).
- **Lịch sử báo giá:** có bản nội bộ.
- **Đo:** xuất 20 bộ trong ≤ 5 giây (NFR-PER-03).

### GĐ 10 · Thư viện và Cài đặt
- **C2 Thư viện:** thẻ theo nhóm; tìm theo mã hoặc tên.
- **Bảng giá theo nhóm:**
  - Nhôm hiện ₫/cây là chính, ₫/kg là dòng phụ.
  - Có huy hiệu "Giá riêng", ngày cập nhật.
- **C9 sheet sửa giá:** giá gốc, giá bán, hệ số; nút "Về giá gói kèm".
- **B5 hệ số nhóm** (Q1).
- **Kính:** thêm kính riêng của xưởng; ẩn kính; xóa có điều kiện (Q12).
- **Cài đặt:**
  - C1 → Cài đặt.
  - C1a thông tin xưởng và logo.
  - Mặc định cho dự án mới.
  - Sao lưu và khôi phục; nhắc sao lưu.
  - Chọn giao diện Sáng / Tối / Theo hệ thống.

### GĐ 11 · Phiên bản mẫu và gói dữ liệu (ĐX-04, ĐX-05)
- Huy hiệu "Mẫu đã cập nhật"; khối so sánh hai bản; nút "Tính theo mẫu mới", "Cập nhật tất cả".
- Nhập gói dữ liệu bằng file: kiểm cấu trúc, biểu thức, mã vật tư; chạy đáp án mẫu đi kèm gói; xem tóm tắt rồi duyệt.

### GĐ 12 · An toàn và lần đầu dùng
- Thiết lập xưởng ở lần mở đầu tiên; dự án mẫu; 3 gợi ý một lần (NFR-USE-01).
- Khóa app bằng khóa của máy, không lưu PIN riêng (NFR-SEC-01, Q11).
- Nhật ký sử dụng và màn "Thống kê sử dụng"; ErrorBoundary; "Gửi nhật ký" (file đã bỏ thông tin cá nhân).

### GĐ 13 · Hoàn thiện và nghiệm thu
- Rà Dark mode trên mọi màn; chữ hệ thống lớn; khổ 360 pt; máy tính bảng; TalkBack.
- **Hiệu năng:** đo NFR-PER-01…04 trên thiết bị chuẩn (Helio G85, RAM 4 GB), ghi vào `docs/DO_HIEU_NANG.md`.
- **Dung lượng:** gói cài ≤ 40 MB (NFR-SIZE-01).
- **Maestro:** luồng 3 bước, thêm bộ cửa, xuất báo giá, chặn khi có lỗi; TC-09 (chế độ máy bay).
- **Build thử:** EAS build profile `preview`; kênh thử nghiệm nội bộ của Google Play.
- **Nghiệm thu:** rà danh sách điều kiện phát hành ở SRS 10.2.

## 4. Ma trận truy vết (cập nhật khi xong mỗi GĐ)

| Yêu cầu | Code | Test |
| --- | --- | --- |
| BR-01…BR-03, BR-05…BR-09, BR-11 | `packages/engine/src/compute.ts` | `packages/engine/test/compute.test.ts` |
| BR-04 | `compute.ts`, `project.ts`, `round.ts` | `compute.test.ts`, `project-quote.test.ts`, TC-03, TC-04 |
| BR-10, FR-QUO-01, FR-QUO-05 | `packages/engine/src/quote.ts` | `project-quote.test.ts`, TC-07 |
| BR-12 | `packages/engine/src/expr/index.ts` | `expr.test.ts` |
| SRS 4.3, FR-CUT-01, 03, 04 (engine) | `packages/engine/src/cut.ts` | `cut.test.ts`, TC-10 |
| FR-BOM-04 (engine) | `packages/engine/src/project.ts` | `project-quote.test.ts`, TC-04 |
| NFR-ACC-01 | `packages/data/src/templates/*.json` | `packages/data/test/golden.test.ts` (TC-01…07, 10) |
| NFR-USE-03 | `packages/engine/src/format.ts` | `format.test.ts` |
| NFR-MNT-01 | `validate.ts`, `templates.lock.json` | `data.test.ts`, `npm run coverage` |
| NFR-USE-02 (tương phản AA, chữ ≥ 14, vùng chạm ≥ 48) | `apps/mobile/src/theme/tokens.ts`, `src/ui/*` | `apps/mobile/src/theme/__tests__/tokens.test.ts` |
| NFR-USE-03 (không ngắt số–đơn vị) | `format.ts` (`bindUnits`) | `format.test.ts` |
| FR-MAT-02 (quy đổi giá) | `packages/data/src/pricing.ts` | `data.test.ts` |
| FR-PRJ-01…04 (lưu trữ) | `apps/mobile/src/db/repos/projects.ts` | `src/db/__tests__/projects.test.ts` |
| FR-DOR-02, 05, 08, "thứ tự" (lưu trữ) | `src/db/repos/doors.ts`, `src/domain/symbols.ts` | `doors.test.ts`, `symbols.test.ts` |
| FR-MAT-01, 02, SRS 5.2 (ẩn, không xóa vật tư mẫu) | `src/db/repos/materials.ts`, `src/domain/pricing.ts` | `materials.test.ts` |
| FR-MAT-03 (bản chụp báo giá) | `src/db/repos/quotes.ts` | `quotes-misc.test.ts`, `projectCalc.test.ts` (TC-08 qua lưu trữ) |
| FR-SET-01, 02 (lưu trữ) | `src/db/repos/workshop.ts` | `quotes-misc.test.ts` |
| FR-SET-03 | `src/db/backup.ts` | `backup.test.ts` |
| SRS 5.2 (phiên bản mẫu, tính lại khi mở) | `src/db/repos/snapshots.ts`, `src/domain/projectCalc.ts` | `projectCalc.test.ts`, `quotes-misc.test.ts` |
| Q2 (xóa mềm 30 ngày) | `src/db/repos/trash.ts` | `projects.test.ts`, `doors.test.ts` |
| NFR-REL-01 (nháp) | `src/db/repos/drafts.ts` | `quotes-misc.test.ts` |
| TC-04 qua lưu trữ | `src/domain/projectCalc.ts` | `projectCalc.test.ts` |
| TC-08 (giao diện), TC-09 | — | GĐ 9, GĐ 13 |

## 5. Quyết định đã chốt

Q1–Q6 ở `KE_HOACH_GIAO_DIEN.md`. Các câu dưới đây chốt theo đề xuất (chủ dự án đã giao toàn quyền). Muốn đổi thì sửa bảng này trước rồi mới sửa code.

| Mã | Câu hỏi | Đã chốt | Lý do |
| --- | --- | --- | --- |
| Q7 | Màu nhôm có tách nhóm khi cắt không? | **Có**, nhóm theo (mã, màu) | Cây khác màu là hàng khác nhau. Dự án một màu thì kết quả không đổi. |
| Q8 | Tiền trên bản gửi khách | Tính từ số đã làm tròn từng dòng | Khách cộng tay ra đúng số in. Engine giữ số thực. |
| Q9 | Ghi chú bộ cửa có in lên báo giá khách không? | **Không**, chỉ in vị trí | Ghi chú thường là chuyện nội bộ; lời nhắn cho khách đã có ghi chú báo giá. |
| Q10 | Cập nhật gói dữ liệu | **Bằng file trước**, OTA để sau | Giữ được offline; không cần máy chủ. |
| Q11 | Khóa app | Dùng khóa của máy, không lưu PIN riêng | Không phải giữ mã bí mật; quên PIN không mất dữ liệu. |
| Q12 | Xưởng được thêm vật tư ở nhóm nào? | Chỉ Kính | Nhôm và phụ kiện chỉ có nghĩa khi mẫu cửa tham chiếu tới. |
| Q13 | Mẫu "Chờ dữ liệu" có hiện ở bản phát hành không? | **Không** (chỉ hiện ở bản dev) | SRS 4.4. |
| Q14 | Tiêu chí chất lượng cắt ở SRS 4.3 | Xem dưới bảng | |
| Q15 | Thiếu `cửa_mẫu.xlsx` và engine v0.1 | Xem dưới bảng | |
| Q16 | Giá nhôm | Lưu ₫/cây; engine quy ra ₫/m | Ghi chú thiết kế "nhôm tính theo cây"; BR-06 tính theo m. |
| Q17 | Hệ số lợi nhuận mặc định | 1,1 cho mọi nhóm | Thiết kế B3 ghi "Báo giá (+10%)". Xưởng sửa ở B5 (Q1). |
| Q18 | Mã nhôm cửa lùa | Mã tạm `XF-L-*`, tên có ghi "(mã chờ xác nhận)" | Thiết kế và SRS chưa có mã thật. |
| Q19 | Ký hiệu bộ cửa khi xóa | Không đánh số lại. Bộ mới lấy số lớn nhất + 1 (tính cả bộ trong thùng rác). Khôi phục mà ký hiệu đã bị dùng thì đổi sang số kế tiếp | Ký hiệu đã ghi lên bản vẽ và phiếu cắt (câu 5 trong ghi chú canvas). |
| Q20 | VAT mặc định | Tắt, thuế suất 8% khi bật, sửa được | Hồ sơ thiết kế: "mặc định tắt, đang để 8%". |
| Q21 | Số báo giá | `BG-YYMM-NNN`, đánh lại từ 001 mỗi tháng, theo từng máy | Ngắn, đọc qua điện thoại được; MVP chỉ một máy (SRS 2.2). |
| Q22 | Khôi phục sao lưu | Thay toàn bộ dữ liệu trong một giao dịch. Giữ nháp, nhật ký và cài đặt riêng của máy. Từ chối file từ bản app mới hơn | SRS 5.2; an toàn khi file hỏng hoặc khôi phục lỗi giữa chừng. Tự sao lưu trước khi khôi phục làm ở GĐ 10 (cần file hệ thống). |

**Q14 – Tiêu chí chất lượng cắt (SRS 4.3).** Tiêu chí "≤ cận dưới + 1 cây" **không phải lúc nào cũng đạt được** về mặt toán học.
- Phản ví dụ, có test: 49 cửa 1200 × 2800. Mỗi cây chỉ chứa được 2 thanh 2800 và không còn chỗ cho thanh 1200, nên tối ưu thật là 62 cây, trong khi cận dưới theo SRS là 58.
- Đã chốt:
  1. Engine không bao giờ dùng nhiều cây hơn FFD.
  2. Dự án hỗn hợp dưới 50 bộ: đạt ≤ cận dưới SRS + 1.
  3. Có báo thêm cận dưới chặt (L2) để đối chiếu.
- **Cần chủ dự án sửa câu chữ trong SRS 4.3.**

**Q15 – Thiếu `cửa_mẫu.xlsx` và engine v0.1.**
- Đã chốt: dựng lại công thức sao cho khớp 100% các ca TC trong SRS, ghi rõ nguồn trong trường `source` của mẫu, và đánh dấu số tạm.
- Lý do: kho mã mới, không có file gốc.
- **Khi có file gốc phải đối chiếu lại các thanh không có trong TC** (ví dụ nẹp ngang) và toàn bộ phụ kiện.

## 6. Việc ngoài code (chủ dự án / chuyên gia)

| Việc | Ảnh hưởng | Trạng thái |
| --- | --- | --- |
| Gửi `cửa_mẫu.xlsx` (sheet G-AD2, G-AW1, G-AW2) và `QUYET_DINH.md` | Đối chiếu 2 mẫu đã dựng lại (Q15) | Chờ |
| Sheet tính và đáp án mẫu cho 4 mẫu còn lại (cửa đi 2 cánh, cửa sổ mở quay 1–2 cánh, cửa sổ mở hất, vách kính) | Cổng 1 | Chờ |
| Bảng giá VAT_TU gốc; mã nhôm thật của cửa lùa; nhóm vật tư phụ | Giá; Q18; màn F3 | Chờ |
| Xác nhận 12 điểm điều chỉnh và giới hạn kỹ thuật (A4, A5) | Điều kiện phát hành 10.2 | Chờ |
| Sửa tiêu chí chất lượng cắt ở SRS 4.3 (Q14) | Nghiệm thu | Chờ |
| Dài cây chuẩn: 5.800 hay 6.000 mm | FR-SET-02 | Chờ |
| Thiết bị chuẩn để đo; 2–3 xưởng thử | GĐ 13, cổng 3 | Chờ |
