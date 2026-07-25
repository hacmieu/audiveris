# Mở Audiveris GUI + tích hợp với web player

**Thời điểm**: 2026-07-26 01:48  
**Trạng thái**: 🟡 ĐANG MỞ GUI · quyết định tích hợp đã ghi

## Cách mở GUI (đã chạy)

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@25
export PATH="$JAVA_HOME/bin:$PATH"
cd /Users/hacmieu/DevOps/HADE/audiveris
./gradlew :app:run --no-daemon -PcmdLineArgs="/ABS/path/output/yeu-xa-sheet-nhac.omr"
```

- **Không** dùng `-batch` → mở cửa sổ đồ họa.
- File `.omr` đã có từ batch trước → GUI mở thẳng project đã transcribe.
- Web player vẫn ở http://localhost:5173/ (Vite, nếu đang chạy).

## Hướng dẫn dùng GUI (tóm tắt)

1. Cửa sổ Audiveris hiện sheet + các ký hiệu OMR (màu theo độ tin cậy).
2. Sửa lỗi: chọn glyph / Inter → gán lại shape, xóa false positive, kéo thả relation.
3. Nên sửa sớm sau step **REDUCTION** / **TEXTS** nếu còn pipeline; với bản đã PAGE thì sửa ở cuối rồi **Export** MusicXML.
4. Menu Step: có thể reset và chạy lại tới một step (cả sheet, không phải 1 vùng khoanh).
5. Sau khi sửa: Export `.mxl` → copy vào `web/public/scores/` → refresh player để nghe lại.

## Có tích hợp được GUI + web player không?

| Mức | Ý tưởng | Khả thi |
|---|---|---|
| **A — Song song (MVP)** | GUI sửa `.omr` → export `.mxl` → web alphaTab phát | ✅ Ngay, không cần code thêm |
| **B — Một app web** | Upload PDF → backend gọi Audiveris batch → web xem/nghe; sửa OMR vẫn qua GUI hoặc editor web sau | ✅ Kiến trúc hợp lý (giống oemer) |
| **C — Nhúng GUI vào web** | Nhúng Swing/JavaFX Audiveris vào browser | ❌ Không thực tế |
| **D — Sửa OMR trong alphaTab** | alphaTab chủ yếu render+play, không phải OMR editor | ❌ / rất hạn chế |

**Kết luận**: Không “gộp một cửa sổ” GUI Java + React. Tích hợp đúng nghĩa = **pipeline chung**: Audiveris (engine+GUI sửa) ↔ file `.omr`/`.mxl` ↔ web player (alphaTab). Về lâu dài có thể bọc batch bằng API và giữ GUI cho phiên sửa sâu.
