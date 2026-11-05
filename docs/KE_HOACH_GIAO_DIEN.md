# Kế hoạch đưa thiết kế vào app

Nguồn thiết kế: https://claude.ai/artifact/BGr6Cgan4XraqYkk65DSAx (bản 1789816675-9b04, khoảng 100 artboard, 4 trang "Hồ sơ bàn giao").
Nguồn yêu cầu: `docs/MATADOOR – Đặc tả yêu cầu phần mềm (SRS) v1.0.pdf`.

## 1. Nguyên tắc chọn

1. **Thiết kế quyết định giao diện** (màu, chữ, bố cục, component, trạng thái). Nếu thiết kế có màn mà app chưa có và SRS cho phép, thì làm theo thiết kế.
2. **SRS quyết định phạm vi và quy tắc nghiệp vụ.** Khi thiết kế và SRS mâu thuẫn, làm theo SRS. Mọi chỗ lệch đều ghi ở mục 3, kèm lý do.
3. **Không phá cái đã chạy.** Engine, công thức, bản chụp báo giá (`QuoteDoc`), sao lưu và các `testID` của Maestro phải giữ nguyên. Đổi giao diện không được làm đổi con số.
4. **Làm từ dưới lên:** token → component → khung điều hướng → từng nhóm màn. Mỗi giai đoạn vừa một phiên làm việc. Xong mỗi giai đoạn, app vẫn chạy được và test vẫn xanh.

Mỗi màn có một trong bốn mức quyết định:

| Mức | Nghĩa |
| --- | --- |
| **Giữ** | Làm đúng như thiết kế |
| **Chỉnh** | Làm theo thiết kế, có sửa một phần (lý do ghi kèm) |
| **Hoãn** | Không làm ở MVP, giữ thiết kế cho giai đoạn sau |
| **Bỏ** | Không làm, vì trái SRS hoặc không có ý nghĩa với app offline |

## 2. Đối chiếu từng màn

### Nhóm A – Xác thực

| Màn thiết kế | Quyết định | Lý do |
| --- | --- | --- |
| A0 Splash | **Chỉnh** | Dùng logo hướng A làm splash và icon app (expo-splash-screen). Bỏ các bước chờ máy chủ vì không có máy chủ. |
| A1 Chào mừng | **Hoãn** | Chỉ dẫn vào A2/A3. Có thể dùng lại sau làm màn giới thiệu lần đầu (NFR-USE-01: hướng dẫn một lần). |
| A2 Đăng nhập, A3 Đăng ký, A4 Quên mật khẩu, A5 OTP, A6 Mật khẩu mới | **Hoãn** | SRS 1.2: MVP chạy offline hoàn toàn. NFR-SEC-01: dữ liệu chỉ lưu trên máy, không gửi ra ngoài. Đăng nhập và đồng bộ là FR-SET-05, thuộc giai đoạn 3 (SRS mục 9). Ghi chú kỹ thuật về OTP, mật khẩu, tự điền giữ lại cho lúc đó. |

### Nhóm B – Dự án

| Màn thiết kế | Quyết định | Lý do |
| --- | --- | --- |
| B1 Danh sách dự án | **Chỉnh** | Giữ: thẻ, tìm kiếm bỏ dấu, trạng thái rỗng, thanh báo Hoàn tác, thanh tab dưới, cuộn đến cuối. **Bỏ** banner "Không có mạng" và lỗi máy chủ: app không dùng mạng. **Bỏ** banner quảng cáo: SRS không có, và SDK quảng cáo gửi dữ liệu ra ngoài (trái NFR-SEC-01). Lỗi khi tải dùng mẫu "Trạng thái lỗi" cho lỗi đọc dữ liệu. |
| B2 Tạo dự án, B6 Sửa dự án, B2 lỗi nhập | **Giữ** | Khớp FR-PRJ-01 và 03 (chỉ tên công trình bắt buộc). |
| B3 Chi tiết dự án | **Chỉnh** | Giữ thẻ tóm tắt, khối "Bóc tách & báo giá", danh sách bộ cửa. Dòng "Biên thực sau hao hụt" làm được: engine đã có số cây thực mua. Dòng nhân công "Sản xuất / Lắp đặt" lấy từ nhóm Nhân công của engine, không viết cứng hai dòng. Giữ trạng thái dự án (FR-PRJ-04). |
| B4 Sheet thao tác | **Giữ** | Sửa, nhân bản, xuất, xóa (FR-PRJ-03). |
| B5 Hệ số lợi nhuận | **Chỉnh (Q1)** | Giữ dạng sheet, nhưng sửa hệ số theo **nhóm vật tư** (SRS FR-MAT-02) thay cho một % cả dự án. |
| B7 Xác nhận xóa | **Giữ** | Hộp xác nhận gọi tên đối tượng (FR-PRJ-03). |
| B8 Sheet xuất file (Excel · PDF) | **Chỉnh** | Làm PDF và ảnh trước (đã có). Excel làm khi chốt FR-MAT-04 (Nên có, đang treo trong BACKLOG). |
| Xóa → "Đã xóa gần đây" 30 ngày + Hoàn tác 10 giây | **Giữ** | Không trái SRS và tăng an toàn dữ liệu (NFR-REL-01). Cần cột `deleted_at`, cập nhật sao lưu và tự xóa hẳn sau 30 ngày. |

