# Hồ sơ bàn giao thiết kế (trích văn bản từ artboard Handoff1–4)

Nguồn: https://claude.ai/artifact/BGr6Cgan4XraqYkk65DSAx bản 1789816675-9b04. File gốc ở `docs/thiet-ke/artboard/`. Khi thiết kế và SRS mâu thuẫn, làm theo SRS (xem `docs/KE_HOACH_GIAO_DIEN.md`).

```text
 
 MATADOOR · HỒ SƠ BÀN GIAO · TRANG 1 / 4 
 Token thiết kế và component
 Bảng màu, thang chữ, khoảng cách và toàn bộ component kèm trạng thái. Đây là nguồn duy nhất khi lập trình dựng lại giao diện.
 1 · Token màu
 Mọi cặp chữ/nền đều đạt WCAG 2.2 AA. Tỉ lệ ghi trong bảng là chữ trên nền bề mặt của cùng chế độ.
 Light
 Token Hex Dùng cho Tương phản 
 bg #F3F6F7 Nền màn hình — 
 surface #FFFFFF Thẻ, ô nhập, sheet — 
 surface-2 #E4EBEE Skeleton, segmented — 
 text #10212A Chữ chính 16,5 : 1 
 text-2 #4B5D66 Chữ phụ 6,9 : 1 
 border #77878F Viền ô nhập 3,7 : 1 
 divider #D8E0E4 Đường kẻ — 
 primary #0B5C75 Liên kết, tab chọn 7,5 : 1 
 primary-soft #DDEFF4 Nền chip, huy hiệu 9,6 : 1 với #073F51 
 accent #C2410C Nút chính duy nhất 5,2 : 1 
 success #1A6E39 Đã lưu, tiết kiệm 6,3 : 1 
 warning #8F5500 Cảnh báo có điều kiện 6,1 : 1 
 error #B42318 Lỗi, xóa 6,6 : 1 
 info #5B3E96 Giá riêng 6,8 : 1 với #EEE8F8 
 glass #CFE7EF Ô kính trong hình vẽ — 
 Dark
 Token Hex Dùng cho Tương phản 
 bg #0B1317 Nền màn hình — 
 surface #141F25 Thẻ, ô nhập, sheet — 
 surface-2 #22323A Skeleton, segmented — 
 text #E6EDF0 Chữ chính 14,2 : 1 
 text-2 #A3B3BB Chữ phụ 7,8 : 1 
 border #71838C Viền ô nhập 4,3 : 1 
 divider #27363E Đường kẻ — 
 primary #6CC7DE Liên kết, tab chọn 8,1 : 1 
 primary-soft #12384A Nền chip, huy hiệu 9,5 : 1 với #BFE8F3 
 accent #FF8F5A Nút chính duy nhất 7,5 : 1 
 success #62C98A Đã lưu, tiết kiệm 8,2 : 1 
 warning #F0B54A Cảnh báo có điều kiện 9,1 : 1 
 error #FF8C82 Lỗi, xóa 7,4 : 1 
 info #CDB8F2 Giá riêng 8,4 : 1 với #2A2140 
 glass #1E4656 Ô kính trong hình vẽ — 
 2 · Thang chữ, khoảng cách, bo góc, đổ bóng
 Chữ Be Vietnam Pro. Chiều cao dòng luôn ≥ 1,3 lần cỡ chữ để dấu tiếng Việt không chạm dòng trên.
 Thang chữ
 Vai trò Cỡ / dòng Đậm Ví dụ 
 Số liệu lớn 32 / 40 Bold · tnum Tổng tiền ở thẻ tóm tắt 
 Tiêu đề màn 28 / 38 Bold SCR-B1 
 Tiêu đề hộp thoại 20 / 28 Bold Xác nhận xóa 
 Tiêu đề mục 18 / 26 SemiBold Nhóm trong form 
 Thanh tiêu đề 17 / 24 Bold Tên màn 
 Nội dung / nút 16 / 24 Regular–SemiBold Mặc định 
 Nhãn ô nhập 14 / 20 Medium Chiều rộng (W) 
 Chữ phụ 13 / 18 Regular Nhỏ nhất được dùng 
 Khoảng cách 4/8
 Tên Giá trị 
 xxs 4 pt 
 xs 8 pt 
 sm 12 pt 
 md 16 pt · lề màn hình 
 lg 24 pt · giữa nhóm 
 xl 32 pt 
 xxl 48 pt 
 Bo góc
 px Dùng cho 
 8 Chip nhỏ 
 12 Ô nhập, thẻ nhỏ 
 14–16 Nút, thẻ 
 20 Sheet, hộp thoại 
 999 Chip lọc, huy hiệu 
 Đổ bóng
 Lớp Giá trị Dùng cho 
 E0 Viền 1 px Thẻ, danh sách 
 E1 0 4px 14px rgba(16,33,42,.18) Nút nổi, snackbar 
 E2 0 -8px 32px rgba(16,33,42,.18) Bottom sheet, hộp thoại 
 3 · Component và trạng thái
 Mỗi component dưới đây đã dựng thật trên canvas, không phải mô tả suông.
 Component Các trạng thái Ghi chú 
 Nút chính Mặc định · nhấn · vô hiệu (opacity .45 + aria-disabled) · đang xử lý Cam, cao 52, mỗi lớp đúng một cái 
 Nút phụ Mặc định · nhấn · vô hiệu Viền 1 px, chữ màu text 
 Nút phá hủy Mặc định · nhấn Viền hoặc nền error, luôn kèm hộp xác nhận 
 Ô nhập Mặc định · đang gõ · lỗi (viền 2 px error + dòng lỗi) · chỉ đọc Cao 52, đơn vị nằm trong ô 
 Ô số có stepper Mặc định · chạm ngưỡng (nút mờ) Hai nút 44 × 44, giá trị ở giữa 
 Select (bottom sheet) Chưa chọn (chữ phụ) · đã chọn Không dùng select gốc 
 Chip lọc Tắt · bật (nền primary-soft + dấu tích) Cao 44, cuộn ngang 
 Segmented 2 lựa chọn, một cái nổi Cao 56, nút con 48 
 Thẻ danh sách Mặc định · nhấn · đang chọn (viền 2 px primary) · skeleton Chiều cao theo nội dung 
 Huy hiệu Trạng thái · Giá riêng · Thanh dư · Cần xác nhận Luôn icon + chữ 
 Snackbar Thông báo · có Hoàn tác 10 giây Nổi trên thanh nút 
 Bottom sheet Mở · đang xử lý · xong Bo góc trên 20, tay cầm 40 × 4 
 Hộp thoại Xác nhận · phá hủy · thông tin Nút phá hủy dùng màu error 
 Thanh tab 3 tab, tab đang mở có viên nền Ẩn khi đang chọn nhiều 
 Trạng thái rỗng Icon + tiêu đề + mô tả + một hành động Mỗi màn danh sách đều có 
 Trạng thái lỗi Icon + lý do + nút Thử lại Không mất dữ liệu đã nhập 
 Skeleton Khối surface-2 theo đúng khung thật Không dùng vòng xoay 
 Banner quảng cáo Chỉ ở B1, C2; nhãn “Quảng cáo” Không ở màn nhập liệu, E3, G 

 
 MATADOOR · HỒ SƠ BÀN GIAO · TRANG 2 / 4 
 Bản đồ màn hình và luồng đi
 Danh sách đầy đủ các màn, đối chiếu với Key 1–6 của wireframe gốc, kèm mọi đường đi chính giữa chúng.
 3 · Bản đồ màn hình
 Mọi màn đều đã dựng thật trên canvas. Bảng dưới đối chiếu với sáu nhóm chức năng (Key) của wireframe gốc.
 Nhóm chức năng gốc Màn đã thiết kế Tình trạng 
 Key 1 · Đăng nhập & tài khoản A0 Splash · A1 Chào mừng · A2 Đăng nhập · A3 Đăng ký · A4 Quên mật khẩu · A5 OTP · A6 Đặt mật khẩu mới · C1 Tài khoản · C1a Thông tin xưởng · C1b Đã xóa gần đây Đủ 
 Key 2 · Quản lý dự án B1 Danh sách · B2 Tạo · B3 Chi tiết · B4 Sheet thao tác · B5 Hệ số lợi nhuận · B6 Chỉnh sửa · B7 Xác nhận xóa · B8 Sheet xuất file Đủ 
 Key 3 · Nhập cửa D1 Danh sách cửa · D2 Chọn hãng nhôm · D3 Chọn mẫu cửa · D4 Thông số hệ · D5 Form nhập cửa · D6 Chi tiết cửa Đủ 
 Key 4 · Tổng hợp nhôm E1 Thiết lập cắt · E2 Tổng hợp nhôm (trước / sau khi cắt) · E3 Sơ đồ cắt (dọc + ngang) Đủ 
 Key 5 · Tổng hợp vật tư F1 Kính · F2 Phụ kiện · F3 Vật tư phụ Đủ 
 Key 6 · Báo giá G1 Báo giá OP1 / OP2 · G2 Xem trước bản gửi khách Đủ 
 Thư viện (dùng chung) C2 Trang chủ · C3 Hãng nhôm & tài liệu · C4 Phụ kiện · C5 Phụ kiện theo hãng · C6 Vật tư phụ · C7 Kính · C8 Bảng giá nhôm · C9 Sheet sửa đơn giá Đủ 
 Đường đi chính
 Mũi tên là điều hướng thật giữa các artboard, bấm được ở chế độ Play.
 Vào app lần đầu
 A0 Splash → A1 Chào mừng → A3 Đăng ký → B1 Danh sách dự án 
 Đăng nhập lại
 A0 → A2 Đăng nhập → B1 
 Quên mật khẩu
 A2 → A4 Nhập SĐT → A5 OTP 6 số → A6 Mật khẩu mới → A2 đã đổi 
 Tạo dự án và nhập cửa
 B1 → B2 Tạo dự án → B3 Chi tiết dự án → D1 Bộ cửa → D2 Hãng nhôm → D3 Mẫu cửa → D5 Form nhập → D6 Chi tiết cửa → D1 
 Chỉnh thông số hệ
 D3 Mẫu cửa → D4 Thông số hệ → D3 giữ mẫu đang chọn 
 Tổng hợp nhôm và cắt
 B3 → E2 Tổng hợp nhôm → E1 Thiết lập cắt → E2 sau khi cắt → E3 Sơ đồ cắt 
 Tổng hợp vật tư
 B3 → F1 Kính / F2 Phụ kiện / F3 VTP → B8 Sheet xuất file 
 Báo giá
 B3 → G1 Báo giá → G2 Xem trước → Chia sẻ / Xuất PDF 
 Xóa và hoàn tác
 B1 hoặc D1 → Hộp xác nhận → Snackbar Hoàn tác 10 giây → C1b Đã xóa gần đây 30 ngày 

 
 MATADOOR · HỒ SƠ BÀN GIAO · TRANG 3 / 4 
 Quy tắc đã chốt và ghi chú kỹ thuật
 Gom mọi quy tắc rải rác qua các lượt duyệt vào một chỗ, kèm phần ghi chú dành riêng cho lập trình viên.
 4 · Quy tắc đã chốt
 Mười quy tắc dưới đây được chốt dần qua các lượt duyệt và đã áp cho toàn bộ canvas.
 Quy tắc Nội dung 
 Một nút cam mỗi lớp Mỗi lớp (màn, sheet, hộp thoại) có đúng một nút màu nhấn. Lớp bị làm mờ phía sau không tính. Hộp thoại phá hủy dùng nút đỏ thay cho cam. 
 Icon luôn có nhãn Không nút nào chỉ có hình. Nếu chật chỗ thì nhãn nằm trong aria-label và có nhãn chữ ở nơi khác trên màn. 
 Khoảng đệm cuối danh sách Vùng cuộn của màn có thanh nút cố định phải có padding-bottom = chiều cao thanh nút + 16 pt. Một nút: 68. Hai nút xếp dọc: 84. 
 Không ngắt giữa số và đơn vị 2.400 mm, 92,83 kg, 10.384.357 ₫, 800 × 2.200 mm đều dùng khoảng trắng không ngắt. Mã định danh (BG-2026-0042, C3328) dùng white-space: nowrap. 
 Màu cảnh báo có điều kiện Chỉ dùng khi hạn dùng còn dưới 7 ngày, hoặc hao hụt từ 10% trở lên. Các mức khác dùng chữ thường. 
 Một nguồn giá duy nhất Thư viện là gốc → Thông số hệ (D4) ghi đè cho một hệ nhôm → form nhập cửa chỉ hiển thị kết quả kèm nguồn và liên kết Sửa, không cho gõ. 
 Xóa là hoãn, không phải mất Mọi thao tác xóa chuyển vào Đã xóa gần đây 30 ngày, kèm snackbar Hoàn tác 10 giây. Hộp xác nhận luôn gọi tên đối tượng. 
 Số dẫn xuất phải nêu căn cứ Đơn giá TB (theo báo giá), Tiền nhôm ước tính (theo chiều dài dùng), Thực mua 13 cây. Đổi căn cứ là đổi con số, phải nêu khi báo cáo. 
 Không mã màn, không ghi chú dev trong UI SCR-… và ghi chú kỹ thuật chỉ nằm trên canvas, không bao giờ hiển thị trong app. 
 Logo và quảng cáo Logo chỉ ở icon app, A0–A4, C1 và đầu trang báo giá G2. Banner quảng cáo chỉ ở B1 và C2, có nhãn “Quảng cáo”, không che nút, không có ở màn nhập liệu, E3 và G. 
 5 · Ghi chú kỹ thuật cho lập trình
 Những điểm dễ làm sai nếu chỉ nhìn ảnh thiết kế.
 Chủ đề Yêu cầu 
 Bàn phím SĐT: phonePad / inputType=phone. Kích thước, %, đơn giá: bàn phím số có dấu phẩy thập phân. OTP: bàn phím số. 
 Tự điền iOS textContentType: username, password, newPassword, oneTimeCode, telephoneNumber, organizationName. Android autofillHints: username, password, newPassword, smsOTPCode, phone. 
 Mật khẩu Theo NIST SP 800-63B: tối thiểu 8 ký tự, không ép thành phần, cho dán, cảnh báo mật khẩu phổ biến. Nút Hiện/Ẩn là nút thật có nhãn chữ. 
 OTP 6 ô, tự nhảy ô, dán cả mã được. Mã sống 5 phút, 60 giây mới cho gửi lại. Lỗi đăng nhập dùng thông báo chung theo OWASP, không nói sai tài khoản hay sai mật khẩu. 
 Tìm kiếm bỏ dấu Chuẩn hóa NFD, xóa dải U+0300–U+036F, đổi đ/Đ thành d, hạ chữ thường, bỏ khoảng trắng trước khi so khớp. “xing fa”, “xingfa”, “Xingfa”, “XINGFA” đều ra Xingfa. 
 Tính số ngày còn lại Đếm ngày lịch từ 00:00 hôm nay đến 00:00 ngày hết hạn theo múi giờ máy (Asia/Ho_Chi_Minh). Hết hạn hôm nay → “Hết hạn hôm nay”. Đã qua → “Đã hết hạn DD/MM/YYYY”. 
 Chống bấm nhầm quảng cáo Banner cách nút thao tác gần nhất ≥ 8 pt, không dính đáy màn, không hiện trong 1 giây đầu sau khi danh sách vừa cuộn xong. 
 Xóa tài khoản 2 bước Bước 1 cảnh báo mất dữ liệu, bước 2 gõ lại số điện thoại để xác nhận. Không dùng nút cam. 
 Thanh toán trên iOS Bán quyền sử dụng trong app bắt buộc qua In-App Purchase (App Store Guideline 3.1.1), không được dẫn ra ngoài. Hiện tại app chỉ hiển thị hạn dùng và số liên hệ, không có nút mua. 
 Chữ hệ thống Mọi màn phải chịu được cỡ chữ hệ thống 310%. Lưới 2 cột tự chuyển 1 cột khi tỉ lệ vượt 1,2. 

 
 MATADOOR · HỒ SƠ BÀN GIAO · TRANG 4 / 4 
 Công thức, câu hỏi còn treo và danh sách kiểm thử
 Phần này dành cho người viết mã và người ra quyết định nghiệp vụ. Số liệu nào là số tạm đều được ghi rõ.
 6 · Công thức nghiệp vụ dùng trong mockup
 Mọi số trên canvas đều tính ra từ các công thức này. Ví dụ lấy từ dự án mẫu Anh Đoài.
 Đại lượng Công thức Ví dụ Anh Đoài 
 Diện tích một bộ W × H ÷ 1.000.000 800 × 2.200 ÷ 10⁶ = 1,76 m² 
 Chiều dài profile cần cắt Cộng chiều dài từng thanh × số thanh D1 · C3328: 800 + 800 + 2.200 × 2 = 6,00 m 
 Khối lượng nhôm Chiều dài (m) × tỉ trọng (kg/m) 6,00 × 1,95 = 11,70 kg 
 Số cây tương đương Chiều dài ÷ chiều dài một cây 6,00 ÷ 5,8 = 1,03 cây 
 Tiền nhôm một bộ (theo chiều dài dùng) (Chiều dài ÷ dài cây) × giá cây, cộng theo từng mã C3328 537.931 + C3303 334.293 = 872.224 ₫ 
 Quy đổi ₫/kg (chỉ để tham khảo) Giá cây ÷ (dài cây × tỉ trọng) 520.000 ÷ 11,31 ≈ 45.977 ₫/kg 
 Tiền kính Diện tích kính × đơn giá 1,365 × 230.000 = 313.950 ₫ 
 Nhân công Diện tích cửa × đơn giá nhân công 1,76 × 70.000 = 123.200 ₫ (sản xuất) 
 Giá vốn một bộ Nhôm + kính + phụ kiện + VTP + nhân công SX + nhân công LĐ 872.224 + 313.950 + 241.000 + 69.000 + 123.200 + 176.000 = 1.795.374 ₫ 
 Giá vốn dự án Cộng (giá vốn một bộ × số bộ) 1.795.374 + 3.473.994 + 2.998.910 + 1.172.046 = 9.440.324 ₫ 
 Số cây thực mua Xếp các đoạn vào cây bằng first-fit giảm dần; mỗi đoạn tốn thêm một mạch cưa 13 cây, sau khi tận dụng 3 thanh dư 
 Kiểm tra mỗi cây Tổng đoạn + số đoạn × mạch cưa + phần dư = chiều dài cây 5.000 + 3 × 5 + 785 = 5.800 mm 
 Tiền nhôm thực mua Số cây × giá cây 13 cây → 4.480.000 ₫ 
 Hao hụt tiền Tiền thực mua − tiền ước tính 4.480.000 − 4.241.502 = 238.498 ₫ · 5,6% 
 Phần dư vật tư Tổng dư trên cây mới ÷ (số cây × dài cây) 9.960 ÷ 75.400 = 13,2% 
 Báo giá OP1 Mỗi bộ: làm tròn(giá vốn một bộ × 1,1), rồi × số bộ Tổng 10.384.357 ₫ 
 Báo giá OP2 Đơn giá TB = tổng OP1 ÷ tổng diện tích, rồi × diện tích từng dòng 1.100.038 ₫/m² → tổng 10.384.359 ₫, chênh +2 ₫ 
 Biên thực sau hao hụt Báo giá − (giá vốn − nhôm ước tính + nhôm thực mua) 10.384.357 − 9.678.822 = 705.535 ₫ · 7,29% 
 7 · Câu hỏi nghiệp vụ còn treo
 Xếp theo mức độ chặn. Nhóm (a) phải chốt trước khi viết dòng mã đầu tiên của phần tính toán.
 Mức Câu hỏi Ảnh hưởng 
 a · Chặn lập trình Bảng tỉ trọng, chiều dài cây và đơn giá cây thật của từng mã theo từng hãng Mockup đang dùng số tạm cho C3313 (1,12 kg/m) và C3300 (0,95 kg/m); C3328 và C3303 là số thật. Không có bảng này thì mọi phép tính nhôm sai. 
 a · Chặn lập trình Giá nhôm thuộc về mã profile hay thuộc về hệ của từng hãng Quyết định này đổi cấu trúc dữ liệu, phải chốt trước khi dựng cơ sở dữ liệu. 
 a · Chặn lập trình Thông số hệ (khe hở, giá) áp dụng riêng từng hãng hay dùng chung Ảnh hưởng khóa chính của bảng thông số. 
 a · Chặn lập trình Kho thanh dư dùng chung toàn app hay riêng từng dự án Dùng chung thì cần thêm màn quản lý kho và ràng buộc khi xóa dự án. 
 b · Chặn ra mắt Mô hình bán quyền sử dụng và cách thanh toán trên iOS / Android iOS bắt buộc In-App Purchase. Chưa chốt thì chưa làm được màn chọn gói. 
 b · Chặn ra mắt Hao hụt có cộng vào báo giá khách không Đã chốt: mặc định KHÔNG. Còn hỏi: có làm tùy chọn bật/tắt theo dự án không. 
 b · Chặn ra mắt Báo giá có cần số, ngày phát hành và thời hạn hiệu lực không Mockup đang dùng BG-2026-0042, ngày 18/09/2026, hiệu lực 15 ngày. 
 b · Chặn ra mắt Thuế GTGT Đã dựng: một dòng thuế và dòng tổng sau thuế, bật/tắt trong Thông tin xưởng, mặc định tắt. Cần chốt mức thuế mặc định (đang để 8%). 
 c · Quyết sau Diễn giải CD3 và CD4 trong tài liệu gốc trùng nhau Đang hiển thị nguyên văn kèm nhãn “Cần xác nhận”, chờ bộ phận kỹ thuật. 
 c · Quyết sau Đổi giá trong Thư viện có cập nhật dự án cũ không Đề xuất: không tự đổi, chỉ gợi ý “Có giá mới, cập nhật báo giá?”. 
 c · Quyết sau Ghi chú chân trang báo giá Xưởng tự nhập một lần trong Thông tin xưởng, hay app gợi ý sẵn mẫu rồi sửa. 
 c · Quyết sau OP2 làm tròn tới mức nào Đang làm tròn tới đồng, chênh +2 ₫ nêu rõ trên màn. Có thể đổi sang làm tròn tới nghìn và dồn lệch vào dòng cuối. 
 c · Quyết sau Số lượng mục trong Thư viện 48 phụ kiện, 32 VTP, 64 mã nhôm là số mẫu, chờ dữ liệu thật. 
 8 · Danh sách kiểm thử khi lập trình
 Chạy đủ tám mục này trước khi coi một màn là xong.
 Kịch bản Màn cần thử Kết quả mong đợi 
 Chữ hệ thống 310% Mọi màn, đặc biệt B3, C5, D5, E2, G1 Không mất chữ, lưới 2 cột tự về 1 cột, nút không chồng nhau 
 Trình đọc màn hình VoiceOver và TalkBack trên A2, B1, D1, D5, E3, G1 Thứ tự đọc hợp lý; nút chỉ có icon đọc đúng nhãn; sơ đồ cắt đọc được qua danh sách đoạn 
 Màn hình nhỏ 360 pt Toàn bộ canvas Không tràn ngang; dải chip vẫn cuộn được; bảng A4 ở G2 cuộn hai chiều 
 Tương phản cao Cả light và dark Viền ô nhập và ranh giới thẻ vẫn thấy rõ; huy hiệu không biến mất 
 Tải chậm B1, D1, E2, F1–F3 Skeleton đúng khung thật, không nhảy layout khi dữ liệu về 
 Mất mạng B1, C1, E2 Banner “Không có mạng”, dữ liệu đã lưu vẫn xem được, thay đổi xếp hàng đồng bộ lại 
 Máy yếu E3 với dự án 50 bộ cửa Sơ đồ cắt vẫn cuộn mượt; cân nhắc dựng dần theo mã profile 
 Xoay ngang E3 Bố cục ngang giữ nguyên thao tác chạm vào từng đoạn 

```
