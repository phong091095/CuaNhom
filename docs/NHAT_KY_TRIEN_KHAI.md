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

**GĐ 6b · Chi tiết cửa (D6), thông số hệ (D4), chọn nhiều và sắp xếp (D1).** Artboard: `DoorDetail`, `DoorsList*`, `DoorsSetup*`, `canvas.json`.

1. **D6** `src/app/du-an/[id]/cua/[doorId]/index.tsx` (SRS SCR-05):
   - Thẻ đầu: bản vẽ nhỏ, ký hiệu, mẫu, kích thước, số bộ, giá bán 1 bộ, giá vốn, lãi.
   - Tab Tổng quan (bản vẽ lớn, thông số, chi phí theo nhóm) · Nhôm · Kính · Phụ kiện · Nhân công.
   - Tab Nhôm (FR-BOM-01): mã, tên, chiều dài 0,1 mm, góc cắt, vị trí, số lượng, kg; nhóm theo mã nhôm.
   - Tab Kính (FR-BOM-02): rộng × cao, số tấm, m², kg/tấm.
   - Tab Phụ kiện (FR-BOM-03): số lẻ và số lấy, đơn vị.
   - Thanh tiêu đề: "Sửa" (mở D5 sửa) và "⋯" (sheet: nhân bản `duplicateDoor`, xóa mềm `softDeleteDoors` + Hoàn tác `restoreDoor`).
   - "Mẫu đã cập nhật": chỉ hiện huy hiệu; phần so sánh và cập nhật làm ở GĐ 11.
2. **Đổi luồng:**
   - Chạm dòng cửa ở B3 → mở D6 (không mở thẳng form sửa nữa).
   - Lưu cửa mới ở D5 → sheet "Thêm cửa tiếp" vẫn giữ; thêm lựa chọn "Xem bộ cửa vừa lưu" → D6.
   - Sửa xong → về D6.
3. **D4** `src/app/mau/[templateId].tsx` (chỉ xem, Q4):
   - Tab Khe hở (hằng số kèm ghi chú) · Profile nhôm (vai trò, mã, công thức dài, số lượng, góc) · Giới hạn (các kiểm tra kỹ thuật).
   - Biểu thức đổi sang chữ: thêm hàm `describeExpr` vào engine (ví dụ `soCanh == 2 and W < 800` → "Số cánh = 2 và Rộng < 800"), có test.
   - Vào từ D5 (thẻ mẫu) và D6 ("Thông số hệ").
4. **D1 trong B3** (artboard `DoorsListSelect`):
   - Nút "Chọn" hoặc nhấn giữ một dòng để vào chế độ chọn nhiều; thanh đáy Xong · Nhân bản · Xóa (xóa mềm + Hoàn tác).
   - Chế độ "Sắp xếp" với nút ↑ ↓ (`moveDoor`).
5. **Test:**
   - D6 hiện đúng TC-01: cánh ngang 718 × 2, cánh đứng 2149 × 2, nẹp đứng 2012,6 × 2, kính 574 × 2007,6.
   - Nhân bản / xóa / Hoàn tác ở D6; chọn nhiều xóa 2 bộ rồi Hoàn tác; sắp xếp lại.
   - `describeExpr` (engine, node:test).
   - Chụp web 390/360, sáng/tối.

## Việc tồn

- [ ] **Chủ dự án:** nếu còn giữ `cửa_mẫu.xlsx`, `QUYET_DINH.md` hoặc mã engine v0.1 cũ, đưa vào `docs/nguon/` để đối chiếu 2 mẫu đã dựng lại (Q15).
- [ ] **Chủ dự án:** xem Q14 (tiêu chí cắt SRS 4.3 không phải lúc nào cũng đạt được) và Q7–Q18.
- [ ] Các việc ngoài code ở `KE_HOACH_TRIEN_KHAI.md` mục 6.
- [ ] **Chưa chạy trên máy thật / Expo Go:** container không có thiết bị. Chủ dự án chạy `npm install` ở gốc kho, rồi `npx expo start` trong `apps/mobile`, quét QR bằng Expo Go (phải là bản hỗ trợ SDK 58) và báo lại lỗi nếu có.
- [ ] **Mã ứng dụng** `vn.matadoor.app` (Android package, iOS bundle id) là tạm: chốt trước khi đưa lên cửa hàng.