### Nhóm C – Tài khoản và Thư viện

| Màn thiết kế | Quyết định | Lý do |
| --- | --- | --- |
| C1 Tài khoản | **Chỉnh** | Đổi thành tab **Cài đặt** (SCR-09). Giữ bố cục danh sách mục và logo. Bỏ phần tài khoản, hạn dùng gói và nút đăng xuất: không có tài khoản ở MVP, mô hình bán gói chưa chốt. Thêm mục Sao lưu/Khôi phục (FR-SET-03, thiết kế chưa có). |
| C1a Thông tin xưởng | **Giữ** | FR-SET-01, kèm bật/tắt VAT như thiết kế. |
| C1b Đã xóa gần đây | **Giữ** | Đi kèm quy tắc xóa mềm ở nhóm B. |
| C2 Thư viện (trang chủ) | **Chỉnh** | Tab Thư viện thay cho màn Bảng giá SCR-08 hiện tại. Bỏ banner quảng cáo (lý do như B1). |
| C3 Hãng nhôm + trình xem tài liệu | **Hoãn** | MVP chỉ có một hệ nhôm Xingfa (SRS 1.2). Nhiều hệ nhôm là giai đoạn 2. Ở MVP, Thư viện mở thẳng danh sách mã nhôm. |
| C4 Hãng phụ kiện, C5 Phụ kiện theo hãng | **Chỉnh** | Gộp thành một danh sách Phụ kiện. Dữ liệu hiện chưa có trường "hãng", nên chưa có gì để chia theo hãng. |
| C6 Vật tư phụ, C7 Kính, C8 Bảng giá nhôm | **Giữ** | Mỗi màn là một nhóm trong `materials.json` (FR-MAT-01). |
| C9 Sheet sửa đơn giá | **Giữ** | Thay cách sửa giá ngay trên dòng hiện tại. Có giá gốc, giá bán, nguồn giá (FR-MAT-02). |

### Nhóm D – Bộ cửa

| Màn thiết kế | Quyết định | Lý do |
| --- | --- | --- |
| D1 Danh sách bộ cửa | **Chỉnh** | SRS đặt danh sách bộ cửa trong SCR-02, nên danh sách chính nằm ở B3 như thiết kế B3 đang vẽ. Màn D1 riêng có **chọn nhiều** (xóa, nhân bản hàng loạt) làm ở giai đoạn 9, không chặn luồng chính. |
| D2 Chọn hãng nhôm | **Hoãn** | Một hệ nhôm ở MVP. Code tự bỏ qua bước này khi dữ liệu chỉ có một hệ, để giai đoạn 2 chỉ cần thêm dữ liệu. |
| D3 Chọn mẫu cửa + chip lọc | **Giữ** | FR-DOR-01 (lọc cửa đi, cửa sổ, vách). Nhóm lọc đọc từ `display.group` trong JSON mẫu (NFR-MNT-01). Giữ nhãn "Lần trước" (NFR-USE-01). |
| D4 Thông số hệ (Khe hở, Profile) | **Chỉnh (Q4)** | MVP chỉ cần **xem** thông số của hệ (profile, khe hở) để thợ đối chiếu. Ghi đè thông số theo hệ thì chờ câu hỏi "a" của thiết kế: thông số dùng riêng từng hãng hay dùng chung. Tham số riêng từng bộ cửa vẫn nhập ở D5 như hiện tại. |
| D5 Form nhập cửa (+ lỗi W/H, form trống) | **Giữ** | FR-DOR-02 đến 07. Giá hiển thị kèm nguồn, không cho gõ, đúng "một nguồn giá". Lỗi hiện ngay dưới ô nhập. Giữ lưu nháp và hỏi khi thoát (NFR-REL-01). |
| D6 Chi tiết cửa (tab Tổng quan, Nhôm…) | **Chỉnh** | Là SCR-05: các tab Cắt nhôm, Kính, Phụ kiện, Nhân công. Cột kg lấy theo FR-BOM-01. Phần "Ảnh công trình" **hoãn** (Q6): SRS không có, làm nặng thêm sao lưu. Hiện `door.tsx` gộp 04 và 05; sẽ tách: Lưu ở D5 → mở D6. |

