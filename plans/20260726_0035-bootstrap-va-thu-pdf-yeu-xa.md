# Bootstrap Audiveris + thử PDF Yêu Xa

**Trạng thái**: ✅ XONG  
**Thời điểm**: 2026-07-26 ~00:35 → hoàn tất 00:43

## Mục tiêu

1. Fork về `github.com/hacmieu/audiveris` (đã có sẵn).
2. Chuẩn bị môi trường (JDK 25) và build từ source.
3. Chạy batch OMR trên `yeu-xa-sheet-nhac.pdf`.
4. Ghi memory / plans / reports làm SSOT; push fork khi có thay đổi.

## Các bước

| # | Bước | Verify |
|---|---|---|
| 1 | Xác nhận fork + remote | `gh repo view hacmieu/audiveris` → isFork |
| 2 | Tải PDF Drive | `file testdata/yeu-xa-sheet-nhac.pdf` = PDF |
| 3 | Cài OpenJDK 25 | `java -version` = 25.x |
| 4 | `./gradlew :app:classes` hoặc `:app:run` | Build OK |
| 5 | Batch `-batch -transcribe -export` | Có `.mxl` / `.omr` trong `output/` |
| 6 | Ghi báo cáo + cập nhật README | SSOT cập nhật |
| 7 | Commit + push lên `hacmieu` | GitHub thấy memory/plans/reports |

## Rủi ro đã biết

- JDK 24 hiện có < 25 bắt buộc → phải cài thêm JDK.
- Lần build đầu tải dependency Gradle có thể lâu.
- OCR (Tesseract) có thể cần tessdata; Audiveris thường bundle hoặc tải runtime.