## Các phiên

### 2026-11-06 · Phiên 6 · GĐ 6a – Chọn mẫu (D3), nhập cửa (D5), bản vẽ

- **Bối cảnh:** chủ dự án nhắn "làm tiếp đi". Phiên mới (container còn nguyên `node_modules`). Đã đọc mục "Phiên tới".
- **Môi trường:** thêm setup script cho môi trường cloud cá nhân "Phongtt": `npm ci` trong thư mục repo (`cuanhom` hoặc `CuaNhom`). Đã chạy thử script trong phiên này (43 giây, 1291 gói). Script chỉ chạy khi một phiên mới tạo container từ đầu, nên chưa kiểm ở phiên thật.
- **Đã làm:**
  - **D3** `src/app/du-an/[id]/them-cua.tsx`:
    - Lưới thẻ mẫu (bản vẽ nhỏ + tên + nhóm).
    - Chip lọc "Tất cả (2)", "Cửa đi (1)", "Cửa sổ (1)", chỉ hiện nhóm đang có mẫu.
    - Nhãn "Lần trước"; ghi sự kiện `door_started`.
  - **D5** `src/features/doors/DoorForm.tsx` (route `cua/moi.tsx`, `cua/[doorId]/sua.tsx`):
    - Dải chip nhảy nhanh (cuộn ngang).
    - Thông tin chung: ký hiệu gợi ý, chặn trùng; số bộ (stepper); tham số lựa chọn dạng segmented; màu nhôm.
    - Kích thước: W, H nhận "2012,6"; tham số số; bản vẽ cập nhật ngay; diện tích 1 bộ.
    - Kính: chỉ kính không ẩn, nhớ kính dùng lần trước theo mẫu; dòng kích thước tấm, số tấm, kg/tấm.
    - Vị trí (chip gợi ý) và ghi chú.
    - Khối "Kiểm tra kỹ thuật": lỗi/cảnh báo/thông tin không gắn được với ô nào.
    - Giá theo Thư viện: giá vốn theo nhóm, giá vốn và giá bán 1 bộ.
    - Thanh đáy: "Tạm tính · N bộ · m²" + tổng, hoặc "Còn N ô cần sửa · Xem" (nhảy tới ô lỗi); Lưu khóa khi còn lỗi.
    - Sau khi lưu: sheet Thêm cửa cùng loại (giữ mẫu, tham số, kính, màu, vị trí; ký hiệu kế tiếp) · Khác loại (về D3) · Xong.
    - Sửa bộ cửa tính theo bản chụp đúng phiên bản mẫu của bộ đó.
    - Sự kiện `door_saved` ghi số giây kể từ lúc mở D3.
  - **Bản vẽ** `src/features/doors/DoorDrawing.tsx` (SVG theo tỉ lệ):
    - Cửa mở quay: khung 3 cạnh + đường nền, cánh, kính; tam giác hướng mở có đỉnh ở phía bản lề (nét đứt = mở vào trong); tay nắm.
    - Cửa lùa: các cánh chồng nhau, mũi tên lùa.
    - Có kích thước W, H và nhãn cho trình đọc màn hình.
  - **Nghiệp vụ** `src/domain/doorForm.ts`: đọc số, gắn lỗi/cảnh báo theo ô, đếm ô lỗi, `canSave`, chuyển sang đầu vào DB, gợi ý vị trí.
  - **Dùng chung:**
    - `src/features/forms/useFormGuard.tsx` (nháp tự lưu + hỏi khi rời); `ProjectForm` đã chuyển sang dùng.
    - `ColorField` (ô màu mẫu + "Màu khác…"); `Body` nhận ref.
    - Dữ liệu: danh sách màu nhôm của hệ Xingfa 55 trong `systems.json` (tên và mã màu theo artboard).
  - **B3:** thanh đáy "Thêm bộ cửa"; chạm dòng cửa mở form sửa (tạm, tới khi có D6).
  - **Cài đặt:** khóa `lastTemplateId`, `lastGlass.<mẫu>`, `afterSaveChoice`.