### Nhóm E – Nhôm và sơ đồ cắt

| Màn thiết kế | Quyết định | Lý do |
| --- | --- | --- |
| E1 Thiết lập cắt | **Giữ** | FR-CUT-02: dài cây, mạch cưa, phần bỏ đầu cho từng dự án. |
| E2 Tổng hợp nhôm (trước và sau khi cắt) | **Chỉnh** | Giữ số cây, kg, tiền ước tính và tiền thực mua, hao hụt (FR-CUT-04). **Bỏ** huy hiệu và dòng "Thanh dư", "tận dụng 3 thanh dư": kho thanh dư là FR-CUT-05, thuộc giai đoạn sau MVP. |
| E2 Đang tính phương án cắt | **Giữ** | Chỉ hiện khi tính lâu hơn khoảng 300 ms (máy yếu, dự án lớn). |
| E3 Sơ đồ cắt (dọc, ngang, chạm xem một đoạn, thanh dư không dùng được, xuất file) | **Giữ** | FR-CUT-01, 03, FR-BOM-05. Vẽ cây đúng tỉ lệ như ghi chú thiết kế. |
| E3 Lỗi máy chủ | **Bỏ** | Tính trên máy, không gọi máy chủ. Thay bằng thông báo lỗi tính toán, có nút Thử lại. |

### Nhóm F – Tổng hợp vật tư

| Màn thiết kế | Quyết định | Lý do |
| --- | --- | --- |
| F1 Kính, F2 Phụ kiện, F3 Vật tư phụ | **Giữ** | FR-BOM-04: tổng hợp cả dự án; phụ kiện cộng số lẻ của các bộ rồi mới làm tròn lên. App hiện chưa có các màn tổng hợp này. |

### Nhóm G – Báo giá

| Màn thiết kế | Quyết định | Lý do |
| --- | --- | --- |
| G1 Báo giá OP1, OP2, khối giá vốn | **Chỉnh** | Giữ bố cục. OP2 làm theo SRS FR-QUO-01: đơn giá TB **làm tròn lên bội 10.000 đ**, cho sửa. Thiết kế đang làm tròn tới đồng (chênh +2 ₫). Giữ chiết khấu, VAT, ghi chú (FR-QUO-05, 06). |
| G2 Xem trước A4, có VAT, phóng to | **Giữ** | Sửa `renderQuoteHtml` theo trang A4 thiết kế, luôn nền trắng. Vẫn đọc được `QuoteDoc` cũ đã lưu, và không có giá vốn, lãi (NFR-SEC-02). Ảnh PNG dùng cùng bố cục. |
| Lịch sử báo giá đã xuất (đã có trong app) | **Giữ, ngoài thiết kế** | FR-MAT-03. Thiết kế chưa vẽ màn này. Dựng bằng component chung (thẻ danh sách + huy hiệu). |

### Phần chung

| Hạng mục | Quyết định | Lý do |
| --- | --- | --- |
| Token màu Light | **Giữ** | Đạt WCAG AA, khớp NFR-USE-02 (đọc ngoài nắng). |
| Token màu Dark + mọi bản Dark | **Giữ, làm cuối** | Không trái SRS. Để giai đoạn cuối vì cần mọi màu đã đi qua token. |
| Font Be Vietnam Pro | **Giữ** | Dùng `@expo-google-fonts/be-vietnam-pro` (chạy được trong Expo Go). |
| Cỡ chữ nhỏ nhất 13 | **Chỉnh → 14** | NFR-USE-02 yêu cầu chữ ≥ 14 sp. |
| Tiền "10.384.357 ₫", kích thước "2.400 mm", "800 × 2.200 mm" | **Chỉnh** | NFR-USE-03: tiền dạng `1.234.567 đ`, mm không có dấu phân cách nghìn (`2200`). Giữ quy tắc khoảng trắng không ngắt giữa số và đơn vị. (Q3.) |
| Thanh tab 3 mục (Dự án, Thư viện, Tài khoản) | **Chỉnh** | Thành Dự án, Thư viện, Cài đặt. |
| Một nút cam mỗi lớp, icon luôn có nhãn, đệm cuối danh sách 68/84 | **Giữ** | Khớp nguyên tắc "một hành động chính mỗi màn" (SRS mục 6). |
| Logo và icon app hướng A | **Giữ** | Logo chỉ ở icon, splash, Cài đặt, đầu trang báo giá. |
| Banner quảng cáo | **Bỏ** | Như B1. |
| Mất mạng, đồng bộ, skeleton khi tải chậm | **Bỏ / giảm** | Dữ liệu đọc đồng bộ từ SQLite, gần như không có thời gian chờ. Chỉ giữ skeleton hoặc "đang tính" cho tối ưu cắt. |
| Chữ hệ thống lớn (310%), màn 360 pt, xoay ngang E3 | **Giữ** | Đưa vào danh sách kiểm thử mỗi màn. |
| Xóa tài khoản 2 bước, In-App Purchase, "còn N ngày" | **Hoãn** | Đi cùng tài khoản và gói dịch vụ, chưa có ở MVP. |

