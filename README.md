# MATADOOR – Cửa nhôm

App di động giúp xưởng nhôm kính đi từ số đo tới báo giá gửi Zalo trong dưới 3 phút, với kích thước cắt chính xác. App chạy offline hoàn toàn: React Native + Expo, dữ liệu lưu trên máy.

Đặc tả: [`docs/MATADOOR – Đặc tả yêu cầu phần mềm (SRS) v1.0.pdf`](docs/). Kế hoạch: [`docs/KE_HOACH_TRIEN_KHAI.md`](docs/KE_HOACH_TRIEN_KHAI.md). Tiến độ: [`docs/NHAT_KY_TRIEN_KHAI.md`](docs/NHAT_KY_TRIEN_KHAI.md).

## Cấu trúc

| Thư mục | Nội dung |
| --- | --- |
| `packages/engine` | Engine tính toán, TypeScript thuần: biểu thức, bóc tách một bộ cửa, tổng hợp dự án, tối ưu cắt, báo giá, định dạng số |
| `packages/data` | Gói dữ liệu: mẫu cửa (JSON), hệ nhôm, bảng vật tư mặc định, đáp án mẫu SRS, quy đổi giá |
| `apps/mobile` | App Expo (dựng từ GĐ 3) |
| `docs/` | SRS, kế hoạch, nhật ký, thiết kế |

## Bắt đầu

Cần Node 22.12 trở lên.

```bash
npm install
```

```bash
npm test
```

```bash
npm run typecheck
```

```bash
npm run coverage
```

## Thêm hoặc sửa mẫu cửa

1. Sửa hoặc thêm file trong `packages/data/src/templates/`. Mẫu mới thì đăng ký ở `packages/data/src/index.ts`.
2. Đổi công thức thì **tăng `version`** của mẫu. Số liệu của bộ cửa đã lưu không được tự đổi (SRS 5.2).
3. Thêm ít nhất một ca đáp án mẫu vào `packages/data/src/golden/srs-tc.json`. Mẫu `verified` mà không có đáp án thì test đỏ (SRS 4.4).
4. Cập nhật khóa phiên bản:

```bash
npm run lock -w @matadoor/data
```

## Tiến độ

| GĐ | Nội dung | Trạng thái |
| --- | --- | --- |
| 0–2 | Nền móng, engine, gói dữ liệu | Xong |
| 3–13 | App: giao diện, lưu trữ, các nhóm màn, nghiệm thu | Xem `docs/KE_HOACH_TRIEN_KHAI.md` |