- **Kiểm thử:**
  - App 152/152 (16 bộ). Engine 87, dữ liệu 26. Typecheck, lint sạch.
  - Nghiệp vụ form: 14 ca, gồm TC-05, TC-06 và hiệu năng (NFR-PER-01: trung bình < 5 ms mỗi lần đánh giá).
  - Giao diện: 10 ca trên router thật:
    - D3: lọc nhóm.
    - D5:
      - TC-05 qua giao diện (lỗi dưới ô W, "Còn 1 ô cần sửa", Lưu khóa);
      - TC-06 (4 bản lề) → lưu → B3;
      - W/H trống khi bấm Lưu;
      - ký hiệu trùng;
      - cửa lùa 2 → 4 cánh ra đúng kính 1130,5 × 1172 rồi 525 × 1172 × 4 (TC-02);
      - thêm cửa cùng loại; "Lần trước";
      - sửa từ B3; nháp; hỏi khi rời.
  - Web (dev server, Chromium): chạy hết luồng B3 → D3 → D5 (TC-05, TC-06, màu, lưu, thêm cùng loại) → B3 ở 390 sáng, 390 tối, 360. Không lỗi console.
- **Lỗi bắt được và đã sửa:** chip nhảy nhanh xuống 2 dòng; dự án mẫu ghi "Trắng sứ" không khớp danh sách màu; lint React Compiler (ref và `Date.now()` lúc render).
- **Commit:** "GĐ 6a: chọn mẫu, nhập bộ cửa, bản vẽ".
- **Bước tiếp theo:** GĐ 6b (xem mục "Phiên tới bắt đầu từ đây").

### 2026-11-05 · Phiên 5 · GĐ 5 – Nhóm B: dự án

- **Bối cảnh:** chủ dự án nhắn "làm tiếp đi". Đã đọc mục "Phiên tới" và làm GĐ 5 theo artboard `ProjectList`, `ProjectForm`, `ProjectDetail`, `ProjectSheets`.
- **Đã làm:**
  - **B1** `src/app/(tabs)/index.tsx`:
    - Tiêu đề kèm số dự án; ô tìm `SearchField` (tìm không dấu).
    - Thẻ dự án `features/projects/ProjectCard.tsx`: tên, trạng thái, khách, địa chỉ, SĐT, "N loại · M bộ" hoặc "Chưa có cửa", báo giá OP1.
    - Skeleton khi tải; trạng thái rỗng kèm "Tạo dự án đầu tiên"; "Không tìm thấy dự án".
    - Nút nổi "Tạo dự án", ẩn khi snackbar đang hiện.
    - OP1 của mọi dự án tính một lượt: `computeProjectTotals` đọc bảng giá và bản chụp mẫu một lần.
  - **B2/B6** `src/app/du-an/moi.tsx`, `[id]/sua.tsx` → `features/projects/ProjectForm.tsx`:
    - Tên công trình (bắt buộc, lỗi dưới ô), khách, SĐT, địa chỉ.
    - SĐT sai dạng chỉ nhắc bằng màu cảnh báo, không chặn lưu; nhận 10–11 số hoặc +84 theo artboard.
    - Nháp tự lưu sau 500 ms; mở lại thì điền lại kèm thông báo.
    - Rời màn khi chưa lưu thì hỏi "Bỏ thay đổi?" (`usePreventRemove` + `repeat()`).
    - Tạo xong mở thẳng B3.
  - **B3** `src/app/du-an/[id]/index.tsx`:
    - Tên, khách · địa chỉ, SĐT bấm để gọi; huy hiệu trạng thái bấm để đổi (`StatusSheet`).
    - Thẻ báo giá dùng token `hero`: OP1, giá vốn, số bộ, m², đơn giá trung bình, lãi dự kiến – mỗi số ghi căn cứ.
    - Lưới 2 cột "Bóc tách & báo giá" (về 1 cột khi chữ hệ thống > 120%).
    - Danh sách bộ cửa: ký hiệu, mẫu, màu, kích thước, m², kính, vị trí, "số bộ × đơn giá", thành tiền; huy hiệu lỗi và "Mẫu đã cập nhật".
    - Báo bộ cửa lỗi chưa tính vào tổng.
  - **B4 + B7** `features/projects/ProjectActions.tsx`:
    - Sheet: Chỉnh sửa · Nhân bản (mở bản sao) · Xóa.
    - Hộp xác nhận gọi tên dự án, nêu số loại cửa, số bộ, báo giá và "30 ngày".
    - Snackbar Hoàn tác 10 giây. Hộp thoại mở sau khi sheet đóng (iOS chờ 350 ms).
  - **C1b** `src/app/da-xoa.tsx` (vào từ Cài đặt → Dữ liệu):
    - Danh sách dự án và bộ cửa đã xóa: ngày xóa, "Còn N ngày" (dưới 7 ngày dùng màu cảnh báo).
    - Khôi phục; khôi phục bộ cửa trùng ký hiệu thì báo ký hiệu mới. Xóa hẳn có xác nhận.
  - **Dùng chung:**
    - `TextField` thêm icon đầu ô và `warning`; `Header` thêm `backLabel`/`onBack`.
    - Thêm `Fab`, `SkeletonCard`, `SearchField`, `Button` kiểu `dangerGhost`; token `hero`/`onHero`/`onHero2` (test tương phản đạt).
    - Hộp thoại có `testID`. Snackbar nổi trên thanh tab/thanh nút (84 pt) và có `useSnackbarVisible`.
  - **Engine:** `formatDate` (dd/mm/yyyy), `keepTogether` (giữ SĐT trên một dòng).
  - **Công cụ bản dev:** "Tạo dự án mẫu" (`domain/sampleProject.ts`: 4 bộ cửa, gồm ca TC-07) – dùng lại cho "Xem dự án mẫu" ở GĐ 12.