## 3. Các câu hỏi đã chốt (2026-10-02)

Chủ dự án giao toàn quyền quyết định. Chốt theo thực tế dưới đây; đổi ý thì sửa bảng này trước rồi mới sửa code.

| Mã | Câu hỏi | Đã chốt | Lý do |
| --- | --- | --- | --- |
| Q1 | Hệ số lợi nhuận theo dự án (B5) hay theo nhóm vật tư (SRS FR-MAT-02)? | **Theo nhóm vật tư.** Sheet B5 hiện các nhóm và hệ số đang dùng, cho sửa nhanh, đổi giá thì áp cho mọi dự án. | Engine, test đối chiếu Excel và báo giá đã xuất đều dựa trên giá bán theo nhóm. Đổi sang % theo dự án là đổi mô hình giá, có nguy cơ sai số. Xưởng muốn bớt giá cho một khách thì đã có chiết khấu (FR-QUO-05). |
| Q2 | Xóa mềm 30 ngày áp cho gì? | **Dự án và bộ cửa.** Báo giá đã xuất vẫn xóa ngay, sau khi xác nhận. | Dự án và bộ cửa là dữ liệu nhập tay, mất thì phải đo lại. Báo giá đã xuất là bản chụp, xóa nhầm thì xuất lại được. |
| Q3 | Dùng `₫` và mm có dấu chấm nghìn như thiết kế? | **Không. Giữ SRS:** `1.234.567 đ`, mm viết `2200`. Giữ khoảng trắng không ngắt giữa số và đơn vị. | SRS là căn cứ nghiệm thu (NFR-USE-03). Thợ quen ghi `2200` trên bản vẽ. `formatMoney`/`mm` và test đã theo SRS. |
| Q4 | Thông số hệ (D4) chỉ xem hay cho sửa? | **Chỉ xem.** | Thông số hệ quyết định kích thước cắt; sửa nhầm là cắt hỏng nhôm. Thay đổi phải qua dữ liệu mẫu đã kiểm (NFR-MNT-01, NFR-ACC-01). |
| Q5 | Xuất Excel (B8, FR-MAT-04) vào MVP? | **Không.** B8 chỉ có PDF và ảnh. | Khách nhận qua Zalo dùng PDF/ảnh. Excel cần thêm thư viện và một mẫu file riêng; để sau khi xưởng thật yêu cầu (nguyên tắc SRS mục 9). |
| Q6 | Ảnh công trình cho từng bộ cửa (D6)? | **Không ở MVP.** | SRS không có. Ảnh làm file sao lưu nặng lên rất nhiều; ảnh chụp đã nằm sẵn trong thư viện ảnh của máy. |

## 4. Lộ trình

Mỗi giai đoạn là một phiên. "Xong" nghĩa là: typecheck, lint, test xanh; Maestro vẫn chạy được (giữ `testID`); đã tự so sánh với artboard ở khổ 390 × 844 trên bản web (`npm run web`).

### GĐ 1 – Token và font
- Viết lại `src/lib/theme.ts` theo token Light: `bg, surface, surface2, text, text2, border, divider, primary, primarySoft, accent, success, warning, error, info, glass`. Thêm thang chữ, khoảng cách 4/8, bo góc, đổ bóng E0–E2.
- Chừa sẵn chỗ cho token Dark (chưa bật).
- Nạp Be Vietnam Pro trong `_layout.tsx`; chờ font nạp xong thì mới ẩn splash.
- Đổi màu bản vẽ cửa sang token `glass` (`drawingColors`).
- Kết quả: app đổi màu và font toàn bộ, bố cục chưa đổi.

