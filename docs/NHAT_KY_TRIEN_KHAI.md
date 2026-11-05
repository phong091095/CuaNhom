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

**GĐ 5 · Nhóm B – Dự án** (chi tiết ở `KE_HOACH_TRIEN_KHAI.md` mục 3; bố cục xem artboard `docs/thiet-ke/artboard/ProjectList`, `ProjectForm`, `ProjectDetail`, `ProjectSheets`):
1. **B1** `src/app/(tabs)/index.tsx`:
   - Dùng `useProjects` (`src/store/projects.ts`).
   - Thẻ dự án gồm: tên, khách, địa chỉ, SĐT, huy hiệu trạng thái, số loại/số bộ, OP1. OP1 lấy từ `computeProject`; cân nhắc tính dần hoặc lưu đệm trong bộ nhớ nếu chậm.
   - Ô tìm (tìm không dấu đã có ở repository).
   - Trạng thái rỗng kèm "Tạo dự án đầu tiên"; nút nổi "Tạo dự án".
   - Snackbar Hoàn tác 10 giây khi xóa (`remove` trả về hàm hoàn tác).
2. **B2/B6** `src/app/du-an/moi.tsx` và `src/app/du-an/[id]/sua.tsx`:
   - Ô tên công trình (bắt buộc), khách, SĐT (nhắc bằng `phoneHint`, không chặn), địa chỉ, ghi chú.
   - Lỗi lấy từ `ValidationError.field` để hiện dưới đúng ô.
   - Lưu nháp vào `drafts`; hỏi khi rời màn mà chưa lưu.
3. **B3** `src/app/du-an/[id]/index.tsx`:
   - Thẻ tóm tắt (`computeProject`): OP1, giá vốn, số bộ, m², đơn giá trung bình.
   - Khối "Bóc tách & báo giá" (các ô dẫn tới E2/F1/F2/G1 – tạm chưa bấm được).
   - Danh sách bộ cửa (thứ tự `sortOrder`).
   - Huy hiệu trạng thái chạm để đổi; nút "Thêm bộ cửa" (D3 làm ở GĐ 6).
4. **B4** sheet thao tác: Sửa · Nhân bản · Xuất (tạm ẩn tới GĐ 9) · Xóa.
5. **B7** hộp xác nhận xóa, có gọi tên dự án.
6. **C1b** "Đã xóa gần đây" `src/app/cai-dat/da-xoa.tsx`: `listTrash`, `daysLeft`, khôi phục, xóa hẳn.
7. **Test:**
   - Jest + `@testing-library/react-native`: cài bằng `npm install -w @matadoor/mobile -D` với bản tương thích React 19.3; kiểm phiên bản trước.
   - Tối thiểu: tạo dự án → B3; xóa → Hoàn tác; tìm không dấu.
   - Chụp bản web 390 × 844 và 360 × 800, sáng/tối, lưu vào `docs/anh-chup/gd5-*.png`.

## Việc tồn

- [ ] **Chủ dự án:** nếu còn giữ `cửa_mẫu.xlsx`, `QUYET_DINH.md` hoặc mã engine v0.1 cũ, đưa vào `docs/nguon/` để đối chiếu 2 mẫu đã dựng lại (Q15).
- [ ] **Chủ dự án:** xem Q14 (tiêu chí cắt SRS 4.3 không phải lúc nào cũng đạt được) và Q7–Q18.
- [ ] Các việc ngoài code ở `KE_HOACH_TRIEN_KHAI.md` mục 6.
- [ ] **Chưa chạy trên máy thật / Expo Go:** container không có thiết bị. Chủ dự án chạy `npm install` ở gốc kho, rồi `npx expo start` trong `apps/mobile`, quét QR bằng Expo Go (phải là bản hỗ trợ SDK 58) và báo lại lỗi nếu có.
- [ ] **Mã ứng dụng** `vn.matadoor.app` (Android package, iOS bundle id) là tạm: chốt trước khi đưa lên cửa hàng.

## Các phiên

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