- **Lỗi thật đã sửa nhờ test và ảnh chụp:**
  1. Mở thẳng form (không có màn trước) thì nút "Hủy" không làm gì → nay về danh sách.
  2. Chọn "Bỏ thay đổi" mà màn không đóng (lệnh rời bị chặn lần nữa) → dùng `repeat()` sau khi tắt chặn.
  3. Prop trợ năng của icon gây lỗi trên web → đổi sang `aria-hidden`.
  4. SĐT bị ngắt dòng trong sheet.
  5. Viền focus mặc định của trình duyệt trong ô nhập.
  6. Snackbar che thanh tab và nút nổi.
- **Kiểm thử:**
  - App 128/128 (14 bộ). Có 14 ca giao diện mới chạy trên router thật (`renderRouter`) với DB trong bộ nhớ:
    - B1: rỗng; thẻ có OP1; tìm không dấu; xóa → Hoàn tác.
    - B2: lỗi bắt buộc; SĐT chỉ nhắc; tạo → B3; nháp tự lưu; nháp còn lại thì điền lại; rời màn hỏi / tiếp tục / bỏ thay đổi xóa nháp.
    - B6: sửa → về B3.
    - B3: số liệu; đổi trạng thái; nhân bản; dự án không còn.
    - C1b: khôi phục, xóa hẳn.
  - Engine 87/87, data 25/25. Typecheck, lint sạch.
  - Web (dev server, Chromium): chạy hết luồng B1 → B2 (lỗi) → B3 → dự án mẫu → B4 → B7 → Hoàn tác → tìm → C1b ở 390 × 844 sáng, 390 tối, 360 × 800. Không lỗi console, không tràn ngang.
- **Lưu ý môi trường:**
  - `expo export --dev` lỗi "unknown module" khi chia route; dùng `npx expo start --web` để kiểm.
  - Dev server không gửi header COOP/COEP cho trang HTML, nhưng SQLite trên web vẫn chạy (bản export có header thì `crossOriginIsolated = true`).
  - Metro đôi khi phát bundle cũ: khởi động lại với `--clear`.