### GĐ 2 – Component
- Dựng lại `components/ui.tsx` theo bảng component của thiết kế, đủ các trạng thái:
  - **Nút:** Nút chính (cam, cao 52, đang xử lý), Nút phụ, Nút phá hủy.
  - **Ô nhập:** Ô nhập (đơn vị nằm trong ô, lỗi viền 2 px), Ô số có stepper 44 × 44, Select dạng bottom sheet.
  - **Chọn:** Chip lọc, Segmented (cao 56).
  - **Hiển thị:** Thẻ danh sách (nhấn, đang chọn), Huy hiệu (luôn có icon + chữ).
  - **Lớp phủ:** Snackbar có Hoàn tác, Bottom sheet, Hộp thoại.
  - **Trạng thái:** rỗng, lỗi.
- Thêm thanh tiêu đề chung.
- Thêm màn ẩn `/dev-components` (chỉ bản dev, vào từ màn Đo hiệu năng) bày mọi component, để so với artboard "Hệ thống thiết kế – Component".
- Giữ tên prop và `testID` hiện có để các màn cũ không vỡ.
- Hộp thoại trên web: thay `webAlert` bằng Hộp thoại mới.

### GĐ 3 – Khung điều hướng và nhóm B
- Thanh tab dưới: Dự án, Thư viện, Cài đặt (Expo Router tabs).
- Icon app và splash theo logo hướng A.
- Làm các màn B1, B2/B6, B3, B4, B5 (hệ số theo nhóm, Q1), B7.
- Xóa mềm: thêm cột `deleted_at`, tăng `SCHEMA_VERSION`, cập nhật `dumpAll`/`replaceAll`/`parseBackup`. Kèm snackbar Hoàn tác 10 giây và màn C1b. Có test nâng cấp DB cũ.
- Tìm kiếm bỏ dấu: hàm thuần trong `src/lib`, có test các ví dụ "xing fa", "XINGFA"…

**Đã làm (2026-10-02) – điểm lệch so với artboard và lý do:**
- Thanh tab chỉ hiện ở 3 màn gốc; màn con (B3, nhập cửa, báo giá…) mở chồng lên và ẩn thanh tab. Lý do: B3 và D5 đã có thanh nút cố định đáy; thêm thanh tab là mất ~100 pt trên máy 360 pt. Quay về bằng nút/vuốt lùi.
- B2/B6 giữ thêm ô "Khách hàng" (FR-PRJ-01 yêu cầu tên khách). SĐT sai dạng chỉ nhắc, không chặn lưu (SRS: SĐT không bắt buộc).
- B3: dòng "Biên thực tế sau hao hụt" thay bằng "Lãi dự kiến" cho tới GĐ 6 (cần số cây thực mua của E2). Ô Kính, Phụ kiện chưa bấm được tới GĐ 7 (F1, F2). Không có ô VTP: dữ liệu vật tư chưa có nhóm vật tư phụ. Thêm khu "Báo giá đã xuất" (FR-MAT-03) và huy hiệu trạng thái bấm để đổi (FR-PRJ-04) mà artboard chưa vẽ.
- B1: thẻ có thêm dòng trạng thái và tên khách (FR-PRJ-02, 04).
- B4 "Hệ số lợi nhuận" mở Bảng giá (hệ số theo nhóm, Q1) thay cho sheet nhập % dự án (B5).
- B8 "Xuất file" mở màn Báo giá (PDF, ảnh) cho tới GĐ 8; không có Excel (Q5).
- Xóa bộ cửa: tạm thời nhấn giữ dòng cửa ở B3; sheet thao tác bộ cửa làm ở GĐ 5 (D6).

### GĐ 4 – Nhóm D: chọn mẫu và nhập cửa
- D3 với chip lọc theo `display.group`.
- D5 form theo thiết kế (stepper số bộ, select kính, khối giá có nguồn), kèm trạng thái lỗi W/H và form trống.
- Giữ lưu nháp, hỏi khi thoát.

