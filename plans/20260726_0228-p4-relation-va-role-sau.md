# Kế hoạch P4 — Relation + undo sâu / convert Lyrics (+ bàn giao)

**Trạng thái**: ⬜ CHƯA BẮT ĐẦU
**Thời điểm**: 2026-07-26 02:28
**Tiền đề**: [P3 xong](../reports/20260726_0228-p3-sua-inter.md)

---

## A. BÀN GIAO

### Đang ở đâu
Port GUI→web. **P1–P3 xong.** Có thể xóa Inter, đổi TextRole, undo/redo, save `.omr` từ web.

### Chạy lại
```bash
# API
export JAVA_HOME=/opt/homebrew/opt/openjdk@25; export PATH="$JAVA_HOME/bin:$PATH"
export TESSDATA_PREFIX="$HOME/Library/Application Support/AudiverisLtd/audiveris/tessdata"
./gradlew :app:run --no-daemon \
  -PcmdLineArgs="-batch,-run,org.audiveris.omr.web.OmrApiServer,/ABS/output/yeu-xa-sheet-nhac.omr"

# Web
cd web && npm run dev   # OMR Viewer phải thấy · api + Undo/Redo/Save
```

### Sự thật P3
- Mutate = `RemovalTask` / `SentenceRoleTask` trực tiếp + history trong `OmrApiServer`.
- `publish()` OK headless (`entityService == null`).
- Book Yêu Xa hiện: **856 inters**, `#3143` = Lyrics ("Ballade"), `#1269` đã xóa (đã save).
- Đổi role đơn giản ≠ convert sang `LyricLineInter`/`LyricItemInter` (InterController làm việc đó).

---

## B. PDCA P4

### PLAN (chọn 1–2, đừng ôm hết)
1. **Link/Unlink relation** qua API (`LinkTask`/`UnlinkTask`) — nối lyric↔chord, xóa relation sai.
2. **Convert Lyrics đầy đủ** — endpoint gọi logic giống `InterController.changeSentence(…, Lyrics)` (không chỉ setRole).
3. Hoặc nhảy **P5 export** `.mxl` nếu ưu tiên nghe lại sau sửa.

### CHECK (ví dụ)
- [ ] Unlink 1 relation → count relations giảm; undo khôi phục
- [ ] Direction→Lyrics convert → members thành `lyric-item`; export (P5) ra đúng lyric trong MusicXML

### Không làm P4
Palette/add (P6), re-run step (P7) — trừ khi user ưu tiên.