- **Commit:** "GĐ 5: nhóm màn Dự án (B1–B4, B6, B7, C1b)".
- **Bước tiếp theo:** GĐ 6a (xem mục "Phiên tới bắt đầu từ đây").

### 2026-11-05 · Phiên 4 · GĐ 4 – Lưu trữ SQLite, sao lưu, store

- **Bối cảnh:** chủ dự án nhắn "làm tiếp đi". Đã đọc mục "Phiên tới" và làm đúng GĐ 4.
- **Đã làm:**
  - **`expo-sqlite` ~58.0.15:** cài bằng `npm install -w` (không dùng `expo install` vì proxy). Đọc hướng dẫn kèm gói (`node_modules/expo-sqlite/skills`) thay cho trang tài liệu.
  - **`src/db/sql.ts`:**
    - Giao diện SQL nhỏ: `exec`, `run`, `getAll`, `getFirst`, `transaction`; giao dịch lồng nhau thì phần trong nhập vào giao dịch ngoài.
    - Adapter `expoSqlite.ts` (bật WAL và khóa ngoại).
    - Adapter `testing/nodeSqlite.ts` (`node:sqlite`, lấy qua `process.getBuiltinModule`, chạy trong Jest).
  - **`src/db/schema.ts` – lược đồ v1:**
    - Các bảng `workshop`, `settings`, `materials`, `projects`, `door_items` (màu, vị trí, ghi chú, `sort_order`, `template_version`, `deleted_at`), `quotes`, `template_snapshots`, `drafts`, `events`, `error_log`.
    - Migration theo `PRAGMA user_version`: mỗi bước một giao dịch; DB của bản app mới hơn thì từ chối.
  - **Repository** (`src/db/repos/`):
    - `workshop`: thông tin xưởng, VAT, tham số cắt mặc định, hệ số nhóm, logo dạng data URI.
    - `settings`: khóa `device.*` không vào sao lưu.
    - `materials`: đồng bộ gói kèm mà không đè giá xưởng đã sửa; sửa giá, giá riêng, về giá gói; ẩn (chặn ẩn kính mặc định của mẫu); thêm kính KU-001…; xóa có điều kiện.
    - `projects`: tạo, sửa, danh sách mới sửa trước kèm tìm không dấu, xóa mềm, khôi phục, nhân bản, xóa hẳn.
    - `doors`: ký hiệu không trùng, gợi ý ký hiệu, xóa nhiều, khôi phục có đổi ký hiệu khi trùng, nhân bản ngay sau bộ gốc, sắp xếp, lên/xuống; mọi thay đổi đưa dự án lên đầu.
    - `quotes`: số `BG-YYMM-NNN`, bản chụp, lịch sử, xóa ngay.
    - `snapshots`: không bao giờ ghi đè; báo khi trùng version mà khác nội dung.
    - `drafts`, `events`, `error_log` (giữ 200 dòng).
    - `trash`: thùng rác, số ngày còn lại, tự xóa hẳn sau 30 ngày (nhật ký giữ 90 ngày).
  - **`src/db/backup.ts`:**
    - `dumpAll`, `serializeBackup`, `parseBackup`, `replaceAll`, `backupFileName`.
    - `parseBackup` kiểm: phải là file MATADOOR, bản app không mới hơn, bảng và cột bắt buộc đủ, bộ cửa/báo giá phải có dự án. Có chỗ nâng file sao lưu của lược đồ cũ (`BACKUP_UPGRADES`).
    - `replaceAll` chạy trong một giao dịch, chỉ chèn cột có thật trong bảng.
  - **`src/db/init.ts` + `client.ts`:** khi mở app thì migrate → đồng bộ vật tư → lưu bản chụp mẫu → dọn thùng rác. `_layout.tsx` chờ DB xong mới tắt splash; lỗi thì hiện màn "Không mở được dữ liệu" có nút Thử lại.
  - **Miền nghiệp vụ:**
    - `src/domain/types.ts`, `errors.ts` (`ValidationError` có `field`).
    - `symbols.ts` (ký hiệu bộ cửa).
    - `pricing.ts`: bảng giá = vật tư DB × hệ số nhóm.
    - `projectCalc.ts`: tính cả dự án theo bản chụp đúng phiên bản mẫu của từng bộ, đánh dấu "mẫu đã cập nhật".
  - **Store Zustand:** `useProjects` (tải, tìm, tạo, xóa có hoàn tác, nhân bản), `useWorkshop`.
  - **Giao diện:**
    - Chọn sáng/tối nay được lưu vào cài đặt.
    - Thư viện đọc số vật tư từ SQLite.
  - **Web:** `metro.config.js` thêm `.wasm` và header COOP/COEP; `app.json` thêm header cho expo-router.
  - **`packages/data`:** thêm `PriceStatus` "xuong" (giá xưởng tự sửa).
