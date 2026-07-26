# P6 xong — Thêm Inter từ web

**Ngày giờ:** 2026-07-26 06:19

## Tóm tắt
Web giờ **thêm** được ký hiệu/nốt (đối xứng với *xóa* ở P3). Palette "+ Thêm" → chọn shape → click lên bản nhạc để đặt. Tự gắn staff gần nhất + dò relation, có Undo/Redo/Save.

## Sự thật cốt lõi
- **API mới:** `POST /api/sheet/{n}/inter` body `{"shape":"NOTEHEAD_BLACK","x":..,"y":..[,"w","h"]}` → trả `id` mới.
  - Java: `InterFactory.createManual(shape, sheet)` → `setStaff` (staff gần nhất qua `getStavesOf`) → `searchLinks` → `AdditionTask`.
- **UI:** `OmrViewer.tsx` palette optgroup (Nốt/Thân-Đuôi/Chấm/Lặng/Hóa biểu/Khóa/Nhịp/Vạch nhịp/Diễn tấu) + chế độ click-đặt (crosshair).
- **Check OK:** thêm NOTEHEAD_BLACK (id 5526, pitch −2.0 tính từ staff), G_CLEF, shape sai→400, undo về 856. Không save nên `.omr` đĩa nguyên vẹn.
- **Lưu ý:** `getStavesOf` snap staff gần nhất kể cả điểm xa (giống drop của GUI). Thêm **text/lyrics** chưa hỗ trợ (cần OCR glyph) — để P6b.

## Trạng thái port GUI → Web
P1 ✅ · P2 ✅ · P3 ✅ (xóa/role) · **P6 ✅ (thêm)** · còn P4 (relation/convert Lyrics), P5 (export `.mxl`), P7 (re-run step).

## Bàn giao
[plans/20260726_0619-p6-them-inter.md](../plans/20260726_0619-p6-them-inter.md) · report [reports/20260726_0619-p6-them-inter.md](../reports/20260726_0619-p6-them-inter.md)
