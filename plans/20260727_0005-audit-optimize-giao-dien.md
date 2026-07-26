# Audit + optimize giao diện web (PDCA)

**Ngày:** 2026-07-27 00:05
**Trạng thái:** ✅ XONG
**Report:** [../reports/20260727_0010-audit-optimize-giao-dien.md](../reports/20260727_0010-audit-optimize-giao-dien.md)

## Bối cảnh

Người dùng chạy skill `design-taste-frontend` để audit rồi tối ưu giao diện `web/`.

## PLAN

**Ghi chú phạm vi trước tiên:** skill này tự loại trừ dashboard / data table / dense product UI.
App là product tool, không phải landing page → chỉ áp phần cross-cutting
(type, màu, shape, contrast, a11y, motion, density, AI tells), bỏ phần landing-page.

Chế độ *Redesign - Preserve*: giữ IA, giữ teal, giữ nhãn nav, giữ endpoint.
Đi theo thứ tự lever của skill (mục 11.D), dừng khi đủ:

1. Typography → verify: font thực nạp là Geist, không còn request Google Fonts
2. Spacing + shape lock → verify: chỉ còn 4 token bán kính, có quy tắc ghi trong CSS
3. Color recalibration → verify: bản nhạc là bề mặt sáng nhất; không còn token chết
4. Motion layer (chỉ phản hồi thao tác) → verify: có `:active`, có `prefers-reduced-motion`
5. A11y → verify: đo tương phản trên DOM thật, tất cả ≥ 4.5:1

Không làm: dark mode đầy đủ (là tính năng, không phải tối ưu), tách bundle alphaTab.

## DO

Xem mục 2 của report.

## CHECK

`tsc` + `oxlint` + `npm run build` pass; chụp lại 3 chế độ; đo tương phản qua CDP;
xác nhận `:focus-visible` và `prefers-reduced-motion` có mặt trong CSSOM runtime.
Nút disabled trên thanh tối: 4.2:1 → **5.36:1**.

## ACT

Cập nhật README SSOT của `memory/`, `plans/`, `reports/`; commit + push.

## Việc còn để ngỏ

1. **Dark mode** — token `--deck*` đã sẵn, chỉ cần thêm một khối `prefers-color-scheme: dark`.
   Chờ người dùng xác nhận có muốn không.
2. **Toolbar OMR ở màn hẹp** — dưới ~1200px hàng 1 vẫn wrap. Nếu hay dùng màn 1024
   thì cân nhắc gom zoom vào một popover.
3. **Bảng thư viện với 20k dòng** — hiện render toàn bộ `<tbody>`. Khi ingest thật
   sẽ cần virtualise (cùng bài toán đã giải cho BookPicker).