- **Kiểm thử:**
  - `npm run check`: xanh – engine 85/85, data 25/25, app 110/110 (10 bộ test).
  - Độ phủ: engine dòng 99,58%; lớp DB, miền nghiệp vụ, store dòng 98,35%. Có ngưỡng 85% trong `jest.config.js`; lệnh `npm run coverage` chạy cả hai.
  - Các test đáng chú ý:
    - migration lỗi giữa chừng thì không nửa vời;
    - sao lưu → khôi phục sang DB khác ra bảng giống hệt (kể cả logo);
    - khôi phục lỗi giữa chừng không đổi dữ liệu;
    - file sửa tay có cột lạ (kể cả tên cột chứa SQL) bị bỏ qua;
    - TC-04 và TC-08 chạy qua lưu trữ;
    - bộ cửa tính theo bản chụp mẫu chứ không theo mẫu gói kèm.
  - **Bản web** (`expo export` rồi phục vụ kèm header COOP/COEP):
    - `crossOriginIsolated = true`; SQLite (wa-sqlite) chạy được.
    - Thư viện hiện số vật tư từ DB.
    - Chọn "Tối" rồi tải lại trang vẫn tối.
- **Lệch / lưu ý:**
  - Giao dịch dùng BEGIN/COMMIT trên cùng kết nối, không dùng `withExclusiveTransactionAsync`. Lý do: API đó không chạy trên web; app có một chủ sở hữu kết nối duy nhất (`client.ts`).
  - Tìm dự án lọc trong JS (LIKE của SQLite không bỏ dấu tiếng Việt). Đủ nhanh với vài trăm dự án; nếu chậm thì thêm cột tìm kiếm đã chuẩn hóa (cần migration).
  - Tự sao lưu dữ liệu hiện tại trước khi khôi phục (ĐX-09) để GĐ 10, vì cần ghi file bằng `expo-file-system`.
- **Chưa kiểm:** `expo-sqlite` trên Android/iOS thật (mới kiểm web và `node:sqlite`).
- **Commit:** "GĐ 4: lưu trữ SQLite, sao lưu/khôi phục, store".
- **Bước tiếp theo:** GĐ 5 (xem mục "Phiên tới bắt đầu từ đây").

### 2026-11-05 · Phiên 3 · GĐ 3 – Khung app Expo, token, component nền

