# Capella Scan vs Audiveris: phân lớp nhạc / text

**Thời điểm**: 2026-07-26 02:21

## Câu trả lời ngắn

**Có.** Audiveris đã phân biệt ký hiệu nhạc và các yếu tố text — thậm chí chi tiết hơn một lớp duy nhất — qua:

1. **Loại Inter** (`type`): `head`/`stem`/`beam`… = nhạc; `word`/`sentence`/`lyric-item`/`chord-name` = text.
2. **`TextRole` trên sentence** (enum trong `org.audiveris.omr.text.TextRole`): `Lyrics`, `ChordName`, `Title`, `Direction`, `CreatorComposer`, `UnknownRole`…
3. **Sửa tay trong GUI desktop**: `InterBoard` có combo `TextRole` → `SentenceRoleTask` (undo được). Đúng tinh thần Capella: máy đoán → người gán lại vai trò.

Web viewer (P1+) giờ có dropdown **Lớp** giống Capella: Nhạc / Text / Lời / Hợp âm / Tiêu đề / Direction.

## Số liệu trên Yêu Xa (sheet 1)

| Lớp | Số Inter | Ghi chú |
|---|---|---|
| Nhạc / ký hiệu | 660 | head, stem, beam, barline… |
| Text (OCR) | 197 | word + sentence + lyric-* + chord-name |
| Hợp âm | 38 | `chord-name` + sentence role ChordName |
| Direction | 36 | **nhiều lời Việt bị gán nhầm vào đây** |
| Lời (Lyrics) | 22 | chủ yếu `lyric-item`/`lyric-line`; sentence role Lyrics chỉ 2 |
| Tiêu đề | 1 | "Yêu Xa" (OCR ra "Yéu Xa") |

→ Máy **đã tách** nhạc vs text. Điểm yếu: (a) OCR dấu tiếng Việt, (b) đoán `TextRole` — lời thường thành `Direction` thay vì `Lyrics`. Đó chính là chỗ người dùng Capella hay sửa tay; trên Audiveris GUI cũng sửa được role, web sẽ làm ở P3+.

## So với Capella Scan

| Capella | Audiveris |
|---|---|
| Chọn vùng là "nhạc" / "text" | Inter type + TextRole (tự + tay) |
| Sửa rồi nhận lại | Sửa Inter/Relation + re-run step (P7) |
| Text vs chord vs lyric | `TextRole` + loại `chord-name` / `lyric-item` riêng |

## Evidence trong code

- `app/.../text/TextRole.java` — enum vai trò.
- `app/.../sig/ui/InterBoard.java` — combo gán role.
- `app/.../sig/ui/SentenceRoleTask.java` — undoable `setRole`.
- XML: `<sentence role="Title" …>`; `<word value="Yéu" …>`; `<chord-name value="F" …>`.

Chi tiết P2 API + viewer: [../reports/20260726_0221-p2-omr-api-va-lop-capella.md](../reports/20260726_0221-p2-omr-api-va-lop-capella.md)