**Đã làm (2026-10-02) – điểm lệch so với artboard và lý do:**
- D3: chip lọc chỉ hiện nhóm đang có mẫu, kèm số mẫu ("Cửa đi (1)"); thêm mẫu vào dữ liệu là chip tự hiện (NFR-MNT-01). Artboard D3 không xuất bản ra file đọc được, nên dựng theo ghi chú canvas + bộ component.
- D5: các nhóm theo dữ liệu mẫu cửa, không theo artboard (Kiểu mở, bản lề, khóa, thanh ốp chân chưa có trong JSON mẫu). Tham số có lựa chọn (số cánh) ở "Thông tin chung", tham số số (khe hở chân…) ở "Kích thước".
- D5 giữ bản vẽ xem trước ngay dưới ô kích thước (SRS SCR-04: bản vẽ và giá cập nhật trực tiếp) và nhóm "Bóc tách vật tư" ở cuối cho tới khi tách D6 (GĐ 5).
- D5 "Đơn giá" chỉ xem kèm nguồn + nút Sửa (mở Bảng giá); không có ô sửa giá kính/nhân công riêng từng cửa như artboard, vì quy tắc "một nguồn giá" của chính bản bàn giao.
- D5 không có "Ảnh công trình" (Q6), không có "Hãng phụ kiện" (một hệ nhôm).
- Banner "Còn N ô cần sửa" chuyển xuống thanh đáy (bấm "Xem" để nhảy tới ô lỗi): đặt đầu trang thì khi gõ W/H banner hiện ra đẩy ô đang gõ xuống. Nút Lưu vẫn khóa khi còn lỗi (TC-05).

### GĐ 5 – Nhóm D: chi tiết cửa
- Tách `door.tsx`: D5 nhập, D6 chi tiết với các tab Tổng quan, Nhôm, Kính, Phụ kiện, Nhân công.
- Sheet thao tác bộ cửa: nhân bản, xóa mềm.
- Màn D4 chỉ xem (Q4).

**Đã làm (2026-10-03) – điểm lệch so với artboard và lý do:**
- D6 tab "VTP" → "Nhân công": dữ liệu vật tư chưa có nhóm vật tư phụ. Không có "Ảnh công trình" (Q6).
- D6 thẻ đầu ghi "Giá bán (1 bộ)" kèm giá vốn và lãi; artboard chỉ ghi "Thành tiền" theo giá vốn. Các bảng chi phí từng nhóm vẫn là giá vốn như artboard.
- D6 "Thông số" đọc theo tham số của mẫu (khe hở chân, số cánh…), không có các dòng kiểu mở/bản lề/khóa vì dữ liệu mẫu chưa có.
- D6 có thêm bản vẽ lớn ở tab Tổng quan (artboard chỉ có hình nhỏ ở đầu).
- B3: bấm dòng cửa mở D6; lưu cửa mới ở D5 cũng mở D6 ("sau khi lưu"); sửa cửa lưu xong quay về D6.
- D4 chỉ xem: 3 tab Khe hở · Profile nhôm · Giới hạn; biểu thức trong mẫu đổi sang chữ ("Số cánh = 2 và Rộng < 800"). Vào từ D5 (thẻ mẫu cửa) và D6 (Thông số hệ); chưa vào từ D3 vì chạm thẻ mẫu ở D3 là chọn mẫu.
- Thêm kiểm tra ký hiệu cửa trùng trong dự án (lỗi dưới ô Tên cửa, chặn lưu); nháp cũ mang ký hiệu đã bị dùng thì tự đổi sang ký hiệu kế tiếp.

### GĐ 6 – Nhóm E
- E1 thiết lập cắt.
- E2 tổng hợp nhôm trước và sau khi cắt, có số cây, kg, hao hụt; không có thanh dư.
- E3 sơ đồ cắt dọc và ngang, chạm vào đoạn để xem chi tiết, cảnh báo đoạn quá dài, xuất phiếu cắt.
- Đo E3 với dự án 50 bộ trên màn "Đo hiệu năng".

**Đã làm (2026-10-03) – điểm lệch so với artboard và lý do:**
- E2: bảng giá đang tính nhôm theo m dài (materials.json), nên "giá cây" = dài cây × giá/m, và ₫/kg là dòng phụ (đúng ghi chú "nhôm tính theo cây, quy đổi ra kg"). Khi có bảng giá theo cây thật thì chỉ đổi dữ liệu.
- E2 không có trạng thái "trước khi cắt / đang tính": engine xếp cây tức thì (đo trên máy ở màn Đo hiệu năng). Không có thanh dư/kho (FR-CUT-05 sau MVP).
- Hao hụt không cộng vào báo giá (đã chốt trong ghi chú thiết kế); B3 thay "Lãi dự kiến" bằng "Biên thực tế sau hao hụt"; ô Nhôm ở B3 mở E2 (trước đây mở thẳng sơ đồ cắt).
- E3: kiểm tra mỗi cây ghi "đoạn + mạch cưa (n−1) × kerf + bỏ đầu 2 × trim + dư = dài cây" – engine không tính mạch cưa sau đoạn cuối (artboard ghi n × kerf). Xem ngang bằng cách mở khóa xoay chỉ ở E3 (expo-screen-orientation); cả app vẫn khóa dọc.
- E3 "Lỗi máy chủ" bỏ (tính trên máy). "Xuất file" là nút "Phiếu cắt" trên thanh tiêu đề (PDF, dùng chung với E2).
- Vai trò thanh nhôm trong mẫu là mã không dấu; thêm từ điển `lib/roles.ts` để hiện có dấu ở E3 và phiếu cắt (test kiểm mọi vai trò trong dữ liệu mẫu).

