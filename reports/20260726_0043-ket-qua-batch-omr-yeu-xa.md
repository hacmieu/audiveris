# Kết quả batch OMR — Yêu Xa

**Thời điểm**: 2026-07-26 00:43  
**Trạng thái**: ✅ **CHẠY THÀNH CÔNG**

## Input

| Trường | Giá trị |
|---|---|
| Nguồn | [Google Drive](https://drive.google.com/file/d/13Ld-lqEXXRE6uyZFQd7nRbIJbNzCqKUd/view) |
| Local | `testdata/yeu-xa-sheet-nhac.pdf` |
| Định dạng | PDF 1.7, 1 trang, 2480×3506 px, ~344 KB |
| Nội dung | Bản nhạc "Yêu Xa" — Vũ Cát Tường (Ballade, 4/4) |

## Lệnh chạy

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@25
export PATH="$JAVA_HOME/bin:$PATH"
export TESSDATA_PREFIX="$HOME/Library/Application Support/AudiverisLtd/audiveris/tessdata"

./gradlew :app:run --no-daemon --console=plain \
  -PcmdLineArgs="-batch,-transcribe,-export,-output,/ABS/output,/ABS/testdata/yeu-xa-sheet-nhac.pdf"
```

> Lưu ý: task `:app:run` chạy với cwd = `app/`, nên **bắt buộc dùng đường dẫn tuyệt đối**.

## Output

| File | Kích thước | Mô tả |
|---|---|---|
| `output/yeu-xa-sheet-nhac.omr` | 238 KB | Book Audiveris |
| `output/yeu-xa-sheet-nhac.mxl` | 5.2 KB | MusicXML compressed |
| `output/yeu-xa-sheet-nhac-20260726T0043.log` | 10 KB | Log per-book |
| [artifacts/yeu-xa-sheet-nhac.mxl](artifacts/yeu-xa-sheet-nhac.mxl) | — | Bản copy trong reports |

## Số liệu nhận dạng

| Metric | Giá trị |
|---|---|
| Thời gian pipeline | **~22 giây** (BUILD SUCCESSFUL) |
| Audiveris | 5.11.0 / commit `9e1e55cd` |
| JDK | OpenJDK 25.0.4 (Homebrew) |
| OCR languages | `eng`, `vie` |
| Systems | 10 |
| Raw measures | 30 |
| Parts (MusicXML) | 1 |
| Notes (MusicXML) | 140 |
| Rests (MusicXML) | 10 |
| Slurs detected | 17 |

## Cảnh báo / chất lượng

- OCR tiếng Việt **lỗi nhiều** trên lời bài hát (ví dụ credit "Yéu Xa", "Vﬁ Cat"; lyrics mẫu méo chữ).
- Nhiều cảnh báo `OctaveShiftInter` / `No chord near SentenceInter` — ký hiệu phụ / lời chưa gắn chord tốt.
- Engine vẫn hoàn tất PAGE + export `.mxl` — cấu trúc nhịp (30 measures) khớp log GRID/MEASURES.

## Môi trường đã thiết lập

1. Fork: https://github.com/hacmieu/audiveris
2. JDK: `brew install openjdk@25`
3. Tessdata: `eng.traineddata` + `vie.traineddata` trong  
   `~/Library/Application Support/AudiverisLtd/audiveris/tessdata/`

## Kết luận

Hệ thống Audiveris **đã bật và chạy batch OMR thành công** trên file Drive "Yêu Xa".  
MusicXML dùng được để kiểm tra cấu trúc; chất lượng OCR lời Việt cần chỉnh (font/language/post-edit) nếu muốn lời chính xác.