- **Bối cảnh:** tiếp ngay sau phiên 2, cùng ngày.
- **Đã làm:**
  - **`apps/mobile`:** dựng từ mẫu `expo-template-default` của SDK 58 (React Native 0.88, React 19.3, Expo Router, TypeScript 6). Đã bỏ phần ví dụ của mẫu.
    - Thêm `@matadoor/engine` và `@matadoor/data` dạng workspace. Metro đóng gói được cả file `.ts` lẫn `.json` của workspace.
    - Thêm `react-native-svg` 15.16.0, `@expo-google-fonts/be-vietnam-pro`, `zustand`.
  - **`app.json`:** tên MATADOOR, scheme `matadoor`, khóa dọc, giao diện tự động sáng/tối; splash sáng và tối; web xuất kiểu `single`.
  - **Icon, splash, favicon:** vẽ lại từ SVG logo hướng A trong thiết kế (artboard LogoMark).
  - **`src/theme`:**
    - Token Light/Dark đúng Handoff1, gồm các màu phụ lấy từ artboard.
    - Thang chữ, khoảng cách, bo góc, kích thước, đổ bóng E1/E2 (chế độ tối không có bóng).
    - Chọn chế độ Theo máy / Sáng / Tối.
  - **`src/ui`:**
    - `Txt`, `Icon` (55 icon nét 1,8 lấy từ artboard Icon), `Logo`.
    - `Button` (chính / phụ / phá hủy / ghost, vô hiệu, đang xử lý), `TextField` (đơn vị trong ô, lỗi viền 2 px, chỉ đọc, bàn phím số hoặc SĐT).
    - `Stepper`, `Chip`, `ChipRow`, `Segmented`, `Badge` (luôn icon + chữ), `Card`, `ListRow`.
    - `BottomSheet`, `Select` dạng sheet, `Dialog` (xác nhận / phá hủy / thông tin), `Snackbar` (Hoàn tác 10 giây).
    - `Header`, `ScreenTitle`, `Screen`, `Body` (đệm đáy 68/84), `BottomBar`, `EmptyState`, `ErrorState`, `SectionTitle`, `TabBar`.
  - **Điều hướng:**
    - Thanh tab Dự án · Thư viện · Cài đặt (`expo-router/js-tabs` với thanh tab tự vẽ: viên nền 56 × 30, icon kèm nhãn).
    - Màn gốc: Dự án (khung B1, trạng thái rỗng); Thư viện (đọc bảng vật tư và mẫu cửa từ `@matadoor/data`); Cài đặt (logo, phiên bản app và dữ liệu, chọn sáng/tối, Công cụ).
    - Màn ẩn `/dev-components`, chỉ có ở bản dev.
  - **Engine:** thêm `bindUnits`. Mọi câu thông báo kiểm tra tự dùng khoảng trắng không ngắt giữa số và đơn vị. Lỗi này phát hiện khi xem ảnh chụp: dòng "600–1200 mm" bị xuống dòng trước "mm".
  - **Công cụ:**
    - ESLint (`eslint-config-expo`, flat config); Jest (`jest-expo`).
    - Test token: 19 cặp chữ/nền đạt ≥ 4,5:1 và viền ≥ 3:1 ở cả hai chế độ; chữ ≥ 14; chiều cao dòng.
  - **Ảnh chụp bản web** khổ 390 × 844 (Chromium): `docs/anh-chup/gd3-man-goc.png`, `docs/anh-chup/gd3-bo-component.png`.
- **Kiểm thử:**
  - `npm run check` (typecheck 3 gói, lint, test): xanh.
    - engine 85/85;
    - data 25/25;
    - app 43/43.
  - `npx expo export --platform web`: đóng gói thành công.
  - CI GitHub của commit trước: xanh.
- **Lệch so với thiết kế và lý do:**
  - Chữ nhỏ nhất 14 (thiết kế 13); nút stepper và chip cao 48 (thiết kế 44). Lý do: NFR-USE-02 yêu cầu chữ ≥ 14 sp và vùng chạm ≥ 48 dp.
  - Tab "Tài khoản" thành "Cài đặt" (theo `KE_HOACH_GIAO_DIEN.md`), icon bánh răng thay icon người.
  - Nút lùi luôn có chữ "Quay lại", theo quy tắc "icon luôn có nhãn".
  - Icon: chỉ đưa vào những icon cần cho MVP (bỏ wifiOff, mail, logout, eye… của phần tài khoản và mạng).
- **Lưu ý môi trường:** `npx expo install` lỗi vì proxy chặn api.expo.dev. Cách làm thay: lấy phiên bản trong `node_modules/expo/bundledNativeModules.json` rồi cài bằng `npm install -w @matadoor/mobile <gói>@<bản>`.
- **Chưa kiểm:** chạy trên Android/iOS thật hoặc Expo Go. Mới kiểm bản web.
- **Commit:** "GĐ 3: khung app Expo, token thiết kế, bộ component nền".
- **Bước tiếp theo:** GĐ 4 (xem mục "Phiên tới bắt đầu từ đây").

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