### GĐ 7 – Nhóm F
- Viết hàm thuần tổng hợp kính, phụ kiện, vật tư phụ của cả dự án (làm tròn sau khi cộng), có test.
- Làm 3 màn F1–F3 và nút xuất.

**Đã làm (2026-10-05) – điểm lệch so với artboard và lý do:**
- F3 "Vật tư phụ" **hoãn**: dữ liệu vật tư (materials.json) chưa có nhóm vật tư phụ – keo, vít, gioăng nằm chung nhóm phụ kiện, nên F2 đang gồm cả vật tư phụ. Khi bảng VAT_TU gốc có nhóm riêng thì tách màn F3 bằng dữ liệu, không sửa logic.
- F2 không có "Hãng phụ kiện" (một hệ nhôm, dữ liệu chưa có hãng).
- "Xuất file" (B8) ở F1/F2 là phiếu đặt kính / phiếu lấy phụ kiện dạng PDF, **không có giá** (gửi nhà cung cấp, thợ); không có Excel (Q5).
- F1 ghi giá vốn từng loại kính, không viết "m² × đơn giá =" vì engine tính tiền theo từng tấm, nhân tổng m² có thể lệch vài đồng.
- Thêm (ngoài thiết kế): bấm một dòng phụ kiện để xem số lẻ từng bộ cửa – giải thích vì sao lấy số đó (FR-BOM-04).

### GĐ 8 – Nhóm G
- G1 OP1/OP2 (làm tròn theo SRS), khối giá vốn gập/mở.
- G2 xem trước, phóng to.
- `renderQuoteHtml` theo trang A4 thiết kế; ảnh PNG dùng cùng bố cục.
- Test báo giá cũ đã lưu vẫn mở được, và bản gửi khách không có giá vốn.
- Màn lịch sử báo giá dựng bằng component mới.

**Đã làm (2026-10-05) – điểm lệch so với artboard và lý do:**
- File thiết kế chính của G1/G2 (Quote, QuotePaper, QuotePreview) không tải được (chỉ có vỏ và ghi chú canvas; link artifact về sau báo không truy cập được). Dựng theo ghi chú canvas + hồ sơ bàn giao: OP1 "Theo từng bộ"/OP2 "Đồng giá m²", khối giá vốn gập/mở, tờ A4 nền trắng 60%/100%, logo xưởng đầu trang, chân trang "Tạo bằng MATADOOR".
- G2 hiển thị **chính HTML của PDF** (WebView trên điện thoại, iframe trên web) – xem sao in vậy, không có bản dựng thứ ba. Tỉ lệ "vừa màn" tính theo bề ngang máy (390 pt ≈ 44% của tờ 794 px), không cố định 60%.
- Nút xuất PDF/ảnh chuyển từ G1 sang G2 (G1 → "Xem trước & gửi" → G2). Bản chụp vẫn chỉ lưu khi tạo file thành công.
- OP2 gợi ý làm tròn lên bội 10.000 đ (SRS FR-QUO-01), không làm tròn tới đồng như artboard; màn ghi rõ chênh so với OP1.
- Không thêm "hiệu lực đến ngày…" riêng: ghi chú mẫu của xưởng đã có "Báo giá có hiệu lực 15 ngày" (FR-QUO-06), tránh hai nguồn.
- Ảnh PNG giữ bố cục dọc cho điện thoại (360 dp, gửi Zalo), cùng màu và chân trang với PDF.
- Báo giá đã xuất (lịch sử) dùng cùng khung xem tờ A4, "⋯" có bản nội bộ và xóa.

### GĐ 9 – Thư viện và Cài đặt
- C2 trang chủ Thư viện; C6, C7, C8 theo nhóm vật tư; C4/C5 gộp; C9 sheet sửa đơn giá.
- C1 → Cài đặt, C1a thông tin xưởng, khối sao lưu và khôi phục.
- D1 chọn nhiều (xóa, nhân bản hàng loạt).

