# OMR Viewer đổi bài qua catalog

**Ngày giờ:** 2026-07-26 23:08

OMR Viewer không còn cứng Yêu Xa: đọc `library/works`, `POST /api/book/open {slug}`, UI dropdown Bài/Trang + nút **Sửa OMR** trong Thư viện.

- API: `GET /api/books`, `POST /api/book/open` (force bỏ dirty).
- Index: field `omr` boolean.
- Check: Yêu Em 614+226 / Yêu Xa 856; browser đổi bài OK.

Report: [../reports/20260726_2308-omr-viewer-multi-book.md](../reports/20260726_2308-omr-viewer-multi-book.md)
