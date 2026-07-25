# P1 xong — OMR Overlay Viewer

**Thời điểm**: 2026-07-26 02:10

## Trạng thái port GUI → web

Phase **1/7 ĐÃ XONG**. Kế tiếp: P2 (JVM service đọc Book).
Bàn giao đầy đủ ở [plans/20260726_0210-p2-jvm-edit-service.md](../plans/20260726_0210-p2-jvm-edit-service.md) — **agent mới đọc file đó trước**.

## Đã thêm vào repo

- `tools/omr_extract.py` — `.omr` → PNG + JSON (Python stdlib).
- `web/src/OmrViewer.tsx` / `OmrViewer.css` — overlay viewer read-only.
- `web/src/App.tsx` — thêm `mode: 'player' | 'omr'`, player giữ mounted (không nạp lại SoundFont).
- `web/public/omr/yeu-xa-sheet-nhac/` — dữ liệu đã commit (308 KB) vì `output/` bị gitignore.

## Sự thật kỹ thuật (đã verify)

- `.omr` = ZIP: `book.xml` + `sheet#N/sheet#N.xml` + `sheet#N/BINARY.png`.
- XML path: `system[@id] → sig → inters/* → bounds`; relation type = **tên thẻ con** của `<relation>`.
- Sheet 1 Yêu Xa: 2480×3506 px, 857 inters, 831 relations, mọi Inter có bounds.
- Bounds = pixel ảnh BINARY → overlay khớp **pixel-perfect** ở zoom 100%, không cần quy đổi.

## Phát hiện

Lọc `grade ≤ 0.6` → 90/857 Inter, **đa số là lời tiếng Việt có dấu** (OCR yếu ở dấu).
False positive rõ: `NOTEHEAD_BLACK 0.179`, `DYNAMICS_SF 0.232`, `DYNAMICS_P 0.268`, `STACCATO 0.347`, `DYNAMICS_PPP 0.366`, `TR 0.464` — bản ballad này không có các ký hiệu đó.

## Lệnh hay dùng

```bash
python3 tools/omr_extract.py output/yeu-xa-sheet-nhac.omr web/public/omr
cd web && npm run dev     # http://localhost:5173 → nút "OMR Viewer"
```

Chi tiết: [report P1](../reports/20260726_0210-p1-omr-overlay-viewer.md)
