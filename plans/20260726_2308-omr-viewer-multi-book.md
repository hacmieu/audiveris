# OMR Viewer multi-book (PDCA) — ✅ XONG

**Ngày giờ:** 2026-07-26 23:08 · Report: [../reports/20260726_2308-omr-viewer-multi-book.md](../reports/20260726_2308-omr-viewer-multi-book.md)

## Plan
Nối `library/catalog` + `library/works/*.omr` với OMR Viewer: đổi book khi đang chạy API, không restart JVM.

## Do / Check
Đã làm + browser verify (Yêu Em ↔ Yêu Xa). Chi tiết report.

## Act tiếp
- Khi dirty: UI nút Save trước khi đổi (đã có confirm + force).
- Title tiếng Việt đẹp hơn (OCR Title từ .omr) thay slug title.