**Đã làm (2026-10-05) – điểm lệch so với artboard và lý do:**
- C2 Thư viện: thẻ theo nhóm vật tư có trong dữ liệu (Nhôm, Kính, Phụ kiện, Nhân công) mở bảng giá nhóm (C6/C7/C8 gộp một màn theo nhóm); thêm mục "Mẫu cửa & thông số hệ" (mở D4) thay cho C3 tài liệu hãng. Không có VTP riêng (như F3), không có hãng (C3/C4/C5), không có banner quảng cáo.
- C9 sheet sửa đơn giá: giá gốc, giá bán, hệ số, "Về giá gói kèm"; nhãn "Giá riêng" (huy hiệu info) như thiết kế.
- C1 → Cài đặt: nhóm Xưởng của bạn · Mặc định cho dự án mới (thiết lập cắt, ghi chú báo giá – FR-SET-02, FR-QUO-06; artboard không có, đưa từ SCR-09 cũ) · Dữ liệu (Đã xóa gần đây, Sao lưu & khôi phục) · Công cụ. Bỏ đăng xuất, xóa tài khoản, hạn dùng, hỗ trợ/pháp lý (chưa có tài khoản, chưa có kênh thật).
- C1a: không có bước cắt logo vuông – picker thu nhỏ còn 512 px giữ tỉ lệ; tên xưởng bắt buộc như artboard. Các màn cài đặt con lưu bằng nút ở thanh đáy và hỏi khi rời mà chưa lưu (trước đây tự lưu khi rời ô).
- D1: chọn nhiều ngay trong danh sách bộ cửa của B3 (nút "Chọn" hoặc nhấn giữ một dòng), thanh đáy Xong · Nhân bản · Xóa (xóa mềm, Hoàn tác). Nhấn giữ không còn là xóa một cửa (xóa một cửa ở D6 "⋯").

### GĐ 10 – Dark mode và rà soát cuối
- Bật token Dark, theo chế độ của hệ điều hành; so với mọi artboard Dark.
- Rà soát theo danh sách kiểm thử của thiết kế:
  - chữ hệ thống lớn, màn 360 pt, xoay ngang E3;
  - TalkBack đọc đúng nhãn;
  - tương phản trong cả Light và Dark.
- Cập nhật kịch bản Maestro, README (bảng tiến độ), `HUONG_DAN_TEST_GIAO_DIEN.md`.

**Đã làm (2026-10-05) – điểm lệch so với thiết kế và lý do:**
- Bảng màu Dark đúng token bàn giao. Mặc định theo hệ điều hành, thêm lựa chọn Theo hệ thống / Sáng / Tối trong Cài đặt (artboard không có – cần để người dùng chủ động và để kiểm thử).
- Hệ điều hành đổi sáng/tối khi app đang mở thì áp ở **lần mở sau**; chọn trong Cài đặt thì áp ngay (vẽ lại cả app rồi về Cài đặt). Lý do: vẽ lại toàn cây giữa chừng sẽ đưa về màn đầu, có thể mất form đang nhập.
- Bản gửi khách (PDF, ảnh PNG, tờ A4 trong G2, khung xem trước đầu trang ở C1a) giữ nền trắng ở cả hai chế độ (ghi chú thiết kế G2); chỉ khung app quanh tờ giấy đổi màu.
- Rà soát: không còn nền sáng lạc ở chế độ tối (quét tự động mọi màn trên web); không tràn ngang ở 360 px; mọi nút có nhãn; nâng vùng chạm chip nhảy nhanh D5 (36 → 44) và đoạn cắt E3 (42 → 44).
- Chữ hệ thống lớn và TalkBack/VoiceOver chưa kiểm được tự động – danh sách kiểm tra tay ở `docs/KIEM_TRA_GIAO_DIEN_TAY.md`.

## 5. Cách kiểm "đúng và đủ" cho mỗi màn

- [ ] Bố cục, khoảng cách, màu khớp artboard Light ở khổ 390 × 844 (chụp bản web đặt cạnh artboard).
- [ ] Có đủ mọi trạng thái thiết kế vẽ cho màn đó (rỗng, lỗi, đang tính, sheet, hộp thoại), trừ trạng thái đã ghi **Bỏ** ở mục 2.
- [ ] Mỗi lớp chỉ một nút cam; icon có nhãn; vùng chạm ≥ 48; chữ ≥ 14.
- [ ] Số và đơn vị theo NFR-USE-03, không ngắt dòng.
- [ ] Không còn mã màn (SCR-…) hay ghi chú dev trong giao diện.
- [ ] Con số giống hệt trước khi đổi giao diện (cùng dự án mẫu).
- [ ] Màn 360 pt và chữ hệ thống lớn không tràn, không chồng.
